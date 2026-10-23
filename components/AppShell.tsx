"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { NavbarMobile } from "@/components/NavbarMobile";
import Footer from "@/components/Footer";
import { SidebarProvider, useSidebar } from "@/lib/sidebarContext";
import { PanelLeftOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF9F6] text-[#111827] relative">
      {/* Header Mobile avec Drawer fluide */}
      <NavbarMobile />

      {/* Sidebar Desktop Collapsible (Afficher / Cacher à volonté) */}
      <Sidebar />

      {/* Bouton onglet discret ancré sur la bordure gauche pour ré-ouvrir le menu en 1 clic */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Afficher la barre de navigation"
          title="Afficher la navigation (Ctrl+B)"
          className="hidden md:flex fixed left-0 top-20 z-40 bg-white hover:bg-[#E6F3EE] text-[#0D3B2E] border border-l-0 border-[#F0EFEA] hover:border-[#A7F3D0] px-2 py-3 rounded-r-xl shadow-xs transition-all cursor-pointer items-center gap-1 group"
        >
          <PanelLeftOpen className="w-4 h-4 text-[#0D3B2E] group-hover:scale-110 transition-transform" />
          <ChevronRight className="w-3.5 h-3.5 -ml-1 text-[#71717A] group-hover:text-[#0D3B2E]" />
        </button>
      )}

      {/* Zone de contenu principale (S'étend à 100% plein écran quand le volet est masqué) */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 p-3 sm:p-5 lg:p-6 w-full mx-auto transition-all duration-300",
          isOpen ? "max-w-[1700px]" : "max-w-none"
        )}
      >
        {/* Barre d'accès rapide & indicateur d'espace élargi quand le menu est masqué */}
        {!isOpen && (
          <div className="hidden md:flex items-center justify-between mb-4 bg-white border border-[#F0EFEA] rounded-xl px-4 py-2.5 shadow-2xs animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center gap-2 bg-[#E6F3EE] hover:bg-[#D1EBE2] text-[#0D3B2E] border border-[#A7F3D0] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer group"
                title="Afficher la navigation (Ctrl+B)"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#0D3B2E] group-hover:scale-110 transition-transform" />
                <span>Afficher la navigation</span>
                <kbd className="text-[10px] bg-white text-[#0D3B2E] px-1.5 py-0.5 rounded border border-[#A7F3D0] font-sans font-semibold">
                  Ctrl+B
                </kbd>
              </button>
              <span className="text-xs text-[#71717A] font-medium">
                Espace de travail élargi actif • Pleine largeur pour la paie et les calculs
              </span>
            </div>

            <span className="text-[11px] font-bold text-[#065F46] bg-[#E6F3EE] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
              Mode Plein Écran
            </span>
          </div>
        )}

        <div className="flex-1 w-full animate-in fade-in-50 duration-200">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}

export default AppShell;
