import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions, useFarmers } from "@/hooks/useApi";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { History, Filter, X, Printer, FileDown } from "lucide-react";

export default function TransactionHistory() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: farmers = [] } = useFarmers();
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printPreviewData, setPrintPreviewData] = useState<{
    transactions: any[];
    filters: string[];
    generatedDate: string;
  } | null>(null);
  const [printFilters, setPrintFilters] = useState<{
    barangays: { [key: string]: boolean };
    organizations: { [key: string]: boolean };
    transactionTypes: { [key: string]: boolean };
  }>({
    barangays: {},
    organizations: {},
    transactionTypes: {},
  });

  // Get unique barangays and organizations
  const barangays = PASSI_BARANGAYS;

  const organizations = useMemo(
    () => [...new Set(farmers.filter(f => f.agency).map(f => f.agency))].sort(),
    [farmers]
  );

  // Get unique transaction types
  const transactionTypes = useMemo(
    () => [...new Set(transactions.map(t => t.transactionType))].sort() as string[],
    [transactions]
  );

  // Get all barangays and organizations for print filters
  const allBarangays = useMemo(
    () => [...new Set(farmers.filter(f => f.farmerAddress1).map(f => f.farmerAddress1))].sort() as string[],
    [farmers]
  );

  const allOrganizations = useMemo(
    () => [...new Set(farmers.filter(f => f.agency).map(f => f.agency))].sort() as string[],
    [farmers]
  );

  // Initialize print filters on component mount with available options
  useMemo(() => {
    setPrintFilters({
      barangays: Object.fromEntries(allBarangays.map((barangay) => [barangay, true])),
      organizations: Object.fromEntries(allOrganizations.map((org) => [org, true])),
      transactionTypes: Object.fromEntries(transactionTypes.map((type) => [type, true])),
    });
  }, [allBarangays, allOrganizations, transactionTypes]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
      if (!farmer) return false;

      const barangayMatch = !selectedBarangay || farmer.farmerAddress1 === selectedBarangay;
      const organizationMatch = !selectedOrganization || farmer.agency === selectedOrganization;

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

  const handlePrintWithFilters = () => {
    // Filter transactions based on selected filters
    const filtered = transactions.filter((tx) => {
      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
      if (!farmer) return false;

      const barangaySelected = printFilters.barangays[farmer.farmerAddress1 || ""];
      const organizationSelected = printFilters.organizations[farmer.agency || ""];
      const transactionTypeSelected = printFilters.transactionTypes[tx.transactionType || ""];

      return barangaySelected && organizationSelected && transactionTypeSelected;
    });

    // Build applied filters list
    const appliedFiltersList = [];
    const selectedBarangays = Object.entries(printFilters.barangays)
      .filter(([_, selected]) => selected)
      .map(([barangay]) => barangay);
    if (selectedBarangays.length > 0 && selectedBarangays.length < allBarangays.length) 
      appliedFiltersList.push(`Barangay: ${selectedBarangays.join(", ")}`);

    const selectedOrgs = Object.entries(printFilters.organizations)
      .filter(([_, selected]) => selected)
      .map(([org]) => org);
    if (selectedOrgs.length > 0 && selectedOrgs.length < allOrganizations.length) 
      appliedFiltersList.push(`Organization: ${selectedOrgs.join(", ")}`);

    const selectedTypes = Object.entries(printFilters.transactionTypes)
      .filter(([_, selected]) => selected)
      .map(([type]) => type);
    if (selectedTypes.length > 0 && selectedTypes.length < transactionTypes.length) 
      appliedFiltersList.push(`Transaction Type: ${selectedTypes.join(", ")}`);

    const generatedDate = new Date().toLocaleDateString("en-PH", { dateStyle: "long" });

    setPrintPreviewData({
      transactions: filtered,
      filters: appliedFiltersList,
      generatedDate,
    });
  };

  const handleGeneratePrintable = () => {
    if (!printPreviewData) return;

    const { transactions: filtered, filters: appliedFiltersList, generatedDate } = printPreviewData;

    const filtersHTML = appliedFiltersList.length > 0 
      ? `<div style="background:#f0f7f4;border-left:3px solid #2D5A3D;padding:10px 12px;margin:15px 0;font-size:11px;">
          <div style="font-weight:bold;color:#2D5A3D;margin-bottom:5px;">Applied Filters:</div>
          ${appliedFiltersList.map(filter => {
            const [label, value] = filter.split(':');
            return `<div style="margin:3px 0;color:#333;line-height:1.4;"><span style="font-weight:600;color:#2D5A3D;">${label}:</span> ${value}</div>`;
          }).join("")}
        </div>`
      : "";

    const transactionRowsHTML = filtered.length > 0 
      ? filtered.map((tx) => {
          const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
          return `
        <tr>
          <td>${farmer ? formatFarmerDisplayName(farmer) : "-"}</td>
          <td>${farmer?.farmerAddress1 || "-"}</td>
          <td>${farmer?.agency || "-"}</td>
          <td>${tx.transactionType || "-"}</td>
          <td>${new Date(tx.officeVisitAt || tx.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
          <td>${tx.notes || "-"}</td>
        </tr>
      `;
        }).join("")
      : `<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;font-style:italic;">No records match the selected filters</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction History Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background: #f5f5f5; padding: 0; }
    @page { size: A4; margin: 15mm; }
    .document { background: white; width: 100%; min-height: 297mm; margin: 0 auto; padding: 20mm; box-shadow: 0 0 0 1px #e5e7eb; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #8B7355; }
    .header-title { font-size: 14px; font-weight: bold; color: #2D5A3D; margin-bottom: 3px; }
    .header-subtitle { font-size: 11px; color: #555; margin-bottom: 2px; }
    .report-title { font-size: 13px; font-weight: bold; color: #2D5A3D; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    thead { background: #EEF5EE; border-bottom: 2px solid #8B7355; }
    th { padding: 8px 6px; text-align: left; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; color: #2D5A3D; border-right: 1px solid #ddd; }
    th:last-child { border-right: none; }
    td { padding: 6px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .summary { display: table; width: 100%; margin: 15px 0; }
    .summary-item { display: table-cell; width: 33.33%; background: #f0f7f4; border: 1px solid #2D5A3D; padding: 10px; text-align: center; font-size: 10px; }
    .summary-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; letter-spacing: 0.3px; }
    .summary-value { font-size: 18px; font-weight: bold; color: #2D5A3D; }
    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #8B7355; color: #666; font-size: 9px; line-height: 1.5; }
    .footer-text { margin: 3px 0; }
    @media print { body { margin: 0; padding: 0; background: white; } .document { box-shadow: none; margin: 0; padding: 15mm; min-height: auto; } }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="header-title">Farmers Record and Transactions System</div>
      <div class="header-subtitle">City of Passi Agriculture Office</div>
      <div class="report-title">Transaction History Report</div>
    </div>
    ${filtersHTML}
    <table>
      <thead>
        <tr>
          <th>Farmer Name</th>
          <th>Barangay</th>
          <th>Organization</th>
          <th>Transaction Type</th>
          <th>Date of Visit</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRowsHTML}
      </tbody>
    </table>
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Transactions</div>
        <div class="summary-value">${filtered.length}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Report Status</div>
        <div class="summary-value" style="font-size: 12px;">${appliedFiltersList.length > 0 ? 'Filtered' : 'Full'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Generated</div>
        <div class="summary-value" style="font-size: 10px;">${generatedDate}</div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-text"><strong>Department of Agriculture</strong></div>
      <div class="footer-text">Farmers Record and Transactions System</div>
      <div class="footer-text">City of Passi Agriculture Office</div>
    </div>
  </div>
</body>
</html>`;
    
    const printWindow = window.open("", "", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleCancelPreview = () => {
    setPrintPreviewData(null);
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 border-sky-300 text-sky-700 hover:bg-sky-50"
              onClick={() => setIsPrintDialogOpen(true)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Transactions
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
                      const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
                      return (
                        <tr
                          key={tx.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Preview Modal */}
        {printPreviewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200 z-10">
                <div>
                  <CardTitle className="text-2xl font-display font-bold text-gray-800">Print Preview</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Review the report before printing</p>
                </div>
                <button
                  onClick={handleCancelPreview}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors p-2 rounded-lg flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Preview Content with Tailwind CSS */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-4 max-h-[calc(90vh-300px)] overflow-y-auto">
                  {/* Header */}
                  <div className="text-center pb-4 border-b-2 border-gray-300">
                    <h3 className="text-lg font-bold text-sky-700">Farmers Record and Transactions System</h3>
                    <p className="text-sm text-gray-600">City of Passi Agriculture Office</p>
                    <p className="text-sm font-semibold text-sky-600 mt-2">Transaction History Report</p>
                  </div>

                  {/* Applied Filters */}
                  {printPreviewData.filters.length > 0 && (
                    <div className="bg-sky-50 border-l-4 border-sky-700 p-4 text-sm">
                      <p className="font-semibold text-sky-700 mb-2">Applied Filters:</p>
                      <div className="space-y-1">
                        {printPreviewData.filters.map((filter, idx) => (
                          <p key={idx} className="text-gray-700">{filter}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-sky-100 border-2 border-sky-300">
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Farmer Name</th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Barangay</th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Organization</th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Transaction Type</th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-700 border border-sky-300">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printPreviewData.transactions.length > 0 ? (
                          printPreviewData.transactions.map((tx, idx) => {
                            const farmer = farmers.find(f => f.rsbsaCode === tx.rsbsaCode);
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-sky-50 bg-opacity-40"}>
                                <td className="px-3 py-2 border border-gray-200">
                                {farmer ? formatFarmerDisplayName(farmer) : "-"}
                              </td>
                                <td className="px-3 py-2 border border-gray-200">{farmer?.farmerAddress1 || "-"}</td>
                                <td className="px-3 py-2 border border-gray-200">{farmer?.agency || "-"}</td>
                                <td className="px-3 py-2 border border-gray-200">{tx.transactionType || "-"}</td>
                                <td className="px-3 py-2 border border-gray-200">
                                  {new Date(tx.officeVisitAt || tx.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-3 py-2 border border-gray-200">{tx.notes || "-"}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-gray-600 italic border border-gray-200">
                              No records match the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-sky-50 border-2 border-sky-400 rounded p-3 text-center">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Transactions</p>
                      <p className="text-2xl font-bold text-sky-700 mt-1">{printPreviewData.transactions.length}</p>
                    </div>
                    <div className="bg-sky-50 border-2 border-sky-400 rounded p-3 text-center">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Report Status</p>
                      <p className="text-lg font-bold text-sky-700 mt-1">{printPreviewData.filters.length > 0 ? "Filtered" : "Full"}</p>
                    </div>
                    <div className="bg-sky-50 border-2 border-sky-400 rounded p-3 text-center">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Generated</p>
                      <p className="text-sm font-semibold text-sky-700 mt-1">{printPreviewData.generatedDate}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-4 border-t-2 border-gray-300">
                    <p className="font-semibold text-sky-700">Department of Agriculture</p>
                    <p className="text-sm text-gray-600">Farmers Record and Transactions System</p>
                    <p className="text-sm text-gray-600">City of Passi Agriculture Office</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2 border-t-2 border-gray-300">
                  <button
                    onClick={handleCancelPreview}
                    className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-700 font-semibold text-base rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePrintable}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <Printer className="w-5 h-5" />
                    Print Document
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Print Filter Dialog */}
        {isPrintDialogOpen && !printPreviewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200 flex-shrink-0">
                <div>
                  <CardTitle className="text-2xl font-display font-bold text-gray-800">Filter Transactions Report</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Select categories to include in the printed report</p>
                </div>
                <button
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors p-2 rounded-lg flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="space-y-6 p-8 overflow-y-auto flex-1">

                {/* Filter Sections in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Transaction Type Checkboxes */}
                  {Object.keys(printFilters.transactionTypes).length > 0 && (
                    <div className="space-y-3 p-4 bg-sky-50/50 rounded-lg border border-sky-200">
                      <h3 className="font-semibold text-sky-700 text-base mb-3">Transaction Type</h3>
                      {Object.entries(printFilters.transactionTypes).map(([type, checked]) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setPrintFilters((prev) => ({
                                ...prev,
                                transactionTypes: { ...prev.transactionTypes, [type]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 rounded cursor-pointer accent-sky-600"
                          />
                          <span className="text-sm text-gray-700 font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Organization Checkboxes */}
                {Object.keys(printFilters.organizations).length > 0 && (
                  <div className="space-y-3 p-4 bg-sky-50/50 rounded-lg border border-sky-200">
                    <h3 className="font-semibold text-sky-700 text-base mb-3">Organization</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {Object.entries(printFilters.organizations).map(([org, checked]) => (
                        <label key={org} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setPrintFilters((prev) => ({
                                ...prev,
                                organizations: { ...prev.organizations, [org]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 rounded cursor-pointer accent-sky-600"
                          />
                          <span className="text-sm text-gray-700 font-medium truncate" title={org}>{org.substring(0, 40)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barangay Checkboxes */}
                {Object.keys(printFilters.barangays).length > 0 && (
                  <div className="space-y-3 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-700 text-base mb-3">Barangay</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {Object.entries(printFilters.barangays).map(([barangay, checked]) => (
                        <label key={barangay} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setPrintFilters((prev) => ({
                                ...prev,
                                barangays: { ...prev.barangays, [barangay]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 rounded cursor-pointer accent-gray-600"
                          />
                          <span className="text-sm text-gray-700 font-medium truncate" title={barangay}>{barangay.substring(0, 40)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Action Buttons - Fixed at bottom */}
              <div className="flex gap-4 p-8 pt-6 border-t-2 border-gray-300 bg-white flex-shrink-0">
                <button
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-700 font-semibold text-base rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrintWithFilters}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <FileDown className="w-5 h-5" />
                  Preview Report
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
