"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, BookOpen, Calculator, FileText, HelpCircle, Book, ArrowRight } from "lucide-react";
import { GUIDE_POLES } from "../navigationData";
import { STATUTORY_RUBRIQUES } from "../rubriquesData";
import { DICO_DATA } from "../guideData";
import { FAQ_DATA } from "../guideData";
import { MODELES_DOCUMENTS } from "../modelesData";

export interface SearchSelection {
  targetId: string;
  subType?: "rubrique" | "dico" | "faq" | "modele" | "theme";
  subTarget?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: SearchSelection) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onSelect }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Unified Search Index
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { themes: [], rubriques: [], dico: [], faq: [], modeles: [] };

    // 1. Themes & Navigation Tools
    const allItems = GUIDE_POLES.flatMap((p) => p.items);
    const matchingThemes = allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.legalRefs || []).some((r) => r.toLowerCase().includes(q))
    ).slice(0, 5);

    // 2. Rubriques de paie
    const matchingRubriques = STATUTORY_RUBRIQUES.filter((r) => !r.g && (
      (r.r || "").toLowerCase().includes(q) ||
      (r.cat || "").toLowerCase().includes(q) ||
      (r.base || "").toLowerCase().includes(q) ||
      (r.rem || "").toLowerCase().includes(q)
    )).slice(0, 5);

    // 3. Dictionnaire
    const matchingDico = DICO_DATA.filter((d) =>
      d.term.toLowerCase().includes(q) ||
      d.def.toLowerCase().includes(q) ||
      d.ref.toLowerCase().includes(q)
    ).slice(0, 5);

    // 4. FAQ
    const matchingFaq = FAQ_DATA.filter((f) =>
      f.q.toLowerCase().includes(q) ||
      f.a.toLowerCase().includes(q) ||
      f.ref.toLowerCase().includes(q)
    ).slice(0, 5);

    // 5. Modèles
    const matchingModeles = MODELES_DOCUMENTS.filter((m) =>
      m.title.toLowerCase().includes(q) ||
      m.base.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q)
    ).slice(0, 4);

    return {
      themes: matchingThemes,
      rubriques: matchingRubriques,
      dico: matchingDico,
      faq: matchingFaq,
      modeles: matchingModeles,
    };
  }, [query]);

  const totalResults =
    results.themes.length +
    results.rubriques.length +
    results.dico.length +
    results.faq.length +
    results.modeles.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative border-b border-slate-100 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher dans tout le guide RH (Loi 90-11, CNAS, IRG, CDI, Panier, FAQ)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1 text-sm">
          {!query ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 text-base">Recherche Universelle dans le Guide RH</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tapez un numéro d'article (Art. 73), une prime (panier), un sigle (CNAS) ou un contrat (CDD).
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {["Simulateur", "Panier", "CNAS 9%", "Art. 73", "IEP", "Heures sup", "Règlement intérieur"].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setQuery(sug)}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="font-medium text-slate-700">Aucun résultat trouvé pour "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Vérifiez l'orthographe ou essayez un mot-clé plus court.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Themes & Navigation items */}
              {results.themes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Thématiques & Outils RH
                  </div>
                  {results.themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelect({ targetId: t.id, subType: "theme" });
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center gap-2">
                          <span>{t.label}</span>
                          {t.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                          {t.description}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Rubriques */}
              {results.rubriques.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                    Rubriques de Paie
                  </div>
                  {results.rubriques.map((r) => (
                    <button
                      key={r.n}
                      onClick={() => {
                        onSelect({ targetId: "suppl-rubriques", subType: "rubrique" });
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/60 border border-transparent hover:border-emerald-100 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                          <span>{r.r}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {r.cat}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {r.cot ? "Cotisable CNAS" : "Non Cotisable"} • {r.imp ? "Imposable IRG" : "Exonéré"} • {r.base}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Dico Terms */}
              {results.dico.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <Book className="w-3.5 h-3.5 text-blue-500" />
                    Dictionnaire & Acronymes DZ
                  </div>
                  {results.dico.map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelect({ targetId: "dico", subType: "dico", subTarget: d.term });
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/60 border border-transparent hover:border-blue-100 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 flex items-center gap-2">
                          <span>{d.term}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                            {d.cat === "algerie" ? "Acronyme DZ" : "Concept RH"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 truncate max-w-lg mt-0.5">
                          {d.def}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* FAQ */}
              {results.faq.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    Questions Fréquentes (FAQ)
                  </div>
                  {results.faq.map((f, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelect({ targetId: "faq", subType: "faq", subTarget: f.q });
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/60 border border-transparent hover:border-amber-100 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-amber-800">
                          {f.q}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-lg mt-0.5">
                          {f.a}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Modeles */}
              {results.modeles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    Modèles Juridiques & Contrats
                  </div>
                  {results.modeles.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelect({ targetId: "modeles", subType: "modele", subTarget: m.id });
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50/60 border border-transparent hover:border-purple-100 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-purple-700">
                          {m.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.base}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Navigation rapide</span>
            <span>•</span>
            <span>Indexé sur 13 thèmes, 47 rubriques, 48 définitions, 24 questions</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Appuyez sur</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold shadow-2xs">ESC</kbd>
            <span>pour fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
