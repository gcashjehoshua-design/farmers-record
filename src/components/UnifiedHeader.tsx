import { Link as RouterLink, useLocation } from "react-router-dom";
import { supabaseUrl } from "@/lib/supabase";
import { Home, Users, Receipt, UserPlus, History } from "lucide-react";

interface LogoUrl {
  name: string;
  url: string;
}

const LOGOS_BUCKET = "logos";
const FALLBACK_LOGOS = [
  "passi-city-logo.png",
  "palangga-passi-logo.png",
  "agriculture-office-logo.png",
];

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/farmers", label: "Farmers", icon: Users },
  { path: "/record-transaction", label: "Transaction", icon: Receipt },
  { path: "/transaction-history", label: "History", icon: History },
  { path: "/add-farmer", label: "Add Farmer", icon: UserPlus },
];

function getLogosPathPrefix(): string {
  return (import.meta.env.VITE_LOGOS_PATH_PREFIX as string) || "";
}

function buildPublicLogoUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${LOGOS_BUCKET}/${cleanPath}`;
}

export default function UnifiedHeader() {
  const location = useLocation();
  // Build logo URLs directly without fetching - logos are static
  const logos: LogoUrl[] = (() => {
    const prefix = getLogosPathPrefix();
    const pathJoin = (p: string, n: string) => (p ? (p.endsWith("/") ? p + n : p + "/" + n) : n);
    return FALLBACK_LOGOS.map((name) => {
      const path = pathJoin(prefix, name);
      return {
        name: name,
        url: buildPublicLogoUrl(path),
      };
    });
  })();
  const isLoading = false;



  return (
    <div className="mb-8 space-y-4">
      {/* Header Section - Clean Card Design */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200/50 overflow-hidden">
        <div className="px-8 py-6">
          {/* Logos Row */}
          <div className="flex justify-center items-center gap-8 md:gap-12 mb-6">
            {isLoading ? (
              <div className="flex gap-8 md:gap-12">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 md:w-24 md:h-24 bg-earth-100 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              logos.map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center justify-center"
                >
                  <img
                    src={logo.url}
                    alt={logo.name
                      .replace("-logo.png", "")
                      .replace(/-/g, " ")
                      .toUpperCase()}
                    className="h-16 md:h-20 lg:h-24 object-contain"
                    onError={(e) => {
                      console.error(`Failed to load logo: ${logo.name}`, "URL:", logo.url);
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Cpath d='M12 2v2M12 20v2M2 12h2M20 12h2'/%3E%3C/svg%3E";
                      e.currentTarget.onerror = null;
                    }}
                  />
                </div>
              ))
            )}
          </div>

          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-earth-900">
              Farmers Record and Transactions System
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-earth-600">
              <span className="font-medium">City of Passi Agriculture Office</span>
              <span className="hidden sm:inline">•</span>
              <span>Modern Agriculture Management System of Passi City</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section - Clean Pill Design */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200 no-underline text-sm font-medium ${
                  isActive
                    ? "bg-farm-600 text-white shadow-md"
                    : "text-earth-700 hover:bg-earth-50 hover:text-farm-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </RouterLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
