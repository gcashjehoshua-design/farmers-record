import { useEffect, useMemo, memo } from "react";
import { useForm, Controller, useFieldArray, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useCreateFarmer, useUpdateFarmer, useAllCommodities } from "@/hooks/useApi";
import type { Farmer } from "@/types";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import { buildOfficialFullName } from "@/lib/farmerDisplay";
import { commodityService } from "@/services/api";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { classifyCommodityName } from "@/lib/commodityClassification";

/** Matches ImportFarmers.tsx Excel columns and `Farmer` / Supabase schema */
const farmerFormSchema = z.object({
  rsbsaCode: z.string().min(1, "RSBSA code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  gender: z.string().optional(),
  birthdate: z.string().optional(),
  phone: z.string().optional(),
  isFarmer: z.boolean(),
  isFarmworker: z.boolean(),
  isFisherfolk: z.boolean(),
  isAgriyouth: z.boolean(),
  isIndigenousPeople: z.boolean(),
  isOrganicPractitioner: z.boolean(),
  isArb: z.boolean(),
  farmerAddress1: z.string().optional(),
  farmerAddress2: z.string().optional(),
  farmerAddress3: z.string().optional(),
  parcelNo: z.string().optional(),
  parcels: z.array(
    z.object({
      parcelNumber: z.number(),
      parcelAddress: z.string().optional(),
    })
  ),
  parcelArea: z.string().optional(),
  cropArea: z.string().optional(),
  farmType: z.string().optional(),
  tribe: z.string().optional(),
  agency: z.string().optional(),
  ownershipType: z.string().optional(),
  ownerName: z.string().optional(),
  dateEncoded: z.string().optional(),
  notes: z.string().optional(),
  commodities: z.array(
    z.object({
      commodityName: z.string(),
      numberOfHeads: z.number().min(0),
    })
  ),
});

export type FarmerFormValues = z.output<typeof farmerFormSchema>;

function titleCaseWords(s: string): string {
  if (!s.trim()) return s;
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ")
    .trim();
}

/** First character uppercase while typing (rest unchanged — avoids lag vs full title-case). */
function uppercaseFirstChar(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function parseOptionalNumber(v: string | undefined): number | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
}

function normalizeCommodityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function formatCommodityLabel(name: string): string {
  return titleCaseWords(name.replace(/\s+/g, " ").trim());
}

function commodityUnitLabel(name: string | undefined): "Heads" | "Hectares" | "Area (sqm)" {
  if (!name || !name.trim()) return "Heads";
  const normalized = name.toLowerCase();
  
  // Fish related commodities should be Area
  if (/(fish|tilapia|catfish|bangus|hatchery|aquaculture|pond)/.test(normalized)) {
    return "Area (sqm)";
  }
  
  // Swan, Quail, Geese/Goose should be Heads
  if (/(swan|quail|goose|geese)/.test(normalized)) {
    return "Heads";
  }

  return classifyCommodityName(name).segment === "livestock" ? "Heads" : "Hectares";
}

function farmerToFormDefaults(f?: Partial<Farmer>): FarmerFormValues {
  const parcels = [];
  if (f?.parcelNo) {
    if (f?.parcelAddress1) parcels.push({ parcelNumber: 1, parcelAddress: f.parcelAddress1 });
    if (f?.parcelAddress2) parcels.push({ parcelNumber: 2, parcelAddress: f.parcelAddress2 });
    if (f?.parcelAddress3) parcels.push({ parcelNumber: 3, parcelAddress: f.parcelAddress3 });
  }

  return {
    rsbsaCode: f?.rsbsaCode ?? "",
    firstName: f?.firstName ?? "",
    lastName: f?.lastName ?? "",
    middleName: f?.middleName ?? "",
    gender: f?.gender ?? "",
    birthdate:
      f?.birthdate instanceof Date
        ? f.birthdate.toISOString().slice(0, 10)
        : f?.birthdate
          ? new Date(f.birthdate as unknown as string).toISOString().slice(0, 10)
          : "",
    phone: f?.phone ?? "",
    isFarmer: f?.isFarmer ?? false,
    isFarmworker: f?.isFarmworker ?? false,
    isFisherfolk: f?.isFisherfolk ?? false,
    isAgriyouth: f?.isAgriyouth ?? false,
    isIndigenousPeople: f?.isIndigenousPeople ?? false,
    isOrganicPractitioner: f?.isOrganicPractitioner ?? false,
    isArb: f?.isArb ?? false,
    farmerAddress1: f?.farmerAddress1 ?? "",
    farmerAddress2: f?.farmerAddress2 ?? "",
    farmerAddress3: f?.farmerAddress3 ?? "",
    parcelNo: f?.parcelNo != null ? String(f.parcelNo) : "",
    parcels: parcels.length > 0 ? parcels : [{ parcelNumber: 1, parcelAddress: "" }],
    parcelArea: f?.parcelArea != null ? String(f.parcelArea) : "",
    cropArea: f?.cropArea != null ? String(f.cropArea) : "",
    farmType: f?.farmType ?? "",
    tribe: f?.tribe ?? "",
    agency: f?.agency ?? "",
    ownershipType: f?.ownershipType ?? "",
    ownerName: f?.ownerName ?? "",
    dateEncoded:
      f?.dateEncoded instanceof Date
        ? f.dateEncoded.toISOString().slice(0, 10)
        : f?.dateEncoded
          ? new Date(f.dateEncoded as unknown as string).toISOString().slice(0, 10)
          : "",
    notes: f?.notes ?? "",
    commodities: [{ commodityName: "", numberOfHeads: 0 }],
  };
}

function formValuesToFarmerPayload(data: FarmerFormValues): Omit<Farmer, "createdAt" | "updatedAt"> {
  const firstName = titleCaseWords(data.firstName.trim());
  const lastName = titleCaseWords(data.lastName.trim());
  const middleName = data.middleName?.trim()
    ? titleCaseWords(data.middleName.trim())
    : undefined;
  const fullName = buildOfficialFullName(lastName, firstName, middleName, undefined);

  // Map parcels back to parcelNo and parcelAddress1-3
  const maxParcelNumber = Math.max(...data.parcels.map(p => p.parcelNumber), 0);
  const parcelAddresses: { [key: number]: string | undefined } = {};
  data.parcels.forEach(p => {
    if (p.parcelAddress?.trim()) {
      parcelAddresses[p.parcelNumber] = p.parcelAddress.trim();
    }
  });

  return {
    rsbsaCode: data.rsbsaCode.trim(),
    firstName,
    lastName,
    middleName,
    fullName,
    gender: data.gender?.trim() || undefined,
    birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
    phone: data.phone?.trim() || undefined,
    isFarmer: data.isFarmer,
    isFarmworker: data.isFarmworker,
    isFisherfolk: data.isFisherfolk,
    isAgriyouth: data.isAgriyouth,
    isIndigenousPeople: data.isIndigenousPeople,
    isOrganicPractitioner: data.isOrganicPractitioner,
    isArb: data.isArb,
    farmerAddress1: data.farmerAddress1?.trim() || undefined,
    farmerAddress2: data.farmerAddress2?.trim() || undefined,
    farmerAddress3: data.farmerAddress3?.trim() || undefined,
    parcelNo: maxParcelNumber > 0 ? maxParcelNumber : undefined,
    parcelAddress1: parcelAddresses[1] || undefined,
    parcelAddress2: parcelAddresses[2] || undefined,
    parcelAddress3: parcelAddresses[3] || undefined,
    parcelArea: parseOptionalNumber(data.parcelArea),
    cropArea: parseOptionalNumber(data.cropArea),
    farmType: data.farmType?.trim() || undefined,
    tribe: data.tribe?.trim() || undefined,
    agency: data.agency?.trim() || undefined,
    ownershipType: data.ownershipType?.trim() || undefined,
    ownerName: data.ownerName?.trim() || undefined,
    dateEncoded: data.dateEncoded ? new Date(data.dateEncoded) : undefined,
    notes: data.notes?.trim() || undefined,
  };
}

interface FarmerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Farmer>;
}

