# Distance GPS

Application web open source qui mesure la distance à vol d'oiseau entre votre position GPS (point A) et un point choisi sur une carte (point B).

Gratuite, sans compte, sans clé API : la carte vient d'OpenStreetMap et la recherche d'adresse de Nominatim.

**Démo :** _à compléter après le premier déploiement Vercel_

## Fonctionnalités

- **Distance au mètre près**, calculée sur l'ellipsoïde WGS84 avec l'algorithme de Karney (GeographicLib), exact à quelques nanomètres. Au-delà de 1 km, l'affichage reste au mètre (`1,234 km`, soit `1 234 m`).
- **Incertitude affichée** à côté de chaque mesure (± X m), calculée à partir de la précision GPS et de la finesse du placement sur la carte.
- **Point A** : géolocalisation affinée. L'application cumule les mesures pendant 30 s maximum, s'arrête dès ±3 m, et propose « Valider » pour arrêter plus tôt. On peut aussi placer A à la main sur la carte.
- **Point B** : toucher la carte, rechercher une adresse, ou saisir des coordonnées décimales (`48.8584, 2.2945` ou `48,8584 ; 2,2945`).
- **Mode Satellite** : photos aériennes IGN (20 cm par pixel en France), zoom jusqu'au niveau 21 pour placer les points finement. Le fond choisi est mémorisé.
- Marqueurs déplaçables par glisser-déposer, interface responsive, thème sombre automatique, navigation au clavier.

## Précision : ce qu'il faut savoir

L'affichage au mètre ne garantit pas une mesure exacte au mètre. La précision réelle dépend de la façon dont les points sont placés :

| Méthode de placement | Précision typique |
| --- | --- |
| Coordonnées saisies | Exactes (la seule erreur vient du calcul, négligeable) |
| Placement sur photo aérienne IGN, zoom maximal | Environ 0,5 à 1 m (précision de l'orthophoto et du pointage) |
| GPS de smartphone, à découvert, après affinage | 2 à 5 m ; 5 à 15 m en ville ou sous les arbres |
| Adresse trouvée par recherche | Inconnue : centre de l'adresse ou du bâtiment |

**Pour mesurer au mètre** : passez en mode Satellite, zoomez au maximum, choisissez « A » dans « Toucher la carte place », touchez le point de départ, puis touchez le point d'arrivée. Une précision de 1 m avec un vrai positionnement GPS exige un récepteur GNSS RTK ; un téléphone ne l'atteint pas.

Pourquoi pas la formule de Haversine ? Elle suppose une Terre parfaitement sphérique. À Abbeville, elle se trompe d'environ 3 m sur 1 km et de 87 m entre Abbeville et Amiens. Elle reste dans le code (`haversine.ts`) comme contrôle croisé, mais n'est plus utilisée pour l'affichage.

## Technologies

| Élément | Choix |
| --- | --- |
| Interface | React 18 + TypeScript |
| Outil de build | Vite 6 |
| Carte | Leaflet 1.9 + React Leaflet 4, tuiles OpenStreetMap et photos aériennes IGN |
| Calcul de distance | GeographicLib (Karney, ellipsoïde WGS84) |
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
│   ├── geodesic.ts          Distance géodésique WGS84, incertitude, finesse de placement
│   ├── haversine.ts         Formule de Haversine (contrôle) et formatage au mètre
│   ├── coordinates.ts       Validation et saisie de coordonnées
│   ├── nominatim.ts         Client Nominatim (1 requête/s maximum)
│   ├── geolocation.ts       Géolocalisation affinée (moyenne pondérée) et erreurs
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
| `VITE_SATELLITE_URL` | Photos aériennes IGN (Géoplateforme, France) |
| `VITE_SATELLITE_ATTRIBUTION` | Mention « IGN – Géoplateforme » |
| `VITE_SATELLITE_MAX_NATIVE_ZOOM` | `19` |
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

## Limites des services publics (OpenStreetMap, Nominatim, IGN)

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

**Photos aériennes IGN** ([Géoplateforme](https://geoservices.ign.fr/)) :
- service public, gratuit et sans clé ; la mention « IGN – Géoplateforme » doit rester visible ;
- couverture limitée à la France (métropole et outre-mer) : ailleurs, le fond Satellite reste vide ;
- pour une couverture mondiale, branchez un autre fournisseur via `VITE_SATELLITE_URL`, en respectant ses conditions. L'imagerie Esri World Imagery, fréquente dans les exemples Leaflet, demande en principe un compte ArcGIS pour un usage hors des outils Esri.

La distance affichée est à vol d'oiseau, pas un itinéraire routier.

## Confidentialité

La position n'est ni stockée ni envoyée à un serveur de l'application. Seuls les textes recherchés partent vers Nominatim, et le chargement de la carte vers les serveurs de tuiles OpenStreetMap.

## Licence

[MIT](LICENSE)
