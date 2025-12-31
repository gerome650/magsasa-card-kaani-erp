import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
// @ts-ignore - papaparse doesn't have TypeScript definitions
import Papa from "papaparse";

// Type definitions for Papa.parse callbacks
interface PapaParseResult<T> {
  data: T[];
  errors: Array<{ row: number; message: string }>;
  meta: { fields?: string[] };
}

interface PapaParseError {
  row: number;
  message: string;
  type?: string;
}
import { trpcClient } from "@/lib/trpcClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CsvType = "farmers" | "farms" | "seasons";

interface ParsedRow {
  [key: string]: string | number;
}

interface UploadResult {
  insertedCount: number;
  skippedCount: number;
  errors: Array<{ rowIndex: number; message: string }>;
  totalRows: number;
}

export default function AdminCsvUpload() {
  const [activeTab, setActiveTab] = useState<CsvType>("farmers");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to detect CSV type from headers (heuristic)
  const detectCsvType = (headers: string[]): CsvType | null => {
    const headerStr = headers.join(',').toLowerCase();
    if (headerStr.includes('openid') && !headerStr.includes('farmid') && !headerStr.includes('farmname')) {
      return 'farmers';
    }
    if (headerStr.includes('farmid') || (headerStr.includes('farmname') && headerStr.includes('farmername'))) {
      return 'seasons';
    }
    if (headerStr.includes('farmername') && headerStr.includes('barangay') && headerStr.includes('municipality')) {
      return 'farms';
    }
    return null;
  };

  // Required columns for each CSV type
  // ✅ QA Verified: Aligned with demo CSV headers and backend zod schemas
  // Note: 'id' column in demo CSVs is auto-generated and can be ignored
  const requiredColumns: Record<CsvType, string[]> = {
    farmers: ["openId"], // name and email are optional in backend schema
    farms: ["name", "farmerName", "barangay", "municipality", "latitude", "longitude", "size", "crops"],
    seasons: ["farmId", "cropType", "harvestDate", "quantity", "unit", "qualityGrade"],
  };

  const handleFileSelect = (type: CsvType) => {
    setActiveTab(type);
    setParsedData([]);
    setPreviewData([]);
    setUploadResult(null);
    setValidationErrors([]);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'utf-8', // Explicit UTF-8 encoding
      transformHeader: (header: string) => {
        // Strip BOM and trim whitespace from headers
        return header.replace(/^\uFEFF/, '').trim();
      },
      transform: (value: string) => {
        // Trim whitespace from values and handle Excel quirks
        if (typeof value === 'string') {
          return value.trim().replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        }
        return value;
      },
      complete: (results: PapaParseResult<ParsedRow>) => {
        setIsLoading(false);
        
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map((err: PapaParseError) => 
            `Row ${err.row}: ${err.message}`
          );
          setValidationErrors(errorMessages);
          toast.error("CSV parsing errors occurred");
          return;
        }

        const data = results.data as ParsedRow[];
        
        if (data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // Validate required columns
        const required = requiredColumns[activeTab];
        const headers = Object.keys(data[0] || {});
        const missingColumns = required.filter((col) => !headers.includes(col));

        if (missingColumns.length > 0) {
          setValidationErrors([
            `Missing required columns: ${missingColumns.join(", ")}`,
            `Found columns: ${headers.join(", ")}`,
          ]);
          toast.error("CSV is missing required columns");
          return;
        }

        // Warn if CSV appears to be wrong type (heuristic check)
        const csvTypeHint = detectCsvType(headers);
        if (csvTypeHint && csvTypeHint !== activeTab) {
          const warning = `⚠️ Warning: This CSV appears to be a ${csvTypeHint} CSV, but you're on the ${activeTab} tab. Please verify you're uploading the correct file.`;
          setValidationErrors([warning]);
          toast.warning("CSV type mismatch detected");
          // Don't block, just warn
        }

        setParsedData(data);
        setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
        toast.success(`Parsed ${data.length} rows successfully`);
      },
      error: (error: Error) => {
        setIsLoading(false);
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });

    // Reset file input
    e.target.value = "";
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import. Please parse a CSV file first.");
      return;
    }

    setIsLoading(true);
    setUploadResult(null);

    try {
      let result: UploadResult;

      if (activeTab === "farmers") {
        const rows = parsedData.map((row) => ({
          openId: String(row.openId || ""),
          name: row.name ? String(row.name) : undefined, // Optional
          email: row.email && String(row.email).trim() ? String(row.email) : undefined, // Optional, must be valid email if provided
          barangay: row.barangay ? String(row.barangay) : undefined, // Optional
        }));

        result = await trpcClient.adminCsv.uploadFarmersCsv.mutate({ rows });
      } else if (activeTab === "farms") {
        const rows = parsedData.map((row) => ({
          userId: row.userId ? Number(row.userId) : undefined,
          farmerOpenId: row.farmerOpenId ? String(row.farmerOpenId) : undefined,
          name: String(row.name || ""),
          farmerName: String(row.farmerName || ""),
          barangay: String(row.barangay || ""),
          municipality: String(row.municipality || ""),
          latitude: String(row.latitude || ""),
          longitude: String(row.longitude || ""),
          size: String(row.size || ""),
          crops: String(row.crops || ""),
          soilType: row.soilType ? String(row.soilType) : undefined,
          irrigationType: row.irrigationType as "Irrigated" | "Rainfed" | "Upland" | undefined,
          averageYield: row.averageYield ? String(row.averageYield) : undefined,
          status: row.status as "active" | "inactive" | "fallow" | undefined,
          registrationDate: row.registrationDate ? String(row.registrationDate) : undefined,
        }));

        result = await trpcClient.adminCsv.uploadFarmsCsv.mutate({ rows });
      } else {
        // seasons
        const rows = parsedData.map((row) => ({
          farmId: row.farmId ? Number(row.farmId) : undefined,
          farmName: row.farmName ? String(row.farmName) : undefined,
          farmerName: row.farmerName ? String(row.farmerName) : undefined,
          parcelIndex: row.parcelIndex ? Number(row.parcelIndex) : 0,
          cropType: String(row.cropType || ""),
          harvestDate: String(row.harvestDate || ""),
          quantity: String(row.quantity || ""),
          unit: String(row.unit || "kg") as "kg" | "tons",
          qualityGrade: String(row.qualityGrade || "Standard") as "Premium" | "Standard" | "Below Standard",
        }));

        result = await trpcClient.adminCsv.uploadSeasonsCsv.mutate({ rows });
      }

      setUploadResult(result);
      
      if (result.errors.length > 0) {
        toast.warning(
          `Import completed with ${result.insertedCount} inserted, ${result.skippedCount} skipped, ${result.errors.length} errors`
        );
      } else {
        toast.success(
          `Successfully imported ${result.insertedCount} rows!`
        );
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getColumnHeaders = () => {
    if (previewData.length === 0) return [];
    return Object.keys(previewData[0]);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin CSV Upload</h1>
        <p className="text-muted-foreground">
          Upload and import farmers, farms, and seasons data via CSV files
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Button
          variant={activeTab === "farmers" ? "default" : "ghost"}
          onClick={() => setActiveTab("farmers")}
        >
          Upload Farmers CSV
        </Button>
        <Button
          variant={activeTab === "farms" ? "default" : "ghost"}
          onClick={() => setActiveTab("farms")}
        >
          Upload Farms CSV
        </Button>
        <Button
          variant={activeTab === "seasons" ? "default" : "ghost"}
          onClick={() => setActiveTab("seasons")}
        >
          Upload Seasons CSV
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {activeTab === "farmers" && "Upload Farmers CSV"}
            {activeTab === "farms" && "Upload Farms CSV"}
            {activeTab === "seasons" && "Upload Seasons CSV"}
          </CardTitle>
          <CardDescription>
            {activeTab === "farmers" && "Required columns: openId (name, email, barangay are optional)"}
            {activeTab === "farms" && "Required columns: name, farmerName, barangay, municipality, latitude, longitude, size, crops (userId or farmerOpenId required)"}
            {activeTab === "seasons" && "Required columns: farmId (or farmName + farmerName), cropType, harvestDate, quantity, unit, qualityGrade"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Click to select a CSV file or drag and drop
              </p>
              <Button onClick={() => handleFileSelect(activeTab)}>
                <FileText className="mr-2 h-4 w-4" />
                Select CSV File
              </Button>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            )}

            {previewData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Preview (showing first 10 of {parsedData.length} rows)
                  </h3>
                  <Button onClick={handleImport} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm & Import
                      </>
                    )}
                  </Button>
                </div>

                <div className="border rounded-lg overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {getColumnHeaders().map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          {getColumnHeaders().map((header) => (
                            <TableCell key={header}>
                              {String(row[header] || "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {uploadResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Import Summary:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Total rows: {uploadResult.totalRows}</li>
                      <li className="text-green-600">
                        Inserted: {uploadResult.insertedCount}
                      </li>
                      <li className="text-yellow-600">
                        Skipped: {uploadResult.skippedCount}
                      </li>
                      {uploadResult.errors.length > 0 && (
                        <li className="text-red-600">
                          Errors: {uploadResult.errors.length}
                        </li>
                      )}
                    </ul>

                    {uploadResult.errors.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2">
                            Show Errors ({uploadResult.errors.length})
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 p-4 bg-red-50 rounded border border-red-200 max-h-60 overflow-auto">
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {uploadResult.errors.slice(0, 50).map((error, idx) => (
                                <li key={idx}>
                                  Row {error.rowIndex + 1}: {error.message}
                                </li>
                              ))}
                              {uploadResult.errors.length > 50 && (
                                <li className="text-gray-500">
                                  ... and {uploadResult.errors.length - 50} more errors
                                </li>
                              )}
                            </ul>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

