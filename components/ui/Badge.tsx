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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    // Alerte / Échéance proche
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
    // Erreur / Retard / Suppression
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
    // Neutre / Brouillon
    neutral: "bg-slate-100/80 text-slate-600 border-slate-200",
    // Brand / Actif / Netix
    brand: "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-[0_0_8px_rgba(79,70,229,0.1)]",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-slate-400",
    brand: "bg-indigo-600",
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
