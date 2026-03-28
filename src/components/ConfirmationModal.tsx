import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      case 'info':
        return <Info className="w-8 h-8 text-sky-600" />;
      default:
        return <HelpCircle className="w-8 h-8 text-farm-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100';
      case 'info':
        return 'bg-sky-100';
      default:
        return 'bg-farm-100';
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-700 text-white';
      default:
        return 'bg-farm-600 hover:bg-farm-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <Card className="card-modern border-earth-200 w-full max-w-md shadow-2xl overflow-hidden scale-in">
        <CardContent className="p-0">
          <div className="p-8 text-center">
            <div className={`w-20 h-20 ${getIconBg()} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
              {getIcon()}
            </div>
            
            <h3 className="text-2xl font-display font-bold text-earth-800 mb-3">
              {title}
            </h3>
            
            <p className="text-earth-600 text-lg leading-relaxed mb-8">
              {message}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-12 border-2 border-earth-200 text-earth-700 hover:bg-earth-50 font-semibold"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 h-12 font-bold shadow-md border-0 ${getConfirmBtnClass()}`}
              >
                {isLoading ? "Processing..." : confirmText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
