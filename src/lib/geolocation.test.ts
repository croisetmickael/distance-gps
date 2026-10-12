import { describe, expect, it } from "vitest";
import { geolocationErrorMessage } from "./geolocation";

describe("geolocationErrorMessage", () => {
  it("explique chaque code d'erreur du navigateur", () => {
    expect(geolocationErrorMessage(1)).toMatch(/refusé/);
    expect(geolocationErrorMessage(2)).toMatch(/indisponible/);
    expect(geolocationErrorMessage(3)).toMatch(/trop de temps/);
    expect(geolocationErrorMessage(99)).toMatch(/Impossible/);
  });
});
