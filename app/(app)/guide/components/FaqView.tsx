"use client";

import React, { useState, useMemo } from "react";
import { FAQ_DATA, FAQItem } from "../guideData";
import { Search, HelpCircle, ChevronDown, ChevronUp, Scale, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function FaqView() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("tous");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true }); // first item open by default

  const categories = [
    { id: "tous", label: "Toutes les questions", count: FAQ_DATA.length },
    { id: "contrat", label: "Contrat de travail", count: FAQ_DATA.filter((f) => f.cat === "contrat").length },
    { id: "paie", label: "Paie & Rémunération", count: FAQ_DATA.filter((f) => f.cat === "paie").length },
    { id: "conges", label: "Congés & Absences", count: FAQ_DATA.filter((f) => f.cat === "conges").length },
    { id: "discipline", label: "Discipline & Sanctions", count: FAQ_DATA.filter((f) => f.cat === "discipline").length },
    { id: "sante", label: "Santé, Sécurité & AT", count: FAQ_DATA.filter((f) => f.cat === "sante").length },
    { id: "retraite", label: "Retraite & CNR", count: FAQ_DATA.filter((f) => f.cat === "retraite").length },
    { id: "divers", label: "Organisation & Instances", count: FAQ_DATA.filter((f) => f.cat === "divers").length },
  ];

  const filteredFaq = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      if (activeCat !== "tous" && item.cat !== activeCat) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.ref.toLowerCase().includes(q) ||
        item.theme.toLowerCase().includes(q)
      );
    });
  }, [search, activeCat]);

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    filteredFaq.forEach((_, idx) => {
      all[idx] = true;
    });
    setOpenItems(all);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Réponses Pratiques & Textes de Référence
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">FAQ Juridique & Sociale Algérienne</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              24 réponses argumentées aux questions courantes des gestionnaires de paie, RH et directeurs d'entreprise, appuyées sur la Loi n°90-11, le CIDTA et le Code de Sécurité Sociale.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Tout déplier
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Tout replier
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar & Category Pills */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher une question, mot-clé, article de loi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeCat === c.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {c.label} ({c.count})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredFaq.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune question ne correspond à votre recherche</p>
          </div>
        ) : (
          filteredFaq.map((item, idx) => {
            const isOpen = !!openItems[idx];

            return (
              <div
                key={`faq-${idx}`}
                className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                  isOpen
                    ? "border-indigo-300 shadow-xs"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleItem(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.theme}
                      </span>
                      {item.ref && (
                        <span className="text-[11px] font-medium text-slate-500 font-mono hidden sm:inline">
                          • {item.ref}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.q}
                    </h3>
                  </div>

                  <div className="p-1 rounded-full bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-[#FAFAFD] space-y-3">
                    <p className="leading-relaxed text-[13.5px] text-slate-700 pt-3">
                      {item.a}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Source légale :</span>
                        <span className="font-mono text-slate-800 font-semibold">{item.ref}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Réponse consolidée Netix SIRH
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
