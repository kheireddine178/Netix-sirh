import React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — État vide standard Netix SIRH
 * Règle §3.8 : Tout état sans données doit afficher une explication claire et une action possible.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center flex flex-col items-center justify-center min-h-[220px]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mb-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {icon || <FolderSearch className="w-6 h-6 text-[#94A3B8]" strokeWidth={1.5} />}
      </div>

      <h4 className="text-sm font-semibold text-[#0F172A] mb-1">{title}</h4>

      {description && (
        <p className="text-xs text-[#64748B] max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
