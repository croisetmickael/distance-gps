import { DEFAULT_NOMINATIM_URL } from "./lib/nominatim";

const env = import.meta.env;

export interface TileSource {
  url: string;
  attribution: string;
  maxNativeZoom: number;
}

const IGN_ORTHO =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0" +
  "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg" +
  "&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

export const config = {
  /** Zoom maximal de la carte (au-delà du zoom natif, les tuiles sont agrandies) */
  maxZoom: 21,
  plan: {
    url: env.VITE_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      env.VITE_TILE_ATTRIBUTION ||
      '&copy; <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>',
    maxNativeZoom: 19,
  } satisfies TileSource,
  satellite: {
    url: env.VITE_SATELLITE_URL || IGN_ORTHO,
    attribution:
      env.VITE_SATELLITE_ATTRIBUTION ||
      'Photos aériennes &copy; <a href="https://geoservices.ign.fr/">IGN – Géoplateforme</a>',
    maxNativeZoom: Number(env.VITE_SATELLITE_MAX_NATIVE_ZOOM) || 19,
  } satisfies TileSource,
  /** Vrai tant que l'imagerie par défaut (IGN, France uniquement) est utilisée */
  satelliteFranceOnly: !env.VITE_SATELLITE_URL,
  nominatimUrl: env.VITE_NOMINATIM_URL || DEFAULT_NOMINATIM_URL,
};
