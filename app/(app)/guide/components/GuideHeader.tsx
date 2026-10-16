"use client";

import React from "react";
import { Search, ChevronRight } from "lucide-react";

interface GuideHeaderProps {
  currentPoleTitle: string;
  currentViewLabel: string;
  onOpenSearch: () => void;
}

export function GuideHeader({ currentPoleTitle, currentViewLabel, onOpenSearch }: GuideHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Netix SIRH</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-400">Guide RH & Réglementaire</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-700">{currentPoleTitle}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-indigo-600 font-semibold">{currentViewLabel}</span>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Conformité Légale 2024–2025 · CIDTA & Loi 90-11
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Guide RH & Réglementaire
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Encyclopédie juridique, simulateur de paie en temps réel (Brut ➔ Net), catalogue des 47 rubriques et modèles officiels de contrats.
          </p>
        </div>

        {/* Global Search OmniBar Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80 shadow-xs transition-all text-slate-500 hover:text-slate-700 text-sm w-full md:w-72"
          >
            <Search className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="flex-1 text-left text-xs font-medium text-slate-400">
              Rechercher (loi, prime, FAQ)...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] tabular-nums font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              Ctrl K
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
