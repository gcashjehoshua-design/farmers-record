import { Link as RouterLink, useLocation } from "react-router-dom";
import { Home, Users, Clipboard, UserPlus, History } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/farmers", label: "Farmers", icon: Users },
  { path: "/record-transaction", label: "Transaction", icon: Clipboard },
  { path: "/transaction-history", label: "History", icon: History },
  { path: "/add-farmer", label: "Add Farmer", icon: UserPlus },
];

export default function QuickActions() {
  const location = useLocation();

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-earth-200 p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-pattern-farm" />
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
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
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </RouterLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
