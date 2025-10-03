import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';
import * as mqtt from 'mqtt';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { OsramSwitchAccessory } from './accessory';

interface DeviceInfo {
  friendly_name: string;
  ieee_address: string;
  model?: string;
  manufacturer?: string;
  definition?: {
    model: string;
    vendor: string;
  };
}

export class Zigbee2MqttOsramPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];
  private mqttClient?: mqtt.MqttClient;
  private devices: Map<string, DeviceInfo> = new Map();

  // Modèles Osram compatibles
  private readonly OSRAM_MODELS = [
    'AC0251100NJ',
    'AC0251600NJ',
    'AC0251700NJ',
  ];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Plugin initialisé avec la configuration:', config);

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching - Configuration MQTT');
      this.connectMqtt();
    });
  }

  private connectMqtt() {
    const mqttUrl = this.config.mqtt_url || 'mqtt://localhost:1883';
    const username = this.config.mqtt_username;
    const password = this.config.mqtt_password;
    const baseTopic = this.config.base_topic || 'zigbee2mqtt';

    this.log.info('Connexion au serveur MQTT:', mqttUrl);

    const options: mqtt.IClientOptions = {
      username,
      password,
    };

    this.mqttClient = mqtt.connect(mqttUrl, options);

    this.mqttClient.on('connect', () => {
      this.log.info('✓ Connecté au serveur MQTT');
      
      // S'abonner au topic des devices
      this.mqttClient!.subscribe(`${baseTopic}/bridge/devices`, (err) => {
        if (err) {
          this.log.error('Erreur lors de l\'abonnement au topic devices:', err);
        } else {
          this.log.info(`Abonné au topic: ${baseTopic}/bridge/devices`);
        }
      });

      // S'abonner à tous les messages des devices pour les actions
      this.mqttClient!.subscribe(`${baseTopic}/+`, (err) => {
        if (err) {
          this.log.error('Erreur lors de l\'abonnement aux topics devices:', err);
        }
      });

      // Demander la liste des devices
      this.mqttClient!.publish(`${baseTopic}/bridge/request/devices`, '');
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMqttMessage(topic, message, baseTopic);
    });

    this.mqttClient.on('error', (err) => {
      this.log.error('Erreur MQTT:', err);
    });

    this.mqttClient.on('offline', () => {
      this.log.warn('Déconnecté du serveur MQTT');
    });

    this.mqttClient.on('reconnect', () => {
      this.log.info('Reconnexion au serveur MQTT...');
    });
  }

  private handleMqttMessage(topic: string, message: Buffer, baseTopic: string) {
    const messageStr = message.toString();

    // Traiter la liste des devices
    if (topic === `${baseTopic}/bridge/devices`) {
      try {
        const devices: DeviceInfo[] = JSON.parse(messageStr);
        this.log.debug(`Reçu ${devices.length} dispositifs de Zigbee2MQTT`);
        
        devices.forEach(device => {
          if (this.isOsramSwitch(device)) {
            this.log.info(`✓ Télécommande Osram détectée: ${device.friendly_name} (${device.model || device.definition?.model})`);
            this.devices.set(device.friendly_name, device);
            this.addOrUpdateAccessory(device);
          }
        });
      } catch (err) {
        this.log.error('Erreur lors du parsing des devices:', err);
      }
    }
  }

  private isOsramSwitch(device: DeviceInfo): boolean {
    const model = device.model || device.definition?.model || '';
    const manufacturer = device.manufacturer || device.definition?.vendor || '';
    
    return (
      manufacturer.toLowerCase().includes('osram') &&
      this.OSRAM_MODELS.some(osramModel => model.includes(osramModel))
    );
  }

  private addOrUpdateAccessory(device: DeviceInfo) {
    const uuid = this.api.hap.uuid.generate(device.ieee_address);
    const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Accessoire existant mis à jour:', device.friendly_name);
      existingAccessory.context.device = device;
      this.api.updatePlatformAccessories([existingAccessory]);
      new OsramSwitchAccessory(this, existingAccessory, this.mqttClient!);
    } else {
      this.log.info('Ajout d\'un nouvel accessoire:', device.friendly_name);
      const accessory = new this.api.platformAccessory(device.friendly_name, uuid);
      accessory.context.device = device;
      new OsramSwitchAccessory(this, accessory, this.mqttClient!);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      this.accessories.push(accessory);
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Chargement de l\'accessoire depuis le cache:', accessory.displayName);
    this.accessories.push(accessory);
  }
}
