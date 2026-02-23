import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  /**
   * Optional label shown next to the back icon.
   * Defaults to "Back".
   */
  label?: string;
  /**
   * Optional fallback path if there is no history.
   * Defaults to "/".
   */
  fallbackPath?: string;
  /**
   * If provided, will navigate directly to this path instead of using browser history.
   * This prevents navigation loops.
   */
  directPath?: string;
  /**
   * Additional classes for the button.
   */
  className?: string;
};

/**
 * Accessible back button that navigates to a specific path or goes back in history.
 *
 * Designed with larger touch target and clear label for older users.
 * Use directPath to avoid navigation loops.
 */
export function BackButton({
  label = "Back",
  fallbackPath = "/",
  directPath,
  className,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (directPath) {
      // Use direct navigation to avoid history loops
      navigate(directPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-xl border border-gray-300 bg-white/90 text-gray-800 hover:bg-gray-100 hover:border-gray-400 text-sm px-4 py-2 ${className ?? ""}`}
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-semibold">{label}</span>
    </Button>
  );
}

