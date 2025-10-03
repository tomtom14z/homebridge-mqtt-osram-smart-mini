# Guide pour rafraîchir les accessoires dans HomeKit

## Problème
Après une mise à jour du plugin qui change les noms des boutons, HomeKit peut garder les anciens noms en cache.

## Solutions (du plus simple au plus radical)

### Solution 1 : Forcer la recréation des accessoires (RECOMMANDÉ)

Cette solution force Homebridge à recréer les accessoires sans perdre vos automatisations.

**Étape 1 : Ajouter un UUID différent temporairement**

Modifiez temporairement le code pour forcer la recréation :

Dans `src/platform.ts`, trouvez la ligne :
```typescript
const uuid = this.api.hap.uuid.generate(device.ieee_address);
```

Et remplacez-la temporairement par :
```typescript
const uuid = this.api.hap.uuid.generate(device.ieee_address + '_v2');
```

**Étape 2 : Recompiler et redémarrer**
```bash
cd "/Users/thomasvernouillet/homebridge-mqtt-osram-smart+mini"
npm run build
sudo systemctl restart homebridge  # ou redémarrer via l'interface
```

**Étape 3 : Supprimer les anciens accessoires**
Dans l'application Maison, supprimez les anciennes télécommandes qui apparaissent maintenant en double.

**Étape 4 : Remettre le code original**
Remettez la ligne originale :
```typescript
const uuid = this.api.hap.uuid.generate(device.ieee_address);
```

Puis recompiler :
```bash
npm run build
```

### Solution 2 : Supprimer le cache Homebridge

**Via l'interface Homebridge Config UI X :**
1. Aller dans **Settings** (Paramètres)
2. Cliquer sur **Remove Single Cached Accessory** (Supprimer un accessoire en cache)
3. Chercher vos télécommandes Osram
4. Les supprimer une par une
5. Redémarrer Homebridge

**Via ligne de commande :**
```bash
# Arrêter Homebridge
sudo systemctl stop homebridge

# Supprimer le fichier de cache
rm -rf ~/.homebridge/accessories/cachedAccessories

# Redémarrer Homebridge
sudo systemctl start homebridge
```

⚠️ **Attention** : Cette méthode supprime TOUS les accessoires en cache, vous devrez peut-être reconfigurer d'autres plugins.

### Solution 3 : Supprimer seulement les télécommandes dans HomeKit

1. Ouvrir l'application **Maison** sur iOS
2. Trouver vos télécommandes Osram
3. Maintenir appuyé sur chaque télécommande
4. Sélectionner **Réglages** → **Supprimer l'accessoire**
5. Redémarrer Homebridge

Les télécommandes seront automatiquement re-découvertes avec les nouveaux noms.

### Solution 4 : Supprimer et ré-ajouter le pont Homebridge (dernier recours)

⚠️ **ATTENTION** : Cette méthode supprimera TOUTES vos automatisations HomeKit liées à Homebridge !

1. Dans l'application Maison, supprimer le pont Homebridge
2. Redémarrer Homebridge
3. Scanner à nouveau le QR code pour ré-ajouter le pont

---

## Quelle solution choisir ?

- **Si vous voulez garder vos automatisations** : Solution 1 ou 3
- **Si vous n'avez pas d'automatisations importantes** : Solution 2
- **En dernier recours uniquement** : Solution 4
