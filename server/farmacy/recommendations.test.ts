import { describe, it, expect } from "vitest";
import { computeFarmacyRecommendations } from "./recommendations";
import { SoilEstimate } from "./soilEstimate";

describe("computeFarmacyRecommendations", () => {
  describe("Edge Cases", () => {
    it("should handle empty/null soil estimate gracefully", () => {
      const result = computeFarmacyRecommendations(null, "palay");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe("soil_analysis");
      expect(result[0].rationale).toContain("Soil data not available");
    });
  });

  describe("pH Adjustments", () => {
    const baseSoil: SoilEstimate = {
      pH: 6.5,
      nitrogen: 80,
      phosphorus: 25,
      potassium: 120,
      organicMatter: 2.5,
      source: "gis",
      confidence: "low",
      evidenceLevel: 0,
    };

    it("should recommend lime for low pH (below optimal range)", () => {
      const lowpHSoil: SoilEstimate = { ...baseSoil, pH: 3.5 };
      const result = computeFarmacyRecommendations(lowpHSoil, "palay");

      const phRec = result.find((r) => r.category === "soil_pH");
      expect(phRec).toBeDefined();
      expect(phRec?.action).toContain("lime");
      expect(phRec?.action).toContain("raise");
      expect(phRec?.priority).toBe("high"); // Large difference (>1.0): 5.5 - 3.5 = 2.0
    });

    it("should recommend sulfur for high pH (above optimal range)", () => {
      const highpHSoil: SoilEstimate = { ...baseSoil, pH: 8.5 };
      const result = computeFarmacyRecommendations(highpHSoil, "palay");

      const phRec = result.find((r) => r.category === "soil_pH");
      expect(phRec).toBeDefined();
      expect(phRec?.action).toContain("sulfur");
      expect(phRec?.action).toContain("lower");
      expect(phRec?.priority).toBe("high");
    });

    it("should not recommend pH adjustment when within optimal range", () => {
      const optimalpHSoil: SoilEstimate = { ...baseSoil, pH: 6.2 };
      const result = computeFarmacyRecommendations(optimalpHSoil, "palay");

      const phRec = result.find((r) => r.category === "soil_pH");
      expect(phRec).toBeUndefined();
    });
  });

  describe("Nutrient Deficiencies", () => {
    const optimalSoil: SoilEstimate = {
      pH: 6.5,
      nitrogen: 100,
      phosphorus: 30,
      potassium: 125,
      organicMatter: 3.0,
      source: "gis",
      confidence: "low",
      evidenceLevel: 0,
    };

    it("should recommend nitrogen fertilizer for low nitrogen", () => {
      const lowNSoil: SoilEstimate = { ...optimalSoil, nitrogen: 40 };
      const result = computeFarmacyRecommendations(lowNSoil, "palay");

      const nRec = result.find(
        (r) => r.category === "fertilizer" && r.action.includes("nitrogen")
      );
      expect(nRec).toBeDefined();
      expect(nRec?.priority).toBe("high"); // Large deficit (>30)
      expect(nRec?.rationale).toContain("Nitrogen");
    });

    it("should recommend phosphorus fertilizer for low phosphorus", () => {
      const lowPSoil: SoilEstimate = { ...optimalSoil, phosphorus: 8 };
      const result = computeFarmacyRecommendations(lowPSoil, "palay");

      const pRec = result.find(
        (r) => r.category === "fertilizer" && r.action.includes("phosphorus")
      );
      expect(pRec).toBeDefined();
      expect(pRec?.priority).toBe("high"); // Large deficit (>10): 20 - 8 = 12
    });

    it("should recommend potassium fertilizer for low potassium", () => {
      const lowKSoil: SoilEstimate = { ...optimalSoil, potassium: 50 };
      const result = computeFarmacyRecommendations(lowKSoil, "palay");

      const kRec = result.find(
        (r) => r.category === "fertilizer" && r.action.includes("potassium")
      );
      expect(kRec).toBeDefined();
      expect(kRec?.priority).toBe("high"); // Large deficit (>30)
    });
  });

  describe("Multiple Deficiencies", () => {
    it("should generate multiple recommendations for multiple deficiencies", () => {
      const deficientSoil: SoilEstimate = {
        pH: 5.0, // Low
        nitrogen: 30, // Low
        phosphorus: 8, // Low
        potassium: 80, // Low
        organicMatter: 1.5, // Low
        source: "gis",
        confidence: "low",
        evidenceLevel: 0,
      };

      const result = computeFarmacyRecommendations(deficientSoil, "palay");

      // Should have pH, N, P, K, and organic matter recommendations
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.some((r) => r.category === "soil_pH")).toBe(true);
      expect(result.some((r) => r.category === "fertilizer")).toBe(true);
      expect(result.some((r) => r.category === "soil_health")).toBe(true);
    });
  });

  describe("Crop-Specific Requirements", () => {
    const baselineSoil: SoilEstimate = {
      pH: 6.0,
      nitrogen: 50,
      phosphorus: 15,
      potassium: 100,
      organicMatter: 2.5,
      source: "gis",
      confidence: "low",
      evidenceLevel: 0,
    };

    it("should use palay requirements", () => {
      const result = computeFarmacyRecommendations(baselineSoil, "palay");
      // pH 6.0 is within palay range (5.5-7.0), so no pH adjustment
      const phRec = result.find((r) => r.category === "soil_pH");
      expect(phRec).toBeUndefined();
    });

    it("should use corn requirements for mais", () => {
      const result = computeFarmacyRecommendations(baselineSoil, "mais");
      // pH 6.0 is within corn range (5.8-7.5), so no pH adjustment
      const phRec = result.find((r) => r.category === "soil_pH");
      expect(phRec).toBeUndefined();
    });

    it("should use default requirements for unknown crops", () => {
      const result = computeFarmacyRecommendations(baselineSoil, "unknown_crop_xyz");
      // Should still generate recommendations with default ranges
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.rulesetVersion)).toBe(true);
    });
  });

  describe("Optimal Soil (No Issues)", () => {
    it("should provide general best practices when no issues found", () => {
      const optimalSoil: SoilEstimate = {
        pH: 6.5,
        nitrogen: 100,
        phosphorus: 30,
        potassium: 125,
        organicMatter: 3.0,
        source: "gis",
        confidence: "low",
        evidenceLevel: 0,
      };

      const result = computeFarmacyRecommendations(optimalSoil, "palay");

      // Should have at least one recommendation (general best practices)
      expect(result.length).toBeGreaterThan(0);
      const generalRec = result.find((r) => r.category === "general");
      expect(generalRec).toBeDefined();
      expect(generalRec?.priority).toBe("low");
    });
  });

  describe("Recommendation Structure", () => {
    it("should include all required fields in recommendations", () => {
      const testSoil: SoilEstimate = {
        pH: 5.0,
        nitrogen: 50,
        phosphorus: 15,
        potassium: 100,
        organicMatter: 2.5,
        source: "gis",
        confidence: "low",
        evidenceLevel: 0,
      };

      const result = computeFarmacyRecommendations(testSoil, "palay");

      result.forEach((rec) => {
        expect(rec.category).toBeDefined();
        expect(typeof rec.category).toBe("string");
        expect(rec.action).toBeDefined();
        expect(typeof rec.action).toBe("string");
        expect(rec.rationale).toBeDefined();
        expect(typeof rec.rationale).toBe("string");
        expect(["low", "medium", "high"]).toContain(rec.priority);
        expect(rec.rulesetVersion).toBeDefined();
        expect(typeof rec.rulesetVersion).toBe("string");
      });
    });
  });
});

