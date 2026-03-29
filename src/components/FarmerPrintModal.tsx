import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, X, FileText, Filter, Info } from "lucide-react";

interface FarmerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (filters: { barangay: string; gender: string; agency: string }) => void;
  isPrinting?: boolean;
  barangays: string[];
  agencies: string[];
}

export default function FarmerPrintModal({
  isOpen,
  onClose,
  onPrint,
  isPrinting = false,
  barangays,
  agencies
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
      <Card className="card-modern border-farm-200 w-full max-w-lg shadow-2xl overflow-hidden scale-in rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 p-8 border-b-2 border-farm-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-farm-200 rounded-xl shadow-inner">
                <Printer className="w-7 h-7 text-farm-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display font-bold text-earth-900 tracking-tight">Print Farmers Directory</CardTitle>
                <p className="text-sm text-earth-600 mt-1 font-medium">Customize your PDF report filters</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-farm-200 rounded-full transition-all duration-200 text-earth-400 hover:text-earth-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-1 gap-6">
            {/* Barangay Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-earth-800 flex items-center gap-2 px-1">
                <Filter className="w-4 h-4 text-farm-600" />
                Select Barangay
              </label>
              <div className="relative group">
                <select
                  value={filters.barangay}
                  onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
                  className="w-full bg-farm-50 border-2 border-farm-100 focus:border-farm-500 text-earth-900 rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-farm-200"
                >
                  <option value="all">All Barangays</option>
                  {barangays.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-earth-400 group-focus-within:text-farm-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-earth-800 flex items-center gap-2 px-1">
                  <Filter className="w-4 h-4 text-farm-600" />
                  Gender
                </label>
                <div className="relative group">
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full bg-farm-50 border-2 border-farm-100 focus:border-farm-500 text-earth-900 rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-farm-200"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-earth-400 group-focus-within:text-farm-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Agency Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-earth-800 flex items-center gap-2 px-1">
                  <Filter className="w-4 h-4 text-farm-600" />
                  Agency
                </label>
                <div className="relative group">
                  <select
                    value={filters.agency}
                    onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
                    className="w-full bg-farm-50 border-2 border-farm-100 focus:border-farm-500 text-earth-900 rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-farm-200"
                  >
                    <option value="all">All Agencies</option>
                    {agencies.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-earth-400 group-focus-within:text-farm-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-start gap-4 shadow-inner">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Info className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-emerald-900 font-medium leading-relaxed">
              The report will be generated in <span className="text-emerald-700 font-bold">Landscape A4</span> format and will only include <span className="text-emerald-700 font-bold">Active</span> farmers matching your selection.
            </p>
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPrinting}
              className="flex-1 h-14 border-2 border-earth-200 text-earth-700 hover:bg-earth-50 hover:text-earth-900 font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 h-14 bg-gradient-to-r from-farm-600 to-farm-700 hover:from-farm-500 hover:to-farm-600 text-white font-bold shadow-lg border-0 rounded-xl transition-all active:scale-95 group"
            >
              {isPrinting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="tracking-wide uppercase text-xs">Generating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="tracking-wide uppercase text-xs font-black">Generate PDF</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


