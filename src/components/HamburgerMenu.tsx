import { Link as RouterLink, useLocation } from "react-router-dom";
import { supabaseUrl } from "@/lib/supabase";
import { Home, Users, Clipboard, UserPlus, History, X, UserCog, LogOut, Upload, FolderKanban } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LogoUrl {
  name: string;
  url: string;
}

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/farmers", label: "Farmers", icon: Users },
  { path: "/inactive-farmers", label: "Inactive Farmers", icon: Users, requiresAdmin: true },
  { path: "/import-farmers", label: "Import Farmers", icon: Upload },
  { path: "/record-transaction", label: "Transaction", icon: Clipboard },
  { path: "/transaction-history", label: "History", icon: History },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/add-farmer", label: "Add Farmer", icon: UserPlus },
  { path: "/users", label: "User Management", icon: UserCog, requiresAdmin: true },
];

const LOGOS_BUCKET = "logos";
const FALLBACK_LOGOS = [
  "agriculture-office-logo.png",
  "passi-city-logo.png",
  "palangga-passi-logo.png",
];

function getLogosPathPrefix(): string {
  return (import.meta.env.VITE_LOGOS_PATH_PREFIX as string) || "";
}

function buildPublicLogoUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${LOGOS_BUCKET}/${cleanPath}`;
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
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

  return (
    <div
      className={`fixed top-0 left-0 h-full w-80 bg-white z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
      }`}
      style={{ borderRight: "1px solid #e8dfd0" }}
    >
      {/* Header */}
      <div className="shrink-0 px-5 py-5 border-b border-earth-200/80 bg-[#faf8f5]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-display font-bold text-earth-800 tracking-tight">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-earth-600 hover:text-earth-800 hover:bg-earth-200/60 active:scale-95 transition-all duration-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-earth-600 mt-1">Quick access to all features</p>
      </div>

      {/* Nav - no onClick so menu stays open when navigating */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems
            .filter((item) => !("requiresAdmin" in item) || !item.requiresAdmin || user?.role === "admin")
            .map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-200 group ${
                  isActive
                    ? "bg-farm-100 text-farm-800 font-semibold shadow-sm"
                    : "text-earth-700 hover:bg-earth-100 hover:text-farm-700 hover:shadow-sm active:scale-[0.99]"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-all duration-200 ${
                    isActive
                      ? "bg-farm-200 text-farm-700"
                      : "bg-earth-100 text-earth-600 group-hover:bg-farm-100 group-hover:text-farm-600 group-hover:scale-105"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-farm-600 shrink-0" />
                )}
              </RouterLink>
            );
          })}
        </div>
      </nav>

      {/* Footer - all 3 logos + full system name + user info */}
      <div className="shrink-0 px-4 py-4 border-t border-earth-200/80 bg-[#faf8f5]">
        <div className="flex justify-center gap-2 mb-3">
          {logos.length > 0
            ? logos.map((logo) => (
                <img
                  key={logo.name}
                  src={logo.url}
                  alt={logo.name.replace(/-/g, " ").replace(".png", "")}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ))
            : [1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-12 rounded-lg bg-earth-100 animate-pulse" />
              ))}
        </div>
        <p className="text-xs font-semibold text-earth-800 text-center leading-tight mb-0.5">
          Farmers Record and Transactions System
        </p>
        <p className="text-xs text-earth-600 text-center mb-2">City of Passi Agriculture Office</p>

        {user && (
          <div className="mt-2 pt-2 border-t border-earth-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-col">
              <RouterLink to={`/users/${user.id}`} className="font-semibold text-earth-800 hover:text-farm-700 hover:underline" title="View my profile">{user.fullName}</RouterLink>
              <span className="text-earth-600 capitalize">{user.role}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-earth-300 text-earth-700 hover:bg-earth-100 hover:border-earth-400 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
