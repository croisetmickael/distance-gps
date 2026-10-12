import { DEFAULT_NOMINATIM_URL } from "./lib/nominatim";

const env = import.meta.env;

export const config = {
  tileUrl: env.VITE_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution:
    env.VITE_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>',
  nominatimUrl: env.VITE_NOMINATIM_URL || DEFAULT_NOMINATIM_URL,
};
