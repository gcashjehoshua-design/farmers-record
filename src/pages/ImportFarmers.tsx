import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, FileUp, ArrowLeft } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { buildOfficialFullName, formatCommoditySummary } from "@/lib/farmerDisplay";
import { PASSI_BARANGAYS } from "@/constants/barangays";

interface FarmerImportData {
  rsbsaCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  gender?: string;
  birthdate?: Date;
  isFarmer: boolean;
  isFarmworker: boolean;
  isFisherfolk: boolean;
  isAgriyouth: boolean;
  isIndigenousPeople: boolean;
  isOrganicPractitioner: boolean;
  isArb: boolean;
  farmerAddress1?: string;
  farmerAddress2?: string;
  farmerAddress3?: string;
  parcelNo?: number;
  parcelAddress1?: string;
  parcelAddress2?: string;
  parcelAddress3?: string;
  parcelArea?: number;
  cropArea?: number;
  farmType?: string;
  tribe?: string;
  agency?: string;
  ownershipType?: string;
  ownerName?: string;
  dateEncoded?: Date;
  commodities: Array<{
    commodityName: string;
    numberOfHeads: number;
  }>;
}

function parseExcelDateValue(dateValue: unknown): Date | null {
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return dateValue;
  }
  if (typeof dateValue === "string") {
    const parts = dateValue.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (Number.isFinite(month) && Number.isFinite(day) && Number.isFinite(year)) {
        return new Date(year, month - 1, day);
      }
    }
  } else if (typeof dateValue === "number") {
    const excelEpoch = new Date(1900, 0, 1);
    return new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
  }
  return null;
}

/** Trim header keys so "RSBSA CODE " / odd spacing still match */
function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).replace(/\s+/g, " ").trim();
    out[key] = v;
  }
  return out;
}

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

function cellNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeCommodityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Normalize barangay name by matching against PASSI_BARANGAYS list case-insensitively */
function normalizeBarangayName(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  
  // Try exact match first
  if (PASSI_BARANGAYS.includes(trimmed)) {
    return trimmed;
  }
  
  // Try case-insensitive match
  const lowerInput = trimmed.toLowerCase();
  const matched = PASSI_BARANGAYS.find(
    (barangay) => barangay.toLowerCase() === lowerInput
  );
  
  return matched || trimmed; // Return matched name or original if no match
}

function mergeCommodityRow(
  farmer: FarmerImportData,
  commodityName: string,
  numberOfHeads: number
): void {
  const label = commodityName.trim();
  if (!label) return;
  const key = normalizeCommodityKey(label);
  const existing = farmer.commodities.find((c) => normalizeCommodityKey(c.commodityName) === key);
  if (existing) {
    existing.numberOfHeads += numberOfHeads;
  } else {
    farmer.commodities.push({ commodityName: label, numberOfHeads: numberOfHeads });
  }
}

/** Parse .xlsx / .xls from ArrayBuffer (browser-safe; avoids deprecated readAsBinaryString) */
function parseExcelToFarmers(buffer: ArrayBuffer): FarmerImportData[] {
  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: true,
    dense: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const farmersByRsbsa = new Map<string, FarmerImportData>();

  jsonData.forEach((rawRow) => {
    const row = normalizeRowKeys(rawRow);
    const rsbsaCode = cellStr(row["RSBSA CODE"]);
    if (!rsbsaCode) return;

    if (!farmersByRsbsa.has(rsbsaCode)) {
      const firstName = cellStr(row["FIRST NAME"]) || "";
      const lastName = cellStr(row["LAST NAME"]) || "";
      const middleName = cellStr(row["MIDDLE NAME"]) || undefined;
      const extName = cellStr(row["EXT NAME"]) || undefined;
      const fullName =
        buildOfficialFullName(lastName, firstName, middleName, extName) ||
        `${firstName} ${lastName}`.trim();

      farmersByRsbsa.set(rsbsaCode, {
        rsbsaCode,
        firstName,
        lastName,
        middleName: middleName || undefined,
        fullName,
        gender: cellStr(row["GENDER"]) || undefined,
        birthdate: parseExcelDateValue(row["BIRTHDATE"]) || undefined,
        isFarmer: cellStr(row["FARMER"]).toUpperCase() === "YES",
        isFarmworker: cellStr(row["FARMWORKER"]).toUpperCase() === "YES",
        isFisherfolk: cellStr(row["FISHERFOLK"]).toUpperCase() === "YES",
        isAgriyouth: cellStr(row["AGRIYOUTH"]).toUpperCase() === "YES",
        isIndigenousPeople: cellStr(row["IF IP"]).toUpperCase() === "YES",
        isOrganicPractitioner: (cellNum(row["ORGANIC PRACTITIONERS"]) ?? 0) > 0,
        isArb: cellStr(row["ARB"]).toUpperCase() === "YES",
        farmerAddress1: normalizeBarangayName(cellStr(row["FARMER ADDRESS 1"])) || undefined,
        farmerAddress2: cellStr(row["FARMER ADDRESS 2"]) || undefined,
        farmerAddress3: cellStr(row["FARMER ADDRESS 3"]) || undefined,
        parcelNo: cellNum(row["PARCEL NO"]),
        parcelAddress1: cellStr(row["PARCEL ADDRESS 1"]) || undefined,
        parcelAddress2: cellStr(row["PARCEL ADDRESS 2"]) || undefined,
        parcelAddress3: cellStr(row["PARCEL ADDRESS 3"]) || undefined,
        parcelArea: cellNum(row["PARCEL AREA"]),
        cropArea: cellNum(row["CROP AREA"]),
        farmType: cellStr(row["FARM TYPE"]) || undefined,
        tribe:
          cellStr(row["TRIBE"]).toLowerCase() !== "null" && cellStr(row["TRIBE"])
            ? cellStr(row["TRIBE"])
            : undefined,
        agency: cellStr(row["AGENCY"]) || undefined,
        ownershipType: cellStr(row["OWNERSHIP TYPE"]) || undefined,
        ownerName: cellStr(row["OWNER NAME"]) || undefined,
        dateEncoded: parseExcelDateValue(row["DATE ENCODED"]) || undefined,
        commodities: [],
      });
    }

    const farmer = farmersByRsbsa.get(rsbsaCode)!;
    const commodityName = cellStr(row["COMMODITY NAME"]);
    const numberOfHeads = cellNum(row["NUMBER OF HEADS"]) ?? 0;

    if (commodityName) {
      mergeCommodityRow(farmer, commodityName, numberOfHeads);
    }
  });

  return Array.from(farmersByRsbsa.values());
}

