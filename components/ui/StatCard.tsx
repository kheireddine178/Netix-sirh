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
 * StatCard — Carte d'indicateur clé Netix SIRH
 * Règle §3.3 & §3.6 : Montants en tabular-nums, icône discrète, pas de couleurs vives décoratives.
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
        "rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex flex-col justify-between transition-all duration-150 hover:border-[#CBD5E1]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="my-2.5">
        <div className="text-2xl font-bold tracking-tight text-[#0F172A] tabular-nums">
          {value}
        </div>
      </div>

      {(subtext || trend || badge) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
          {trend ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 font-semibold tabular-nums",
                trend.positive ? "text-[#15803D]" : "text-[#B91C1C]"
              )}
            >
              {trend.positive ? (
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              <span>{trend.value}</span>
            </div>
          ) : badge ? (
            <Badge variant={badge.variant || "neutral"} size="sm">
              {badge.text}
            </Badge>
          ) : (
            <span className="text-[#94A3B8]">{subtext}</span>
          )}

          {trend && subtext && <span className="text-[#94A3B8] truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
