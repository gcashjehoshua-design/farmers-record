import { Link as RouterLink } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats, useFarmers, useTransactions, useAllCommodities } from "@/hooks/useApi";
import { dashboardService } from "@/services/api";
import { exportVisitsToPdf, exportFilteredFarmersToPdf } from "@/lib/pdfExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, TrendingUp, ArrowRight, CalendarDays, X, Save, FileDown, BarChart3, Clipboard, Sprout, Bird, UsersRound, Building2, MapPin } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState<number | null>(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempDay, setTempDay] = useState<number | null>(selectedDay);
  const [isPrintingVisits, setIsPrintingVisits] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintingFiltered, setIsPrintingFiltered] = useState(false);
  const [printFilters, setPrintFilters] = useState<{
    genders: { [key: string]: boolean };
    farmTypes: { [key: string]: boolean };
    agencies: { [key: string]: boolean };
    barangays: { [key: string]: boolean };
  }>({
    genders: { Male: true, Female: true },
    farmTypes: {},
    agencies: {},
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

  // Calculate agencies and gender distribution
  const agencyStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (farmers || []).forEach((farmer) => {
      if (farmer.agency) {
        stats[farmer.agency] = (stats[farmer.agency] || 0) + 1;
      }
    });
    return stats;
  }, [farmers]);

  const barangayStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (farmers || []).forEach((farmer) => {
      if (farmer.farmerAddress1) {
        stats[farmer.farmerAddress1] = (stats[farmer.farmerAddress1] || 0) + 1;
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

  // Sync print filter options when agency list (from farmers) changes
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
      agencies: Object.fromEntries(Object.keys(agencyStats).map((org) => [org, true])),
      barangays: Object.fromEntries(Array.from(barangaysFromFarmers).map((barangay) => [barangay, true])),
    }));
  }, [agencyStats, farmers]);

  // Calculate visits per agency for the selected date period
  const visitsPerAgency = useMemo(() => {
    const orgVisits: Record<string, number> = {};
    
    // Calculate date range
    let startDate: Date;
    let endDate: Date;
    if (selectedMonth !== null) {
      if (selectedDay !== null) {
        startDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 0, 0, 0, 0);
        endDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 23, 59, 59, 999);
      } else {
        startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
        endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      }
    } else {
      startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
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

  const agencyChartData = useMemo(() => {
    return Object.entries(agencyStats)
      .map(([name, value]) => ({ name: name.substring(0, 30), value: Math.round(value as number) }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [agencyStats]);

  const barangayChartData = useMemo(() => {
    // Start with all Passi City barangays
    return PASSI_BARANGAYS.map((barangay) => ({
      name: barangay,
      value: barangayStats[barangay] || 0,
    })).sort((a, b) => (b.value as number) - (a.value as number));
  }, [barangayStats]);


  // Define chart colors - theme-compliant palette
  const GENDER_COLORS = ['#f87171', '#60a5fa']; // Warm red for Female-like, Cool blue for Male-like
  const ORG_COLORS = ['#16a34a', '#ea580c', '#06b6d4', '#9333ea', '#f43f5e', '#14b8a6', '#f59e0b', '#7c3aed', '#ec4899', '#10b981'];
  
  // Barangay colors - unique color for each barangay
  const BARANGAY_COLORS = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#14b8a6', '#06d6d4', '#0891b2', '#0284c7', '#1e40af', '#7c3aed',
    '#a855f7', '#d946ef', '#e11d48', '#ea580c', '#fb923c', '#fbbf24', '#fcd34d', '#bfdbfe',
    '#a7f3d0', '#a5f3fc', '#c7d2fe', '#ddd6fe', '#fbcfe8', '#fecdd3', '#fed7aa', '#fef3c7'
  ];

  const handlePrintVisitsPdf = async () => {
    setIsPrintingVisits(true);
    try {
      const visits = await dashboardService.visitsList(selectedMonth, selectedYear, selectedDay ?? undefined);
      const month = selectedMonth ?? 0; // Use 0 to indicate all months in the export
      await exportVisitsToPdf(visits, {
        month,
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
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setTempDay(selectedDay);
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
        const agencySelected = printFilters.agencies[farmer.agency || ""];
        const barangaySelected = printFilters.barangays[farmer.farmerAddress1 || ""];
        
        return genderSelected && farmTypeSelected && agencySelected && barangaySelected;
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

      const selectedAgencies = Object.entries(printFilters.agencies)
        .filter(([_, selected]) => selected)
        .map(([org]) => org);
      if (selectedAgencies.length > 0) appliedFiltersList.push(`Agency: ${selectedAgencies.join(", ")}`);

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
                  {selectedMonth === null 
                    ? `${selectedYear}`
                    : selectedDay !== null
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
              className="mt-4 w-full sm:w-auto bg-white border-sky-300 text-sky-700 hover:bg-sky-50"
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
                <span className="text-xs font-semibold text-harvest-700">By Agency</span>
              </div>
            </div>
            <p className="text-sm text-earth-700 mb-3 font-medium">Visits per Agency</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {Object.entries(visitsPerAgency).length === 0 ? (
                <p className="text-xs text-earth-600 py-4 text-center">No visits recorded</p>
              ) : (
                Object.entries(visitsPerAgency)
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

      {/* Charts Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-earth-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-earth-700" />
            </div>
            <h2 className="text-3xl font-display font-bold text-earth-800">Analytics & Visualizations</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Crops vs livestock (commodity rows) */}
          <div className="md:col-span-2 grid gap-6 lg:grid-cols-2">
            {farmChartsHaveData ? (
              <>
                <Card className="card-modern border-harvest-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: "0.5s" }}>
                  <CardHeader className="bg-gradient-to-br from-harvest-50 to-harvest-100/50 border-b-2 border-harvest-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2.5 bg-harvest-100 rounded-xl text-harvest-600 shadow-sm">
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-display text-harvest-900">Crops</CardTitle>
                        <CardDescription className="text-harvest-700/80 mt-1">Commodity records under crop categories</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={cropChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={60} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 500 }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} dy={5} />
                          <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} dx={-10} />
                          <Tooltip 
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '12px' }}
                            itemStyle={{ color: '#16a34a', fontWeight: 600 }}
                            labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                          />
                          <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={32}>
                            <LabelList
                              dataKey="value"
                              position="top"
                              fill="#166534"
                              fontSize={11}
                              fontWeight={600}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-modern border-amber-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: "0.52s" }}>
                  <CardHeader className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-b-2 border-amber-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-sm">
                        <Bird className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-display text-amber-900">Livestock</CardTitle>
                        <CardDescription className="text-amber-700/80 mt-1">Commodity records under livestock categories</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={livestockChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={58} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 500 }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} dy={5} />
                          <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} dx={-10} />
                          <Tooltip 
                            cursor={{ fill: '#fef3c7' }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '12px' }}
                            itemStyle={{ color: '#d97706', fontWeight: 600 }}
                            labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                          />
                          <Bar dataKey="value" fill="#d97706" radius={[6, 6, 0, 0]} barSize={40}>
                            <LabelList
                              dataKey="value"
                              position="top"
                              fill="#92400e"
                              fontSize={11}
                              fontWeight={600}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-modern border-harvest-200 animate-slide-up hover:shadow-lg transition-shadow duration-300 lg:col-span-2" style={{ animationDelay: "0.5s" }}>
                <CardHeader className="bg-gradient-to-br from-harvest-50 to-harvest-100/50 border-b-2 border-harvest-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-harvest-100 rounded-xl text-harvest-600 shadow-sm">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display text-harvest-900">Farmers by farm type</CardTitle>
                      <CardDescription className="text-harvest-700/80 mt-1">Crops and livestock from commodity records</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <Sprout className="w-12 h-12 text-harvest-200 mb-3" />
                  <p className="text-center text-earth-600">
                    No commodity records yet. Add commodities on farmer profiles or import from Excel to see these charts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gender Pie Chart */}
          <div>
            {genderChartData.length > 0 ? (
              <Card className="card-modern border-rose-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.55s' }}>
                <CardHeader className="bg-gradient-to-br from-rose-50 to-blue-50/50 border-b-2 border-rose-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
                      <UsersRound className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display text-rose-900">Farmers by Gender</CardTitle>
                      <CardDescription className="text-rose-700/80 mt-1">Gender distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genderChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {genderChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center justify-center gap-6 text-sm text-earth-700">
                      {genderChartData.map((entry, index) => (
                        <div key={`gender-legend-${entry.name}`} className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: GENDER_COLORS[index % GENDER_COLORS.length] }}
                          />
                          <span className="font-medium">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-modern border-rose-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.55s' }}>
                <CardHeader className="bg-gradient-to-br from-rose-50 to-blue-50/50 border-b-2 border-rose-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
                      <UsersRound className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display text-rose-900">Farmers by Gender</CardTitle>
                      <CardDescription className="text-rose-700/80 mt-1">Gender distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <UsersRound className="w-12 h-12 text-rose-200 mb-3" />
                  <p className="text-center text-earth-600">No data available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Agency Pie Chart */}
          <div>
            {agencyChartData.length > 0 ? (
              <Card className="card-modern border-purple-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.60s' }}>
                <CardHeader className="bg-gradient-to-br from-purple-50 to-orange-50/50 border-b-2 border-purple-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display text-purple-900">Farmers by Agency</CardTitle>
                      <CardDescription className="text-purple-700/80 mt-1">Agency distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={agencyChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name: _name, value }) => `${Math.round(value as number)}`}
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {agencyChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={ORG_COLORS[index % ORG_COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-earth-700">
                      {agencyChartData.map((entry, index) => (
                        <div key={`agency-legend-${entry.name}`} className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: ORG_COLORS[index % ORG_COLORS.length] }}
                          />
                          <span className="font-medium truncate" title={entry.name}>
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-modern border-purple-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.60s' }}>
                <CardHeader className="bg-gradient-to-br from-purple-50 to-orange-50/50 border-b-2 border-purple-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display text-purple-900">Farmers by Agency</CardTitle>
                      <CardDescription className="text-purple-700/80 mt-1">Agency distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <Building2 className="w-12 h-12 text-purple-200 mb-3" />
                  <p className="text-center text-earth-600">No data available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Barangay Bar Chart */}
          <div className="md:col-span-2">
            <Card className="card-modern border-teal-200 animate-slide-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.65s' }}>
              <CardHeader className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-b-2 border-teal-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2.5 bg-teal-100 rounded-xl text-teal-600 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-display text-teal-900">Farmers by Barangay</CardTitle>
                    <CardDescription className="text-teal-700/80 mt-1">Farmers per barangay in Passi City</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-y-auto pr-2 custom-scrollbar max-h-96">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={barangayChartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={70} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 500 }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} dy={0} />
                      <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip 
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '12px' }}
                        itemStyle={{ color: '#14b8a6', fontWeight: 600 }}
                        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {barangayChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={BARANGAY_COLORS[index % BARANGAY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
                      <label htmlFor="modal-month" className="text-sm font-semibold text-earth-700 mb-2">Month (Optional)</label>
                      <select
                        id="modal-month"
                        value={tempMonth !== null ? tempMonth : ""}
                        onChange={(e) => setTempMonth(e.target.value === "" ? null : parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                      >
                        <option value="">All Months</option>
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
                  variant="secondary"
                  className="flex-1 h-12 font-semibold hover:scale-105 active:scale-95"
                >
                  Cancel
                </Button>
                <button
                  onClick={handleConfirmDate}
                  type="button"
                  className="flex-1 h-12 bg-farm-300 hover:bg-farm-400 text-white font-semibold rounded-xl shadow-sm border-0 hover:shadow-md min-w-[120px] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
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

              {/* Agency & Barangay in separate sections */}
              {Object.keys(printFilters.agencies).length > 0 && (
                <div className="space-y-3 p-4 bg-sky-50/50 rounded-lg border border-sky-200">
                  <h3 className="font-semibold text-sky-700 text-base mb-3">Agency</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {Object.entries(printFilters.agencies).map(([org, checked]) => (
                      <label key={org} className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setPrintFilters((prev) => ({
                              ...prev,
                              agencies: { ...prev.agencies, [org]: e.target.checked },
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
                className="flex-1 px-6 py-3 bg-farm-300 text-white font-semibold text-base rounded-lg hover:bg-farm-400 transition-all duration-200 active:scale-95 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleExportFilteredFarmersPdf}
                disabled={isPrintingFiltered}
                className="flex-1 px-6 py-3 bg-farm-300 text-white font-semibold text-base rounded-lg hover:bg-farm-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
