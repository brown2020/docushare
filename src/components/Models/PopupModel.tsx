import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
    extraCss?: string; // Accepts any valid React children
}

export default function PopupModel({ isOpen, onClose, children, extraCss }: ModalProps) {

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && onClose) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="absolute h-full w-full flex justify-center items-center z-[20000] top-0 max-sm:px-[30px] right-0 bg-black bg-opacity-40">
            <div onClick={(e) => e.stopPropagation()} className={`relative bg-white rounded-lg shadow-lg mx-4 overflow-auto transform transition-transform duration-300 scale-95 ${extraCss}`}>
                {children}
            </div>
        </div>
    );
}