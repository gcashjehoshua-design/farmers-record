import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarmer, useTransactionsByFarmer } from "@/hooks/useApi";
import { exportProfileTransactionsToPdf } from "@/lib/pdfExport";
import { User, History, Calendar, ArrowLeft, Edit, Phone, MapPin, Calendar as CalendarIcon, FileText, Building2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { data: farmer, isLoading, error } = useFarmer(id || "");
  const { data: transactions = [] } = useTransactionsByFarmer(id || "");

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
    <div className="space-y-8 animate-fade-in bg-earth-100/70 rounded-2xl p-6 sm:p-8">
      {/* Header - matches Farmer Directory style */}
      <div className="border-b-2 border-earth-300 bg-earth-200/60 rounded-2xl shadow-earth">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-earth-800">
                {farmer.fullName}
              </h1>
              <p className="text-base text-earth-700 mt-1">
                Farmer profile & visit history
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/farmers", { replace: true })}
                variant="outline"
                className="border-earth-400 text-earth-700 hover:bg-earth-200/80"
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
            {/* Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-farm-700 border-b-2 border-farm-200 pb-2">
                Personal information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Full name</p>
                  <p className="text-base font-bold text-earth-800">{farmer.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-farm-600" /> Phone
                  </p>
                  <p className="text-base font-bold text-earth-800">{farmer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">RSBSA number</p>
                  <p className="text-base font-bold text-earth-800">{farmer.rsbsaNumber || "—"}</p>
                </div>
                {farmer.dateOfBirth && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-harvest-600" /> Date of birth
                    </p>
                    <p className="text-base font-bold text-earth-800">
                      {new Date(farmer.dateOfBirth).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Farm */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-farm-700 border-b-2 border-farm-200 pb-2">
                Location & farm
              </h3>
              <div className="space-y-4">
                {farmer.address && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-farm-600" /> Address
                    </p>
                    <p className="text-base font-bold text-earth-800">{farmer.address}</p>
                  </div>
                )}
                {farmer.barangay && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-harvest-600" /> Barangay
                    </p>
                    <p className="text-base font-bold text-earth-800">{farmer.barangay}</p>
                  </div>
                )}
                {farmer.farmType && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Farm type</p>
                    <p className="text-base font-bold text-earth-800">{farmer.farmType}</p>
                  </div>
                )}
                {farmer.farmLocation && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-farm-600" /> Farm location
                    </p>
                    <p className="text-base font-bold text-earth-800">{farmer.farmLocation}</p>
                  </div>
                )}
                {farmer.organization && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-farm-600" /> Organization
                    </p>
                    <p className="text-base font-bold text-earth-800">{farmer.organization}</p>
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
            {transactions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-sky-300 text-sky-700 hover:bg-sky-50"
                onClick={async () => await exportProfileTransactionsToPdf(farmer.fullName, transactions)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Print to PDF
              </Button>
            )}
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
                  <tr className="border-b-2 border-earth-200 bg-earth-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Date of Visit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Transaction Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-earth-800">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={`border-b border-earth-100 ${
                          index % 2 === 0 ? "bg-[#fffefb]" : "bg-earth-50/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-earth-700">
                          {new Date(tx.date).toLocaleDateString("en-PH", {
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
                        <td className="px-4 py-3 text-sm font-semibold text-earth-800">
                          {tx.amount ? `₱${tx.amount.toLocaleString("en-PH")}` : "-"}
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