export default function ImportFarmers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<FarmerImportData[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success">("idle");
  const [totalFarmers, setTotalFarmers] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileSelected(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buf = event.target?.result;
        if (!(buf instanceof ArrayBuffer)) {
          showError("Could not read file. Please try again.");
          return;
        }
        const farmers = parseExcelToFarmers(buf);
        setTotalFarmers(farmers.length);
        setPreviewData(farmers.slice(0, 10));
        if (farmers.length === 0) {
          showError(
            "No rows with a valid RSBSA CODE were found. Check that the first sheet has a header row with column RSBSA CODE."
          );
        } else {
          success(`Successfully loaded ${farmers.length} farmers from Excel file`);
        }
      } catch (err) {
        showError("Failed to parse Excel file. Please check the format.");
        console.error(err);
      }
    };

    reader.onerror = () => showError("Failed to read the file from your device.");
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!fileSelected || totalFarmers === 0) {
      showError("No file selected or no farmers detected. Choose the file again after fixing the sheet.");
      return;
    }

    setIsLoading(true);
    setImportStatus("processing");
    setImportProgress(0);

    try {
      // Read file again to get all data
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const buf = event.target?.result;
          if (!(buf instanceof ArrayBuffer)) {
            showError("Could not read file for import.");
            return;
          }
          const farmers = parseExcelToFarmers(buf);
          if (farmers.length === 0) {
            showError("No farmers to import.");
            return;
          }

          // 1. Fetch existing RSBSA codes to prevent duplicates
          const { data: existingFarmers, error: fetchError } = await supabase
            .from("farmers")
            .select("rsbsa_code");

          if (fetchError) {
            console.error("Error checking existing farmers:", fetchError);
            throw fetchError;
          }

          const existingCodes = new Set(existingFarmers?.map(f => f.rsbsa_code) || []);
          const duplicates = farmers.filter(f => existingCodes.has(f.rsbsaCode));
          const newFarmers = farmers.filter(f => !existingCodes.has(f.rsbsaCode));

          if (newFarmers.length === 0) {
            showError("All farmers in this file are already registered in the system.");
            setImportStatus("idle");
            setIsLoading(false);
            return;
          }

          if (duplicates.length > 0) {
            const confirmImport = window.confirm(
              `${duplicates.length} farmers are already registered and will be skipped. Proceed with importing the ${newFarmers.length} new farmers?`
            );
            if (!confirmImport) {
              setImportStatus("idle");
              setIsLoading(false);
              return;
            }
          }

          let importedCount = 0;
          let commoditiesCount = 0;

          // 2. Batch insert ONLY new farmers
          const BATCH_SIZE = 50;
          for (let i = 0; i < newFarmers.length; i += BATCH_SIZE) {
            const batch = newFarmers.slice(i, i + BATCH_SIZE);
            const farmersData = batch.map((f) => ({
              rsbsa_code: f.rsbsaCode,
              first_name: f.firstName,
              last_name: f.lastName,
              middle_name: f.middleName || null,
              full_name: f.fullName,
              gender: f.gender || null,
              birthdate: f.birthdate ? f.birthdate.toISOString().split("T")[0] : null,
              is_farmer: f.isFarmer,
              is_farmworker: f.isFarmworker,
              is_fisherfolk: f.isFisherfolk,
              is_agriyouth: f.isAgriyouth,
              is_indigenous_people: f.isIndigenousPeople,
              is_organic_practitioner: f.isOrganicPractitioner,
              is_arb: f.isArb,
              farmer_address_1: f.farmerAddress1 || null,
              farmer_address_2: f.farmerAddress2 || null,
              farmer_address_3: f.farmerAddress3 || null,
              parcel_no: f.parcelNo || null,
              parcel_address_1: f.parcelAddress1 || null,
              parcel_address_2: f.parcelAddress2 || null,
              parcel_address_3: f.parcelAddress3 || null,
              parcel_area: f.parcelArea || null,
              crop_area: f.cropArea || null,
              farm_type: f.farmType || null,
              tribe: f.tribe || null,
              agency: f.agency || null,
              ownership_type: f.ownershipType || null,
              owner_name: f.ownerName || null,
              date_encoded: f.dateEncoded ? f.dateEncoded.toISOString().split("T")[0] : null,
            }));

            const { error: farmerError } = await supabase
              .from("farmers")
              .upsert(farmersData as any);

            if (farmerError) {
              console.error("Error inserting farmers batch:", farmerError);
              showError(`Error importing batch ${i / BATCH_SIZE + 1}: ${farmerError.message}`);
              throw farmerError;
            }

            const rsbsaBatch = batch.map((f) => f.rsbsaCode);
            const { error: deleteCommodityError } = await supabase
              .from("farmer_commodities")
              .delete()
              .in("rsbsa_code", rsbsaBatch);

            if (deleteCommodityError) {
              console.error("Error clearing commodities:", deleteCommodityError);
              showError(`Error updating commodities: ${deleteCommodityError.message}`);
              throw deleteCommodityError;
            }

            const commoditiesData: Array<{
              rsbsa_code: string;
              commodity_name: string;
              number_of_heads: number;
            }> = [];

            batch.forEach((f) => {
              f.commodities.forEach((c) => {
                commoditiesData.push({
                  rsbsa_code: f.rsbsaCode,
                  commodity_name: c.commodityName,
                  number_of_heads: c.numberOfHeads,
                });
              });
            });

            if (commoditiesData.length > 0) {
              const { error: commodityError } = await supabase.from("farmer_commodities").insert(commoditiesData as any);

              if (commodityError) {
                console.error("Error inserting commodities:", commodityError);
                showError(`Error importing commodities: ${commodityError.message}`);
                throw commodityError;
              }
            }

            importedCount += batch.length;
            commoditiesCount += commoditiesData.length;
            const progress = Math.round((importedCount / newFarmers.length) * 100);
            setImportProgress(progress);
          }

          setImportProgress(100);
          setImportStatus("success");
          success(
            `Successfully imported ${importedCount} farmers and ${commoditiesCount} commodity records!`
          );

          // Refresh the farmers list cache so the new data shows up immediately
          queryClient.invalidateQueries({ queryKey: ["farmers"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["commodities", "all"] });

          setTimeout(() => {
            navigate("/farmers");
          }, 2000);
        } catch (err) {
          showError("Failed to import data. Please try again.");
          console.error(err);
          setImportStatus("idle");
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsArrayBuffer(fileSelected);
    } catch (err) {
      showError("Error processing file");
      console.error(err);
      setIsLoading(false);
      setImportStatus("idle");
    }
  };

  return (
    <div className="animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 max-w-4xl py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/farmers")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="p-4 bg-blue-100 rounded-2xl">
              <FileUp className="w-10 h-10 text-blue-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Farmers</h1>
              <p className="text-gray-600 mt-1">Upload Excel file to import farmer records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* Upload Section */}
        <Card className="border-2 border-dashed border-gray-300 mb-6">
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Excel File</h2>

              <label className="inline-block">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              </label>

              {fileSelected && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700">
                    <strong>File:</strong> {fileSelected.name}
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Farmers to import:</strong> {totalFarmers}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {previewData.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle>Preview (First 10 Farmers)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-semibold">RSBSA Code</th>
                      <th className="text-left py-2 px-3 font-semibold">Name</th>
                      <th className="text-left py-2 px-3 font-semibold">Address (Barangay)</th>
                      <th className="text-left py-2 px-3 font-semibold">Commodities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((farmer) => (
                      <tr key={farmer.rsbsaCode} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono text-xs">{farmer.rsbsaCode}</td>
                        <td className="py-3 px-3">{farmer.fullName}</td>
                        <td className="py-3 px-3 text-gray-600">{farmer.farmerAddress1 || "-"}</td>
                        <td className="py-3 px-3 text-xs text-green-800 max-w-[14rem]">
                          {farmer.commodities.length > 0
                            ? formatCommoditySummary(farmer.commodities.map((c) => c.commodityName))
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Progress */}
        {importStatus === "processing" && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <p className="text-gray-900 font-semibold">Importing farmers...</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{importProgress}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {importStatus === "success" && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-green-900 font-semibold">Import completed successfully! Redirecting...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/farmers")}
            variant="secondary"
            className="flex-1 hover:scale-105 active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={totalFarmers === 0 || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Importing..." : "Import Farmers"}
          </Button>
        </div>


      </div>
    </div>
  );
}
