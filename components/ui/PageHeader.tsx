import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — Structure standard de haut de page Netix SIRH
 * Règle §4.2 : Fil d'Ariane, Titre, Sous-titre court, et UNE action principale en haut à droite.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 border-b border-[#E2E8F0] mb-6", className)}>
      {/* Fil d'Ariane */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-[#64748B]">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-[#0F172A] transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-[#0F172A]" : ""}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Titre et zone d'action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[#64748B]">{subtitle}</p>}
        </div>

        {/* Boutons d'action (Règle §4.2 : un seul bouton indigo principal) */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {/* Zone optionnelle pour onglets ou filtres */}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
