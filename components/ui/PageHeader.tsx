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
 * PageHeader — Structure de haut de page Netix SIRH 2026
 * Style : Titre fort, typographie épurée, fil d'Ariane subtil, actions groupées.
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
    <div className={cn("flex flex-col gap-4 pb-6 border-b border-slate-200/80 mb-8", className)}>
      {/* Fil d'Ariane */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-slate-800 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-bold text-slate-700" : ""}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Titre + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
