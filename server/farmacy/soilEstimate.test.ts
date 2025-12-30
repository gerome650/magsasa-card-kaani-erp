import { describe, it, expect } from "vitest";
import { getSoilEstimate, GeoLocation } from "./soilEstimate";

describe("getSoilEstimate", () => {
  describe("Location Validation", () => {
    it("should return null for incomplete geo (no province, no lat/lng)", () => {
      const geo: GeoLocation = {};
      const result = getSoilEstimate(geo);
      expect(result).toBeNull();
    });

    it("should accept province only", () => {
      const geo: GeoLocation = { province: "Nueva Ecija" };
      const result = getSoilEstimate(geo);
      expect(result).not.toBeNull();
      expect(result?.source).toBe("gis");
      expect(result?.confidence).toBe("low");
      expect(result?.evidenceLevel).toBe(0);
    });

    it("should accept municipality only", () => {
      const geo: GeoLocation = { municipality: "Science City of Muñoz" };
      const result = getSoilEstimate(geo);
      expect(result).not.toBeNull();
    });

    it("should accept latitude and longitude", () => {
      const geo: GeoLocation = { latitude: 14.5995, longitude: 120.9842 };
      const result = getSoilEstimate(geo);
      expect(result).not.toBeNull();
    });

    it("should accept province and municipality", () => {
      const geo: GeoLocation = {
        province: "Nueva Ecija",
        municipality: "Science City of Muñoz",
      };
      const result = getSoilEstimate(geo);
      expect(result).not.toBeNull();
    });
  });

  describe("Soil Estimate Structure", () => {
    it("should return valid soil estimate structure", () => {
      const geo: GeoLocation = { province: "Nueva Ecija" };
      const result = getSoilEstimate(geo);

      expect(result).not.toBeNull();
      expect(result?.pH).toBeDefined();
      expect(typeof result?.pH).toBe("number");
      expect(result?.nitrogen).toBeDefined();
      expect(typeof result?.nitrogen).toBe("number");
      expect(result?.phosphorus).toBeDefined();
      expect(typeof result?.phosphorus).toBe("number");
      expect(result?.potassium).toBeDefined();
      expect(typeof result?.potassium).toBe("number");
      expect(result?.organicMatter).toBeDefined();
      expect(typeof result?.organicMatter).toBe("number");
      expect(result?.source).toBe("gis");
      expect(result?.confidence).toBe("low");
      expect(result?.evidenceLevel).toBe(0);
    });

    it("should return conservative baseline values", () => {
      const geo: GeoLocation = { province: "Nueva Ecija" };
      const result = getSoilEstimate(geo);

      expect(result?.pH).toBe(6.5);
      expect(result?.nitrogen).toBe(50);
      expect(result?.phosphorus).toBe(15);
      expect(result?.potassium).toBe(120);
      expect(result?.organicMatter).toBe(2.5);
    });
  });

  describe("Stub Implementation", () => {
    it("should always return same values regardless of location (stub behavior)", () => {
      const geo1: GeoLocation = { province: "Nueva Ecija" };
      const geo2: GeoLocation = { latitude: 14.5995, longitude: 120.9842 };
      const geo3: GeoLocation = { municipality: "Manila" };

      const result1 = getSoilEstimate(geo1);
      const result2 = getSoilEstimate(geo2);
      const result3 = getSoilEstimate(geo3);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});

