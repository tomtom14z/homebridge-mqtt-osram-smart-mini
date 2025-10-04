# Homebridge MQTT Osram Smart+ Mini

Plugin Homebridge pour détecter automatiquement les télécommandes **Osram Smart+ Mini** (modèles AC0251100NJ, AC0251600NJ, AC0251700NJ) via **Zigbee2MQTT** et les exposer dans HomeKit.

## Fonctionnalités

✨ **Détection automatique** des télécommandes Osram Smart+ Mini connectées à Zigbee2MQTT
- Plus besoin de configurer manuellement chaque télécommande !
- Le plugin interroge le serveur MQTT et découvre automatiquement tous les dispositifs compatibles

🎛️ **3 boutons programmables** par télécommande :
- **Bouton 1 - Flèche Haut** :
  - Appui court : événement `on`
  - Appui long : événement `brightness_move_up`
  
- **Bouton 2 - Flèche Bas** :
  - Appui court : événement `off`
  - Appui long : événement `brightness_move_down`
  
- **Bouton 3 - Cercle** :
  - Appui court : événement `brightness_move_to_level`
  - Appui long : événement `move_to_saturation`

🔋 **Surveillance de la batterie** avec notification de batterie faible

## Prérequis

- Homebridge installé et configuré
- Serveur MQTT (Mosquitto recommandé)
- Zigbee2MQTT configuré et connecté au serveur MQTT
- Télécommandes Osram Smart+ Mini appairées avec Zigbee2MQTT

## Installation

### Via npm (recommandé)

```bash
npm install -g homebridge-mqtt-osram-smart-mini
```

### Installation manuelle

1. Clonez ce dépôt :
```bash
git clone https://github.com/votre-repo/homebridge-mqtt-osram-smart-mini.git
cd homebridge-mqtt-osram-smart-mini
```

2. Installez les dépendances et compilez :
```bash
npm install
npm run build
```

3. Liez le plugin localement :
```bash
npm link
```

## Configuration

Ajoutez la configuration suivante dans votre fichier `config.json` de Homebridge :

```json
{
  "platforms": [
    {
      "platform": "MqttOsramSmartMini",
      "name": "Osram Smart+ Mini",
      "mqtt_url": "mqtt://localhost:1883",
      "mqtt_username": "mqtt_user",
      "mqtt_password": "votre_mot_de_passe",
      "base_topic": "zigbee2mqtt",
      "debounce_delay": 500
    }
  ]
}
```

### Paramètres de configuration

| Paramètre | Type | Obligatoire | Défaut | Description |
|-----------|------|-------------|--------|-------------|
| `platform` | string | ✅ | - | Doit être `"MqttOsramSmartMini"` |
| `name` | string | ✅ | - | Nom de la plateforme |
| `mqtt_url` | string | ❌ | `mqtt://localhost:1883` | URL du serveur MQTT |
| `mqtt_username` | string | ❌ | - | Nom d'utilisateur MQTT |
| `mqtt_password` | string | ❌ | - | Mot de passe MQTT |
| `base_topic` | string | ❌ | `zigbee2mqtt` | Topic de base Zigbee2MQTT |
| `debounce_delay` | number | ❌ | `500` | Délai en ms pour éviter les déclenchements multiples (0-5000) |

## Utilisation dans HomeKit

Une fois le plugin configuré et Homebridge redémarré, vos télécommandes Osram apparaîtront automatiquement dans l'application Maison :

1. **Chaque télécommande** apparaîtra avec son nom configuré dans Zigbee2MQTT
2. **3 boutons** seront créés par télécommande (Flèche Haut, Flèche Bas, Cercle)
3. **Créez des automatisations** dans HomeKit en utilisant ces boutons comme déclencheurs

### Exemple d'automatisation

Dans l'application Maison :
- Créez une nouvelle automatisation
- Choisissez "Lorsqu'un accessoire est contrôlé"
- Sélectionnez votre télécommande Osram et le bouton souhaité
- Choisissez l'événement (appui court ou long)
- Définissez l'action à exécuter

## Développement

### Structure du projet

```
homebridge-mqtt-osram-smart+mini/
├── src/
│   ├── index.ts          # Point d'entrée du plugin
│   ├── platform.ts       # Plateforme principale avec détection MQTT
│   ├── accessory.ts      # Gestion des accessoires (télécommandes)
│   └── settings.ts       # Constantes du plugin
├── package.json
├── tsconfig.json
└── README.md
```

### Compiler le plugin

```bash
npm run build
```

### Mode développement (compilation automatique)

```bash
npm run watch
```

## Dépannage

### Les télécommandes ne sont pas détectées

1. Vérifiez que Zigbee2MQTT est bien connecté à votre serveur MQTT
2. Vérifiez les logs de Homebridge pour voir les messages de connexion MQTT
3. Assurez-vous que les télécommandes sont bien appairées dans Zigbee2MQTT
4. Vérifiez que le modèle de votre télécommande est bien supporté (AC0251100NJ, AC0251600NJ, AC0251700NJ)

### Les boutons ne répondent pas

1. Vérifiez les logs de Homebridge pour voir si les actions sont reçues
2. Testez dans Zigbee2MQTT que les actions sont bien publiées sur MQTT
3. Redémarrez Homebridge

### Activer les logs de débogage

Ajoutez `-D` lors du démarrage de Homebridge :

```bash
homebridge -D
```

## Licence

MIT

## Auteur

Thomas Vernouillet

## Remerciements

- Homebridge pour le framework de plugins
- Zigbee2MQTT pour l'intégration Zigbee
- OSRAM pour les télécommandes Smart+ Mini
