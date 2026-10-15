"use client";

import React from "react";
import { AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

/**
 * ConfirmDialog — Dialogue de confirmation pour actions critiques Netix SIRH
 * Règle §3.6 : Sécurise les actions sensibles (clôture de paie, suppression, modification de contrat).
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const iconMap = {
    danger: (
      <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
      </div>
    ),
    warning: (
      <div className="w-10 h-10 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
      </div>
    ),
    primary: (
      <div className="w-10 h-10 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
        <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
      </div>
    ),
  };

  const buttonVariant = variant === "danger" ? "danger" : "primary";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} size="sm">
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            loading={loading}
            size="sm"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5 py-1">
        {iconMap[variant]}
        <div className="flex flex-col gap-1 text-left">
          <p className="text-sm text-[#334155] leading-relaxed">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
