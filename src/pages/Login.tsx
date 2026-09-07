import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Users, AlertTriangle, LogIn, Eye, EyeOff } from "lucide-react";
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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
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
    const errors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      errors.username = "Username is required";
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
      await login(username, password);
      
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      
      // Show success message briefly before navigating
      setError(null);
      setFormSuccess("Sign in successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load remembered username on mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUsername");
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfaf7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="card-modern border-earth-400 animate-slide-up shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-farm-200 to-farm-300 border-b-2 border-earth-400 p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center gap-6 pt-2">
                {logos.map((logo) => (
                  <img
                    key={logo.name}
                    src={logo.url}
                    alt={logo.name
                      .replace("-logo.png", "")
                      .replace(/-/g, " ")
                      .toUpperCase()}
                    className="h-16 w-16 object-contain drop-shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 w-full bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-earth-300 shadow-sm">
                <div className="p-3 bg-farm-400 rounded-xl shadow-inner">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display font-bold text-earth-800 leading-tight">Department of Agriculture</CardTitle>
                  <CardDescription className="text-sm font-medium text-earth-600">
                    Farmers Record and Transactions System
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-800 animate-pulse">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {formSuccess && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-400 bg-emerald-100 px-4 py-3 text-sm text-emerald-800 animate-fade-in shadow-sm">
                <div className="w-5 h-5 mt-0.5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="font-medium">{formSuccess}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-earth-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    className={`input-modern h-11 pl-9 transition-colors ${
                      fieldErrors.username ? "border-red-400 bg-red-50" : ""
                    }`}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-earth-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input-modern h-11 pl-9 pr-11 transition-colors ${
                      fieldErrors.password ? "border-red-400 bg-red-50" : ""
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-300 hover:text-earth-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
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
                  className="w-4 h-4 rounded border-earth-400 cursor-pointer accent-farm-400"
                />
                <label htmlFor="rememberMe" className="text-sm text-earth-700 cursor-pointer">
                  Remember this account
                </label>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-farm-700 hover:text-farm-900 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="btn-farm w-full h-11 text-base font-semibold mt-6 hover:shadow-lg transition-all"
                disabled={isSubmitting || !username || !password}
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
        <div className="text-center mt-6 text-xs text-earth-200">
          <p>Farmers Record and Transactions System</p>
          <p className="mt-1">© City of Agriculture Office. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
