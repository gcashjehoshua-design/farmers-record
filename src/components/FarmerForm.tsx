import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { useCreateFarmer, useUpdateFarmer } from "@/hooks/useApi";
import type { Farmer } from "@/types";
import { PASSI_BARANGAYS } from "@/constants/barangays";

const farmerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  rsbsaNumber: z.string().min(1, "RSBSA Number is required"),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  barangay: z.string().optional(),
  farmType: z.string().optional(),
  farmLocation: z.string().optional(),
  organization: z.string().optional(),
  notes: z.string().optional(),
});

interface FarmerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Farmer>;
}

export default function FarmerForm({ onSuccess, initialData }: FarmerFormProps) {
  const defaults = initialData
    ? {
        ...initialData,
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth as any).toISOString().slice(0, 10)
          : undefined,
      }
    : {};
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmerSchema) as any,
    defaultValues: defaults as any,
  });

  const createFarmer = useCreateFarmer();
  const updateFarmer = useUpdateFarmer();

  const isSubmitting = createFarmer.isPending || updateFarmer.isPending;
  const isEditMode = !!initialData?.id;

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      };
      if (isEditMode && initialData?.id) {
        await updateFarmer.mutateAsync({ id: initialData.id, data: payload });
      } else {
        await createFarmer.mutateAsync(payload);
      }
      onSuccess?.();
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save farmer. Please try again.");
    }
  };

  const FormField = ({ 
    label, 
    name, 
    control, 
    errors, 
    required, 
      type = "text",
    placeholder, 
    multiline = false, 
    rows = 4 
  }: any) => (
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
              placeholder={placeholder}
              rows={rows}
              className="input-modern resize-none"
            />
          ) : (
            <input
              {...field}
              type={type}
              placeholder={placeholder}
              className={`input-modern ${
                errors[name] ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""
              }`}
            />
          )}
          {errors[name] && (
            <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
          )}
        </div>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information Section */}
      <div className="p-6 bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 rounded-2xl space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-sky-200">
          <div className="p-2 bg-sky-200 rounded-lg">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">
            Personal Information
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-5">
          <FormField name="fullName" label="Full Name" control={control} errors={errors} required placeholder="Juan Dela Cruz" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField name="phone" label="Phone Number" control={control} errors={errors} required placeholder="09XXXXXXXXX" />
          <FormField name="rsbsaNumber" label="RSBSA Number" control={control} errors={errors} required placeholder="e.g., 2024-XXXX-XXXX" />
        </div>
        <div>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Birthday
                </label>
                <input
                  {...field}
                  type="date"
                  className="input-modern"
                  value={field.value ?? ""}
                />
                {errors["dateOfBirth"] && (
                  <p className="text-red-500 text-xs mt-1">{(errors as any)["dateOfBirth"]?.message}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Address Information Section */}
      <div className="p-6 bg-gradient-to-br from-farm-50 to-farm-100 border-2 border-farm-200 rounded-2xl space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-farm-200">
          <div className="p-2 bg-farm-200 rounded-lg">
            <span className="text-2xl">📍</span>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">
            Address Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField name="address" label="Address" control={control} errors={errors} placeholder="Street Address" />
          <Controller
            name="barangay"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Barangay
                </label>
                <select
                  {...field}
                  className="input-modern"
                >
                  <option value="">Select Barangay</option>
                  {PASSI_BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors["barangay"] && (
                  <p className="text-red-500 text-xs mt-1">{(errors as any)["barangay"]?.message}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Farm Information Section */}
      <div className="p-6 bg-gradient-to-br from-harvest-50 to-harvest-100 border-2 border-harvest-200 rounded-2xl space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-harvest-200">
          <div className="p-2 bg-harvest-200 rounded-lg">
            <span className="text-2xl">🚜</span>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">
            Farm Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Type of farm as dropdown for easier selection */}
          <Controller
            name="farmType"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Type of Farm
                </label>
                <select
                  {...field}
                  className="input-modern"
                >
                  <option value="">Select type</option>
                  <option value="Rice farms">Rice farms</option>
                  <option value="Corn">Corn</option>
                  <option value="Sugar cane">Sugar cane</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Fruit">Fruit</option>
                </select>
              </div>
            )}
          />
          <FormField
            name="farmLocation"
            label="Farm Location"
            control={control}
            errors={errors}
            placeholder="Sitio / Purok / Landmark"
          />
        </div>
        <div>
          <FormField
            name="organization"
            label="Organization"
            control={control}
            errors={errors}
            placeholder="Farmer organization or cooperative"
          />
        </div>
      </div>

      {/* Additional Notes Section */}
      <div className="p-6 bg-gradient-to-br from-earth-50 to-earth-100 border-2 border-earth-200 rounded-2xl space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-earth-200">
          <div className="p-2 bg-earth-200 rounded-lg">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">
            Additional Notes
          </h3>
        </div>
        <FormField 
          name="notes" 
          label="Notes/Comments" 
          control={control} 
          errors={errors} 
          placeholder="Any additional notes about the farmer"
          multiline
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
        <Button
          type="button"
          onClick={() => reset()}
          variant="outline"
          className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Clear Form
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn-farm flex-1 h-12 text-base font-semibold disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? "Saving..." : "Save Farmer"}
        </Button>
      </div>
    </form>
  );
}
