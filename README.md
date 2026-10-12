# Distance GPS

Application web open source qui mesure la distance à vol d'oiseau entre votre position GPS (point A) et un point choisi sur une carte (point B).

Gratuite, sans compte, sans clé API : la carte vient d'OpenStreetMap et la recherche d'adresse de Nominatim.

**Démo :** _à compléter après le premier déploiement Vercel_

## Fonctionnalités

- **Point A** : géolocalisation de l'appareil, avec affichage de la précision (cercle sur la carte et valeur en mètres).
- **Point B** : toucher la carte, rechercher une adresse, ou saisir des coordonnées décimales (`48.8584, 2.2945` ou `48,8584 ; 2,2945`).
- Les deux marqueurs se déplacent par glisser-déposer ; la distance se met à jour aussitôt.
- **Distance** calculée avec la formule de Haversine (rayon terrestre moyen 6 371 008,8 m), affichée en mètres sous 1 km, puis en kilomètres.
- Interface responsive (carte au-dessus et panneau en bas sur mobile, panneau latéral sur ordinateur), thème sombre automatique, navigation au clavier.
- Messages d'erreur explicites : permission refusée, position indisponible, absence de HTTPS, limite de requêtes Nominatim.

## Technologies

| Élément | Choix |
| --- | --- |
| Interface | React 18 + TypeScript |
| Outil de build | Vite 6 |
| Carte | Leaflet 1.9 + React Leaflet 4, tuiles OpenStreetMap |
| Géocodage | API publique Nominatim |
| Tests | Vitest 4 |
| Hébergement | Vercel (site statique) |

## Démarrage rapide

Prérequis : Node.js 18.18 ou plus récent (22 recommandé, voir `.nvmrc`).

```bash
git clone https://github.com/<votre-compte>/distance-gps.git
cd distance-gps
npm ci
npm run dev
```

Ouvrez ensuite l'adresse affichée (http://localhost:5173). La géolocalisation fonctionne sur `localhost` ; depuis un autre appareil du réseau local, elle exige HTTPS.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run typecheck` | Contrôle TypeScript |
| `npm test` | Tests automatisés (Vitest) |
| `npm run build` | Contrôle TypeScript puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local |

Vérification complète, identique à celle faite avant chaque déploiement :

```bash
npm ci && npm run typecheck && npm test && npm run build
```

## Structure

```
src/
├── App.tsx                  Écran principal (points A et B, distance)
├── components/
│   ├── MapView.tsx          Carte Leaflet, marqueurs, tracé, recadrage
│   └── SearchBox.tsx        Recherche du point B (adresse ou coordonnées)
├── lib/
│   ├── haversine.ts         Formule de Haversine et formatage de la distance
│   ├── coordinates.ts       Validation et saisie de coordonnées
│   ├── nominatim.ts         Client Nominatim (1 requête/s maximum)
│   ├── geolocation.ts       Géolocalisation et messages d'erreur
│   └── *.test.ts            Tests unitaires
├── config.ts                Fournisseurs de tuiles et de géocodage
└── styles.css
```

## Déploiement sur Vercel

Le fichier `vercel.json` fixe la configuration :

- Framework : Vite
- Installation : `npm ci`
- Build : `npm run build`
- Répertoire de sortie : `dist`
- En-tête `Permissions-Policy: geolocation=(self)` : la géolocalisation est autorisée pour le site lui-même uniquement.

L'application est une page unique sans routage côté client : aucune règle de réécriture n'est nécessaire. Vercel sert le site en HTTPS, condition indispensable à la géolocalisation dans les navigateurs.

Une fois le dépôt GitHub importé dans Vercel, chaque push sur `main` déclenche un déploiement de production, et chaque pull request un déploiement de prévisualisation.

## Variables d'environnement

**Aucune n'est requise.** Des variables optionnelles permettent de changer de fournisseur (voir `.env.example`) :

| Variable | Valeur par défaut |
| --- | --- |
| `VITE_TILE_URL` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `VITE_TILE_ATTRIBUTION` | Mention « Contributeurs OpenStreetMap » |
| `VITE_NOMINATIM_URL` | `https://nominatim.openstreetmap.org` |

Les variables `VITE_*` sont intégrées au code envoyé au navigateur : n'y placez jamais de secret. Sur Vercel, elles se définissent dans *Settings → Environment Variables* et prennent effet au déploiement suivant.

## Mettre à jour l'application

```bash
git pull
# … modifications …
npm run typecheck && npm test && npm run build
git add -A
git commit -m "Description claire de la modification"
git push origin main     # Vercel redéploie automatiquement
```

Pour les dépendances : `npm outdated`, puis `npm install <paquet>@<version>`, `npm audit`, et relancer la vérification complète.

## Limites des services publics OpenStreetMap et Nominatim

Ces services sont gratuits et financés par des dons. Leurs règles d'usage s'appliquent à toute personne qui déploie l'application.

**Tuiles OpenStreetMap** ([politique d'usage](https://operations.osmfoundation.org/policies/tiles/)) :
- adaptées à un usage personnel ou à faible trafic, sans garantie de disponibilité ni de performance ;
- l'attribution « © Contributeurs OpenStreetMap » doit rester visible (elle l'est en bas de la carte) ;
- le téléchargement massif ou le préchargement de tuiles est interdit ;
- en cas de trafic important, passez à un fournisseur dédié via `VITE_TILE_URL`.

**Nominatim** ([politique d'usage](https://operations.osmfoundation.org/policies/nominatim/)) :
- 1 requête par seconde au maximum : l'application l'impose côté client ;
- pas d'autocomplétion : la recherche ne part qu'à la validation du formulaire ;
- l'application doit être identifiable : le navigateur transmet l'en-tête `Referer` du site ;
- au-delà d'un usage léger, utilisez une instance auto-hébergée ou un service commercial via `VITE_NOMINATIM_URL`.

**Précision** : la distance affichée est orthodromique (vol d'oiseau, Terre sphérique). L'écart avec l'ellipsoïde WGS84 reste inférieur à 0,5 %. Ce n'est pas une distance d'itinéraire routier. La précision du point A dépend de l'appareil (GPS, Wi-Fi, réseau mobile).

## Confidentialité

La position n'est ni stockée ni envoyée à un serveur de l'application. Seuls les textes recherchés partent vers Nominatim, et le chargement de la carte vers les serveurs de tuiles OpenStreetMap.

## Licence

[MIT](LICENSE)
