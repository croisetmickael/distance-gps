import { formatDistance, formatUncertainty } from "../lib/haversine";
import { distanceUncertainty, geodesicDistance } from "../lib/geodesic";
import type { NamedPoint } from "../lib/types";

interface Props {
  a: NamedPoint | null;
  b: NamedPoint | null;
  /** Version resserrée, posée sur la carte en plein écran */
  compact?: boolean;
}

/** Distance A–B, sa conversion en mètres et l'incertitude de mesure. */
export default function DistanceResult({ a, b, compact = false }: Props) {
  if (!a || !b) {
    return (
      <p className="hint empty">
        {!a
          ? "Localisez-vous, ou placez A sur la carte, puis choisissez un point B."
          : "Touchez la carte ou recherchez un lieu pour placer le point B."}
      </p>
    );
  }

  const distance = formatDistance(geodesicDistance(a, b));
  const uncertainty = distanceUncertainty(a, b);

  return (
    <>
      <p className="distance">
        {distance.value}
        <span className="unit">{distance.unit}</span>
      </p>
      {!compact && (
        <p className="hint">
          {distance.unit === "km" ? `soit ${distance.meters} ` : ""}à vol d'oiseau, sur
          l'ellipsoïde WGS84
        </p>
      )}
      {compact && distance.unit === "km" && <p className="hint">soit {distance.meters}</p>}
      <p className={`uncertainty${uncertainty.meters > 1 ? " is-wide" : ""}`}>
        Incertitude ± {formatUncertainty(uncertainty.meters)}
        {uncertainty.partial && " (plus une adresse approximative)"}
      </p>
    </>
  );
}
