"use client";

import React, { useState, useMemo } from "react";
import { STATUTORY_RUBRIQUES } from "../rubriquesData";
import { Search, Filter, ShieldCheck, FileSpreadsheet, Info, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function RubriquesView() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "cot_imp" | "panier" | "exonere" | "retenues">("all");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return STATUTORY_RUBRIQUES.filter((item) => {
      if (item.g) return true; // keep groups for structure

      // Filter by type
      if (filterType === "cot_imp" && (!item.cot || !item.imp)) return false;
      if (filterType === "panier" && !(!item.cot && item.imp)) return false;
      if (filterType === "exonere" && (item.cot || item.imp || item.cat?.includes("Retenue") || item.cat?.includes("Cotisation"))) return false;
      if (filterType === "retenues" && !item.cat?.includes("Retenue") && !item.cat?.includes("Cotisation") && !item.cat?.includes("Retenues")) return false;

      // Filter by text search
      if (!q) return true;
      const haystack = `${item.r || ""} ${item.cat || ""} ${item.base || ""} ${item.rem || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search, filterType]);

  // Clean groups that have no matching children
  const displayRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredItems.length; i++) {
      const current = filteredItems[i];
      if (current.g) {
        // Peek forward to see if there is at least one non-group item before next group
        let hasChildren = false;
        for (let j = i + 1; j < filteredItems.length; j++) {
          if (filteredItems[j].g) break;
          hasChildren = true;
          break;
        }
        if (hasChildren) rows.push(current);
      } else {
        rows.push(current);
      }
    }
    return rows;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const nonGroups = STATUTORY_RUBRIQUES.filter((r) => !r.g);
    const cotisables = nonGroups.filter((r) => r.cot).length;
    const imposables = nonGroups.filter((r) => r.imp).length;
    const exonerees = nonGroups.filter((r) => !r.cot && !r.imp && !r.cat?.includes("Retenue") && !r.cat?.includes("Cotisation")).length;
    return { total: nonGroups.length, cotisables, imposables, exonerees };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              Référentiel Salarial & Réglementaire
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catalogue des Rubriques de Paie DZ</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Nomenclature complète des 47 éléments de rémunération, indemnités et retenues avec statut CNAS (Ord. 95-01) et traitement fiscal IRG (CIDTA Art. 104).
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{stats.total}</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 text-center">
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block">Cotisables</span>
              <span className="text-lg font-bold text-emerald-800 tabular-nums">{stats.cotisables}</span>
            </div>
            <div className="bg-indigo-50/60 border border-indigo-200/60 rounded-xl p-3 text-center">
              <span className="text-xs font-medium text-indigo-700 uppercase tracking-wider block">Imposables</span>
              <span className="text-lg font-bold text-indigo-800 tabular-nums">{stats.imposables}</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-center">
              <span className="text-xs font-medium text-amber-700 uppercase tracking-wider block">Exonérées</span>
              <span className="text-lg font-bold text-amber-800 tabular-nums">{stats.exonerees}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher une rubrique, loi (Ord. 95-01, Loi 90-11)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                Toutes ({stats.total})
              </button>
              <button
                onClick={() => setFilterType("cot_imp")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "cot_imp"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                Cotisable + Imposable ({stats.cotisables})
              </button>
              <button
                onClick={() => setFilterType("panier")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "panier"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                }`}
              >
                Non Cotisable / Imposable (Panier)
              </button>
              <button
                onClick={() => setFilterType("exonere")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "exonere"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60"
                }`}
              >
                Exonérées ({stats.exonerees})
              </button>
              <button
                onClick={() => setFilterType("retenues")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "retenues"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                Retenues (4)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-14 text-center">N°</th>
                <th className="py-3.5 px-4 min-w-[220px]">Rubrique / Libellé</th>
                <th className="py-3.5 px-4 w-36 text-center">Cotisable CNAS</th>
                <th className="py-3.5 px-4 w-36 text-center">Imposable IRG</th>
                <th className="py-3.5 px-4 min-w-[180px]">Base Légale</th>
                <th className="py-3.5 px-4 min-w-[260px]">Remarques & Modalités</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Aucune rubrique ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                displayRows.map((item, idx) => {
                  if (item.g) {
                    return (
                      <tr key={`group-${idx}`} className="bg-slate-50/90 font-semibold text-slate-800">
                        <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-indigo-900 border-t border-b border-slate-200/60">
                          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                          {item.g}
                        </td>
                      </tr>
                    );
                  }

                  const isCot = item.cot === true;
                  const isImp = item.imp === true;
                  const is10Pct = item.rem?.includes("10%");

                  return (
                    <tr
                      key={`rubrique-${item.n}`}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Number */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 font-medium">
                        {item.n?.toString().padStart(2, "0")}
                      </td>

                      {/* Rubrique & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.r}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.cat}</div>
                      </td>

                      {/* Cotisable CNAS Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isCot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Oui (9%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            Non
                          </span>
                        )}
                      </td>

                      {/* Imposable IRG Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {is10Pct ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Libératoire 10%
                          </span>
                        ) : isImp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            Oui (Barème)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            Exonéré
                          </span>
                        )}
                      </td>

                      {/* Legal Reference */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                          {item.base || "Réglementation"}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed">
                        {item.rem}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Affichage de <strong className="text-slate-800">{displayRows.filter((r) => !r.g).length}</strong> rubriques sur {stats.total}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Références juridiques conformes au JORADP et aux circulaires DGI 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}
