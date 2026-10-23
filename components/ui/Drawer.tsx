"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
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
 * Drawer — Volet latéral coulissant Netix SIRH
 * Règle §3.6 : Permet l'affichage rapide des dossiers collaborateurs ou fiches de paie sans rupture de contexte.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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
    lg: "max-w-xl",
    xl: "max-w-2xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-[#111827]/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className={cn(
          "w-full h-full bg-white border-l border-[#F0EFEA] shadow-2xl flex flex-col text-left animate-in slide-in-from-right duration-200",
          sizeStyles[size],
          className
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#F0EFEA]">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="text-base font-bold text-[#111827] leading-none">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#71717A] mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#FAF9F8] transition-colors cursor-pointer"
            aria-label="Fermer le panneau latéral"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-[#111827]">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="p-3.5 px-5 bg-[#FAF9F8] border-t border-[#F0EFEA] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
