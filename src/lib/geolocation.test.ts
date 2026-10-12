import { describe, expect, it } from "vitest";
import { combineFixes, geolocationErrorMessage } from "./geolocation";

describe("geolocationErrorMessage", () => {
  it("explique chaque code d'erreur du navigateur", () => {
    expect(geolocationErrorMessage(1)).toMatch(/refusé/);
    expect(geolocationErrorMessage(2)).toMatch(/indisponible/);
    expect(geolocationErrorMessage(3)).toMatch(/trop de temps/);
    expect(geolocationErrorMessage(99)).toMatch(/Impossible/);
  });
});

describe("combineFixes", () => {
  it("retourne null sans mesure exploitable", () => {
    expect(combineFixes([])).toBeNull();
    expect(combineFixes([{ lat: 1, lng: 1, accuracy: Number.NaN }])).toBeNull();
  });

  it("écarte les mesures beaucoup moins précises que la meilleure", () => {
    const r = combineFixes([
      { lat: 50, lng: 2, accuracy: 4 },
      { lat: 50.01, lng: 2.01, accuracy: 60 },
    ]);
    expect(r).toEqual({ lat: 50, lng: 2, accuracy: 4 });
  });

  it("pondère par 1/précision² et annonce la meilleure précision", () => {
    const r = combineFixes([
      { lat: 50.0, lng: 2.0, accuracy: 3 },
      { lat: 50.00003, lng: 2.0, accuracy: 6 },
    ])!;
    // poids 1/9 et 1/36 → 4/5 et 1/5
    expect(r.lat).toBeCloseTo(50.000006, 9);
    expect(r.accuracy).toBe(3);
  });
});
