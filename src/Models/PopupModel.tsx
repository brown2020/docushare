import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
    extraCss?: string; // Accepts any valid React children
}

export default function PopupModel({ isOpen, onClose, children, extraCss }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="absolute h-full w-full flex justify-center items-center z-50 top-0 right-0 bg-black bg-opacity-40">
            <div onClick={(e) => e.stopPropagation()} className={`relative bg-white rounded-lg shadow-lg p-6 mx-4 overflow-auto transform transition-transform duration-300 scale-95 ${extraCss}`}>
                {children}
            </div>
        </div>
    );
}