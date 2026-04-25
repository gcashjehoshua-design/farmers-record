import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarmer, useTransactionsByFarmer, useUpdateFarmer } from "@/hooks/useApi";
import FarmerForm from "@/components/FarmerForm";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { User, History, Calendar, ArrowLeft, Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";

const transactionTypeColors: Record<string, string> = {
  "Loan": "bg-blue-100 text-blue-700",
  "Grant": "bg-green-100 text-green-700",
  "Support": "bg-purple-100 text-purple-700",
  "Consultation": "bg-yellow-100 text-yellow-700",
  "Training": "bg-indigo-100 text-indigo-700",
};

function getTransactionTypeColor(type: string) {
  return transactionTypeColors[type] || "bg-earth-100 text-earth-700";
}

export default function FarmerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: farmer, isLoading, error } = useFarmer(id || "");
  const { data: transactions = [] } = useTransactionsByFarmer(id || "");
  const updateFarmer = useUpdateFarmer();
  const { toasts, success, error: showError } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isInactive = farmer?.isActive === false;

  const handleToggleStatus = async () => {
    if (!farmer?.rsbsaCode) return;
    const newStatus = !farmer.isActive;
    const action = newStatus ? "reactivate" : "deactivate";
    try {
      await updateFarmer.mutateAsync({ rsbsaCode: farmer.rsbsaCode, data: { isActive: newStatus } });
      success(`Farmer "${formatFarmerDisplayName(farmer)}" has been ${action}d successfully`);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(`Error ${action}ing farmer:`, err);
      showError(`Failed to ${action} farmer. Please try again.`);
    }
  };

  if (error || (!isLoading && !farmer)) {
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

  if (isInactive) {
    return (
      <div className="space-y-8 animate-fade-in bg-earth-100/30 min-h-screen p-6 sm:p-8 rounded-2xl">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
        
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleToggleStatus}
          title="Reactivate Farmer Profile?"
          message={`Would you like to reactivate the profile of ${formatFarmerDisplayName(farmer)}? This will make them visible to all users again.`}
          confirmText="Yes, reactivate"
          cancelText="No, keep inactive"
          type="info"
          isLoading={updateFarmer.isPending}
        />

        <div className="p-12 text-center bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-red-200 shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-display font-bold text-earth-800 mb-2">Profile Locked</h2>
          <p className="text-earth-600 text-lg mb-8 max-w-md mx-auto">
            This farmer profile is <strong>Inactive</strong>. Information is hidden and locked for security.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/farmers")}
              variant="secondary"
              className="w-full sm:w-auto h-12 px-8 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
            {user?.role === "admin" && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-gray-100 text-farm-700 border border-farm-200 shadow-sm hover:shadow-md"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reactivate Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in bg-earth-100/30 min-h-screen p-6 sm:p-8 rounded-2xl">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleToggleStatus}
        title={farmer.isActive ? "Make Profile Inactive?" : "Reactivate Profile?"}
        message={farmer.isActive 
          ? `Would you like to make the profile of ${formatFarmerDisplayName(farmer)} inactive? This will hide them from the regular directory.`
          : `Would you like to reactivate the profile of ${formatFarmerDisplayName(farmer)}? This will make them visible to all users again.`}
        confirmText={farmer.isActive ? "Yes, make inactive" : "Yes, reactivate"}
        cancelText="Cancel"
        type={farmer.isActive ? "danger" : "info"}
        isLoading={updateFarmer.isPending}
      />
      {/* Header */}
      <div className="border-b-2 border-earth-200 bg-earth-50 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-farmer text-white text-2xl font-bold flex items-center justify-center shadow-farm">
            {formatFarmerDisplayName(farmer).charAt(0) || "F"}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-earth-800">
              {formatFarmerDisplayName(farmer)}
            </h1>
            <p className="text-earth-600 mt-1">Farmer Profile & Transaction History</p>
            <p className="text-xs text-earth-500 mt-2">Code: {farmer.rsbsaCode}</p>
          </div>
        </div>
      </div>

      {/* Editable Farmer Details */}
      <Card className="card-modern border-farm-200">
        <CardHeader className="bg-gradient-to-r from-farm-900/5 to-farm-900/10 border-b-2 border-farm-200 rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-farm-600" />
              <div>
                <CardTitle className="text-xl">Farmer Details</CardTitle>
                <p className="text-sm text-earth-600 mt-0.5">Edit and save changes below</p>
              </div>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  farmer.isActive 
                    ? "bg-red-100 text-red-700 hover:bg-red-200" 
                    : "bg-farm-100 text-farm-700 hover:bg-farm-200"
                }`}
                title={farmer.isActive ? "Deactivate this farmer (admin only)" : "Reactivate this farmer (admin only)"}
              >
                <Trash2 className="w-4 h-4" />
                {farmer.isActive ? "Deactivate" : "Reactivate"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <FarmerForm
            initialData={farmer}
            onSuccess={() => navigate("/farmers")}
          />
        </CardContent>
      </Card>

      {/* Transaction & Visit History */}
      <Card className="card-modern border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-900/5 to-sky-900/10 border-b-2 border-sky-200 rounded-t-2xl" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.5rem" }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <History className="w-6 h-6 text-sky-600 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-xl">Visit & Transaction History</CardTitle>
              <p className="text-sm text-earth-600 mt-0.5">
                {transactions.length} visit{transactions.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isInactive) return;
              if (!farmer || !farmer.rsbsaCode) {
                console.error("[FarmerProfile] Error: Farmer or rsbsaCode is undefined", farmer);
                return;
              }
              const url = `/record-transaction?farmer=${farmer.rsbsaCode}`;
              console.log(`[FarmerProfile] Button clicked - Navigating to: ${url}`);
              navigate(url);
            }}
            disabled={isInactive}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              isInactive 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-sky-100 text-sky-700 hover:bg-sky-200"
            }`}
            title={isInactive ? "Cannot record transactions for inactive farmers" : "Record a new transaction for this farmer"}
          >
            Record Transaction
          </button>
        </CardHeader>
        <CardContent className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-earth-300 mx-auto mb-4" />
              <p className="text-earth-600 font-medium">No visits or transactions recorded yet</p>
              <p className="text-sm text-earth-500 mt-1">
                Record a transaction for this farmer to see visit history
              </p>
              <button
                onClick={() => {
                  if (isInactive) return;
                  const url = `/record-transaction?farmer=${farmer.rsbsaCode}`;
                  console.log(`[FarmerProfile] Navigating to: ${url}`);
                  navigate(url);
                }}
                disabled={isInactive}
                className={`mt-4 btn-farm px-6 py-2 rounded-xl ${isInactive ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Record Transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-earth-200 bg-earth-900/5">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Date of Visit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Transaction Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .sort((a, b) => new Date(b.officeVisitAt || b.createdAt).getTime() - new Date(a.officeVisitAt || a.createdAt).getTime())
                    .map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={`border-b border-earth-200 ${
                          index % 2 === 0 ? "bg-transparent" : "bg-earth-900/3"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-earth-700">
                          {new Date(tx.officeVisitAt || tx.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(
                              tx.transactionType
                            )}`}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-earth-600 max-w-xs truncate" title={tx.description || ""}>
                          {tx.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-earth-600 max-w-xs truncate" title={tx.notes || ""}>
                          {tx.notes || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
