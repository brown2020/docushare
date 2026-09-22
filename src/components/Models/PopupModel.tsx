"use client";

import React, { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  extraCss?: string;
  title?: string;
}

export default function PopupModel({
  isOpen,
  onClose,
  children,
  extraCss,
  title = "Dialog",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (isOpen && !node.open) {
      node.showModal();
    } else if (!isOpen && node.open) {
      node.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !onClose) return;
    const handler = () => onClose();
    node.addEventListener("close", handler);
    return () => node.removeEventListener("close", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-auto p-0 backdrop:bg-black/40 ${extraCss ?? ""}`}
    >
      {children}
    </dialog>
  );
}
