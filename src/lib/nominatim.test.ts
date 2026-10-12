import { describe, expect, it, vi } from "vitest";
import { createGeocoder, GeocodingError, MIN_INTERVAL_MS } from "./nominatim";

const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("createGeocoder", () => {
  it("interroge /search avec les bons paramètres et convertit les résultats", async () => {
    const fetchMock = vi.fn((_url: string) =>
      ok([{ lat: "48.8566", lon: "2.3522", display_name: "Paris, France" }]),
    );
    const search = createGeocoder("https://example.org", fetchMock);
    const results = await search("Paris");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://example.org/search");
    expect(url.searchParams.get("q")).toBe("Paris");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(results).toEqual([{ lat: 48.8566, lng: 2.3522, label: "Paris, France" }]);
  });

  it("ignore les résultats aux coordonnées invalides", async () => {
    const search = createGeocoder("https://example.org", () =>
      ok([{ lat: "abc", lon: "2", display_name: "X" }]),
    );
    expect(await search("Nulle part")).toEqual([]);
  });

  it("refuse les requêtes trop courtes sans appeler le réseau", async () => {
    const fetchMock = vi.fn();
    const search = createGeocoder("https://example.org", fetchMock);
    await expect(search("ab")).rejects.toBeInstanceOf(GeocodingError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signale clairement une limitation de débit (429)", async () => {
    const search = createGeocoder("https://example.org", () =>
      Promise.resolve(new Response("", { status: 429 })),
    );
    await expect(search("Paris")).rejects.toThrow(/Trop de recherches/);
  });

  it("signale une erreur réseau", async () => {
    const search = createGeocoder("https://example.org", () => Promise.reject(new TypeError("x")));
    await expect(search("Paris")).rejects.toThrow(/connexion/);
  });

  it("respecte 1 requête par seconde", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(() => ok([]));
      const search = createGeocoder("https://example.org", fetchMock, () => Date.now());
      await search("Paris");
      const second = search("Lyon");
      await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS - 100);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(200);
      await second;
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
