import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
}

/**
 * Badge — Composant statut Netix SIRH 2026
 * Style : Pilule arrondie, micro-bordure translucide, pastille de statut avec halo.
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
    // Validé / Payé / Conforme
    success: "bg-[#E6F3EE] text-[#065F46] border-[#A7F3D0]",
    // Alerte / Échéance proche
    warning: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    // Erreur / Retard / Suppression
    danger: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    // Neutre / Brouillon
    neutral: "bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7]",
    // Brand / Actif / Netix
    brand: "bg-[#E6F3EE] text-[#0D3B2E] border-[#A7F3D0]",
  };

  const dotColors = {
    success: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    danger: "bg-[#EF4444]",
    neutral: "bg-[#A1A1AA]",
    brand: "bg-[#0D3B2E]",
  };

  const sizeStyles = {
    sm: "text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full gap-1",
    md: "text-xs font-bold tracking-tight px-2.5 py-0.5 rounded-full gap-1.5",
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
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
