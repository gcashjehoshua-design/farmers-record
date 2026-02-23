import { useState } from "react";
import type { ToastType } from "@/components/Toast";

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);

  const showToast = (type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const success = (message: string, duration?: number) => showToast("success", message, duration);
  const error = (message: string, duration?: number) => showToast("error", message, duration);
  const info = (message: string, duration?: number) => showToast("info", message, duration);

  return { toasts, success, error, info };
};
