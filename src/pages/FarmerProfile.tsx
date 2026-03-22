import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarmer, useTransactionsByFarmer, useDeleteFarmer } from "@/hooks/useApi";
import FarmerForm from "@/components/FarmerForm";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { User, History, Calendar, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";

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
  const deleteFarmer = useDeleteFarmer();
  const { toasts, success, error: showError } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteFarmer = async () => {
    if (!farmer?.rsbsaCode) return;
    try {
      await deleteFarmer.mutateAsync(farmer.rsbsaCode);
      success(`Farmer "${formatFarmerDisplayName(farmer)}" has been deleted successfully`);
      setTimeout(() => navigate("/farmers"), 1500);
    } catch (err) {
      console.error("Error deleting farmer:", err);
      showError("Failed to delete farmer. Please try again.");
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

  return (
    <div className="space-y-8 animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="card-modern border-red-200 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-earth-800 mb-2">Delete Farmer?</h3>
                  <p className="text-sm text-earth-600 mb-4">
                    Are you sure you want to delete <strong>{formatFarmerDisplayName(farmer)}</strong>? This action cannot be undone and will also delete all associated transactions and visit records.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-earth-100 text-earth-700 rounded-lg font-medium hover:bg-earth-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteFarmer}
                      disabled={deleteFarmer.isPending}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleteFarmer.isPending ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Header */}
      <div className="border-b-2 border-earth-200 bg-earth-900/5 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-farmer text-white text-2xl font-bold flex items-center justify-center shadow-farm">
            {formatFarmerDisplayName(farmer).charAt(0) || "F"}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-earth-800">
              {formatFarmerDisplayName(farmer)}
            </h1>
            <p className="text-earth-600 mt-1">Farmer Profile & Transaction History</p>
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
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                title="Delete this farmer (admin only)"
              >
                <Trash2 className="w-4 h-4" />
                Delete
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
        <CardHeader className="bg-gradient-to-r from-sky-900/5 to-sky-900/10 border-b-2 border-sky-200 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-sky-600" />
            <div>
              <CardTitle className="text-xl">Visit & Transaction History</CardTitle>
              <p className="text-sm text-earth-600 mt-0.5">
                {transactions.length} visit{transactions.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
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
                onClick={() => navigate("/record-transaction")}
                className="mt-4 btn-farm px-6 py-2 rounded-xl"
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
