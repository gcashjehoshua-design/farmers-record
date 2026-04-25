import { useMemo, useState } from "react";
import { useFarmers, useUpdateFarmer, useAllCommodities } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { formatFarmerDisplayName, formatCommoditySummary } from "@/lib/farmerDisplay";
import type { Farmer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, ArrowLeft, Search } from "lucide-react";
import FarmersTable from "@/components/FarmersTable";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import ConfirmationModal from "@/components/ConfirmationModal";

const ITEMS_PER_PAGE = 10;

export default function InactiveFarmers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const { data: allFarmers, isLoading, error } = useFarmers(true);
  const { data: allCommodities = [] } = useAllCommodities();
  const updateFarmer = useUpdateFarmer();
  const { toasts, success, error: showError } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [farmerToReactivate, setFarmerToReactivate] = useState<Farmer | null>(null);

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

  const inactiveFarmers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = (allFarmers || []).filter(f => f.isActive === false);
    
    if (!term) return base;

    return base.filter((farmer) => {
      const displayName = formatFarmerDisplayName(farmer).toLowerCase();
      const rsbsa = farmer.rsbsaCode.toLowerCase();
      const commodityText = (commoditySummaryByRsbsa.get(farmer.rsbsaCode) || "").toLowerCase();
      
      return (
        displayName.includes(term) ||
        rsbsa.includes(term) ||
        commodityText.includes(term) ||
        (farmer.phone && farmer.phone.toLowerCase().includes(term))
      );
    });
  }, [allFarmers, searchTerm, commoditySummaryByRsbsa]);

  const handleReactivateRequest = (farmer: Farmer) => {
    setFarmerToReactivate(farmer);
    setShowConfirmModal(true);
  };

  const confirmReactivate = async () => {
    if (!farmerToReactivate) return;
    const display = formatFarmerDisplayName(farmerToReactivate);
    try {
      await updateFarmer.mutateAsync({ rsbsaCode: farmerToReactivate.rsbsaCode, data: { isActive: true } });
      success(`${display} has been reactivated.`);
    } catch (e) {
      showError("Failed to reactivate farmer.");
    } finally {
      setShowConfirmModal(false);
      setFarmerToReactivate(null);
    }
  };

  const totalPages = Math.ceil(inactiveFarmers.length / ITEMS_PER_PAGE);
  const paginatedFarmers = inactiveFarmers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl shadow-lg">
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm mt-1">Only admins can access the inactive farmers list.</p>
      </div>
    );
  }

  if (error)
    return (
      <div className="animate-fade-in">
        <div className="p-6 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl shadow-lg">
          <p className="font-semibold">Error loading inactive farmers</p>
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
        onConfirm={confirmReactivate}
        title="Reactivate Farmer Profile?"
        message={`Would you like to reactivate the profile of ${farmerToReactivate ? formatFarmerDisplayName(farmerToReactivate) : "this farmer"}? This will make them visible in the directory again.`}
        confirmText="Yes, reactivate"
        cancelText="No, keep inactive"
        type="info"
        isLoading={updateFarmer.isPending}
      />
      
      {/* Header Section */}
      <div className="border-b-2 border-earth-200 bg-earth-50/90">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-100 rounded-2xl">
              <Users className="w-10 h-10 text-red-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-earth-800">
                Inactive Farmers
              </h1>
              <p className="text-base md:text-lg text-earth-700">
                Manage inactive farmer profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 animate-slide-up">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search inactive farmers by name, RSBSA, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-modern pl-12 h-14 text-base"
              />
            </div>
          </div>
        </div>

        <Card className="card-modern border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Inactive Farmers</p>
                  <p className="text-3xl font-bold text-red-600">
                    {inactiveFarmers.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern border-red-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600"></div>
                <p className="text-gray-600 font-medium mt-6 text-lg">Loading inactive farmers...</p>
              </div>
            ) : (
              <FarmersTable
                farmers={paginatedFarmers}
                onDelete={handleReactivateRequest}
                commoditySummaryByRsbsa={commoditySummaryByRsbsa}
              />
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {inactiveFarmers.length > 0 && totalPages > 1 && (
          <Card className="card-modern border-red-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="hover:scale-105 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="flex items-center gap-3 font-semibold">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="hover:scale-105 active:scale-95"
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
