import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarmer, useTransactionsByFarmer, useCommoditiesByFarmer, useUpdateFarmer } from "@/hooks/useApi";
import { exportProfileTransactionsToPdf } from "@/lib/pdfExport";
import { User, History, Calendar, ArrowLeft, Edit, Phone, MapPin, Calendar as CalendarIcon, FileText, Building2, FileDown, Sprout, Clipboard, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFarmerDisplayName, formatCommoditySummary, getCommodityUnitLabel } from "@/lib/farmerDisplay";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

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

export default function ViewFarmer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: farmer, isLoading, error } = useFarmer(id || "");
  const { data: transactions = [] } = useTransactionsByFarmer(id || "");
  const { data: commodities = [] } = useCommoditiesByFarmer(id || "");
  const updateFarmer = useUpdateFarmer();
  const { toasts, success, error: showError } = useToast();
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  const isInactive = farmer?.isActive === false;

  const handleReactivate = async () => {
    if (!farmer?.rsbsaCode) return;
    try {
      await updateFarmer.mutateAsync({ rsbsaCode: farmer.rsbsaCode, data: { isActive: true } });
      success(`Farmer "${formatFarmerDisplayName(farmer)}" has been reactivated successfully`);
      setShowReactivateConfirm(false);
    } catch (err) {
      console.error("Error reactivating farmer:", err);
      showError("Failed to reactivate farmer. Please try again.");
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
      <div className="space-y-8 animate-fade-in">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
        
        {showReactivateConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="card-modern border-red-200 w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-farm-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-farm-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-earth-800 mb-2">Reactivate Farmer?</h3>
                    <p className="text-sm text-earth-600 mb-4">
                      Are you sure you want to reactivate <strong>{formatFarmerDisplayName(farmer)}</strong>? This will make them visible to all users again.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReactivateConfirm(false)}
                        className="flex-1 px-4 py-2 bg-farm-300 text-white rounded-lg font-medium hover:bg-farm-400 transition-colors hover:scale-105 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReactivate}
                        disabled={updateFarmer.isPending}
                        className="flex-1 px-4 py-2 bg-farm-300 text-white rounded-lg font-medium hover:bg-farm-400 transition-colors hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {updateFarmer.isPending ? "Reactivating..." : "Reactivate"}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                onClick={() => setShowReactivateConfirm(true)}
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

  const commoditySummary = formatCommoditySummary(commodities.map((c) => c.commodityName));

  return (
    <div className="space-y-8 animate-fade-in bg-earth-100/70 rounded-2xl p-6 sm:p-8">
      {/* Header - matches Farmer Directory style */}
      <div className="border-b-2 border-earth-300 bg-earth-200/60 rounded-2xl shadow-earth">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-earth-800">
                {formatFarmerDisplayName(farmer)}
              </h1>
              <p className="text-base text-earth-700 mt-1">
                Farmer profile & visit history
              </p>
              {commoditySummary ? (
                <p className="text-sm text-earth-600 mt-2">
                  <span className="font-semibold text-farm-800">Commodities: </span>
                  {commoditySummary}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/farmers", { replace: true })}
                variant="secondary"
                className="hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Farmers
              </Button>
              <Button
                onClick={() => navigate(`/farmers/${id}/edit`)}
                className="btn-farm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Farmer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Farmer Details - matches Dashboard card style */}
      <Card className="card-modern border-farm-200">
        <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-farm-100 rounded-xl">
              <User className="w-6 h-6 text-farm-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-earth-800">Farmer details</CardTitle>
              <p className="text-sm text-earth-700 mt-0.5">Personal, location & farm information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal — aligned with Excel / import */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-farm-700 border-b-2 border-farm-200 pb-2">
                Personal information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">RSBSA code</p>
                  <p className="text-base font-mono font-bold text-earth-800">{farmer.rsbsaCode || "—"}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">First name</p>
                    <p className="text-base font-bold text-earth-800">{farmer.firstName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Middle name</p>
                    <p className="text-base font-bold text-earth-800">{farmer.middleName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Last name</p>
                    <p className="text-base font-bold text-earth-800">{farmer.lastName || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Display name</p>
                  <p className="text-base font-bold text-earth-800">{formatFarmerDisplayName(farmer) || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-farm-600" /> Phone
                  </p>
                  <p className="text-base font-bold text-earth-800">{farmer.phone || "—"}</p>
                </div>
                {farmer.gender && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Gender</p>
                    <p className="text-base font-bold text-earth-800">{farmer.gender}</p>
                  </div>
                )}
                {farmer.birthdate && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-harvest-600" /> Birthdate
                    </p>
                    <p className="text-base font-bold text-earth-800">
                      {new Date(farmer.birthdate).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-2">Classifications</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Farmer", farmer.isFarmer],
                      ["Farmworker", farmer.isFarmworker],
                      ["Fisherfolk", farmer.isFisherfolk],
                      ["Agriyouth", farmer.isAgriyouth],
                      ["Indigenous (IF IP)", farmer.isIndigenousPeople],
                      ["Organic practitioner", farmer.isOrganicPractitioner],
                      ["ARB", farmer.isArb],
                    ]
                      .filter(([, on]) => on)
                      .map(([label]) => (
                        <span
                          key={String(label)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-farm-100 text-farm-800 border border-farm-200"
                        >
                          {label}
                        </span>
                      ))}
                    {![
                      farmer.isFarmer,
                      farmer.isFarmworker,
                      farmer.isFisherfolk,
                      farmer.isAgriyouth,
                      farmer.isIndigenousPeople,
                      farmer.isOrganicPractitioner,
                      farmer.isArb,
                    ].some(Boolean) && (
                      <span className="text-earth-500 text-sm">None recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Farmer address & parcel — Excel column labels */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-farm-700 border-b-2 border-farm-200 pb-2">
                Address &amp; parcel
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-farm-600" /> Farmer address 1 (Barangay)
                  </p>
                  <p className="text-base font-bold text-earth-800">{farmer.farmerAddress1 || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Farmer address 2</p>
                  <p className="text-base font-bold text-earth-800">{farmer.farmerAddress2 || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Farmer address 3</p>
                  <p className="text-base font-bold text-earth-800">{farmer.farmerAddress3 || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Parcel no.</p>
                    <p className="text-base font-bold text-earth-800">{farmer.parcelNo ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Parcel / crop area</p>
                    <p className="text-base font-bold text-earth-800">
                      {farmer.parcelArea != null || farmer.cropArea != null
                        ? `${farmer.parcelArea ?? "—"} / ${farmer.cropArea ?? "—"}`
                        : "—"}
                    </p>
                  </div>
                </div>
                {farmer.farmType && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Farm type</p>
                    <p className="text-base font-bold text-earth-800">{farmer.farmType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Parcel address 1</p>
                  <p className="text-base font-bold text-earth-800">{farmer.parcelAddress1 || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Parcel address 2</p>
                  <p className="text-base font-bold text-earth-800">{farmer.parcelAddress2 || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Parcel address 3</p>
                  <p className="text-base font-bold text-earth-800">{farmer.parcelAddress3 || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Tribe</p>
                  <p className="text-base font-bold text-earth-800">{farmer.tribe || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-farm-600" /> Agency
                  </p>
                  <p className="text-base font-bold text-earth-800">{farmer.agency || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Ownership type</p>
                  <p className="text-base font-bold text-earth-800">{farmer.ownershipType || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Owner name</p>
                  <p className="text-base font-bold text-earth-800">{farmer.ownerName || "—"}</p>
                </div>
                {farmer.dateEncoded && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Date encoded</p>
                    <p className="text-base font-bold text-earth-800">
                      {new Date(farmer.dateEncoded).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {farmer.notes && (
            <div className="mt-8 pt-6 border-t-2 border-farm-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-farm-600" />
                <span className="text-sm font-semibold text-earth-700">Notes</span>
              </div>
              <p className="text-earth-800 font-bold bg-farm-50/60 border border-farm-200 p-4 rounded-xl leading-relaxed">
                {farmer.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commodities — same as Excel import */}
      <Card className="card-modern border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Sprout className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-xl text-earth-800">Commodities</CardTitle>
              <p className="text-sm text-earth-600 mt-0.5">COMMODITY NAME and QUANTITY (Heads for livestock, Hectares for crops)</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {commodities.length === 0 ? (
            <p className="text-earth-600 text-sm">No commodity records for this farmer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-green-200 bg-green-50/80">
                    <th className="text-left py-2 px-3 font-semibold text-earth-800">Commodity name</th>
                    <th className="text-left py-2 px-3 font-semibold text-earth-800">Quantity / Area</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities.map((c) => (
                    <tr key={c.id} className="border-b border-green-100">
                      <td className="py-2 px-3 font-medium text-earth-800">{c.commodityName}</td>
                      <td className="py-2 px-3 text-earth-700">
                        {c.numberOfHeads != null ? (
                          <div className="flex flex-col">
                            <span className="font-bold">{c.numberOfHeads}</span>
                            <span className="text-[10px] uppercase tracking-wider text-earth-500 font-medium">
                              {getCommodityUnitLabel(c.commodityName)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction & Visit History */}
      <Card className="card-modern border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200 rounded-t-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-sky-600" />
              <div>
                <CardTitle className="text-xl">Visit & Transaction History</CardTitle>
                <p className="text-sm text-earth-600 mt-0.5">
                  {transactions.length} visit{transactions.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {transactions.length > 0 && (
                <>
                  <Button
                    type="button"
                    className="btn-farm px-4 py-2 rounded-lg text-sm"
                    onClick={() => navigate(`/record-transaction?farmer=${farmer.rsbsaCode}`)}
                  >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Record Transaction
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50"
                    onClick={async () =>
                  await exportProfileTransactionsToPdf(formatFarmerDisplayName(farmer), transactions, {
                    barangay: farmer.farmerAddress1,
                    agency: farmer.agency,
                  })
                    }
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Print to PDF
                  </Button>
                </>
              )}
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
              <Button
                onClick={() => navigate(`/record-transaction?farmer=${farmer.rsbsaCode}`)}
                className="mt-4 btn-farm px-6 py-2 rounded-xl"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Record Transaction
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-earth-200 bg-earth-50">
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
                        className={`border-b border-earth-100 ${
                          index % 2 === 0 ? "bg-[#fffefb]" : "bg-earth-50/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-earth-700">
                          {new Date(tx.officeVisitAt || tx.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
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
