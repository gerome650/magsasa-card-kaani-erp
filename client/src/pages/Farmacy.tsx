import { useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Farmacy v0 - GIS-First Soil Recommendations
 * 
 * Feature flag: Only rendered if VITE_FARMACY_ENABLED=true
 */
export function Farmacy() {
  // Check feature flag (client-side check for UI rendering)
  const isEnabled = import.meta.env.VITE_FARMACY_ENABLED === "true";
  
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [municipality, setMunicipality] = useState<string>("");
  const [crop, setCrop] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const createCaseMutation = trpc.farmacy.createCase.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEnabled) {
      alert("Farmacy feature is not enabled");
      return;
    }

    // Validate: require crop
    if (!crop.trim()) {
      alert("Please enter a crop type");
      return;
    }

    // Validate: require location (lat/lng OR province/municipality)
    if (!latitude && !longitude && !province && !municipality) {
      alert("Please provide location (latitude/longitude OR province/municipality)");
      return;
    }

    try {
      await createCaseMutation.mutateAsync({
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        province: province || undefined,
        municipality: municipality || undefined,
        crop: crop.trim(),
        season: season || undefined,
        year: year ? parseInt(year, 10) : undefined,
      });
    } catch (error: any) {
      console.error("Failed to create farmacy case:", error);
      alert(error?.message || "Failed to create case");
    }
  };

  const caseData = createCaseMutation.data;
  const isLoading = createCaseMutation.isPending;

  if (!isEnabled) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <p className="text-yellow-800">
            Farmacy feature is not enabled. Set VITE_FARMACY_ENABLED=true to enable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Farmacy - Soil Recommendations</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Case Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Input (lat/lng OR province/municipality) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Latitude (optional)
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="14.5995"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Longitude (optional)
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="120.9842"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">OR</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Province (optional)
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nueva Ecija"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Municipality (optional)
              </label>
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Science City of Muñoz"
              />
            </div>
          </div>

          {/* Crop Input (required) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Crop <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="palay, corn, etc."
              required
            />
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Season (optional)
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Wet, Dry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Year (optional)
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="2025"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Get Recommendations"}
          </button>
        </form>
      </div>

      {/* Results */}
      {caseData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>

          {/* Confidence Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Confidence Level:</strong> {caseData.soilConfidence} (
              Evidence Level: {caseData.evidenceLevel})
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              These recommendations are based on GIS-estimated soil data. For
              more accurate recommendations, consider conducting laboratory soil
              analysis.
            </p>
          </div>

          {/* Soil Estimate Summary */}
          {caseData.soilEstimate && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Soil Estimate</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">pH:</span>{" "}
                  {caseData.soilEstimate.pH?.toFixed(1)}
                </div>
                <div>
                  <span className="font-medium">N:</span>{" "}
                  {caseData.soilEstimate.nitrogen} kg/ha
                </div>
                <div>
                  <span className="font-medium">P:</span>{" "}
                  {caseData.soilEstimate.phosphorus} kg/ha
                </div>
                <div>
                  <span className="font-medium">K:</span>{" "}
                  {caseData.soilEstimate.potassium} kg/ha
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Source: {caseData.soilSource} | Confidence: {caseData.soilConfidence}
              </div>
            </div>
          )}

          {/* Recommendations List */}
          {caseData.recommendations && Array.isArray(caseData.recommendations) && caseData.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Recommendations</h3>
              <div className="space-y-3">
                {caseData.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{rec.category}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          rec.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : rec.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.action}</p>
                    <p className="text-xs text-gray-600">{rec.rationale}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Ruleset: {rec.rulesetVersion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {createCaseMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <p className="text-red-800">
            Error: {createCaseMutation.error?.message || "Unknown error"}
          </p>
        </div>
      )}
    </div>
  );
}

