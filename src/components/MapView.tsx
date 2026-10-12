import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng, NamedPoint } from "../lib/types";
import { config } from "../config";

export type BaseLayer = "plan" | "satellite";

// Marqueurs en HTML/CSS : évite le bug classique des icônes Leaflet
// introuvables une fois le projet compilé par Vite.
const makeIcon = (letter: "A" | "B") =>
  L.divIcon({
    className: `pin pin-${letter.toLowerCase()}`,
    html: `<span>${letter}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const FRANCE_CENTER: [number, number] = [46.6, 2.4];

/** Position et zoom au moment de l'action, pour estimer la finesse du placement. */
export type PlaceHandler = (p: LatLng, zoom: number) => void;

interface Props {
  a: NamedPoint | null;
  b: NamedPoint | null;
  fitKey: number;
  baseLayer: BaseLayer;
  onMapClick: PlaceHandler;
  onDragA: PlaceHandler;
  onDragB: PlaceHandler;
}

function ClickHandler({ onMapClick }: { onMapClick: PlaceHandler }) {
  const map = useMapEvents({
    click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }, map.getZoom()),
  });
  return null;
}

/** Recadre la carte quand un point est défini par géolocalisation ou recherche. */
function FitView({ a, b, fitKey }: Pick<Props, "a" | "b" | "fitKey">) {
  const map = useMap();
  useEffect(() => {
    if (fitKey === 0) return;
    if (a && b) {
      map.fitBounds(L.latLngBounds([a.lat, a.lng], [b.lat, b.lng]), {
        padding: [56, 56],
        maxZoom: 18,
      });
    } else {
      const p = a ?? b;
      if (p) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 17));
    }
    // Volontairement limité à fitKey : pas de recadrage pendant un glisser-déposer.
  }, [fitKey]);
  return null;
}

/** Leaflet ne détecte que les redimensionnements de fenêtre : on surveille le conteneur. */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function DraggablePin({
  point,
  icon,
  title,
  onDrag,
}: {
  point: NamedPoint;
  icon: L.DivIcon;
  title: string;
  onDrag: PlaceHandler;
}) {
  const map = useMap();
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={icon}
      draggable
      title={title}
      alt={title}
      eventHandlers={{
        dragend: (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          onDrag({ lat: ll.lat, lng: ll.lng }, map.getZoom());
        },
      }}
    />
  );
}

export default function MapView({ a, b, fitKey, baseLayer, onMapClick, onDragA, onDragB }: Props) {
  const iconA = useMemo(() => makeIcon("A"), []);
  const iconB = useMemo(() => makeIcon("B"), []);
  const tiles = config[baseLayer];

  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={6}
      maxZoom={config.maxZoom}
      className={`map map-${baseLayer}`}
      worldCopyJump
    >
      <TileLayer
        key={baseLayer}
        url={tiles.url}
        attribution={tiles.attribution}
        maxNativeZoom={tiles.maxNativeZoom}
        maxZoom={config.maxZoom}
      />
      <ClickHandler onMapClick={onMapClick} />
      <FitView a={a} b={b} fitKey={fitKey} />
      <AutoResize />

      {a?.source === "gps" && a.accuracy !== undefined && a.accuracy < 5000 && (
        <Circle
          center={[a.lat, a.lng]}
          radius={a.accuracy}
          pathOptions={{ color: "#2e6fc2", weight: 1, fillOpacity: 0.15 }}
        />
      )}
      {a && b && (
        <>
          {/* Liseré blanc sous le tracé : lisible sur le plan comme sur la photo */}
          <Polyline
            positions={[[a.lat, a.lng], [b.lat, b.lng]]}
            pathOptions={{ color: "#ffffff", weight: 6, opacity: 0.85 }}
            interactive={false}
          />
          <Polyline
            positions={[[a.lat, a.lng], [b.lat, b.lng]]}
            pathOptions={{ color: "#1c2b36", weight: 3, dashArray: "8 8" }}
            interactive={false}
          />
        </>
      )}
      {a && <DraggablePin point={a} icon={iconA} title="Point A" onDrag={onDragA} />}
      {b && <DraggablePin point={b} icon={iconB} title="Point B" onDrag={onDragB} />}
    </MapContainer>
  );
}
