# Guide d'installation rapide

## 🎉 Votre plugin est maintenant disponible publiquement !

### 📦 Sur npm
**https://www.npmjs.com/package/homebridge-mqtt-osram-smart-mini**

### 💻 Sur GitHub
**https://github.com/tomtom14z/homebridge-mqtt-osram-smart-mini**

---

## Installation sur un autre appareil Homebridge

### 1. Installer le plugin via npm

```bash
npm install -g homebridge-mqtt-osram-smart-mini
```

Ou via l'interface Homebridge Config UI X :
1. Aller dans l'onglet **Plugins**
2. Rechercher `homebridge-mqtt-osram-smart-mini`
3. Cliquer sur **Install**

### 2. Configurer le plugin

Ajouter cette configuration dans votre fichier `config.json` :

```json
{
  "platforms": [
    {
      "platform": "MqttOsramSmartMini",
      "name": "Osram Smart+ Mini",
      "mqtt_url": "mqtt://localhost:1883",
      "mqtt_username": "mqtt_user",
      "mqtt_password": "VOTRE_MOT_DE_PASSE",
      "base_topic": "zigbee2mqtt"
    }
  ]
}
```

**Ou via l'interface Homebridge Config UI X** :
1. Aller dans l'onglet **Plugins**
2. Cliquer sur **Settings** pour le plugin `homebridge-mqtt-osram-smart-mini`
3. Remplir le formulaire avec vos informations MQTT
4. Sauvegarder

### 3. Redémarrer Homebridge

```bash
sudo systemctl restart homebridge
```

Ou via l'interface Homebridge Config UI X : cliquer sur **Restart Homebridge**

---

## ✨ Fonctionnalités

✅ **Détection automatique** de toutes vos télécommandes Osram Smart+ Mini (AC0251100NJ, AC0251600NJ, AC0251700NJ)

✅ **3 boutons programmables** par télécommande :
- **Flèche Haut** : appui court / appui long
- **Flèche Bas** : appui court / appui long  
- **Cercle** : appui court / appui long

✅ **Surveillance de la batterie** avec alertes

✅ **Utilise les noms configurés** dans Zigbee2MQTT

---

## 🔄 Mises à jour futures

Pour publier une nouvelle version :

1. Modifier le code
2. Mettre à jour la version dans `package.json` :
   ```bash
   npm version patch  # pour 1.0.0 -> 1.0.1
   # ou
   npm version minor  # pour 1.0.0 -> 1.1.0
   # ou
   npm version major  # pour 1.0.0 -> 2.0.0
   ```
3. Compiler et publier :
   ```bash
   npm run build
   git push && git push --tags
   npm publish
   ```

---

## 🆘 Support

- **Issues GitHub** : https://github.com/tomtom14z/homebridge-mqtt-osram-smart-mini/issues
- **Documentation complète** : voir README.md

---

Bon courage avec vos télécommandes Osram ! 🎛️✨
