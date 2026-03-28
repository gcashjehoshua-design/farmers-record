import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, X, FileText, Filter, Info } from "lucide-react";
import { PASSI_BARANGAYS } from "@/constants/barangays";

interface FarmerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (filters: { barangay: string; gender: string; agency: string }) => void;
  isPrinting?: boolean;
}

export default function FarmerPrintModal({
  isOpen,
  onClose,
  onPrint,
  isPrinting = false
}: FarmerPrintModalProps) {
  const [filters, setFilters] = useState({
    barangay: 'all',
    gender: 'all',
    agency: 'all'
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    onPrint(filters);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <Card className="card-modern border-earth-200 w-full max-w-lg shadow-2xl overflow-hidden scale-in">
        <CardHeader className="bg-gradient-to-r from-farm-600 to-farm-800 p-6 text-white border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-display font-bold text-white">Print Farmers Directory</CardTitle>
                <p className="text-sm text-farm-100/90 mt-0.5 font-medium">Select filters for the PDF report</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6 bg-earth-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barangay Filter */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-earth-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-farm-600" />
                Barangay
              </label>
              <select
                value={filters.barangay}
                onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
                className="input-modern w-full bg-white border-2 border-earth-200 focus:border-farm-500 transition-all h-11"
              >
                <option value="all">All Barangays</option>
                {PASSI_BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-earth-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-farm-600" />
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="input-modern w-full bg-white border-2 border-earth-200 focus:border-farm-500 transition-all h-11"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Agency Filter */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-earth-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-farm-600" />
                Agency / Organization
              </label>
              <select
                value={filters.agency}
                onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
                className="input-modern w-full bg-white border-2 border-earth-200 focus:border-farm-500 transition-all h-11"
              >
                <option value="all">All Agencies</option>
                <option value="DA">DA</option>
                <option value="DAR">DAR</option>
                <option value="BFAR">BFAR</option>
                <option value="LGU">LGU</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="bg-farm-50/50 p-4 rounded-xl border border-farm-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-farm-600 mt-0.5" />
            <p className="text-sm text-farm-800 leading-relaxed">
              The report will be generated in <strong>Landscape A4</strong> format and will only include <strong>Active</strong> farmers matching these filters.
            </p>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPrinting}
              className="flex-1 h-12 border-2 border-earth-200 text-earth-700 hover:bg-earth-100 font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 h-12 bg-farm-700 hover:bg-farm-800 text-white font-bold shadow-lg border-0 rounded-xl"
            >
              {isPrinting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generate PDF
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


