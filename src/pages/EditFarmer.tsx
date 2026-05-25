import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFarmer, useCommoditiesByFarmer } from "@/hooks/useApi";
import FarmerForm from "@/components/FarmerForm";
import { User, ArrowLeft } from "lucide-react";
import Toast from "@/components/Toast";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { useToast } from "@/hooks/useToast";
import { useMemo } from "react";

export default function EditFarmer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, success } = useToast();
  const { data: farmer, isLoading: isFarmerLoading, error: farmerError } = useFarmer(id || "");
  const { data: commodities, isLoading: isCommoditiesLoading } = useCommoditiesByFarmer(id || "");

  const combinedData = useMemo(() => {
    if (!farmer) return undefined;
    return {
      ...farmer,
      commodities: commodities || [],
    };
  }, [farmer, commodities]);

  const isLoading = isFarmerLoading || isCommoditiesLoading;

  if (farmerError || (!isLoading && !farmer)) {
    return (
      <div className="animate-fade-in">
        <div className="p-6 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl shadow-lg">
          <p className="font-semibold">Farmer not found</p>
          <p className="text-sm mt-1">The farmer profile may have been removed.</p>
          <button
            onClick={() => navigate("/farmers")}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-medium flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Farmers
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !farmer) {
    return (
      <div className="animate-fade-in py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-farm-200 border-t-farm-600" />
        <p className="text-earth-600 mt-4 font-medium">Loading farmer profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      {/* Header */}
      <div className="border-b-2 border-earth-200 bg-earth-50/90 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Button
            onClick={() => navigate(`/farmers/${id}`, { replace: true })}
            variant="secondary"
            className="flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-farmer text-white text-2xl font-bold flex items-center justify-center shadow-farm">
            {formatFarmerDisplayName(farmer).charAt(0) || "F"}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-earth-800">
              Edit Farmer Profile
            </h1>
            <p className="text-earth-600 mt-1">Update farmer information below</p>
          </div>
        </div>
      </div>

      {/* Editable Farmer Details */}
      <Card className="card-modern border-farm-200">
        <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-farm-600" />
            <div>
              <CardTitle className="text-xl">Farmer Details</CardTitle>
              <p className="text-sm text-earth-600 mt-0.5">Edit and save changes below</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <FarmerForm
            initialData={combinedData}
            onSuccess={() => {
              success("Farmer profile updated!");
              setTimeout(() => navigate(`/farmers/${id}`, { replace: true }), 500);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
