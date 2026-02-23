import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarmers, useDeleteFarmer } from "@/hooks/useApi";
import type { Farmer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, ArrowLeft, Users, TrendingUp } from "lucide-react";
import FarmersTable from "@/components/FarmersTable";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

const ITEMS_PER_PAGE = 10;

export default function FarmersList() {
  const navigate = useNavigate();
  const { data: farmers, isLoading, error } = useFarmers();
  const deleteFarmer = useDeleteFarmer();
  const { toasts, success, error: showError } = useToast();

  const handleDelete = async (farmer: Farmer) => {
    if (!window.confirm(`Delete ${farmer.fullName || "this farmer"}?`)) return;
    try {
      await deleteFarmer.mutateAsync(farmer.id);
      success(`${farmer.fullName} has been deleted.`);
    } catch (e) {
      showError("Failed to delete farmer.");
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [selectedOrganization, setSelectedOrganization] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const allBarangays = useMemo(() => {
    const set = new Set<string>();
    (farmers || []).forEach((farmer) => {
      if (farmer.barangay) {
        set.add(farmer.barangay);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farmers]);

  const allOrganizations = useMemo(() => {
    const set = new Set<string>();
    (farmers || []).forEach((farmer) => {
      if (farmer.organization) {
        set.add(farmer.organization);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farmers]);

  const filteredFarmers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const base = (farmers || []).filter((farmer) => {
      const matchesSearch =
        farmer.fullName.toLowerCase().includes(term) ||
        (farmer.phone && farmer.phone.includes(searchTerm));
      const matchesBarangay =
        selectedBarangay === "all" ||
        !selectedBarangay ||
        farmer.barangay === selectedBarangay;
      const matchesOrganization =
        selectedOrganization === "all" ||
        !selectedOrganization ||
        farmer.organization === selectedOrganization;
      return matchesSearch && matchesBarangay && matchesOrganization;
    });

    // Sort by organization, then barangay, then name for easier browsing
    return base.sort((a, b) => {
      const orgA = a.organization || "";
      const orgB = b.organization || "";
      if (orgA !== orgB) {
        return orgA.localeCompare(orgB);
      }
      const barangayA = a.barangay || "";
      const barangayB = b.barangay || "";
      if (barangayA !== barangayB) {
        return barangayA.localeCompare(barangayB);
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [farmers, searchTerm, selectedBarangay, selectedOrganization]);

  const totalPages = Math.ceil(filteredFarmers.length / ITEMS_PER_PAGE);
  const paginatedFarmers = filteredFarmers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
    <div className="min-h-screen animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}
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
                placeholder="Search by full name or phone number..."
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
                Filter by Organization:
              </label>
              <select
                value={selectedOrganization}
                onChange={(e) => {
                  setSelectedOrganization(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-modern w-full sm:w-64"
              >
                <option value="all">All organizations</option>
                {allOrganizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => navigate("/add-farmer")}
              className="btn-farm h-14 px-8 text-base w-full lg:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Farmer
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
              <FarmersTable farmers={paginatedFarmers} onDelete={handleDelete} />
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
