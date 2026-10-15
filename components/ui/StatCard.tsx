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
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="my-3">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
      </div>

      {(subtext || trend || badge) && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          {subtext && <span className="text-slate-500 truncate">{subtext}</span>}

          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
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
