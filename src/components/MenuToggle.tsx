import { Menu } from "lucide-react";

interface MenuToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MenuToggle({ isOpen, onToggle }: MenuToggleProps) {
  // When menu is open, the close button is inside the menu (no overlaying button)
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed top-6 left-6 z-50 p-3 bg-white rounded-xl shadow-lg border-2 border-earth-200 hover:border-farm-400 hover:bg-farm-50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label="Open menu"
    >
      <Menu className="w-6 h-6 text-earth-700" />
    </button>
  );
}
