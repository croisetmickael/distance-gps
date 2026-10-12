import { describe, expect, it } from "vitest";
import { formatLatLng, isValidLatLng, parseCoordinates } from "./coordinates";

describe("parseCoordinates", () => {
  it.each([
    ["48.8566, 2.3522", { lat: 48.8566, lng: 2.3522 }],
    ["48.8566,2.3522", { lat: 48.8566, lng: 2.3522 }],
    ["48,8566 ; 2,3522", { lat: 48.8566, lng: 2.3522 }],
    ["-33.8688 151.2093", { lat: -33.8688, lng: 151.2093 }],
    ["  0 0 ", { lat: 0, lng: 0 }],
  ])("reconnaît « %s »", (input, expected) => {
    expect(parseCoordinates(input)).toEqual(expected);
  });

  it.each(["", "Paris", "91, 0", "0, 181", "48.8, 2.3, 4", "12 rue de la Paix"])(
    "rejette « %s »",
    (input) => {
      expect(parseCoordinates(input)).toBeNull();
    },
  );
});

describe("isValidLatLng", () => {
  it("valide les bornes", () => {
    expect(isValidLatLng({ lat: 90, lng: -180 })).toBe(true);
    expect(isValidLatLng({ lat: 90.1, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: Number.NaN, lng: 0 })).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
  });
});

describe("formatLatLng", () => {
  it("arrondit à 5 décimales", () => {
    expect(formatLatLng({ lat: 48.856613, lng: 2.352222 })).toBe("48.85661, 2.35222");
  });
});
