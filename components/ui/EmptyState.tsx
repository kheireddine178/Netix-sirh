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
        "rounded-xl border border-dashed border-[#E4E4E7] bg-[#FAF9F8] p-8 text-center flex flex-col items-center justify-center min-h-[200px]",
        className
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-white border border-[#F0EFEA] text-[#0D3B2E] flex items-center justify-center mb-3 shadow-2xs">
        {icon || <FolderSearch className="w-5 h-5 text-[#A1A1AA]" />}
      </div>

      <h4 className="text-sm font-bold text-[#111827] mb-1">{title}</h4>

      {description && (
        <p className="text-xs text-[#71717A] max-w-sm mb-3.5 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
