import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useFarmers } from "@/hooks/useApi";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import { History, Filter, X } from "lucide-react";

export default function TransactionHistory() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: farmers = [] } = useFarmers();
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);

  // Get unique barangays and organizations
  const barangays = PASSI_BARANGAYS;

  const organizations = useMemo(
    () => [...new Set(farmers.filter(f => f.organization).map(f => f.organization))].sort(),
    [farmers]
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const farmer = farmers.find(f => f.id === tx.farmerId);
      if (!farmer) return false;

      const barangayMatch = !selectedBarangay || farmer.barangay === selectedBarangay;
      const organizationMatch = !selectedOrganization || farmer.organization === selectedOrganization;

      return barangayMatch && organizationMatch;
    });
  }, [transactions, farmers, selectedBarangay, selectedOrganization]);

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

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-sky-50/80">
        <div className="container mx-auto px-4 max-w-6xl py-6">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization</label>
                <select
                  value={selectedOrganization || ""}
                  onChange={(e) => setSelectedOrganization(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  <option value="">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(selectedBarangay || selectedOrganization) && (
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
                {selectedOrganization && (
                  <button
                    onClick={() => setSelectedOrganization(null)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors"
                  >
                    Organization: {selectedOrganization}
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="card-modern border-gray-200 animate-slide-up">
          <CardHeader>
            <CardTitle>
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full"></div>
                </div>
                <p className="text-gray-500 mt-4">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No transactions found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Farmer Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Barangay</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Organization</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transaction Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date of Visit</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, index) => {
                      const farmer = farmers.find(f => f.id === tx.farmerId);
                      return (
                        <tr
                          key={tx.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{farmer?.fullName || "Unknown"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{farmer?.barangay || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{farmer?.organization || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(tx.transactionType)}`}>
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(tx.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={tx.notes || ""}>
                            {tx.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
