import { useCallback, useState } from "react";
import MapView from "./components/MapView";
import SearchBox from "./components/SearchBox";
import { formatLatLng } from "./lib/coordinates";
import { getCurrentPosition } from "./lib/geolocation";
import { formatDistance, haversineDistance } from "./lib/haversine";
import type { LatLng, NamedPoint } from "./lib/types";

export default function App() {
  const [a, setA] = useState<NamedPoint | null>(null);
  const [b, setB] = useState<NamedPoint | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const refit = () => setFitKey((k) => k + 1);

  async function locate() {
    setLocating(true);
    setGeoError(null);
    try {
      setA(await getCurrentPosition());
      refit();
    } catch (err) {
      setGeoError((err as Error).message);
    } finally {
      setLocating(false);
    }
  }

  const setBFromMap = useCallback((p: LatLng) => setB({ ...p, label: formatLatLng(p) }), []);
  const dragA = useCallback((p: LatLng) => setA({ ...p, label: formatLatLng(p) }), []);

  const distance = a && b ? formatDistance(haversineDistance(a, b)) : null;

  return (
    <div className="app">
      <main className="map-area" aria-label="Carte">
        <MapView
          a={a}
          b={b}
          fitKey={fitKey}
          onMapClick={setBFromMap}
          onDragA={dragA}
          onDragB={setBFromMap}
        />
      </main>

      <aside className="panel">
        <header className="panel-head">
          <h1>Distance GPS</h1>
        </header>

        <section className="result" aria-live="polite">
          {distance ? (
            <>
              <p className="distance">
                {distance.value}
                <span className="unit">{distance.unit}</span>
              </p>
              <p className="hint">à vol d'oiseau entre A et B</p>
            </>
          ) : (
            <p className="hint empty">
              {!a
                ? "Commencez par vous localiser, puis choisissez un point B."
                : "Touchez la carte ou recherchez un lieu pour placer le point B."}
            </p>
          )}
        </section>

        <section className="point" aria-labelledby="label-a">
          <div className="point-head">
            <span className="dot dot-a" aria-hidden="true">A</span>
            <h2 id="label-a">Départ</h2>
            <button type="button" className="btn btn-primary" onClick={locate} disabled={locating}>
              {locating ? "Localisation…" : a ? "Actualiser" : "Me localiser"}
            </button>
          </div>
          {a && (
            <p className="coords">
              {a.label === "Ma position" ? formatLatLng(a) : a.label}
              {a.accuracy !== undefined && a.label === "Ma position" && (
                <span className="accuracy-text"> (précision ± {Math.round(a.accuracy)} m)</span>
              )}
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
          {b && <p className="coords">{b.label}</p>}
          <SearchBox
            onSelect={(p) => {
              setB(p);
              refit();
            }}
          />
        </section>

        <footer className="panel-foot">
          Les marqueurs se déplacent par glisser-déposer. Recherche :{" "}
          <a href="https://nominatim.org" target="_blank" rel="noreferrer">
            Nominatim
          </a>
          , données{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
          .
        </footer>
      </aside>
    </div>
  );
}
