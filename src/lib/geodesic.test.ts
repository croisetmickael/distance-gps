import { describe, expect, it } from "vitest";
import {
  distanceUncertainty,
  geodesicDistance,
  metersPerPixel,
  placementAccuracy,
} from "./geodesic";
import { haversineDistance } from "./haversine";
import type { NamedPoint } from "./types";

const dms = (d: number, m: number, s: number) => Math.sign(d) * (Math.abs(d) + m / 60 + s / 3600);

describe("geodesicDistance (Karney, WGS84)", () => {
  it("reproduit l'exemple officiel GeographicLib : Wellington – Salamanque", () => {
    const d = geodesicDistance({ lat: -41.32, lng: 174.81 }, { lat: 40.96, lng: -5.5 });
    expect(d).toBeCloseTo(19_959_679.267, 3); // au millimètre
  });

  it("reproduit le cas de test de Vincenty (1975) : Flinders Peak – Buninyong", () => {
    const d = geodesicDistance(
      { lat: dms(-37, 57, 3.7203), lng: dms(144, 25, 29.5244) },
      { lat: dms(-37, 39, 10.1561), lng: dms(143, 55, 35.3839) },
    );
    expect(d).toBeCloseTo(54_972.271, 3);
  });

  it("vaut 0 pour un même point et reste symétrique", () => {
    const p = { lat: 50.1054, lng: 1.8357 };
    const q = { lat: 50.1101, lng: 1.8502 };
    expect(geodesicDistance(p, p)).toBe(0);
    expect(geodesicDistance(p, q)).toBeCloseTo(geodesicDistance(q, p), 9);
  });

  it("mesure 1 m quand les points sont à 1 m l'un de l'autre", () => {
    // 1 m vers le nord ≈ 1 / 111 229 degré à 50° N (rayon de courbure méridien WGS84)
    const p = { lat: 50, lng: 2 };
    const d = geodesicDistance(p, { lat: 50 + 1 / 111_229.3, lng: 2 });
    expect(Math.abs(d - 1)).toBeLessThan(0.001);
  });

  it("gère les points quasi antipodaux, là où Vincenty échoue", () => {
    const d = geodesicDistance({ lat: 0, lng: 0 }, { lat: 0.5, lng: 179.7 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(19_900_000);
  });

  it("montre pourquoi Haversine ne suffit pas au mètre près", () => {
    const abbeville = { lat: 50.1054, lng: 1.8357 };
    const amiens = { lat: 49.8941, lng: 2.2958 };
    const ecart = Math.abs(haversineDistance(abbeville, amiens) - geodesicDistance(abbeville, amiens));
    expect(ecart).toBeGreaterThan(1); // plusieurs dizaines de mètres sur ~40 km
  });
});

describe("metersPerPixel / placementAccuracy", () => {
  it("donne la résolution Web Mercator", () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156_543.03, 1);
    expect(metersPerPixel(50, 19)).toBeCloseTo(0.192, 3);
  });

  it("estime un placement fin au zoom maximal et grossier de loin", () => {
    expect(placementAccuracy(50, 21)).toBeLessThan(0.2);
    expect(placementAccuracy(50, 12)).toBeGreaterThan(50);
  });
});

describe("distanceUncertainty", () => {
  const pt = (source: NamedPoint["source"], accuracy?: number): NamedPoint => ({
    lat: 0,
    lng: 0,
    label: "",
    source,
    accuracy,
  });

  it("additionne les incertitudes connues (pire cas)", () => {
    expect(distanceUncertainty(pt("gps", 4), pt("carte", 0.6))).toEqual({ meters: 4.6, partial: false });
  });

  it("considère les coordonnées saisies comme exactes", () => {
    expect(distanceUncertainty(pt("saisie"), pt("carte", 0.5))).toEqual({ meters: 0.5, partial: false });
  });

  it("signale une adresse de précision inconnue", () => {
    expect(distanceUncertainty(pt("gps", 3), pt("recherche"))).toEqual({ meters: 3, partial: true });
  });
});
