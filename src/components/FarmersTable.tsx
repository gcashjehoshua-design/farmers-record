import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Phone, MapPin, Sprout, RotateCcw } from "lucide-react";
import type { Farmer } from "@/types";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";

interface FarmersTableProps {
  farmers: Farmer[];
  onDelete?: (farmer: Farmer) => void;
  /** Optional comma-separated commodity labels per RSBSA (e.g. from import merge) */
  commoditySummaryByRsbsa?: Map<string, string>;
}

export default function FarmersTable({ farmers, onDelete, commoditySummaryByRsbsa }: FarmersTableProps) {
  const navigate = useNavigate();
  if (farmers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-farm-100 rounded-full mb-4">
          <Sprout className="w-10 h-10 text-farm-600" />
        </div>
        <p className="text-earth-700 font-semibold text-lg mb-2">No farmers found</p>
        <p className="text-earth-600 text-sm">Try adjusting your search filters</p>
      </div>
    );
  }

  const isInactiveFarmer = (farmer: Farmer) => farmer.isActive === false;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
            <th className="px-6 py-4 text-left text-sm font-bold text-earth-800 uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-earth-800 uppercase tracking-wider">Commodities</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-earth-800 uppercase tracking-wider">RSBSA Code</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-earth-800 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-earth-800 uppercase tracking-wider">Location</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-earth-800 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-farm-100">
          {farmers.map((farmer, index) => {
            const inactive = isInactiveFarmer(farmer);
            return (
              <tr
                key={farmer.rsbsaCode}
                onClick={() => navigate(`/farmers/${farmer.rsbsaCode}`)}
                className={`transition-all duration-200 hover:bg-farm-50/50 hover:shadow-sm cursor-pointer ${
                  index % 2 === 0 ? "bg-[#fffefb]" : "bg-farm-50/30"
                } ${inactive ? "opacity-75 grayscale-[0.3]" : ""}`}
              >
                <td className="px-6 py-5">
                  <div>
                    <span className={`text-base font-semibold block ${inactive ? "text-gray-600" : "text-earth-800"}`}>
                      {formatFarmerDisplayName(farmer)}
                      {inactive && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactive</span>}
                    </span>
                    {farmer.agency && (
                      <span className="text-xs text-earth-600 mt-1 flex items-center gap-1">
                        <Sprout className="w-3 h-3" />
                        {farmer.agency}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 max-w-[12rem] sm:max-w-xs">
                  <span className={`text-xs leading-snug ${inactive ? "text-gray-500" : "text-earth-700"}`}>
                    {commoditySummaryByRsbsa?.get(farmer.rsbsaCode) || "—"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`text-sm font-mono font-bold ${inactive ? "text-gray-500" : "text-earth-700"}`}>{farmer.rsbsaCode}</span>
                </td>
                <td className="px-6 py-5">
                  {farmer.phone ? (
                    <div className="flex items-center gap-2 text-sm text-earth-700">
                      <Phone className={`w-4 h-4 ${inactive ? "text-gray-400" : "text-farm-600"}`} />
                      <span className={`font-medium ${inactive ? "text-gray-500" : ""}`}>{farmer.phone}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-earth-500">-</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  {farmer.farmerAddress2 ? (
                    <div className="flex items-center gap-2 text-sm text-earth-700">
                      <MapPin className={`w-4 h-4 ${inactive ? "text-gray-400" : "text-harvest-600"}`} />
                      <span className={inactive ? "text-gray-500" : ""}>{farmer.farmerAddress2}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-earth-500">-</span>
                  )}
                </td>
                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`transition-all ${
                        inactive 
                          ? "bg-gray-300 text-gray-600 hover:bg-gray-400 hover:scale-105 active:scale-95 disabled:opacity-50" 
                          : "hover:scale-105 active:scale-95"
                      }`}
                      disabled={inactive}
                      onClick={() => navigate(`/farmers/${farmer.rsbsaCode}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      View/Edit
                    </Button>
                    {onDelete ? (
                      <Button
                        size="sm"
                        variant={inactive ? "secondary" : "destructive"}
                        className={`shadow-sm transition-all ${
                          inactive 
                            ? "bg-farm-300 text-white hover:bg-farm-400 hover:scale-105 active:scale-95" 
                            : "hover:scale-105 active:scale-95"
                        }`}
                        onClick={() => onDelete(farmer)}
                      >
                        {inactive ? (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reactivate
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Make Inactive
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
