import type { LatLng } from "./types";

/** Rayon moyen de la Terre (UGGI), en mètres. */
export const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Distance sur une Terre sphérique (formule de Haversine), en mètres.
 * Rapide mais approchée : jusqu'à 0,5 % d'écart avec l'ellipsoïde WGS84
 * (environ 5 m par kilomètre). L'application affiche donc la distance
 * géodésique (geodesic.ts) ; cette fonction sert de contrôle croisé.
 */
export function haversineDistance(a: LatLng, b: LatLng, radius = EARTH_RADIUS_M): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export interface FormattedDistance {
  value: string;
  unit: "m" | "km";
  /** La même distance en mètres entiers, ex. « 115 432 m » */
  meters: string;
}

const intFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const kmFormat = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** Formate une distance au mètre près (km avec 3 décimales au-delà de 1 km). */
export function formatDistance(meters: number): FormattedDistance {
  if (!Number.isFinite(meters) || meters < 0) {
    throw new RangeError("La distance doit être un nombre positif.");
  }
  const rounded = Math.round(meters);
  const m = `${intFormat.format(rounded)} m`;
  if (rounded < 1000) return { value: intFormat.format(rounded), unit: "m", meters: m };
  return { value: kmFormat.format(rounded / 1000), unit: "km", meters: m };
}

/** Arrondi lisible d'une incertitude : 0,5 m près sous 10 m, au mètre au-delà. */
export function formatUncertainty(meters: number): string {
  if (meters < 10) {
    const v = Math.max(0.5, Math.round(meters * 2) / 2);
    return `${new Intl.NumberFormat("fr-FR").format(v)} m`;
  }
  return `${intFormat.format(Math.round(meters))} m`;
}
