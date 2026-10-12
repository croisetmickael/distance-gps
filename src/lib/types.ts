export interface LatLng {
  lat: number;
  lng: number;
}

/** Origine d'un point : elle détermine l'incertitude à afficher. */
export type PointSource = "gps" | "carte" | "recherche" | "saisie";

export interface NamedPoint extends LatLng {
  /** Libellé lisible (adresse, coordonnées…) */
  label: string;
  source: PointSource;
  /**
   * Incertitude de position en mètres :
   * précision GPS, ou finesse du placement sur la carte.
   * Absente quand elle est inconnue (adresse trouvée par recherche).
   */
  accuracy?: number;
}
