"use client";

import React, { useState, useMemo } from "react";
import { DICO_DATA, DicoItem } from "../guideData";
import { Search, Book, Scale, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function DicoView() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<"tous" | "algerie" | "international">("tous");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const alphabet = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    DICO_DATA.forEach((item) => {
      const first = item.term.trim().charAt(0).toUpperCase();
      if (first) letters.add(first);
    });
    return letters;
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return DICO_DATA.filter((item) => {
      if (cat !== "tous" && item.cat !== cat) return false;

      if (selectedLetter) {
        const first = item.term.trim().charAt(0).toUpperCase();
        if (first !== selectedLetter) return false;
      }

      if (!q) return true;
      const haystack = `${item.term} ${item.def} ${item.theme} ${item.ref}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search, cat, selectedLetter]);

  const countAlgerie = useMemo(() => DICO_DATA.filter((d) => d.cat === "algerie").length, []);
  const countInternational = useMemo(() => DICO_DATA.filter((d) => d.cat === "international").length, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Book className="w-3.5 h-3.5 text-indigo-600" />
              Glossaire Juridique & Métier
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dictionnaire & Sigles RH Algériens</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Répertoire de 48 termes spécialisés : acronymes officiels algériens (CNAS, IRG, SNMG, DAS, CIDTA) et concepts RH internationaux (GPEC, RPS, Turnover).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setCat("tous"); setSelectedLetter(null); setSearch(""); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                cat === "tous" && !selectedLetter && !search
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tous ({DICO_DATA.length})
            </button>
            <button
              onClick={() => { setCat("algerie"); setSelectedLetter(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                cat === "algerie"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              🇩🇿 Acronymes DZ ({countAlgerie})
            </button>
            <button
              onClick={() => { setCat("international"); setSelectedLetter(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                cat === "international"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              🌐 Concepts RH ({countInternational})
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar & Alphabet Index */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher un terme, un sigle, une loi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>
            <div className="text-xs font-medium text-slate-500 self-center">
              {filteredItems.length} {filteredItems.length > 1 ? "termes trouvés" : "terme trouvé"}
            </div>
          </div>

          {/* Alphabet Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 items-center">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedLetter === null
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tous
            </button>
            {alphabet.map((letter) => {
              const hasItems = availableLetters.has(letter);
              const isSelected = selectedLetter === letter;

              return (
                <button
                  key={letter}
                  disabled={!hasItems}
                  onClick={() => setSelectedLetter(isSelected ? null : letter)}
                  className={`w-7 h-7 text-xs font-bold rounded-md flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : hasItems
                      ? "text-slate-800 hover:bg-indigo-50 hover:text-indigo-600"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Terms Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">Aucun terme ne correspond aux critères</p>
          <p className="text-xs text-slate-400 mt-1">Essayez de réinitialiser la recherche ou le filtre alphabétique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => {
            const isDz = item.cat === "algerie";

            return (
              <div
                key={`${item.term}-${idx}`}
                className="bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.term}
                    </h3>
                    {isDz ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        DZ Acronyme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        Concept RH
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {item.def}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                  {item.theme && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.theme}</span>
                    </div>
                  )}
                  {item.ref && (
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Scale className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="tabular-nums text-[10.5px] truncate">{item.ref}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
