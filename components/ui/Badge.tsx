import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
}

/**
 * Badge — Composant statut Netix SIRH
 * Règle §3.2 : Vert / orange / rouge UNIQUEMENT pour exprimer un statut (badge, alerte). Jamais en décoration.
 */
export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    // Statut validé / payé / conforme
    success: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
    // Statut alerte / à surveiller / échéance proche
    warning: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    // Statut erreur / retard / suppression
    danger: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
    // Statut neutre / brouillon / archivé
    neutral: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    // Statut actif / en cours Netix
    brand: "bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]",
  };

  const dotColors = {
    success: "bg-[#16A34A]",
    warning: "bg-[#D97706]",
    danger: "bg-[#DC2626]",
    neutral: "bg-[#64748B]",
    brand: "bg-[#4F46E5]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 rounded gap-1 font-semibold",
    md: "text-xs px-2.5 py-0.5 rounded-md gap-1.5 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border select-none transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
