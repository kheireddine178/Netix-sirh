"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GUIDE_POLES } from "./navigationData";
import { GuidePoleId, GuideItem } from "./types";
import { GuideHeader } from "./components/GuideHeader";
import { GlobalSearchModal, SearchSelection } from "./components/GlobalSearchModal";
import { SimulatorView } from "./components/SimulatorView";
import { RubriquesView } from "./components/RubriquesView";
import { DicoView } from "./components/DicoView";
import { ModelesView } from "./components/ModelesView";
import { FaqView } from "./components/FaqView";
import { BaremesView } from "./components/BaremesView";
import { LegalThemeView } from "./components/LegalThemeView";
import {
  Calculator,
  FileText,
  ShieldAlert,
  Folder,
  Scale,
  Users,
  Award,
  Briefcase,
  Heart,
  Globe,
  AlertTriangle,
  TrendingUp,
  Compass,
  Lock,
  Book,
  BookOpen,
  HelpCircle,
  Sparkles,
  ChevronRight
} from "lucide-react";

// Icon mapping helper for navigation pills
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator,
  FileText,
  ShieldAlert,
  Folder,
  Scale,
  Users,
  Award,
  Briefcase,
  Heart,
  Globe,
  AlertTriangle,
  TrendingUp,
  Compass,
  Lock,
  Book,
  BookOpen,
  HelpCircle,
};

function GetItemIcon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_COMPONENTS[name] || BookOpen;
  return <Comp className={className} />;
}

export default function GuidePage() {
  const [activePoleId, setActivePoleId] = useState<GuidePoleId>("remuneration");
  const [activeItemId, setActiveItemId] = useState<string>("theme1");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut listener for OmniSearch (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentPole = useMemo(() => {
    return GUIDE_POLES.find((p) => p.id === activePoleId) || GUIDE_POLES[0];
  }, [activePoleId]);

  const currentItem = useMemo(() => {
    for (const pole of GUIDE_POLES) {
      const found = pole.items.find((item) => item.id === activeItemId);
      if (found) return found;
    }
    return currentPole.items[0];
  }, [activeItemId, currentPole]);

  // Handle global search selection
  const handleSearchSelect = (selection: SearchSelection) => {
    // Find which pole contains the targetId
    for (const pole of GUIDE_POLES) {
      const match = pole.items.find((i) => i.id === selection.targetId);
      if (match) {
        setActivePoleId(pole.id);
        setActiveItemId(match.id);
        return;
      }
    }
    // Fallback for sub-types
    if (selection.subType === "rubrique") {
      setActivePoleId("remuneration");
      setActiveItemId("suppl-rubriques");
    } else if (selection.subType === "modele") {
      setActivePoleId("outils");
      setActiveItemId("modeles");
    } else if (selection.subType === "dico") {
      setActivePoleId("outils");
      setActiveItemId("dico");
    } else if (selection.subType === "faq") {
      setActivePoleId("outils");
      setActiveItemId("faq");
    }
  };

  const handleSelectPole = (poleId: GuidePoleId) => {
    setActivePoleId(poleId);
    const targetPole = GUIDE_POLES.find((p) => p.id === poleId);
    if (targetPole && targetPole.items.length > 0) {
      setActiveItemId(targetPole.items[0].id);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 pb-20">
      {/* OmniSearch Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSearchSelect}
      />

      {/* Top Header & Breadcrumbs */}
      <GuideHeader
        currentPoleTitle={currentPole.title}
        currentViewLabel={currentItem.label}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 4 PÔLES RH - Main Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GUIDE_POLES.map((pole) => {
          const isActive = pole.id === activePoleId;
          const IconComp = ICON_COMPONENTS[pole.icon] || BookOpen;

          return (
            <button
              key={pole.id}
              onClick={() => handleSelectPole(pole.id)}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between group ${
                isActive
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10"
                  : "bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white hover:shadow-xs"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-2xl"></div>
              )}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}
                >
                  {pole.items.length} modules
                </span>
              </div>

              <div>
                <h2
                  className={`text-sm font-bold transition-colors ${
                    isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                  }`}
                >
                  {pole.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-normal">
                  {pole.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Left Sub-Navigation + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sub-Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-2">
              <span>{currentPole.title}</span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {currentPole.items.length}
              </span>
            </div>

            <nav className="space-y-1">
              {currentPole.items.map((item) => {
                const isSelected = item.id === activeItemId;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group relative ${
                      isSelected
                        ? "bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/80 shadow-2xs"
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                      }`}
                    >
                      <GetItemIcon name={item.iconName} className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold truncate block">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                              isSelected
                                ? "bg-indigo-200/60 text-indigo-900"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Besoin d'un calcul immédiat ?</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Testez notre simulateur Brut ➔ Net avec la cascade CNAS (9%), IRG progressif et charges patronales (26%).
            </p>
            <button
              onClick={() => {
                setActivePoleId("remuneration");
                setActiveItemId("simulateur");
              }}
              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors pt-1"
            >
              <span>Lancer le simulateur</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Dynamic View Area */}
        <div className="lg:col-span-9 min-w-0">
          {activeItemId === "simulateur" && <SimulatorView />}

          {activeItemId === "suppl-rubriques" && <RubriquesView />}

          {activeItemId === "suppl-taux" && <BaremesView />}

          {activeItemId === "modeles" && <ModelesView />}

          {activeItemId === "dico" && <DicoView />}

          {activeItemId === "faq" && <FaqView />}

          {/* Legal Themes (theme1 to theme13) */}
          {activeItemId.startsWith("theme") && (
            <LegalThemeView
              themeId={activeItemId}
              title={currentItem.label}
              badge={currentItem.badge}
              legalRefs={currentItem.legalRefs}
              description={currentItem.description}
              onNavigateToSimulator={() => {
                setActivePoleId("remuneration");
                setActiveItemId("simulateur");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
