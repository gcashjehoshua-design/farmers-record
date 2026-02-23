import { Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "@/hooks/useApi";
import { dashboardService } from "@/services/api";
import { exportVisitsToPdf } from "@/lib/pdfExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Receipt, UserPlus, TrendingUp, CheckCircle2, ArrowRight, CalendarDays, X, Save, FileDown } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

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

  const { toasts, success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading, error } = useDashboardStats(selectedMonth, selectedYear, selectedDay !== null ? selectedDay : undefined);

  const handlePrintVisitsPdf = async () => {
    setIsPrintingVisits(true);
    try {
      const visits = await dashboardService.visitsList(selectedMonth, selectedYear, selectedDay ?? undefined);
      await exportVisitsToPdf(visits, {
        month: selectedMonth,
        year: selectedYear,
        day: selectedDay ?? undefined,
      });
      success("PDF generated successfully!");
    } catch (e) {
      console.error(e);
      showError("Failed to generate PDF.");
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

  if (error)
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );

  const actions = [
    {
      title: "Record Transaction",
      description: "Register a new farmer visit and record the transaction type",
      icon: Receipt,
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

  const totalFarmers = stats?.totalFarmers || 0;
  const farmersVisitedThisMonth = stats?.farmersVisitedThisMonth || 0;
  const visitsThisMonth = stats?.visitsThisMonth || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-farm-100 rounded-xl">
                <Users className="w-6 h-6 text-farm-600" />
              </div>
              <div className="px-3 py-1 bg-farm-100 rounded-full">
                <span className="text-xs font-semibold text-farm-700">Total</span>
              </div>
            </div>
            <p className="text-sm text-earth-700 mb-2">Total Farmers</p>
            <p className="text-4xl font-bold text-gradient-farm mb-1">
              {isLoading ? (
                <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                totalFarmers
              )}
            </p>
            <p className="text-xs text-earth-600">Registered in the system</p>
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
              {isLoading ? (
                <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                farmersVisitedThisMonth
              )}
            </p>
            <p className="text-xs text-earth-600">
              Visits:{" "}
              <span className="font-semibold text-earth-800">
                {isLoading ? "..." : visitsThisMonth}
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
                <CheckCircle2 className="w-6 h-6 text-harvest-600" />
              </div>
              <div className="px-3 py-1 bg-harvest-100 rounded-full">
                <span className="text-xs font-semibold text-harvest-700">Online</span>
              </div>
            </div>
            <p className="text-sm text-earth-700 mb-2">System Status</p>
            <p className="text-4xl font-bold text-harvest-600 mb-1">✓</p>
            <p className="text-xs text-earth-600">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-display font-bold text-earth-800">Quick Actions</h2>
          <TrendingUp className="w-6 h-6 text-farm-600" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <RouterLink 
                key={action.path} 
                to={action.path} 
                className="no-underline animate-scale-in group"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <Card className={`card-modern bg-gradient-to-br ${action.bgGradient} border-2 ${action.borderColor} h-full overflow-hidden relative`}>
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
    </div>
  );
}
