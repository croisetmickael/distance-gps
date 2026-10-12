import { Geodesic } from "geographiclib-geodesic";
import type { LatLng, NamedPoint } from "./types";

/**
 * Distance géodésique sur l'ellipsoïde WGS84 (algorithme de Karney, GeographicLib).
 * Exacte à quelques nanomètres près, quelle que soit la distance : c'est la référence
 * utilisée pour l'affichage au mètre près.
 */
export function geodesicDistance(a: LatLng, b: LatLng): number {
  const r = Geodesic.WGS84.Inverse(a.lat, a.lng, b.lat, b.lng);
  return r.s12 ?? Number.NaN;
}

/** Taille d'un pixel de carte (Web Mercator, tuiles 256 px) en mètres au sol. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (40_075_016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);
}

/**
 * Finesse estimée d'un placement manuel : environ 3 pixels à l'écran
 * (taille de la pointe d'un doigt ou d'un clic hésitant).
 */
export function placementAccuracy(lat: number, zoom: number): number {
  return 3 * metersPerPixel(lat, zoom);
}

export interface Uncertainty {
  /** Incertitude totale (pire cas : somme des deux), en mètres */
  meters: number;
  /** Vrai si au moins un point a une incertitude inconnue */
  partial: boolean;
}

export function distanceUncertainty(a: NamedPoint, b: NamedPoint): Uncertainty {
  const known = (p: NamedPoint) => (p.source === "saisie" ? 0 : p.accuracy);
  const ua = known(a);
  const ub = known(b);
  return { meters: (ua ?? 0) + (ub ?? 0), partial: ua === undefined || ub === undefined };
}
