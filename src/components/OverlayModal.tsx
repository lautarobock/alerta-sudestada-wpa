"use client";

import { useEffect, type ReactNode } from "react";

export function OverlayIconButton({
    label,
    onClick,
    badge,
    children,
}: {
    label: string;
    onClick: () => void;
    badge?: "alert" | "critical" | null;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative p-2 rounded-lg text-gray-700 bg-white/80 hover:bg-white border border-black/5 shadow-sm transition-colors"
            aria-label={label}
            title={label}
        >
            {children}
            {badge && (
                <span
                    className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                        badge === "critical" ? "bg-red-500" : "bg-orange-500"
                    }`}
                    aria-hidden="true"
                />
            )}
        </button>
    );
}

export function OverlayModal({
    title,
    wide,
    onClose,
    children,
}: {
    title: string;
    wide?: boolean;
    onClose: () => void;
    children: ReactNode;
}) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? "max-w-4xl" : "max-w-2xl"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors text-2xl font-bold leading-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
                <div className="p-4 sm:p-6">{children}</div>
            </div>
        </div>
    );
}
