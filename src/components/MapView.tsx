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

interface Props {
  a: NamedPoint | null;
  b: NamedPoint | null;
  fitKey: number;
  onMapClick: (p: LatLng) => void;
  onDragA: (p: LatLng) => void;
  onDragB: (p: LatLng) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: Props["onMapClick"] }) {
  useMapEvents({ click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
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
        maxZoom: 16,
      });
    } else {
      const p = a ?? b;
      if (p) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 14));
    }
    // Volontairement limité à fitKey : on ne recadre pas pendant un glisser-déposer.
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

export default function MapView({ a, b, fitKey, onMapClick, onDragA, onDragB }: Props) {
  const iconA = useMemo(() => makeIcon("A"), []);
  const iconB = useMemo(() => makeIcon("B"), []);

  const dragHandlers = (cb: (p: LatLng) => void) => ({
    dragend: (e: L.LeafletEvent) => {
      const ll = (e.target as L.Marker).getLatLng();
      cb({ lat: ll.lat, lng: ll.lng });
    },
  });

  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={6}
      className="map"
      worldCopyJump
      attributionControl
    >
      <TileLayer url={config.tileUrl} attribution={config.tileAttribution} maxZoom={19} />
      <ClickHandler onMapClick={onMapClick} />
      <FitView a={a} b={b} fitKey={fitKey} />
      <AutoResize />

      {a?.accuracy && a.accuracy < 5000 && (
        <Circle
          center={[a.lat, a.lng]}
          radius={a.accuracy}
          pathOptions={{ color: "#2e6fc2", weight: 1, fillOpacity: 0.12 }}
        />
      )}
      {a && b && (
        <Polyline
          positions={[
            [a.lat, a.lng],
            [b.lat, b.lng],
          ]}
          pathOptions={{ color: "#1c2b36", weight: 3, dashArray: "8 8" }}
        />
      )}
      {a && (
        <Marker
          position={[a.lat, a.lng]}
          icon={iconA}
          draggable
          eventHandlers={dragHandlers(onDragA)}
          title="Point A"
          alt="Point A"
        />
      )}
      {b && (
        <Marker
          position={[b.lat, b.lng]}
          icon={iconB}
          draggable
          eventHandlers={dragHandlers(onDragB)}
          title="Point B"
          alt="Point B"
        />
      )}
    </MapContainer>
  );
}
