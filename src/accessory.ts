import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MqttClient } from 'mqtt';

import { Zigbee2MqttOsramPlatform } from './platform';

/**
 * Accessoire pour télécommande Osram Smart+ Mini
 * 
 * Mapping des actions Zigbee2MQTT vers les boutons HomeKit:
 * 
 * Bouton 1 (Flèche haut):
 *   - Appui court: "on" → SINGLE_PRESS (0)
 *   - Appui long: "brightness_move_up" → LONG_PRESS (2)
 * 
 * Bouton 2 (Flèche bas):
 *   - Appui court: "off" → SINGLE_PRESS (0)
 *   - Appui long: "brightness_move_down" → LONG_PRESS (2)
 * 
 * Bouton 3 (Cercle):
 *   - Appui court: "brightness_move_to_level" → SINGLE_PRESS (0)
 *   - Appui long: "move_to_saturation" → LONG_PRESS (2)
 */
export class OsramSwitchAccessory {
  private services: Service[] = [];
  private batteryService: Service;
  private baseTopic: string;

  // Mapping des actions vers les boutons et événements
  private readonly ACTION_MAPPING = {
    // Bouton 1 - Flèche haut
    'on': { button: 0, event: this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS },
    'brightness_move_up': { button: 0, event: this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS },
    
    // Bouton 2 - Flèche bas
    'off': { button: 1, event: this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS },
    'brightness_move_down': { button: 1, event: this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS },
    
    // Bouton 3 - Cercle
    'brightness_move_to_level': { button: 2, event: this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS },
    'move_to_saturation': { button: 2, event: this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS },
  };

  constructor(
    private readonly platform: Zigbee2MqttOsramPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly mqttClient: MqttClient,
  ) {
    this.baseTopic = this.platform.config.base_topic || 'zigbee2mqtt';
    
    // Configuration des informations de l'accessoire
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'OSRAM')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Smart+ Mini')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.ieee_address);

    // Nettoyer les anciens services si nécessaire (y compris ServiceLabel)
    this.accessory.services.forEach(service => {
      if (service.UUID === this.platform.Service.StatelessProgrammableSwitch.UUID) {
        // Vérifier si c'est un ancien service avec un mauvais nom
        const currentName = service.getCharacteristic(this.platform.Characteristic.Name).value as string;
        const validNames = ['Bouton Haut', 'Bouton Bas', 'Bouton Cercle'];
        if (currentName && !validNames.includes(currentName)) {
          this.platform.log.info(`Suppression de l'ancien service: ${currentName}`);
          this.accessory.removeService(service);
        }
      }
      // Supprimer le ServiceLabel s'il existe (il force les noms "Bouton 1, 2, 3")
      if (service.UUID === this.platform.Service.ServiceLabel.UUID) {
        this.platform.log.info('Suppression du ServiceLabel');
        this.accessory.removeService(service);
      }
    });

    // Créer 3 services de bouton (un pour chaque bouton physique)
    const buttonNames = ['Bouton Haut', 'Bouton Bas', 'Bouton Cercle'];
    
    for (let i = 0; i < 3; i++) {
      let service = this.accessory.getServiceById(
        this.platform.Service.StatelessProgrammableSwitch,
        `button${i}`,
      );

      if (!service) {
        service = this.accessory.addService(
          this.platform.Service.StatelessProgrammableSwitch,
          buttonNames[i],
          `button${i}`,
        );
      }

      service.setCharacteristic(this.platform.Characteristic.Name, buttonNames[i]);
      
      // Configurer les valeurs valides: SINGLE_PRESS (0) et LONG_PRESS (2)
      service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
        .setProps({
          validValues: [
            this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
            this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS,
          ],
        });

      this.services.push(service);
    }

    // Service de batterie
    this.batteryService = this.accessory.getService(this.platform.Service.Battery) ||
      this.accessory.addService(this.platform.Service.Battery);

    this.batteryService.setCharacteristic(this.platform.Characteristic.Name, 'Batterie');

    // S'abonner aux messages MQTT
    this.subscribeMqtt();
  }

  private subscribeMqtt() {
    const topic = `${this.baseTopic}/${this.accessory.context.device.friendly_name}`;
    
    this.mqttClient.subscribe(topic, (err) => {
      if (err) {
        this.platform.log.error(`Erreur d'abonnement au topic ${topic}:`, err);
      } else {
        this.platform.log.debug(`Abonné au topic: ${topic}`);
      }
    });

    this.mqttClient.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        this.handleMessage(message);
      }
    });
  }

  private handleMessage(message: Buffer) {
    try {
      const data = JSON.parse(message.toString());
      
      // Traiter l'action du bouton
      if (data.action) {
        this.handleAction(data.action);
      }

      // Traiter le niveau de batterie
      if (data.battery !== undefined) {
        this.updateBattery(data.battery);
      }
    } catch (err) {
      this.platform.log.error('Erreur lors du parsing du message MQTT:', err);
    }
  }

  private handleAction(action: string) {
    const mapping = this.ACTION_MAPPING[action as keyof typeof this.ACTION_MAPPING];
    
    if (mapping) {
      this.platform.log.info(
        `Action détectée: ${action} → Bouton ${mapping.button + 1}, ` +
        `Événement: ${mapping.event === 0 ? 'SINGLE_PRESS' : 'LONG_PRESS'}`,
      );

      const service = this.services[mapping.button];
      if (service) {
        service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
          .updateValue(mapping.event);
      }
    } else {
      this.platform.log.debug(`Action non mappée: ${action}`);
    }
  }

  private updateBattery(batteryLevel: number) {
    this.platform.log.debug(`Mise à jour du niveau de batterie: ${batteryLevel}%`);
    
    this.batteryService.updateCharacteristic(
      this.platform.Characteristic.BatteryLevel,
      batteryLevel,
    );

    // Définir le statut de batterie faible (< 20%)
    const lowBattery = batteryLevel < 20
      ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.batteryService.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery,
    );
  }
}
