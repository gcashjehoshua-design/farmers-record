import { supabaseUrl } from "@/lib/supabase";

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

function getLogosPathPrefix(): string {
  return (import.meta.env.VITE_LOGOS_PATH_PREFIX as string) || "";
}

/** Build public URL manually - more reliable than getPublicUrl for some Supabase setups */
function buildPublicLogoUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${LOGOS_BUCKET}/${cleanPath}`;
}

export default function LogoHeader() {
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
    <header className="relative overflow-hidden rounded-2xl shadow-farm-lg border-2 border-earth-200 mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-earth-100 via-[#fffefb] to-farm-100" />
      <div className="absolute inset-0 opacity-20 bg-pattern-farm" />
      <div className="relative z-10 py-6 px-6 flex flex-col items-center">
          {/* Logos Section */}
          <div className="w-full flex justify-center gap-6 mb-3 sm:gap-8 md:gap-12 flex-wrap">
            {isLoading ? (
              <div className="flex gap-6 sm:gap-8 md:gap-12">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-earth-200 rounded-lg animate-pulse"
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
                    className="h-16 sm:h-20 md:h-24 object-contain drop-shadow-md hover:drop-shadow-lg transition-all duration-300"
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
          <div className="text-center border-t-2 border-earth-200/60 pt-4 mt-2 w-full max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-earth-800">
              Farmers Record and Transactions System
            </h1>
            <p className="text-sm sm:text-base text-earth-700 mt-2 font-semibold">
              City of Passi Agriculture Office
            </p>
            <p className="text-xs sm:text-sm text-earth-600 mt-1">
              Modern Agriculture Management System of Passi City
            </p>
          </div>
        </div>
    </header>
  );
}
