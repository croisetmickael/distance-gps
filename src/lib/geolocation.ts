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

/** Obtient la position courante de l'appareil (point A). */
export function getCurrentPosition(): Promise<NamedPoint> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(new Error("La géolocalisation exige une connexion HTTPS."));
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Ce navigateur ne permet pas la géolocalisation."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          label: "Ma position",
        }),
      (err) => reject(new Error(geolocationErrorMessage(err.code))),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}
