import type { LatLng } from "./types";

export function isValidLatLng(p: Partial<LatLng> | null | undefined): p is LatLng {
  return (
    !!p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

/**
 * Reconnaît une saisie de coordonnées décimales « lat, lng ».
 * Accepte la virgule décimale française si les deux nombres sont séparés
 * par un point-virgule ou des espaces : « 48,8566 ; 2,3522 ».
 * Retourne null si la saisie n'est pas un couple de coordonnées valide.
 */
export function parseCoordinates(input: string): LatLng | null {
  const text = input.trim();
  if (!text) return null;

  let parts: string[];
  if (text.includes(";")) {
    parts = text.split(";");
  } else if (/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(text)) {
    parts = text.split(",");
  } else {
    parts = text.split(/\s+/);
  }
  if (parts.length !== 2) return null;

  const nums = parts.map((s) => s.trim().replace(",", "."));
  if (!nums.every((s) => /^-?\d+(\.\d+)?$/.test(s))) return null;

  const point = { lat: Number(nums[0]), lng: Number(nums[1]) };
  return isValidLatLng(point) ? point : null;
}

export function formatLatLng(p: LatLng, digits = 5): string {
  return `${p.lat.toFixed(digits)}, ${p.lng.toFixed(digits)}`;
}
