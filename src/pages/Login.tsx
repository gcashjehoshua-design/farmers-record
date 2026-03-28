import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail, AlertTriangle, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabaseUrl } from "@/lib/supabase";

interface LogoUrl {
  name: string;
  url: string;
}

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const logos: LogoUrl[] = (() => {
    const prefix = getLogosPathPrefix();
    const pathJoin = (p: string, n: string) =>
      p ? (p.endsWith("/") ? p + n : p + "/" + n) : n;
    return FALLBACK_LOGOS.map((name) => {
      const path = pathJoin(prefix, name);
      return {
        name,
        url: buildPublicLogoUrl(path),
      };
    });
  })();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      errors.email = "Username is required";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="card-modern border-farm-200 animate-slide-up shadow-lg">
          <CardHeader className="bg-gradient-to-b from-farm-50 to-farm-100 border-b-2 border-farm-200">
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center gap-4">
                {logos.map((logo) => (
                  <img
                    key={logo.name}
                    src={logo.url}
                    alt={logo.name
                      .replace("-logo.png", "")
                      .replace(/-/g, " ")
                      .toUpperCase()}
                    className="h-12 w-12 object-contain drop-shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 bg-farm-100 rounded-xl">
                  <Lock className="w-6 h-6 text-farm-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display">Department of Agriculture</CardTitle>
                  <CardDescription className="text-sm">
                    Farmers Record and Transactions System
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-pulse">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    className={`input-modern h-11 pl-9 transition-colors ${
                      fieldErrors.email ? "border-red-300 bg-red-50" : ""
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input-modern h-11 pl-9 pr-11 transition-colors ${
                      fieldErrors.password ? "border-red-300 bg-red-50" : ""
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-earth-300 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-earth-700 cursor-pointer">
                  Remember this account
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="btn-farm w-full h-11 text-base font-semibold mt-6 hover:shadow-lg transition-all"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-earth-600">
          <p>Farmers Record and Transactions System</p>
          <p className="mt-1">© 2026 Passi City Agriculture Office</p>
        </div>
      </div>
    </div>
  );
}

