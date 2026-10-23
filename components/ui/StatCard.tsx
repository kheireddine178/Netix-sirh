import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  badge?: {
    text: string;
    variant?: "success" | "warning" | "danger" | "neutral" | "brand";
  };
  className?: string;
}

/**
 * StatCard — Carte d'indicateur clé Netix SIRH 2026
 * Style : Rayon 16px (rounded-2xl), grands chiffres tabulaires haute lisibilité, micro-badge.
 */
export function StatCard({
  label,
  value,
  subtext,
  icon,
  trend,
  badge,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#F0EFEA] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-all duration-150 hover:border-[#E4E4E7]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#FAF9F8] border border-[#F0EFEA] text-[#0D3B2E] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="my-2.5">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#111827] tabular-nums">
          {value}
        </div>
      </div>

      {(subtext || trend || badge) && (
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#F0EFEA] text-xs">
          {subtext && <span className="text-[#71717A] truncate">{subtext}</span>}

          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0",
                trend.positive
                  ? "bg-[#E6F3EE] text-[#065F46] border border-[#A7F3D0]"
                  : "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
              )}
            >
              {trend.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}

          {badge && (
            <Badge variant={badge.variant || "neutral"} size="sm">
              {badge.text}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
