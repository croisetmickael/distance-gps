export interface LatLng {
  lat: number;
  lng: number;
}

export interface NamedPoint extends LatLng {
  /** Libellé lisible (adresse, « Ma position », coordonnées…) */
  label: string;
  /** Précision en mètres, si connue (géolocalisation) */
  accuracy?: number;
}
