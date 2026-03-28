import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarmers, useDeleteFarmer, useAllCommodities } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { formatFarmerDisplayName, formatCommoditySummary } from "@/lib/farmerDisplay";
import type { Farmer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, ArrowLeft, Users, TrendingUp, Printer } from "lucide-react";
import FarmersTable from "@/components/FarmersTable";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { PASSI_BARANGAYS } from "@/constants/barangays";
import { exportFarmersToPdf } from "@/lib/pdfExport";
import ConfirmationModal from "@/components/ConfirmationModal";
import FarmerPrintModal from "@/components/FarmerPrintModal";

const ITEMS_PER_PAGE = 10;

function genderFilterLabel(g: string | undefined): string {
  if (!g) return "";
  const x = g.trim().toLowerCase();
  if (x === "male" || x === "m") return "Male";
  if (x === "female" || x === "f") return "Female";
  return g;
}

export default function FarmersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: farmers, isLoading, error } = useFarmers(false);
  const { data: allCommodities = [] } = useAllCommodities();
  const deleteFarmer = useDeleteFarmer();
  const { toasts, success, error: showError } = useToast();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [farmerToDeactivate, setFarmerToDeactivate] = useState<Farmer | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDelete = (farmer: Farmer) => {
    if (!isAdmin) {
      showError("Only admins can make farmers inactive.");
      return;
    }
    setFarmerToDeactivate(farmer);
    setShowConfirmModal(true);
  };

  const confirmDeactivate = async () => {
    if (!farmerToDeactivate) return;
    const display = formatFarmerDisplayName(farmerToDeactivate);
    try {
      await deleteFarmer.mutateAsync(farmerToDeactivate.rsbsaCode);
      success(`${display} is now inactive.`);
    } catch (e) {
      showError("Failed to make farmer inactive.");
    } finally {
      setShowConfirmModal(false);
      setFarmerToDeactivate(null);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [selectedAgency, setSelectedAgency] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const allBarangays = useMemo(() => {
    const set = new Set<string>();
    (farmers || []).forEach((farmer) => {
      if (farmer.farmerAddress1) {
        set.add(farmer.farmerAddress1);
      }
    });
    // Combine with static list and remove duplicates
    PASSI_BARANGAYS.forEach((b) => set.add(b));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farmers]);

  const allAgencies = useMemo(() => {
    const set = new Set<string>();
    (farmers || []).forEach((farmer) => {
      if (farmer.agency) {
        set.add(farmer.agency);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farmers]);

  const commoditySummaryByRsbsa = useMemo(() => {
    const byCode = new Map<string, string[]>();
    for (const c of allCommodities) {
      const code = c.rsbsaCode;
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code)!.push(c.commodityName);
    }
    const out = new Map<string, string>();
    for (const [code, names] of byCode) {
      out.set(code, formatCommoditySummary(names));
    }
    return out;
  }, [allCommodities]);

  const filteredFarmers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const phoneDigits = searchTerm.replace(/\D/g, "");
    const base = (farmers || []).filter((farmer) => {
      const displayName = formatFarmerDisplayName(farmer).toLowerCase();
      const commodityText = (commoditySummaryByRsbsa.get(farmer.rsbsaCode) || "").toLowerCase();
      const rsbsa = farmer.rsbsaCode.toLowerCase();
      const matchesSearch =
        !term ||
        displayName.includes(term) ||
        rsbsa.includes(term) ||
        commodityText.includes(term) ||
        (farmer.phone && farmer.phone.toLowerCase().includes(term)) ||
        (phoneDigits.length > 0 && farmer.phone && farmer.phone.replace(/\D/g, "").includes(phoneDigits)) ||
        (farmer.firstName && farmer.firstName.toLowerCase().includes(term)) ||
        (farmer.lastName && farmer.lastName.toLowerCase().includes(term)) ||
        (farmer.middleName && farmer.middleName.toLowerCase().includes(term)) ||
        (farmer.fullName && farmer.fullName.toLowerCase().includes(term));
      const matchesBarangay =
        selectedBarangay === "all" ||
        !selectedBarangay ||
        farmer.farmerAddress1 === selectedBarangay;
      const matchesAgency =
        selectedAgency === "all" ||
        !selectedAgency ||
        farmer.agency === selectedAgency;
      const matchesGender =
        selectedGender === "all" ||
        !selectedGender ||
        genderFilterLabel(farmer.gender) === selectedGender;
      return matchesSearch && matchesBarangay && matchesAgency && matchesGender;
    });

    // Sort by creation date in ascending order (oldest/first added first)
    return base.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }, [farmers, searchTerm, selectedBarangay, selectedAgency, selectedGender, commoditySummaryByRsbsa]);

  const totalPages = Math.ceil(filteredFarmers.length / ITEMS_PER_PAGE);
  const paginatedFarmers = filteredFarmers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrintPdf = async (printFilters: { barangay: string; gender: string; agency: string }) => {
    setIsPrinting(true);
    try {
      // Filter the full farmers list based on modal selection
      const dataToPrint = (farmers || []).filter(f => {
        const matchesBarangay = printFilters.barangay === "all" || f.farmerAddress1 === printFilters.barangay;
        const matchesGender = printFilters.gender === "all" || genderFilterLabel(f.gender) === printFilters.gender;
        const matchesAgency = printFilters.agency === "all" || f.agency === printFilters.agency;
        return matchesBarangay && matchesGender && matchesAgency;
      });

      await exportFarmersToPdf(dataToPrint, printFilters);
      success("PDF report generated successfully.");
      setShowPrintModal(false);
    } catch (e) {
      showError("Failed to generate PDF report.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (error)
    return (
      <div className="animate-fade-in">
        <div className="p-6 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl shadow-lg">
          <p className="font-semibold">Error loading farmers</p>
          <p className="text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in bg-earth-100/30 min-h-screen">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDeactivate}
        title="Make Profile Inactive?"
        message={`Would you like to make the profile of ${farmerToDeactivate ? formatFarmerDisplayName(farmerToDeactivate) : "this farmer"} inactive? This will hide them from the regular directory.`}
        confirmText="Yes, make inactive"
        cancelText="No, keep active"
        type="danger"
        isLoading={deleteFarmer.isPending}
      />

      <FarmerPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={handlePrintPdf}
        isPrinting={isPrinting}
        barangays={allBarangays}
        agencies={allAgencies}
      />
      {/* Header Section */}
      <div className="border-b-2 border-earth-200 bg-earth-50/90">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-farm-100 rounded-2xl">
              <Users className="w-10 h-10 text-farm-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-earth-800">
                Farmer Directory
              </h1>
              <p className="text-base md:text-lg text-earth-700">
                Find and manage all farmer profiles in the system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Search, Barangay Filter and Add Button */}
        <div className="flex flex-col lg:flex-row gap-4 animate-slide-up">
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, RSBSA code, phone, or commodity..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-modern pl-12 h-14 text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="text-sm font-medium text-earth-700">
                Filter by Barangay:
              </label>
              <select
                value={selectedBarangay}
                onChange={(e) => {
                  setSelectedBarangay(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-modern w-full sm:w-64"
              >
                <option value="all">All barangays</option>
                {allBarangays.map((bgy) => (
                  <option key={bgy} value={bgy}>
                    {bgy}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="text-sm font-medium text-earth-700">
                Filter by Gender:
              </label>
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-modern w-full sm:w-64"
              >
                <option value="all">All genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="text-sm font-medium text-earth-700">
                Filter by Agency:
              </label>
              <select
                value={selectedAgency}
                onChange={(e) => {
                  setSelectedAgency(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-modern w-full sm:w-64"
              >
                <option value="all">All agencies</option>
                {allAgencies.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <Button
              onClick={() => setShowPrintModal(true)}
              className="btn-secondary h-14 px-8 text-base bg-sky-600 hover:bg-sky-700 text-white border-0"
              disabled={farmers?.length === 0}
            >
              <Printer className="w-5 h-5 mr-2" />
              Print to PDF
            </Button>
            <Button
              onClick={() => navigate("/add-farmer")}
              className="btn-farm h-14 px-8 text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Farmer
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-farm-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-farm-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Farmers</p>
                  <p className="text-3xl font-bold text-gradient-farm">
                    {filteredFarmers.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-earth-700">Showing</p>
                  <p className="text-2xl font-bold text-earth-800">
                    {paginatedFarmers.length} <span className="text-lg text-earth-600">of {filteredFarmers.length}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-farm-200 border-t-farm-600"></div>
                <p className="text-gray-600 font-medium mt-6 text-lg">Loading farmers...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the data</p>
              </div>
            ) : (
              <FarmersTable
                farmers={paginatedFarmers}
                onDelete={isAdmin ? handleDelete : undefined}
                commoditySummaryByRsbsa={commoditySummaryByRsbsa}
              />
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredFarmers.length > 0 && totalPages > 1 && (
          <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-2 border-earth-200 hover:bg-earth-50 hover:border-farm-400 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-earth-700">Page</span>
                  <span className="font-bold text-farm-600 text-xl px-4 py-2 bg-farm-50 rounded-xl">
                    {currentPage}
                  </span>
                  <span className="font-semibold text-gray-700">of</span>
                  <span className="font-bold text-farm-600 text-xl px-4 py-2 bg-farm-50 rounded-xl">
                    {totalPages}
                  </span>
                </div>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-2 border-earth-200 hover:bg-earth-50 hover:border-farm-400 disabled:opacity-50"
                >
                  Next
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
