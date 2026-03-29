import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions, useFarmers } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { transactionService } from "@/services/api";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { exportAllTransactionsToPdf } from "@/lib/pdfExport";
import { History, Filter, X, FileDown, Trash2, Clipboard} from "lucide-react";
import Toast from "@/components/Toast";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTransactions } = useTransactions();
  
  // Sort transactions by date descending (latest at top)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.officeVisitAt || a.createdAt).getTime();
      const dateB = new Date(b.officeVisitAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [transactions]);

  const { data: farmers = [] } = useFarmers();
  const { user } = useAuth();
  const { toasts, success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printFilters, setPrintFilters] = useState<{
    barangays: { [key: string]: boolean };
    agencies: { [key: string]: boolean };
    transactionTypes: { [key: string]: boolean };
  }>({
    barangays: {},
    agencies: {},
    transactionTypes: {},
  });

  // Get unique barangays and agencies
  const barangays = PASSI_BARANGAYS;

  const agencies = useMemo(
    () => [...new Set(farmers.filter(f => f.agency).map(f => f.agency))].sort(),
    [farmers]
  );

  // Get unique transaction types
  const transactionTypes = useMemo(
    () => [...new Set(transactions.map(t => t.transactionType))].sort() as string[],
    [transactions]
  );

  // Get all barangays and agencies for print filters
  const allBarangays = useMemo(
    () => [...new Set(farmers.filter(f => f.farmerAddress1).map(f => f.farmerAddress1))].sort() as string[],
    [farmers]
  );

  const allAgencies = useMemo(
    () => [...new Set(farmers.filter(f => f.agency).map(f => f.agency))].sort() as string[],
    [farmers]
  );

  // Initialize print filters on component mount with available options
  useEffect(() => {
    setPrintFilters({
      barangays: Object.fromEntries(allBarangays.map((barangay) => [barangay, true])),
      agencies: Object.fromEntries(allAgencies.map((agency) => [agency, true])),
      transactionTypes: Object.fromEntries(transactionTypes.map((type) => [type, true])),
    });
  }, [allBarangays, allAgencies, transactionTypes]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
      if (!farmer) return false;

      const barangayMatch = !selectedBarangay || farmer.farmerAddress1 === selectedBarangay;
      const agencyMatch = !selectedAgency || farmer.agency === selectedAgency;

      return barangayMatch && agencyMatch;
    });
  }, [sortedTransactions, farmers, selectedBarangay, selectedAgency]);

  const transactionTypeColors: Record<string, string> = {
    "Loan": "bg-blue-100 text-blue-700",
    "Grant": "bg-green-100 text-green-700",
    "Support": "bg-purple-100 text-purple-700",
    "Consultation": "bg-yellow-100 text-yellow-700",
    "Training": "bg-indigo-100 text-indigo-700",
  };

  const getTransactionTypeColor = (type: string) => {
    return transactionTypeColors[type] || "bg-gray-100 text-gray-700";
  };

  const handlePrintWithFilters = async () => {
    // Filter transactions based on selected filters
    const filtered = transactions.filter((tx) => {
      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
      if (!farmer) return false;

      const barangaySelected = printFilters.barangays[farmer.farmerAddress1 || ""];
      const agencySelected = printFilters.agencies[farmer.agency || ""];
      const transactionTypeSelected = printFilters.transactionTypes[tx.transactionType || ""];

      return barangaySelected && agencySelected && transactionTypeSelected;
    });

    if (filtered.length === 0) {
      showError("No transactions found matching the selected filters.");
      return;
    }

    // Build applied filters list
    const appliedFiltersList = [];
    const selectedBarangays = Object.entries(printFilters.barangays)
      .filter(([_, selected]) => selected)
      .map(([barangay]) => barangay);
    if (selectedBarangays.length > 0 && selectedBarangays.length < allBarangays.length) 
      appliedFiltersList.push(`Barangay: ${selectedBarangays.join(", ")}`);

    const selectedAgencies = Object.entries(printFilters.agencies)
      .filter(([_, selected]) => selected)
      .map(([agency]) => agency);
    if (selectedAgencies.length > 0 && selectedAgencies.length < allAgencies.length) 
      appliedFiltersList.push(`Agency: ${selectedAgencies.join(", ")}`);

    const selectedTypes = Object.entries(printFilters.transactionTypes)
      .filter(([_, selected]) => selected)
      .map(([type]) => type);
    if (selectedTypes.length > 0 && selectedTypes.length < transactionTypes.length) 
      appliedFiltersList.push(`Transaction Type: ${selectedTypes.join(", ")}`);

    const transactionsWithNames = filtered.map(tx => {
      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
      return {
        ...tx,
        farmerName: farmer ? formatFarmerDisplayName(farmer) : "Unknown",
        barangay: farmer?.farmerAddress1,
        agency: farmer?.agency
      };
    });

    try {
      await exportAllTransactionsToPdf(transactionsWithNames, appliedFiltersList);
      success("Transaction report exported to PDF!");
      setIsPrintDialogOpen(false);
    } catch (e) {
      console.error(e);
      showError("Failed to generate PDF. Please try again.");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!isAdmin) {
      showError("Only administrators can delete transactions.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      return;
    }

    setDeletingId(transactionId);
    try {
      await transactionService.delete(transactionId);
      success("Transaction deleted successfully!");
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await refetchTransactions();
    } catch (e) {
      console.error(e);
      showError("Failed to delete transaction. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-sky-50/80">
        <div className="container mx-auto px-4 max-w-6xl py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-sky-100 rounded-2xl">
                <History className="w-10 h-10 text-sky-700" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">
                  Transaction History
                </h1>
                <p className="text-base md:text-lg text-gray-700">
                  View and filter all farmer transactions and records
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/record-transaction")}
              className="btn-farm h-14 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Clipboard className="w-5 h-5 mr-2" />
              Record New Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Filters */}
        <Card className="card-modern border-gray-200 mb-6 animate-slide-up">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-sky-600" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                <select
                  value={selectedBarangay || ""}
                  onChange={(e) => setSelectedBarangay(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  <option value="">All Barangays</option>
                  {barangays.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agency</label>
                <select
                  value={selectedAgency || ""}
                  onChange={(e) => setSelectedAgency(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  <option value="">All Agencies</option>
                  {agencies.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(selectedBarangay || selectedAgency) && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {selectedBarangay && (
                  <button
                    onClick={() => setSelectedBarangay(null)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors"
                  >
                    Barangay: {selectedBarangay}
                    <X className="w-4 h-4" />
                  </button>
                )}
                {selectedAgency && (
                  <button
                    onClick={() => setSelectedAgency(null)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors"
                  >
                    Agency: {selectedAgency}
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 border-sky-300 text-sky-700 hover:bg-sky-50"
              onClick={() => setIsPrintDialogOpen(true)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Print to PDF
            </Button>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="card-modern border-gray-200 animate-slide-up">
          <CardHeader>
            <CardTitle>
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No transactions found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Farmer Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Barangay</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Agency</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transaction Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date of Visit</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                      {isAdmin && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const farmer = farmers.find((f) => f.rsbsaCode === tx.rsbsaCode);
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors"
                          onClick={() => {
                            if (farmer) navigate(`/farmers/${farmer.rsbsaCode}`);
                          }}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {farmer ? formatFarmerDisplayName(farmer) : "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{farmer?.farmerAddress1 || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{farmer?.agency || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(tx.transactionType)}`}>
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(tx.officeVisitAt || tx.createdAt).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={tx.notes || ""}>
                            {tx.notes || "-"}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                disabled={deletingId === tx.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3 h-3" />
                                {deletingId === tx.id ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Filter Dialog */}
        {isPrintDialogOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-2xl shadow-2xl scale-in max-h-[90vh] overflow-hidden flex flex-col border-farm-200 rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-farm-200 rounded-xl shadow-inner">
                    <FileDown className="w-7 h-7 text-farm-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display font-bold text-earth-900 tracking-tight">PDF Report Options</CardTitle>
                    <p className="text-sm text-earth-600 mt-1 font-medium">Select categories to include in the generated PDF</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="text-earth-400 hover:text-earth-600 hover:bg-farm-200 transition-all duration-200 p-2 rounded-full flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="space-y-8 p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">
                <div className="grid gap-8">
                  {/* Transaction Type Checkboxes */}
                  {transactionTypes.length > 0 && (
                    <div className="space-y-4 p-6 bg-farm-50 border-2 border-farm-100 rounded-2xl shadow-inner">
                      <h3 className="font-bold text-earth-800 text-base flex items-center gap-2 px-1">
                        <Filter className="w-4 h-4 text-farm-600" />
                        Transaction Type
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {transactionTypes.map((type) => (
                          <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-white p-3 rounded-xl transition-all border border-transparent hover:border-farm-200 group shadow-sm">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={printFilters.transactionTypes[type]}
                                onChange={(e) =>
                                  setPrintFilters((prev) => ({
                                    ...prev,
                                    transactionTypes: { ...prev.transactionTypes, [type]: e.target.checked },
                                  }))
                                }
                                className="w-5 h-5 rounded-md cursor-pointer accent-farm-600 border-farm-300 bg-white transition-all"
                              />
                            </div>
                            <span className="text-sm text-earth-700 font-semibold group-hover:text-farm-700 transition-colors">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Agency Checkboxes */}
                    {Object.keys(printFilters.agencies).length > 0 && (
                      <div className="space-y-4 p-6 bg-farm-50 border-2 border-farm-100 rounded-2xl shadow-inner">
                        <h3 className="font-bold text-earth-800 text-base flex items-center gap-2 px-1">
                          <Filter className="w-4 h-4 text-farm-600" />
                          Agencies
                        </h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {Object.entries(printFilters.agencies).map(([org, checked]) => (
                            <label key={org} className="flex items-center gap-3 cursor-pointer hover:bg-white p-3 rounded-xl transition-all border border-transparent hover:border-farm-200 group shadow-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setPrintFilters((prev) => ({
                                    ...prev,
                                    agencies: { ...prev.agencies, [org]: e.target.checked },
                                  }))
                                }
                                className="w-5 h-5 rounded-md cursor-pointer accent-farm-600 border-farm-300 bg-white"
                              />
                              <span className="text-sm text-earth-700 font-semibold truncate group-hover:text-farm-700 transition-colors" title={org}>{org}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Barangay Checkboxes */}
                    {Object.keys(printFilters.barangays).length > 0 && (
                      <div className="space-y-4 p-6 bg-farm-50 border-2 border-farm-100 rounded-2xl shadow-inner">
                        <h3 className="font-bold text-earth-800 text-base flex items-center gap-2 px-1">
                          <Filter className="w-4 h-4 text-farm-600" />
                          Barangays
                        </h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {Object.entries(printFilters.barangays).map(([barangay, checked]) => (
                            <label key={barangay} className="flex items-center gap-3 cursor-pointer hover:bg-white p-3 rounded-xl transition-all border border-transparent hover:border-farm-200 group shadow-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setPrintFilters((prev) => ({
                                    ...prev,
                                    barangays: { ...prev.barangays, [barangay]: e.target.checked },
                                  }))
                                }
                                className="w-5 h-5 rounded-md cursor-pointer accent-farm-600 border-farm-300 bg-white"
                              />
                              <span className="text-sm text-earth-700 font-semibold truncate group-hover:text-farm-700 transition-colors" title={barangay}>{barangay}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Action Buttons - Fixed at bottom */}
              <div className="flex gap-4 p-8 pt-6 border-t-2 border-farm-100 bg-farm-50/50 flex-shrink-0 shadow-inner">
                <button
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-earth-200 text-earth-700 font-bold text-base rounded-xl hover:bg-white hover:text-earth-900 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrintWithFilters}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-farm-600 to-farm-700 hover:from-farm-500 hover:to-farm-600 text-white font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-95 group"
                >
                  <FileDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="uppercase text-xs font-black tracking-widest">Generate PDF</span>
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
