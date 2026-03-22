import { Link as RouterLink } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats, useFarmers, useTransactions, useAllCommodities } from "@/hooks/useApi";
import { dashboardService } from "@/services/api";
import { exportVisitsToPdf, exportFilteredFarmersToPdf } from "@/lib/pdfExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, TrendingUp, ArrowRight, CalendarDays, X, Save, FileDown, BarChart3, Clipboard } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import {
  PRINT_FARM_TYPE_KEYS,
  cropCommodityChartData,
  livestockCommodityChartData,
} from "@/lib/commodityClassification";

/** Map DB values like MALE / FEMALE to chart buckets */
function bucketGender(g: string | undefined): "Male" | "Female" | null {
  if (!g) return null;
  const x = g.trim().toLowerCase();
  if (x === "male" || x === "m") return "Male";
  if (x === "female" || x === "f") return "Female";
  return null;
}

export default function Dashboard() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempDay, setTempDay] = useState<number | null>(selectedDay);
  const [isPrintingVisits, setIsPrintingVisits] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintingFiltered, setIsPrintingFiltered] = useState(false);
  const [printFilters, setPrintFilters] = useState<{
    genders: { [key: string]: boolean };
    farmTypes: { [key: string]: boolean };
    organizations: { [key: string]: boolean };
    barangays: { [key: string]: boolean };
  }>({
    genders: { Male: true, Female: true },
    farmTypes: {},
    organizations: {},
    barangays: {},
  });

  const { toasts, success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats(selectedMonth, selectedYear, selectedDay !== null ? selectedDay : undefined);
  const {
    data: farmers,
    isLoading: farmersLoading,
    error: farmersError,
    refetch: refetchFarmers,
  } = useFarmers();
  const { data: transactions } = useTransactions();
  const { data: commodities } = useAllCommodities();

  // Calculate organizations and gender distribution
  const organizationStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (farmers || []).forEach((farmer) => {
      if (farmer.agency) {
        stats[farmer.agency] = (stats[farmer.agency] || 0) + 1;
      }
    });
    return stats;
  }, [farmers]);

  const genderStats = useMemo(() => {
    const stats = { Male: 0, Female: 0 };
    (farmers || []).forEach((farmer) => {
      const b = bucketGender(farmer.gender);
      if (b === "Male") stats.Male++;
      else if (b === "Female") stats.Female++;
    });
    return stats;
  }, [farmers]);

  // Sync print filter options when organization list (from farmers) changes
  useEffect(() => {
    const barangaysFromFarmers = new Set<string>();
    (farmers || []).forEach((farmer) => {
      if (farmer.farmerAddress1) {
        barangaysFromFarmers.add(farmer.farmerAddress1);
      }
    });
    // Combine with static list
    PASSI_BARANGAYS.forEach((b) => barangaysFromFarmers.add(b));
    
    setPrintFilters((prev) => ({
      genders: prev.genders,
      farmTypes: Object.fromEntries(PRINT_FARM_TYPE_KEYS.map((type) => [type, true])),
      organizations: Object.fromEntries(Object.keys(organizationStats).map((org) => [org, true])),
      barangays: Object.fromEntries(Array.from(barangaysFromFarmers).map((barangay) => [barangay, true])),
    }));
  }, [organizationStats, farmers]);

  // Calculate visits per organization for the selected date period
  const visitsPerOrganization = useMemo(() => {
    const orgVisits: Record<string, number> = {};
    
    // Calculate date range
    let startDate: Date;
    let endDate: Date;
    if (selectedDay !== null) {
      startDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 23, 59, 59, 999);
    } else {
      startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    }

    // Filter transactions by date
    (transactions || []).forEach((tx) => {
      const txDate = new Date(tx.officeVisitAt || tx.createdAt);
      if (txDate >= startDate && txDate <= endDate) {
        const farmer = (farmers || []).find(f => f.rsbsaCode === tx.rsbsaCode);
        if (farmer && farmer.agency) {
          orgVisits[farmer.agency] = (orgVisits[farmer.agency] || 0) + 1;
        }
      }
    });
    
    return orgVisits;
  }, [transactions, farmers, selectedMonth, selectedYear, selectedDay]);

  const cropChartData = useMemo(() => cropCommodityChartData(commodities), [commodities]);
  const livestockChartData = useMemo(() => livestockCommodityChartData(commodities), [commodities]);

  const farmChartsHaveData = useMemo(
    () =>
      cropChartData.some((d) => d.value > 0) || livestockChartData.some((d) => d.value > 0),
    [cropChartData, livestockChartData]
  );

  const genderChartData = useMemo(() => {
    return Object.entries(genderStats).map(([name, value]) => ({ name, value: Math.round(value as number) }));
  }, [genderStats]);

  const organizationChartData = useMemo(() => {
    return Object.entries(organizationStats)
      .map(([name, value]) => ({ name: name.substring(0, 30), value: Math.round(value as number) }));
  }, [organizationStats]);



  // Define chart colors
  const COLORS = ['#16a34a', '#0284c7', '#ea580c', '#d946ef', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const handlePrintVisitsPdf = async () => {
    setIsPrintingVisits(true);
    try {
      const visits = await dashboardService.visitsList(selectedMonth, selectedYear, selectedDay ?? undefined);
      await exportVisitsToPdf(visits, {
        month: selectedMonth,
        year: selectedYear,
        day: selectedDay ?? undefined,
      });
      success("Visit report exported successfully!");
    } catch (e) {
      console.error(e);
      showError("Failed to generate report.");
    } finally {
      setIsPrintingVisits(false);
    }
  };

  const handleOpenDatePicker = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setTempDay(selectedDay);
    setIsDatePickerOpen(true);
  };

  const handleConfirmDate = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setSelectedDay(tempDay);
    setIsDatePickerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleCloseDatePicker = () => {
    setIsDatePickerOpen(false);
  };

  const handleExportFilteredFarmersPdf = async () => {
    setIsPrintingFiltered(true);
    try {
      const filtered = (farmers || []).filter((farmer) => {
        const genderKey = bucketGender(farmer.gender);
        const genderSelected =
          genderKey != null
            ? !!printFilters.genders[genderKey]
            : printFilters.genders.Male && printFilters.genders.Female;
        const farmTypeSelected = true; // Print dialog farm-type filters are legacy; commodity-based chart is separate
        const organizationSelected = printFilters.organizations[farmer.agency || ""];
        const barangaySelected = printFilters.barangays[farmer.farmerAddress1 || ""];
        
        return genderSelected && farmTypeSelected && organizationSelected && barangaySelected;
      });

      const appliedFiltersList = [];
      const selectedGenders = Object.entries(printFilters.genders)
        .filter(([_, selected]) => selected)
        .map(([gender]) => gender);
      if (selectedGenders.length > 0) appliedFiltersList.push(`Gender: ${selectedGenders.join(", ")}`);

      const selectedFarmTypes = Object.entries(printFilters.farmTypes)
        .filter(([_, selected]) => selected)
        .map(([type]) => type);
      if (selectedFarmTypes.length > 0) appliedFiltersList.push(`Farm Type: ${selectedFarmTypes.join(", ")}`);

      const selectedOrgs = Object.entries(printFilters.organizations)
        .filter(([_, selected]) => selected)
        .map(([org]) => org);
      if (selectedOrgs.length > 0) appliedFiltersList.push(`Organization: ${selectedOrgs.join(", ")}`);

      const selectedBarangays = Object.entries(printFilters.barangays)
        .filter(([_, selected]) => selected)
        .map(([barangay]) => barangay);
      if (selectedBarangays.length > 0) appliedFiltersList.push(`Barangay: ${selectedBarangays.join(", ")}`);

      await exportFilteredFarmersToPdf(filtered, appliedFiltersList);
      success("Farmers report exported successfully!");
      setIsPrintDialogOpen(false);
    } catch (e) {
      console.error(e);
      showError("Failed to export report.");
    } finally {
      setIsPrintingFiltered(false);
    }
  };

  const actions = [
    {
      title: "Record Transaction",
      description: "Register a new farmer visit and record the transaction type",
      icon: Clipboard,
      path: "/record-transaction",
      gradient: "from-harvest-500 to-harvest-600",
      bgGradient: "from-harvest-50 to-harvest-100",
      borderColor: "border-harvest-300",
      iconBg: "bg-harvest-100",
      iconColor: "text-harvest-600",
    },
    {
      title: "Farmer Directory",
      description: "Browse all farmers and view their profiles and transaction history",
      icon: Users,
      path: "/farmers",
      gradient: "from-farm-500 to-farm-600",
      bgGradient: "from-farm-50 to-farm-100",
      borderColor: "border-farm-300",
      iconBg: "bg-farm-100",
      iconColor: "text-farm-600",
    },
    {
      title: "Add New Farmer",
      description: "Register a new farmer in the system with their profile details",
      icon: UserPlus,
      path: "/add-farmer",
      gradient: "from-sky-500 to-sky-600",
      bgGradient: "from-sky-50 to-sky-100",
      borderColor: "border-sky-300",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
  ];

  const totalFarmers = stats?.totalFarmers ?? farmers?.length ?? 0;
  const farmersVisitedThisMonth = stats?.farmersVisitedThisMonth || 0;
  const visitsThisMonth = stats?.visitsThisMonth || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      {(statsError || farmersError) && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
          <p className="font-semibold">Some data could not be loaded</p>
          <p className="text-sm mt-1">
            {statsError && <span>Statistics: {String((statsError as Error).message)}. </span>}
            {farmersError && (
              <span>
                Farmer list: {String((farmersError as Error).message)}.{" "}
                <button
                  type="button"
                  className="underline font-medium text-amber-900"
                  onClick={() => void refetchFarmers()}
                >
                  Retry farmers
                </button>
              </span>
            )}
          </p>
        </div>
      )}
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-farm-100 rounded-xl">
                <Users className="w-6 h-6 text-farm-600" />
              </div>
              <div className="px-3 py-1 bg-farm-100 rounded-full">
                <span className="text-xs font-semibold text-farm-700">
                  Total
                </span>
              </div>
            </div>
            <p className="text-sm text-earth-700 mb-2">Farmers</p>
            <p className="text-4xl font-bold text-gradient-farm mb-1">
              {statsLoading && farmersLoading ? (
                <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                totalFarmers
              )}
            </p>
            <p className="text-xs text-earth-600">
              In the system
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern border-sky-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-100 rounded-xl">
                <CalendarDays className="w-6 h-6 text-sky-600" />
              </div>
              <button
                onClick={handleOpenDatePicker}
                className="px-3 py-1.5 bg-sky-100 rounded-full hover:bg-sky-200 transition-colors cursor-pointer group flex items-center gap-1.5"
                title="Click to change date, then Save to view farmers"
              >
                <CalendarDays className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold text-sky-700 group-hover:text-sky-800">
                  {selectedDay !== null
                    ? new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </button>
            </div>
            <p className="text-sm text-earth-700 mb-2">Farmers Visited</p>
            <p className="text-4xl font-bold text-sky-700 mb-1">
              {statsLoading ? (
                <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                farmersVisitedThisMonth
              )}
            </p>
            <p className="text-xs text-earth-600">
              Visits:{" "}
              <span className="font-semibold text-earth-800">
                {statsLoading ? "..." : visitsThisMonth}
              </span>
              <span className="block mt-1 text-earth-500">Click date above → Save to filter</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full sm:w-auto border-sky-300 text-sky-700 hover:bg-sky-50"
              onClick={handlePrintVisitsPdf}
              disabled={isPrintingVisits}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isPrintingVisits ? "Generating…" : "Print visits to PDF"}
            </Button>
            <p className="text-xs text-earth-500 mt-1.5">
              {selectedDay !== null ? "Current day" : "Whole month"} → PDF
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern border-harvest-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-harvest-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-harvest-600" />
              </div>
              <div className="px-3 py-1 bg-harvest-100 rounded-full">
                <span className="text-xs font-semibold text-harvest-700">By Organization</span>
              </div>
            </div>
            <p className="text-sm text-earth-700 mb-3 font-medium">Visits per Organization</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {Object.entries(visitsPerOrganization).length === 0 ? (
                <p className="text-xs text-earth-600 py-4 text-center">No visits recorded</p>
              ) : (
                Object.entries(visitsPerOrganization)
                  .sort((a, b) => b[1] - a[1])
                  .map(([org, count]) => (
                    <div key={org} className="flex justify-between items-center p-2 bg-harvest-50 rounded-lg border border-harvest-100">
                      <span className="text-sm font-medium text-earth-800">{org}</span>
                      <span className="text-sm font-bold text-harvest-600 bg-harvest-100 px-2.5 py-1 rounded-full">
                        {count} {count === 1 ? 'visit' : 'visits'}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-bold text-earth-800">Analytics & Visualizations</h2>
          <BarChart3 className="w-6 h-6 text-farm-600" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Crops vs livestock (commodity rows) */}
          <div className="md:col-span-2 grid gap-6 lg:grid-cols-2">
            {farmChartsHaveData ? (
              <>
                <Card className="card-modern border-harvest-200 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                  <CardHeader className="bg-gradient-to-r from-harvest-50 to-harvest-100 border-b-2 border-harvest-200">
                    <CardTitle className="text-xl font-display">Crops</CardTitle>
                    <CardDescription>Commodity records under crop categories (rice, corn, vegetables, fruit trees, etc.)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="max-h-96 overflow-y-auto">
                      <ResponsiveContainer width="100%" height={Math.max(280, cropChartData.length * 48)}>
                        <BarChart data={cropChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={72} tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-modern border-amber-200 animate-slide-up" style={{ animationDelay: "0.52s" }}>
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-200">
                    <CardTitle className="text-xl font-display">Livestock</CardTitle>
                    <CardDescription>Commodity records under livestock (pig, chicken, other)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="max-h-96 overflow-y-auto">
                      <ResponsiveContainer width="100%" height={Math.max(220, livestockChartData.length * 52)}>
                        <BarChart data={livestockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#d97706" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-modern border-harvest-200 animate-slide-up lg:col-span-2" style={{ animationDelay: "0.5s" }}>
                <CardHeader className="bg-gradient-to-r from-harvest-50 to-harvest-100 border-b-2 border-harvest-200">
                  <CardTitle className="text-xl font-display">Farmers by farm type</CardTitle>
                  <CardDescription>Crops and livestock from commodity records</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-center text-earth-600 py-12">
                    No commodity records yet. Add commodities on farmer profiles or import from Excel to see these charts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gender Pie Chart */}
          <div>
            {genderChartData.length > 0 ? (
              <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.55s' }}>
                <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
                  <CardTitle className="text-xl font-display">Farmers by Gender</CardTitle>
                  <CardDescription>Gender distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-96 overflow-y-auto">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genderChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${Math.round(value as number)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {genderChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.55s' }}>
                <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
                  <CardTitle className="text-xl font-display">Farmers by Gender</CardTitle>
                  <CardDescription>Gender distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-center text-earth-600 py-12">No data available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Organization Pie Chart */}
          <div>
            {organizationChartData.length > 0 ? (
              <Card className="card-modern border-sky-200 animate-slide-up" style={{ animationDelay: '0.60s' }}>
                <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200">
                  <CardTitle className="text-xl font-display">Farmers by Organization</CardTitle>
                  <CardDescription>Organization distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-96 overflow-y-auto">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={organizationChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name: _name, value }) => `${Math.round(value as number)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {organizationChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-modern border-sky-200 animate-slide-up" style={{ animationDelay: '0.60s' }}>
                <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200">
                  <CardTitle className="text-xl font-display">Farmers by Organization</CardTitle>
                  <CardDescription>Organization distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-center text-earth-600 py-12">No data available</p>
                </CardContent>
              </Card>
            )}
          </div>


        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6 gap-4">
          <h2 className="text-3xl font-display font-bold text-earth-800">Quick Actions</h2>
          <TrendingUp className="w-6 h-6 text-farm-600" />
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            
            const content = (
              <Card className={`card-modern bg-gradient-to-br ${action.bgGradient} border-2 ${action.borderColor} h-full overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 ${action.iconBg} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${action.iconColor}`} />
                    </div>
                    <ArrowRight className={`w-5 h-5 ${action.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
                  </div>
                  <CardTitle className="text-xl font-display font-bold text-earth-800 mb-2">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-earth-700 leading-relaxed">
                    {action.description}
                  </CardDescription>
                  <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            );
            
            return (
              <RouterLink 
                key={action.path} 
                to={action.path} 
                className="no-underline animate-scale-in group"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                {content}
              </RouterLink>
            );
          })}
        </div>
      </div>



      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-earth-800">Select Month, Day & Year</CardTitle>
              <button
                onClick={handleCloseDatePicker}
                className="text-earth-600 hover:text-earth-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-earth-600 -mt-2">
                Choose a date to view farmers visited. Click <strong>Save</strong> to apply and refresh the data.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label htmlFor="modal-month" className="text-sm font-semibold text-earth-700 mb-2">Month</label>
                    <select
                      id="modal-month"
                      value={tempMonth}
                      onChange={(e) => setTempMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="modal-day" className="text-sm font-semibold text-earth-700 mb-2">Day (Optional)</label>
                    <select
                      id="modal-day"
                      value={tempDay !== null ? tempDay : ""}
                      onChange={(e) => setTempDay(e.target.value === "" ? null : parseInt(e.target.value))}
                      className="px-3 py-2 border-2 border-earth-200 rounded-lg bg-[#fffefb] text-earth-800 font-medium hover:border-earth-300 focus:outline-none focus:ring-2 focus:ring-farm-500 focus:border-transparent transition-all text-sm"
                    >
                      <option value="">All Days</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="modal-year" className="text-sm font-semibold text-earth-700 mb-2">Year</label>
                    <select
                      id="modal-year"
                      value={tempYear}
                      onChange={(e) => setTempYear(parseInt(e.target.value))}
                      className="px-3 py-2 border-2 border-earth-200 rounded-lg bg-[#fffefb] text-earth-800 font-medium hover:border-earth-300 focus:outline-none focus:ring-2 focus:ring-farm-500 focus:border-transparent transition-all text-sm"
                    >
                      {Array.from({ length: 11 }, (_, i) => tempYear - 5 + i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCloseDatePicker}
                  variant="outline"
                  className="flex-1 h-12 border-2 border-earth-200 text-earth-700 font-semibold"
                >
                  Cancel
                </Button>
                <button
                  onClick={handleConfirmDate}
                  type="button"
                  className="flex-1 h-12 bg-farm-600 hover:bg-farm-700 text-white font-semibold rounded-xl shadow-farm hover:shadow-farm-lg min-w-[120px] flex items-center justify-center gap-2 transition-all duration-300"
                  style={{ backgroundColor: '#2D5A3D' }}
                >
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Filter Dialog */}
      {isPrintDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200 flex-shrink-0">
              <div>
                <CardTitle className="text-2xl font-display font-bold text-earth-800">Filter Farmers Report</CardTitle>
                <p className="text-sm text-earth-600 mt-1">Select categories to include in the printed report</p>
              </div>
              <button
                onClick={() => setIsPrintDialogOpen(false)}
                className="text-earth-600 hover:text-earth-800 hover:bg-earth-200 transition-colors p-2 rounded-lg flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6 p-8 overflow-y-auto flex-1">

              {/* Filter Sections in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gender Checkboxes */}
                <div className="space-y-3 p-4 bg-farm-50/50 rounded-lg border border-farm-200">
                  <h3 className="font-semibold text-farm-700 text-base mb-3">Gender</h3>
                  {Object.entries(printFilters.genders).map(([gender, checked]) => (
                    <label key={gender} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setPrintFilters((prev) => ({
                            ...prev,
                            genders: { ...prev.genders, [gender]: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 rounded cursor-pointer accent-farm-600"
                      />
                      <span className="text-sm text-earth-700 font-medium">{gender}</span>
                    </label>
                  ))}
                </div>

                {/* Farm Type Checkboxes */}
                {Object.keys(printFilters.farmTypes).length > 0 && (
                  <div className="space-y-3 p-4 bg-harvest-50/50 rounded-lg border border-harvest-200">
                    <h3 className="font-semibold text-harvest-700 text-base mb-3">Farm Type</h3>
                    {Object.entries(printFilters.farmTypes).map(([farmType, checked]) => (
                      <label key={farmType} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setPrintFilters((prev) => ({
                              ...prev,
                              farmTypes: { ...prev.farmTypes, [farmType]: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 rounded cursor-pointer accent-harvest-600"
                        />
                        <span className="text-sm text-earth-700 font-medium">{farmType}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Organization & Barangay in separate sections */}
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
                        <span className="text-sm text-earth-700 font-medium truncate" title={org}>{org.substring(0, 30)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Barangay Checkboxes */}
              {Object.keys(printFilters.barangays).length > 0 && (
                <div className="space-y-3 p-4 bg-earth-50/50 rounded-lg border border-earth-200">
                  <h3 className="font-semibold text-earth-700 text-base mb-3">Barangay</h3>
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
                          className="w-4 h-4 rounded cursor-pointer accent-earth-600"
                        />
                        <span className="text-sm text-earth-700 font-medium truncate" title={barangay}>{barangay.substring(0, 30)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-4 p-8 pt-6 border-t-2 border-earth-300 bg-white flex-shrink-0">
              <button
                onClick={() => setIsPrintDialogOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-earth-400 text-earth-700 font-semibold text-base rounded-lg hover:bg-earth-100 transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleExportFilteredFarmersPdf}
                disabled={isPrintingFiltered}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-farm-600 to-farm-700 hover:from-farm-700 hover:to-farm-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              >
                <FileDown className="w-5 h-5" />
                {isPrintingFiltered ? "Exporting..." : "Export to PDF"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
