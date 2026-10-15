"use client";

import React, { useMemo } from "react";
import { GUIDE_HTML_CONTENT } from "../guideData";
import { Scale, Printer, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LegalThemeViewProps {
  themeId: string;
  title: string;
  badge?: string;
  legalRefs?: string[];
  description: string;
  onNavigateToSimulator?: () => void;
}

export function LegalThemeView({
  themeId,
  title,
  badge,
  legalRefs,
  description,
  onNavigateToSimulator,
}: LegalThemeViewProps) {
  const rawHtml = GUIDE_HTML_CONTENT[themeId] || "";

  // Strip outdated scripts or legacy simulator DOM from theme1 if present
  const cleanedHtml = useMemo(() => {
    let html = rawHtml;
    if (themeId === "theme1") {
      const parts = html.split('<div class="panel" style="margin-top:16px">');
      html = parts[0] || html;
    }
    // Remove inline scripts for security and SSR purity
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    return html;
  }, [rawHtml, themeId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Theme Hero Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                {badge || "Droit Social DZ"}
              </span>
              {legalRefs && legalRefs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {legalRefs.map((ref, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <Scale className="w-3 h-3 text-slate-500" />
                      {ref}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">{description}</p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {themeId === "theme1" && onNavigateToSimulator && (
              <Button
                variant="primary"
                onClick={onNavigateToSimulator}
                className="gap-2 shadow-xs text-xs font-semibold"
              >
                <span>Ouvrir le Simulateur Brut ➔ Net</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-medium"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Styled Theme HTML Container */}
      <div className="netix-legal-content bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div
          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
          className="prose prose-slate max-w-none 
            [&_.panel]:mb-8 [&_.panel]:p-6 [&_.panel]:rounded-xl [&_.panel]:border [&_.panel]:border-slate-200/70 [&_.panel]:bg-[#FAFBFD]
            [&_.panel-kicker]:text-xs [&_.panel-kicker]:font-bold [&_.panel-kicker]:text-indigo-600 [&_.panel-kicker]:uppercase [&_.panel-kicker]:tracking-wider [&_.panel-kicker]:mb-1
            [&_.panel-title]:text-lg [&_.panel-title]:font-bold [&_.panel-title]:text-slate-900 [&_.panel-title]:mb-2
            [&_.panel-text]:text-sm [&_.panel-text]:text-slate-600 [&_.panel-text]:leading-relaxed
            [&_.panel-note]:mt-3 [&_.panel-note]:p-3 [&_.panel-note]:rounded-lg [&_.panel-note]:bg-white [&_.panel-note]:border [&_.panel-note]:border-slate-200/80 [&_.panel-note]:text-xs [&_.panel-note]:text-slate-600
            [&_.grid-2]:grid [&_.grid-2]:grid-cols-1 md:[&_.grid-2]:grid-cols-2 [&_.grid-2]:gap-4 [&_.grid-2]:my-6
            [&_.rh-card]:p-5 [&_.rh-card]:rounded-xl [&_.rh-card]:border [&_.rh-card]:border-slate-200/80 [&_.rh-card]:bg-white [&_.rh-card]:shadow-2xs
            [&_.rh-card_h3]:text-sm [&_.rh-card_h3]:font-bold [&_.rh-card_h3]:text-slate-900 [&_.rh-card_h3]:mb-3 [&_.rh-card_h3]:flex [&_.rh-card_h3]:items-center [&_.rh-card_h3]:gap-1.5
            [&_.rh-card_ul]:text-xs [&_.rh-card_ul]:text-slate-600 [&_.rh-card_ul]:space-y-2 [&_.rh-card_ul]:list-disc [&_.rh-card_ul]:pl-4
            [&_.formula-grid]:grid [&_.formula-grid]:grid-cols-1 sm:[&_.formula-grid]:grid-cols-2 lg:[&_.formula-grid]:grid-cols-4 [&_.formula-grid]:gap-3 [&_.formula-grid]:my-4
            [&_.formula]:p-3.5 [&_.formula]:rounded-xl [&_.formula]:border [&_.formula]:border-indigo-100 [&_.formula]:bg-indigo-50/40 [&_.formula]:text-xs
            [&_.formula_strong]:block [&_.formula_strong]:font-bold [&_.formula_strong]:text-indigo-950 [&_.formula_strong]:mb-1
            [&_.formula_span]:text-slate-600 [&_.formula_span]:leading-relaxed
            [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-3
            [&_table_th]:py-2.5 [&_table_th]:px-3 [&_table_th]:border-b [&_table_th]:border-slate-200 [&_table_th]:bg-slate-50 [&_table_th]:text-slate-700 [&_table_th]:font-semibold
            [&_table_td]:py-2.5 [&_table_td]:px-3 [&_table_td]:border-b [&_table_td]:border-slate-100 [&_table_td]:text-slate-700
            [&_.alert]:p-4 [&_.alert]:rounded-xl [&_.alert]:text-xs [&_.alert]:my-4 [&_.alert]:leading-relaxed
            [&_.alert-red]:bg-rose-50 [&_.alert-red]:border [&_.alert-red]:border-rose-200 [&_.alert-red]:text-rose-900
            [&_.alert-blue]:bg-indigo-50 [&_.alert-blue]:border [&_.alert-blue]:border-indigo-200 [&_.alert-blue]:text-indigo-900
            [&_.steps]:space-y-3 [&_.step]:p-3 [&_.step]:rounded-lg [&_.step]:bg-slate-50 [&_.step]:border [&_.step]:border-slate-200/60
            [&_.step_h3]:text-xs [&_.step_h3]:font-bold [&_.step_h3]:text-slate-900 [&_.step_h3]:mb-1
            [&_.step_p]:text-xs [&_.step_p]:text-slate-600"
        />
      </div>
    </div>
  );
}
