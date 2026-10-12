import type { NamedPoint } from "./types";
import { isValidLatLng } from "./coordinates";

export const DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org";

/** Politique Nominatim : 1 requête par seconde maximum. */
export const MIN_INTERVAL_MS = 1100;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export class GeocodingError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createGeocoder(
  baseUrl: string = DEFAULT_NOMINATIM_URL,
  fetchImpl: FetchLike = (...args) => fetch(...args),
  now: () => number = () => Date.now(),
) {
  let lastRequest = -Infinity;

  return async function search(query: string, signal?: AbortSignal): Promise<NamedPoint[]> {
    const q = query.trim();
    if (q.length < 3) throw new GeocodingError("Saisissez au moins 3 caractères.");

    const wait = lastRequest + MIN_INTERVAL_MS - now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequest = now();

    const url = new URL("/search", baseUrl);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("accept-language", "fr");

    let response: Response;
    try {
      response = await fetchImpl(url.toString(), { signal, headers: { Accept: "application/json" } });
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      throw new GeocodingError("Recherche impossible : vérifiez votre connexion.");
    }
    if (response.status === 429) {
      throw new GeocodingError("Trop de recherches. Patientez quelques secondes.");
    }
    if (!response.ok) {
      throw new GeocodingError(`Le service de recherche a répondu ${response.status}.`);
    }

    const data = (await response.json()) as NominatimResult[];
    if (!Array.isArray(data)) return [];
    return data
      .map((r): NamedPoint => ({
        lat: Number(r.lat),
        lng: Number(r.lon),
        label: r.display_name,
        source: "recherche",
      }))
      .filter((p) => isValidLatLng(p) && typeof p.label === "string");
  };
}
