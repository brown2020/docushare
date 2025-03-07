import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  extraCss?: string; // Accepts any valid React children
}

export default function PopupModel({
  isOpen,
  onClose,
  children,
  extraCss,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 backdrop-blur-sm bg-white/70 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-auto transform transition-transform duration-300 scale-95 ${extraCss}`}
      >
        {children}
      </div>
    </div>
  );
}
