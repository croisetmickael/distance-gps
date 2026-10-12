import type { NamedPoint } from "./types";

export function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Accès à la position refusé. Autorisez la localisation pour ce site dans les réglages du navigateur.";
    case 2:
      return "Position indisponible. Vérifiez que la localisation de l'appareil est activée.";
    case 3:
      return "La localisation a pris trop de temps. Réessayez, de préférence à l'extérieur.";
    default:
      return "Impossible d'obtenir votre position.";
  }
}

export interface Fix {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Combine plusieurs mesures GPS prises sans bouger.
 * On garde les mesures au plus deux fois moins précises que la meilleure,
 * puis on fait une moyenne pondérée par 1/précision² (les meilleures comptent plus).
 * La précision annoncée reste celle de la meilleure mesure : prudente, jamais flattée.
 */
export function combineFixes(fixes: Fix[]): Fix | null {
  const valid = fixes.filter((f) => Number.isFinite(f.accuracy) && f.accuracy > 0);
  if (valid.length === 0) return null;
  const best = Math.min(...valid.map((f) => f.accuracy));
  const kept = valid.filter((f) => f.accuracy <= best * 2);
  let wSum = 0;
  let lat = 0;
  let lng = 0;
  for (const f of kept) {
    const w = 1 / f.accuracy ** 2;
    wSum += w;
    lat += f.lat * w;
    lng += f.lng * w;
  }
  return { lat: lat / wSum, lng: lng / wSum, accuracy: best };
}

export interface WatchOptions {
  /** Arrêt automatique quand la précision atteint cette valeur (m) */
  targetAccuracy: number;
  /** Durée maximale d'affinage (ms) */
  maxDurationMs: number;
}

export interface WatchCallbacks {
  onUpdate: (point: NamedPoint, samples: number) => void;
  onDone: (point: NamedPoint | null) => void;
  onError: (message: string) => void;
}

/**
 * Suit la position pendant quelques secondes pour l'affiner (point A).
 * Retourne une fonction qui arrête la mesure et conserve le meilleur résultat.
 */
export function watchRefinedPosition(
  { onUpdate, onDone, onError }: WatchCallbacks,
  { targetAccuracy, maxDurationMs }: WatchOptions = { targetAccuracy: 3, maxDurationMs: 30_000 },
): () => void {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    onError("La géolocalisation exige une connexion HTTPS.");
    return () => {};
  }
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    onError("Ce navigateur ne permet pas la géolocalisation.");
    return () => {};
  }

  const fixes: Fix[] = [];
  let finished = false;
  let current: NamedPoint | null = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    navigator.geolocation.clearWatch(id);
    clearTimeout(timer);
    onDone(current);
  };

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      fixes.push({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      const combined = combineFixes(fixes);
      if (!combined) return;
      current = { ...combined, label: "Ma position", source: "gps" };
      onUpdate(current, fixes.length);
      if (combined.accuracy <= targetAccuracy) finish();
    },
    (err) => {
      if (fixes.length === 0) {
        finished = true;
        navigator.geolocation.clearWatch(id);
        clearTimeout(timer);
        onError(geolocationErrorMessage(err.code));
      }
    },
    { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
  );
  const timer = setTimeout(finish, maxDurationMs);
  return finish;
}
