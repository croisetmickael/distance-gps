/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TILE_URL?: string;
  readonly VITE_TILE_ATTRIBUTION?: string;
  readonly VITE_SATELLITE_URL?: string;
  readonly VITE_SATELLITE_ATTRIBUTION?: string;
  readonly VITE_SATELLITE_MAX_NATIVE_ZOOM?: string;
  readonly VITE_NOMINATIM_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