/** Isolated so typing in name fields does not re-render the whole form. */
const DisplayNamePreview = memo(function DisplayNamePreview({ control }: { control: Control<FarmerFormValues> }) {
  const firstName = (useWatch({ control, name: "firstName", defaultValue: "" }) as string) ?? "";
  const lastName = (useWatch({ control, name: "lastName", defaultValue: "" }) as string) ?? "";
  const middleName = (useWatch({ control, name: "middleName", defaultValue: "" }) as string) ?? "";
  const preview = buildOfficialFullName(lastName, firstName, middleName || undefined, undefined);
  return (
    <div className="rounded-lg border border-sky-200 bg-white/80 px-4 py-3 text-sm text-gray-700">
      <span className="font-medium text-gray-800">Display name saved as: </span>
      <span className="text-gray-900 font-semibold">{preview || "— (enter last and first name)"}</span>
      <p className="text-xs text-gray-500 mt-1">
        Format: Last name, first name and middle name. Each name field starts with a capital letter as you type; full
        word capitalization is applied when you save.
      </p>
    </div>
  );
});

export default function FarmerForm({ onSuccess, initialData }: FarmerFormProps) {
  const isInactive = (initialData as any)?.isActive === false;
  const { toasts, error: showError } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!initialData?.rsbsaCode;
  const { data: allCommodities = [] } = useAllCommodities();

  const defaultValues = useMemo(() => farmerToFormDefaults(initialData), [initialData]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerFormSchema) as never,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "commodities" });
  const { fields: parcelFields, append: appendParcel, remove: removeParcel } = useFieldArray({ control, name: "parcels" });
  const watchedCommodities = useWatch({ control, name: "commodities" });

  const commodityOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const commodity of allCommodities) {
      const rawName =
        typeof commodity === "string"
          ? commodity
          : (commodity as { commodityName?: string }).commodityName || "";
      const key = normalizeCommodityKey(rawName);
      if (!key) continue;
      if (!unique.has(key)) {
        unique.set(key, formatCommodityLabel(rawName));
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [allCommodities]);

  // Add mode: do not reset on mount — avoids React Strict Mode double-mount clearing the form and fixes typing stalls.
  // Edit mode: hydrate when farmer record is available.
  useEffect(() => {
    if (!isEditMode || !initialData?.rsbsaCode) return;
    reset(farmerToFormDefaults(initialData));
  }, [isEditMode, initialData?.rsbsaCode, reset, initialData]);

  const createFarmer = useCreateFarmer();
  const updateFarmer = useUpdateFarmer();
  const isSubmitting = createFarmer.isPending || updateFarmer.isPending;

  const onSubmit = async (data: FarmerFormValues) => {
    try {
      const payload = formValuesToFarmerPayload(data);

      if (isEditMode && initialData?.rsbsaCode) {
        await updateFarmer.mutateAsync({ rsbsaCode: initialData.rsbsaCode, data: payload });
      } else {
        await createFarmer.mutateAsync(payload);
        const rows = (data.commodities || []).filter(
          (c) => c.commodityName && c.commodityName.trim().length > 0
        );
        for (const c of rows) {
          const normalizedCommodity = formatCommodityLabel(c.commodityName);
          await commodityService.create({
            rsbsaCode: payload.rsbsaCode,
            commodityName: normalizedCommodity,
            numberOfHeads: c.numberOfHeads || 0,
          });
        }
        if (rows.length > 0) {
          await queryClient.invalidateQueries({ queryKey: ["commodities", "all"] });
          await queryClient.invalidateQueries({ queryKey: ["commodities", "farmer", payload.rsbsaCode] });
        }
      }

      onSuccess?.();
      if (!isEditMode) reset(farmerToFormDefaults());
    } catch (e) {
      console.error("Error submitting form:", e);
      showError("Failed to save farmer. Please try again.");
    }
  };

  const FormField = ({
    label,
    name,
    required,
    type = "text",
    placeholder,
    multiline = false,
    rows = 3,
    disabled = false,
    capitalizeFirstLetter = false,
  }: {
    label: string;
    name: FieldPath<FarmerFormValues>;
    required?: boolean;
    type?: string;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    /** For name fields: keep the first character uppercase as the user types */
    capitalizeFirstLetter?: boolean;
  }) => {
    const isFieldDisabled = disabled || isInactive;
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {multiline ? (
              <textarea
                {...field}
                value={(field.value as string) ?? ""}
                disabled={isFieldDisabled}
                placeholder={placeholder}
                rows={rows}
                className="input-modern resize-none"
              />
            ) : capitalizeFirstLetter && type === "text" ? (
              <input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                value={String((field.value as string) ?? "")}
                disabled={isFieldDisabled}
                type="text"
                placeholder={placeholder}
                autoComplete="off"
                className={`input-modern ${
                  (errors as Record<string, unknown>)[String(name)] ? "border-red-400" : ""
                }`}
                onChange={(e) => field.onChange(uppercaseFirstChar(e.target.value))}
              />
            ) : (
              <input
                {...field}
                value={(field.value as string | number) ?? ""}
                disabled={isFieldDisabled}
                type={type}
                placeholder={placeholder}
                className={`input-modern ${
                  (errors as Record<string, unknown>)[String(name)] ? "border-red-400" : ""
                }`}
              />
            )}
            {(() => {
              const err = errors as Record<string, { message?: string } | undefined>;
              const e = err[String(name)];
              return e?.message ? <p className="text-red-500 text-xs mt-1">{e.message}</p> : null;
            })()}
          </div>
        )}
      />
    );
  };

  const BoolRow = ({
    label,
    name,
    hint,
  }: {
    label: string;
    name:
      | "isFarmer"
      | "isFarmworker"
      | "isFisherfolk"
      | "isAgriyouth"
      | "isIndigenousPeople"
      | "isOrganicPractitioner"
      | "isArb";
    hint?: string;
  }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className={`flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 ${isInactive ? "opacity-60 cursor-not-allowed" : ""}`}>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-farm-600"
            checked={field.value}
            disabled={isInactive}
            onChange={(e) => field.onChange(e.target.checked)}
          />
          <span>
            <span className="font-medium text-gray-900">{label}</span>
            {hint && <span className="block text-xs text-gray-500">{hint}</span>}
          </span>
        </label>
      )}
    />
  );

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
        {/* Identity — same labels as Excel */}
        <div className="p-6 bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-sky-200">
            <div className="p-2 bg-sky-200 rounded-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">RSBSA &amp; name</h3>
              <p className="text-sm text-gray-600">Matches Excel: RSBSA CODE, FIRST / LAST / MIDDLE NAME</p>
            </div>
          </div>
          <FormField
            name="rsbsaCode"
            label="RSBSA code"
            required
            placeholder="Unique farmer ID"
            disabled={isEditMode}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormField name="firstName" label="First name" required placeholder="Juan" capitalizeFirstLetter />
            <FormField name="middleName" label="Middle name" placeholder="Santos" capitalizeFirstLetter />
            <FormField name="lastName" label="Last name" required placeholder="Dela Cruz" capitalizeFirstLetter />
          </div>
          <DisplayNamePreview control={control} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select {...field} className="input-modern" value={field.value ?? ""} disabled={isInactive}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              )}
            />
            <FormField name="birthdate" label="Birthdate" type="date" />
          </div>
          <FormField name="phone" label="Phone (optional)" placeholder="09XXXXXXXXX" />
        </div>

        {/* Classifications — Excel YES/NO columns */}
        <div className="p-6 bg-gradient-to-br from-farm-50 to-farm-100 border-2 border-farm-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-farm-200">
            <div className="p-2 bg-farm-200 rounded-lg">
              <span className="text-2xl">🏷️</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">Classifications</h3>
              <p className="text-sm text-gray-600">FARMER, FARMWORKER, FISHERFOLK, AGRIYOUTH, IF IP, Organic, ARB</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BoolRow name="isFarmer" label="Farmer" />
            <BoolRow name="isFarmworker" label="Farmworker" />
            <BoolRow name="isFisherfolk" label="Fisherfolk" />
            <BoolRow name="isAgriyouth" label="Agriyouth" />
            <BoolRow name="isIndigenousPeople" label="Indigenous people (IF IP)" />
            <BoolRow name="isOrganicPractitioner" label="Organic practitioner" />
            <BoolRow name="isArb" label="ARB" />
          </div>
        </div>

        {/* Farmer addresses */}
        <div className="p-6 bg-gradient-to-br from-earth-50 to-earth-100 border-2 border-earth-200 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-earth-200">
            <div className="p-2 bg-earth-200 rounded-lg">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">Farmer address</h3>
              <p className="text-sm text-gray-600">Address 1 = barangay; 2 = city/municipality; 3 = province</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Farmer address 1 (Barangay)</label>
            <Controller
              name="farmerAddress1"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  list="passi-barangays"
                  className="input-modern"
                  disabled={isInactive}
                  placeholder="Barangay (matches Excel FARMER ADDRESS 1)"
                />
              )}
            />
            <datalist id="passi-barangays">
              {PASSI_BARANGAYS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <FormField name="farmerAddress2" label="Farmer address 2 (Municipality / City)" placeholder="Passi City" />
          <FormField name="farmerAddress3" label="Farmer address 3 (Province)" placeholder="Iloilo" />
        </div>

        {/* Parcel */}
        <div className="p-6 bg-gradient-to-br from-harvest-50 to-harvest-100 border-2 border-harvest-200 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-harvest-200">
            <div className="p-2 bg-harvest-200 rounded-lg">
              <span className="text-2xl">🚜</span>
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900">Parcel &amp; farm area</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField name="parcelArea" label="Parcel area" type="number" placeholder="hectares" />
            <FormField name="cropArea" label="Crop area" type="number" placeholder="hectares" />
            <Controller
              name="farmType"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Farm type</label>
                  <select {...field} className="input-modern" value={field.value ?? ""} disabled={isInactive}>
                    <option value="">Select Farm Type</option>
                    <option value="Rainfed Lowland">Rainfed Lowland</option>
                    <option value="Rainfed Upland">Rainfed Upland</option>
                  </select>
                </div>
              )}
            />
          </div>

          {/* Dynamic Parcels Section */}
          <div className="space-y-4 border-t border-harvest-200 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Parcel details</label>
            </div>
            {parcelFields.map((field, index) => (
              <div key={field.id} className="space-y-3 p-4 bg-white/60 rounded-lg border border-harvest-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Parcel {field.parcelNumber}</h4>
                  {parcelFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParcel(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove parcel"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <Controller
                  name={`parcels.${index}.parcelAddress` as const}
                  control={control}
                  render={({ field: addressField }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Parcel address {field.parcelNumber}
                      </label>
                      <input
                        {...addressField}
                        type="text"
                        placeholder={`Address for parcel ${field.parcelNumber}`}
                        className="input-modern"
                        disabled={isInactive}
                      />
                    </div>
                  )}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const nextNumber = Math.max(...parcelFields.map(p => p.parcelNumber), 0) + 1;
                if (nextNumber <= 3) {
                  appendParcel({ parcelNumber: nextNumber, parcelAddress: "" });
                }
              }}
              disabled={parcelFields.length >= 3 || isInactive}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-harvest-200 text-gray-800 rounded-lg font-medium hover:bg-harvest-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
              Add another parcel
            </button>
          </div>
        </div>

        {/* Other */}
        <div className="p-6 bg-gradient-to-br from-sky-50 to-white border-2 border-sky-100 rounded-2xl space-y-5 shadow-sm">
          <h3 className="text-xl font-display font-bold text-gray-900 border-b pb-2">Agency &amp; ownership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField name="tribe" label="Tribe" />
            <FormField name="agency" label="Agency" />
            <Controller
              name="ownershipType"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ownership type</label>
                  <select {...field} className="input-modern" value={field.value ?? ""} disabled={isInactive}>
                    <option value="">Select</option>
                    <option value="Registered Owner">Registered Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Lessee">Lessee</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}
            />
            <FormField name="ownerName" label="Owner name" />
            <FormField name="dateEncoded" label="Date encoded" type="date" />
          </div>
          <FormField name="notes" label="Notes" multiline rows={4} placeholder="Additional notes" />
        </div>

        {/* Commodities — only on add (same as Excel rows) */}
        {!isEditMode && (
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-green-200 pb-3">
              <div>
                <h3 className="text-xl font-display font-bold text-gray-900">Commodities</h3>
                <p className="text-sm text-gray-600">Commodity name and quantity (Heads for livestock, Hectares for crops)</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-green-300"
                onClick={() => append({ commodityName: "", numberOfHeads: 0 })}
              >
                <Plus className="w-4 h-4 mr-1" /> Add row
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-white border border-green-100">
                <Controller
                  name={`commodities.${index}.commodityName`}
                  control={control}
                  render={({ field: f }) => (
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <label className="text-xs font-medium text-gray-600">Commodity name</label>
                      <select
                        {...f}
                        className="input-modern text-sm"
                        value={f.value || ""}
                        onChange={(e) => f.onChange(formatCommodityLabel(e.target.value))}
                      >
                        <option value="">Select commodity</option>
                        {commodityOptions.map((commodityName) => (
                          <option key={`commodity-${commodityName}`} value={commodityName}>
                            {commodityName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />
                <Controller
                  name={`commodities.${index}.numberOfHeads`}
                  control={control}
                  render={({ field: f }) => (
                    <div className="w-28 space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        {commodityUnitLabel(watchedCommodities?.[index]?.commodityName)}
                      </label>
                      <input
                        {...f}
                        type="number"
                        min={0}
                        step={commodityUnitLabel(watchedCommodities?.[index]?.commodityName) !== "Heads" ? "0.01" : "1"}
                        className="input-modern text-sm"
                        placeholder="0"
                        value={f.value ?? 0}
                        onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                />
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
          <Button
            type="button"
            onClick={() => reset(farmerToFormDefaults(initialData))}
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-300"
            disabled={isInactive}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || isInactive} 
            className="btn-farm flex-1 h-12 text-base font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Saving…" : isEditMode ? "Update farmer" : "Save farmer"}
          </Button>
        </div>
      </form>
    </>
  );
}
