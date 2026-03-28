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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <Card className="bg-[#38261e] border-[#5a443a] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden scale-in rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-[#1a301a] to-[#2d5a3d] p-8 text-white border-b border-[#3a543a]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                <Printer className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display font-bold text-white tracking-tight">Print Farmers Directory</CardTitle>
                <p className="text-sm text-green-100/90 mt-1 font-medium">Customize your PDF report filters</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90"
            >
              <X className="w-6 h-6 text-white/80" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8 bg-[#38261e]">
          <div className="grid grid-cols-1 gap-6">
            {/* Barangay Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#eee8e6] flex items-center gap-2 px-1">
                <Filter className="w-4 h-4 text-[#809c80]" />
                Select Barangay
              </label>
              <div className="relative group">
                <select
                  value={filters.barangay}
                  onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
                  className="w-full bg-[#140d0a] border-2 border-[#5a443a] focus:border-[#4A7C59] text-white rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-[#a68e85] shadow-lg"
                >
                  <option value="all">All Barangays</option>
                  {barangays.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d0c0bb] group-focus-within:text-[#4A7C59] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#eee8e6] flex items-center gap-2 px-1">
                  <Filter className="w-4 h-4 text-[#809c80]" />
                  Gender
                </label>
                <div className="relative group">
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full bg-[#140d0a] border-2 border-[#5a443a] focus:border-[#4A7C59] text-white rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-[#a68e85] shadow-lg"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d0c0bb] group-focus-within:text-[#4A7C59] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Agency Filter */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#eee8e6] flex items-center gap-2 px-1">
                  <Filter className="w-4 h-4 text-[#809c80]" />
                  Agency
                </label>
                <div className="relative group">
                  <select
                    value={filters.agency}
                    onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
                    className="w-full bg-[#140d0a] border-2 border-[#5a443a] focus:border-[#4A7C59] text-white rounded-xl h-12 px-4 appearance-none transition-all cursor-pointer font-medium hover:border-[#a68e85] shadow-lg"
                  >
                    <option value="all">All Agencies</option>
                    {agencies.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d0c0bb] group-focus-within:text-[#4A7C59] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#140d0a]/60 p-5 rounded-2xl border border-[#5a443a]/40 flex items-start gap-4 shadow-inner">
            <div className="p-2 bg-[#1a301a]/40 rounded-lg">
              <Info className="w-5 h-5 text-[#809c80]" />
            </div>
            <p className="text-sm text-[#d0c0bb] font-medium leading-relaxed">
              The report will be generated in <span className="text-[#809c80] font-bold">Landscape A4</span> format and will only include <span className="text-[#809c80] font-bold">Active</span> farmers matching your selection.
            </p>
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPrinting}
              className="flex-1 h-14 border-2 border-[#5a443a] text-[#eee8e6] hover:bg-[#5a443a] hover:text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 h-14 bg-gradient-to-r from-[#2d5a3d] to-[#1e3d29] hover:from-[#4A7C59] hover:to-[#2d5a3d] text-white font-bold shadow-[0_8px_25px_rgba(0,0,0,0.4)] border-0 rounded-xl transition-all active:scale-95 group"
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


