"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Modal — Fenêtre modale accessible Netix SIRH
 * Règle §3.6 : Structure header / body / footer, touche Echap, backdrop soigné.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fermeture sur la touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full bg-white rounded-lg border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-150",
          sizeStyles[size],
          className
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-[#F1F5F9]">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="text-base font-semibold text-[#0F172A] leading-none">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#64748B] mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-sm text-[#334155]">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 px-5 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
