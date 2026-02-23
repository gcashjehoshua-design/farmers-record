import { Link as RouterLink, useLocation } from "react-router-dom";
import { Home, Users, Receipt, UserPlus, History } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/farmers", label: "Farmers", icon: Users },
  { path: "/record-transaction", label: "Transaction", icon: Receipt },
  { path: "/transaction-history", label: "History", icon: History },
  { path: "/add-farmer", label: "Add Farmer", icon: UserPlus },
];

export default function FarmersRecordNav() {
  const location = useLocation();

  return (
    <nav className="relative overflow-hidden rounded-2xl shadow-farm border-2 border-earth-200 mb-6 bg-gradient-to-r from-farm-50 via-earth-50 to-harvest-50">
      <div className="absolute inset-0 opacity-30 bg-pattern-farm" />
      
      <div className="relative z-10 px-6 py-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <RouterLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 no-underline ${
                isActive
                  ? "bg-farm-200/80 text-farm-800 font-semibold shadow-sm border-2 border-farm-300"
                  : "bg-[#fffefb]/80 text-earth-700 hover:bg-[#fffefb] hover:border-earth-300 border-2 border-earth-200 hover:text-farm-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </RouterLink>
          );
        })}
      </div>
    </nav>
  );
}
