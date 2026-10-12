import { describe, expect, it } from "vitest";
import { EARTH_RADIUS_M, formatDistance, formatUncertainty, haversineDistance } from "./haversine";

const paris = { lat: 48.8566, lng: 2.3522 };
const londres = { lat: 51.5074, lng: -0.1278 };
const newYork = { lat: 40.7128, lng: -74.006 };

describe("haversineDistance", () => {
  it("vaut 0 pour deux points identiques", () => {
    expect(haversineDistance(paris, paris)).toBe(0);
  });

  it("est symétrique", () => {
    expect(haversineDistance(paris, londres)).toBeCloseTo(haversineDistance(londres, paris), 6);
  });

  it("donne 1° de longitude sur l'équateur ≈ 111,195 km", () => {
    const d = haversineDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeCloseTo((2 * Math.PI * EARTH_RADIUS_M) / 360, 3);
    expect(d / 1000).toBeCloseTo(111.195, 2);
  });

  it("donne un quart de méridien entre l'équateur et le pôle", () => {
    const d = haversineDistance({ lat: 0, lng: 0 }, { lat: 90, lng: 0 });
    expect(d).toBeCloseTo((Math.PI * EARTH_RADIUS_M) / 2, 3);
  });

  it("gère les points antipodaux sans NaN", () => {
    const d = haversineDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(Number.isNaN(d)).toBe(false);
    expect(d).toBeCloseTo(Math.PI * EARTH_RADIUS_M, 3);
  });

  it("gère le passage de l'antiméridien", () => {
    const d = haversineDistance({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });
    expect(d / 1000).toBeCloseTo(111.195, 2);
  });

  it("Paris – Londres ≈ 343,5 km", () => {
    expect(haversineDistance(paris, londres) / 1000).toBeCloseTo(343.5, 0);
  });

  it("Paris – New York ≈ 5 837 km", () => {
    expect(Math.abs(haversineDistance(paris, newYork) / 1000 - 5837)).toBeLessThan(5);
  });
});

describe("formatDistance", () => {
  const norm = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");

  it("affiche les mètres entiers sous 1 km", () => {
    expect(formatDistance(0)).toEqual({ value: "0", unit: "m", meters: "0 m" });
    expect(formatDistance(999.4).value).toBe("999");
  });

  it("affiche les kilomètres au mètre près (3 décimales)", () => {
    const d = formatDistance(1234.4);
    expect(d).toMatchObject({ value: "1,234", unit: "km" });
    expect(norm(d.meters)).toBe("1 234 m");
    expect(formatDistance(999.6)).toMatchObject({ value: "1,000", unit: "km" });
    const far = formatDistance(115_431.7);
    expect(norm(far.value)).toBe("115,432");
    expect(norm(far.meters)).toBe("115 432 m");
  });

  it("refuse les valeurs invalides", () => {
    expect(() => formatDistance(-1)).toThrow(RangeError);
    expect(() => formatDistance(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatUncertainty", () => {
  it("arrondit au demi-mètre sous 10 m, au mètre au-delà", () => {
    expect(formatUncertainty(0)).toBe("0,5 m");
    expect(formatUncertainty(0.74)).toBe("0,5 m");
    expect(formatUncertainty(3.3)).toBe("3,5 m");
    expect(formatUncertainty(12.4)).toBe("12 m");
  });
});
