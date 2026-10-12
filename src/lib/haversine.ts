import type { LatLng } from "./types";

/** Rayon moyen de la Terre (UGGI), en mètres. */
export const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Distance orthodromique (« à vol d'oiseau ») entre deux points,
 * calculée avec la formule de Haversine. Résultat en mètres.
 * Erreur typique < 0,5 % par rapport à l'ellipsoïde WGS84.
 */
export function haversineDistance(a: LatLng, b: LatLng, radius = EARTH_RADIUS_M): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  // Bornage : protège asin() des erreurs d'arrondi (points antipodaux)
  return 2 * radius * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export interface FormattedDistance {
  value: string;
  unit: "m" | "km";
}

/** Formate une distance en mètres pour l'affichage en français. */
export function formatDistance(meters: number): FormattedDistance {
  if (!Number.isFinite(meters) || meters < 0) {
    throw new RangeError("La distance doit être un nombre positif.");
  }
  if (meters < 1000) {
    return { value: String(Math.round(meters)), unit: "m" };
  }
  const km = meters / 1000;
  const digits = km < 10 ? 2 : km < 100 ? 1 : 0;
  const value = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km);
  return { value, unit: "km" };
}
