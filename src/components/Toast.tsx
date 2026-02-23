import { useEffect, useState } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Toast = ({ type, message, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-emerald-800";
      case "error":
        return "text-red-800";
      case "info":
        return "text-blue-800";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-emerald-300";
      case "error":
        return "border-red-300";
      case "info":
        return "border-blue-300";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-emerald-600";
      case "error":
        return "text-red-600";
      case "info":
        return "text-blue-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className={`w-5 h-5 ${getIconColor()}`} />;
      case "error":
        return <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />;
      case "info":
        return <Info className={`w-5 h-5 ${getIconColor()}`} />;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border ${getBgColor()} ${getBorderColor()} shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      {getIcon()}
      <div className={`flex-1 ${getTextColor()} text-sm font-medium`}>{message}</div>
      <button
        onClick={() => setIsVisible(false)}
        className={`${getTextColor()} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
