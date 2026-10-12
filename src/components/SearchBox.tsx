import { useMemo, useRef, useState, type FormEvent } from "react";
import { parseCoordinates, formatLatLng } from "../lib/coordinates";
import { createGeocoder } from "../lib/nominatim";
import type { NamedPoint } from "../lib/types";
import { config } from "../config";

interface Props {
  onSelect: (p: NamedPoint) => void;
}

export default function SearchBox({ onSelect }: Props) {
  const search = useMemo(() => createGeocoder(config.nominatimUrl), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NamedPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);

    const coords = parseCoordinates(query);
    if (coords) {
      onSelect({ ...coords, label: formatLatLng(coords) });
      return;
    }

    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setLoading(true);
    try {
      const found = await search(query, ctrl.signal);
      if (found.length === 0) setError("Aucun lieu trouvé. Essayez avec la ville ou le code postal.");
      setResults(found);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      if (controller.current === ctrl) setLoading(false);
    }
  }

  function choose(p: NamedPoint) {
    onSelect(p);
    setResults(null);
    setQuery(p.label.split(",")[0]);
  }

  return (
    <div className="search">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="search-b" className="visually-hidden">
          Rechercher le point B
        </label>
        <input
          id="search-b"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lieu ou coordonnées"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className="btn" disabled={loading || query.trim().length === 0}>
          {loading ? "Recherche…" : "Rechercher"}
        </button>
      </form>
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="results" aria-label="Résultats de recherche">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.label}`}>
              <button type="button" onClick={() => choose(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
