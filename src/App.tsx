import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { type BaseLayer, type PlaceHandler } from "./components/MapView";
import SearchBox from "./components/SearchBox";
import { config } from "./config";
import { formatLatLng } from "./lib/coordinates";
import { distanceUncertainty, geodesicDistance, placementAccuracy } from "./lib/geodesic";
import { watchRefinedPosition } from "./lib/geolocation";
import { formatDistance, formatUncertainty } from "./lib/haversine";
import type { NamedPoint } from "./lib/types";

type Target = "A" | "B";

const LAYER_KEY = "distance-gps:fond";

function readStoredLayer(): BaseLayer {
  try {
    return localStorage.getItem(LAYER_KEY) === "satellite" ? "satellite" : "plan";
  } catch {
    return "plan";
  }
}

const placed = (p: { lat: number; lng: number }, zoom: number): NamedPoint => ({
  ...p,
  label: formatLatLng(p, 6),
  source: "carte",
  accuracy: placementAccuracy(p.lat, zoom),
});

export default function App() {
  const [a, setA] = useState<NamedPoint | null>(null);
  const [b, setB] = useState<NamedPoint | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [target, setTarget] = useState<Target>("B");
  const [baseLayer, setBaseLayer] = useState<BaseLayer>(readStoredLayer);
  const [refining, setRefining] = useState<{ samples: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const stopWatch = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LAYER_KEY, baseLayer);
    } catch {
      /* stockage indisponible : le choix ne sera simplement pas mémorisé */
    }
  }, [baseLayer]);

  useEffect(() => () => stopWatch.current?.(), []);

  const refit = () => setFitKey((k) => k + 1);

  function locate() {
    stopWatch.current?.();
    setGeoError(null);
    setRefining({ samples: 0 });
    let first = true;
    stopWatch.current = watchRefinedPosition({
      onUpdate: (p, samples) => {
        setA(p);
        setRefining({ samples });
        if (first) {
          first = false;
          refit();
        }
      },
      onDone: () => {
        setRefining(null);
        stopWatch.current = null;
      },
      onError: (message) => {
        setGeoError(message);
        setRefining(null);
        stopWatch.current = null;
      },
    });
  }

  const onMapClick = useCallback<PlaceHandler>(
    (p, zoom) => {
      if (target === "A") {
        stopWatch.current?.();
        setA(placed(p, zoom));
        setTarget("B");
      } else {
        setB(placed(p, zoom));
      }
    },
    [target],
  );
  const dragA = useCallback<PlaceHandler>((p, zoom) => {
    stopWatch.current?.();
    setA(placed(p, zoom));
  }, []);
  const dragB = useCallback<PlaceHandler>((p, zoom) => setB(placed(p, zoom)), []);

  const meters = a && b ? geodesicDistance(a, b) : null;
  const distance = meters !== null ? formatDistance(meters) : null;
  const uncertainty = a && b ? distanceUncertainty(a, b) : null;

  return (
    <div className="app">
      <main className="map-area" aria-label="Carte">
        <MapView
          a={a}
          b={b}
          fitKey={fitKey}
          baseLayer={baseLayer}
          onMapClick={onMapClick}
          onDragA={dragA}
          onDragB={dragB}
        />
        <div className="layer-switch" role="radiogroup" aria-label="Fond de carte">
          {(["plan", "satellite"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={baseLayer === l}
              className={baseLayer === l ? "is-active" : undefined}
              onClick={() => setBaseLayer(l)}
            >
              {l === "plan" ? "Plan" : "Satellite"}
            </button>
          ))}
        </div>
      </main>

      <aside className="panel">
        <header className="panel-head">
          <h1>Distance GPS</h1>
        </header>

        <section className="result" aria-live="polite">
          {distance && uncertainty ? (
            <>
              <p className="distance">
                {distance.value}
                <span className="unit">{distance.unit}</span>
              </p>
              <p className="hint">
                {distance.unit === "km" ? `soit ${distance.meters} ` : ""}à vol d'oiseau, sur
                l'ellipsoïde WGS84
              </p>
              <p className={`uncertainty${uncertainty.meters > 1 ? " is-wide" : ""}`}>
                Incertitude ± {formatUncertainty(uncertainty.meters)}
                {uncertainty.partial && " (plus une adresse approximative)"}
              </p>
            </>
          ) : (
            <p className="hint empty">
              {!a
                ? "Localisez-vous, ou placez A sur la carte, puis choisissez un point B."
                : "Touchez la carte ou recherchez un lieu pour placer le point B."}
            </p>
          )}
        </section>

        <div className="target" role="radiogroup" aria-label="Le prochain toucher sur la carte place">
          <span>Toucher la carte place</span>
          {(["A", "B"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={target === t}
              className={`target-${t.toLowerCase()}${target === t ? " is-active" : ""}`}
              onClick={() => setTarget(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="point" aria-labelledby="label-a">
          <div className="point-head">
            <span className="dot dot-a" aria-hidden="true">A</span>
            <h2 id="label-a">Départ</h2>
            {refining ? (
              <button type="button" className="btn btn-primary" onClick={() => stopWatch.current?.()}>
                Valider
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={locate}>
                {a?.source === "gps" ? "Relocaliser" : "Me localiser"}
              </button>
            )}
          </div>
          {a && (
            <p className="coords">
              {formatLatLng(a, 6)}
              {a.accuracy !== undefined && (
                <span className="accuracy-text">
                  {" "}
                  ({a.source === "gps" ? "GPS" : "placement"} ± {formatUncertainty(a.accuracy)})
                </span>
              )}
            </p>
          )}
          {refining && (
            <p className="message">
              Affinage en cours ({refining.samples} mesure{refining.samples > 1 ? "s" : ""}). Restez
              immobile, à découvert ; validez quand la précision vous convient.
            </p>
          )}
          {geoError && (
            <p className="message error" role="alert">
              {geoError}
            </p>
          )}
        </section>

        <section className="point" aria-labelledby="label-b">
          <div className="point-head">
            <span className="dot dot-b" aria-hidden="true">B</span>
            <h2 id="label-b">Destination</h2>
            {b && (
              <button type="button" className="btn btn-quiet" onClick={() => setB(null)}>
                Effacer
              </button>
            )}
          </div>
          {b && (
            <p className="coords">
              {b.source === "recherche" ? b.label : formatLatLng(b, 6)}
              {b.source === "carte" && b.accuracy !== undefined && (
                <span className="accuracy-text"> (placement ± {formatUncertainty(b.accuracy)})</span>
              )}
            </p>
          )}
          {b?.source === "recherche" && (
            <p className="message">
              Point placé au centre de l'adresse. Pour une mesure au mètre, zoomez au maximum en
              mode Satellite et déplacez le marqueur B sur l'endroit exact.
            </p>
          )}
          <SearchBox
            onSelect={(p) => {
              setB(p);
              refit();
            }}
          />
        </section>

        <footer className="panel-foot">
          Zoomez au maximum avant de placer ou déplacer un marqueur : plus le zoom est fort, plus le
          placement est fin.
          {baseLayer === "satellite" && config.satelliteFranceOnly && (
            <> Les photos aériennes IGN couvrent la France uniquement.</>
          )}{" "}
          Recherche :{" "}
          <a href="https://nominatim.org" target="_blank" rel="noreferrer">
            Nominatim
          </a>
          .
        </footer>
      </aside>
    </div>
  );
}
