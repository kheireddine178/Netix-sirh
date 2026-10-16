"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Printer,
  Save,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Building2,
  Sparkles,
  Info,
  X,
  RotateCcw,
  Download,
  AlertTriangle,
  UserCheck,
  User,
  SlidersHorizontal,
  ChevronDown,
  Edit3,
  Layers,
  Check,
  FileText,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebarContext";
import { cn } from "@/lib/utils";
import {
  calculerBulletinComplet,
  round2,
  round1,
  BASE_HORAIRE_LEGALE,
  JOURS_OUVRABLES_STANDARD,
  TAUX_CNAS_SALARIAL,
  TAUX_CNAS_PATRONAL,
  TAUX_CNAS_OEUVRES_SOCIALES,
  TAUX_CNAS_TOTAL_DAC,
  DetailCalculIRG,
  ResultatBulletinPaie,
} from "@/src/lib/payroll-engine";
import {
  SalarieCockpit,
  BulletinCockpitVariables,
  RubriqueCatalogueItem,
  RubriqueFixeAssignee,
  sauvegarderBulletinIndividuel,
  sauvegarderProfilSalarie,
  assignerRubriqueFixeSalarie,
  retirerRubriqueFixeSalarie,
} from "./actions";

function formatDA(num: number, withSymbol: boolean = true): string {
  if (isNaN(num) || !isFinite(num)) return withSymbol ? "0,00 DA" : "0,00";
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSymbol ? `${parts[0]},${parts[1]} DA` : `${parts[0]},${parts[1]}`;
}

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

interface Props {
  initialSalaries: SalarieCockpit[];
  initialVariables: Record<number, BulletinCockpitVariables>;
  catalogue: RubriqueCatalogueItem[];
  annee: number;
  mois: number;
}

export default function CockpitClient({
  initialSalaries,
  initialVariables,
  catalogue,
  annee,
  mois,
}: Props) {
  const [salaries, setSalaries] = useState<SalarieCockpit[]>(initialSalaries);
  const [variablesMap, setVariablesMap] = useState<Record<number, BulletinCockpitVariables>>(initialVariables);
  const [selectedSalarieId, setSelectedSalarieId] = useState<number>(initialSalaries[0]?.id || 1);

  // Filtre et recherche
  const [search, setSearch] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Navigation par tiroir de flotte (Drawer)
  const [isFleetDrawerOpen, setIsFleetDrawerOpen] = useState<boolean>(false);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState<boolean>(false);

  // Onglet actif du Studio Collaborateur : variables | fixes | profil
  const [activeTab, setActiveTab] = useState<"variables" | "fixes" | "profil">("variables");

  const [selectedMonth, setSelectedMonth] = useState<number>(mois);
  const [selectedYear, setSelectedYear] = useState<number>(annee);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();

  // Modale d'assignation de rubrique fixe
  const [isAddFixedModalOpen, setIsAddFixedModalOpen] = useState<boolean>(false);
  const [rubriqueSearch, setRubriqueSearch] = useState<string>("");
  const [selectedRubriqueCode, setSelectedRubriqueCode] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<number>(5000);

  // Le salarié actuellement affiché au centre
  const currentSalarie = useMemo(() => {
    return salaries.find((s) => s.id === selectedSalarieId) || salaries[0];
  }, [salaries, selectedSalarieId]);

  const currentVariables = useMemo(() => {
    if (!currentSalarie) return null;
    return (
      variablesMap[currentSalarie.id] || {
        salarieId: currentSalarie.id,
        annee: selectedYear,
        mois: selectedMonth,
        heuresAbsence: 0,
        hs50: 0,
        hs75: 0,
        hs100: 0,
        joursPanier: 22,
        tauxPanier: 300,
        forfaitTransport: 2500,
        primesVariables: [],
        avancesAcomptes: 0,
        autresRetenues: 0,
        statut: "Brouillon",
      }
    );
  }, [currentSalarie, variablesMap, selectedYear, selectedMonth]);

  // ------------------------------------------------------------------
  // 1. CALCUL EN DIRECT (0 ms) POUR LE SALARIÉ SÉLECTIONNÉ
  // ------------------------------------------------------------------

  const currentBulletinCalc = useMemo(() => {
    if (!currentSalarie || !currentVariables) return null;

    // Calcul de la somme des primes fixes cotisables du salarié
    const totalPrimesFixesCotisables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

    // Primes variables cotisables du mois
    const totalPrimesVariablesCotisables = currentVariables.primesVariables
      .filter((p) => p.cotisable)
      .reduce((acc, p) => acc + p.montant, 0);

    const totalPrimesCotisables = totalPrimesFixesCotisables + totalPrimesVariablesCotisables;

    // Primes non cotisables mais imposables (ex: primes de véhicule, téléphone)
    const totalPrimesNonCotisablesImposables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "NON" && (r.imposable === "OUI" || r.imposable === "IRG"))
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

    // Retenues spécifiques fixes (ex: mutuelle)
    const totalRetenuesFixes = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Retenue (-)")
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

    const result = calculerBulletinComplet({
      salaireBase: currentSalarie.salaire_base_theorique,
      heuresAbsence: currentVariables.heuresAbsence,
      hs50: currentVariables.hs50,
      hs75: currentVariables.hs75,
      hs100: currentVariables.hs100,
      primesCotisables: totalPrimesCotisables,
      forfaitTransport: currentVariables.forfaitTransport,
      panierForce: currentVariables.joursPanier * currentVariables.tauxPanier,
      tauxUnitairePanier: currentVariables.tauxPanier,
      primesNonCotisablesImposables: totalPrimesNonCotisablesImposables,
      avancesAcomptes: currentVariables.avancesAcomptes,
      autresRetenues: currentVariables.autresRetenues + totalRetenuesFixes,
      regimeIrg: currentSalarie.regime_irg,
    });

    return result;
  }, [currentSalarie, currentVariables]);

  // Liste filtrée des salariés
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const matchSearch =
        search.trim() === "" ||
        s.nom_prenom.toLowerCase().includes(search.toLowerCase()) ||
        s.matricule.toLowerCase().includes(search.toLowerCase()) ||
        s.fonction.toLowerCase().includes(search.toLowerCase()) ||
        s.departement.toLowerCase().includes(search.toLowerCase());

      const matchDept = deptFilter === "ALL" || s.departement === deptFilter;

      const vars = variablesMap[s.id];
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VALIDE" && vars?.statut === "Validé") ||
        (statusFilter === "BROUILLON" && (!vars || vars.statut === "Brouillon"));

      return matchSearch && matchDept && matchStatus;
    });
  }, [salaries, search, deptFilter, statusFilter, variablesMap]);

  // Index actuel dans la liste
  const currentIdx = useMemo(() => {
    return filteredSalaries.findIndex((s) => s.id === currentSalarie?.id);
  }, [filteredSalaries, currentSalarie]);

  // Départements uniques pour filtres
  const departements = useMemo(() => {
    const set = new Set(salaries.map((s) => s.departement));
    return Array.from(set);
  }, [salaries]);

  // Progression globale
  const stats = useMemo(() => {
    let countValides = 0;
    for (const s of salaries) {
      if (variablesMap[s.id]?.statut === "Validé") {
        countValides++;
      }
    }
    return {
      total: salaries.length,
      valides: countValides,
      pourcentage: Math.round((countValides / salaries.length) * 100),
    };
  }, [salaries, variablesMap]);

  // ------------------------------------------------------------------
  // 2. RACCOURCIS CLAVIER & NAVIGATION RAPIDE
  // ------------------------------------------------------------------

  const handleSelectNext = useCallback(() => {
    if (currentIdx < filteredSalaries.length - 1) {
      setSelectedSalarieId(filteredSalaries[currentIdx + 1].id);
    }
  }, [filteredSalaries, currentIdx]);

  const handleSelectPrev = useCallback(() => {
    if (currentIdx > 0) {
      setSelectedSalarieId(filteredSalaries[currentIdx - 1].id);
    }
  }, [filteredSalaries, currentIdx]);

  // Sauvegarde unitaire du bulletin
  const handleSaveCurrentBulletin = useCallback(
    async (passerAuSuivant: boolean = false) => {
      if (!currentSalarie || !currentVariables) return;
      setIsSaving(true);

      try {
        const updatedVars = {
          ...currentVariables,
          statut: "Validé" as const,
        };

        setVariablesMap((prev) => ({
          ...prev,
          [currentSalarie.id]: updatedVars,
        }));

        await sauvegarderBulletinIndividuel(
          currentSalarie.id,
          selectedYear,
          selectedMonth,
          currentSalarie.salaire_base_theorique,
          updatedVars
        );

        setSaveNotice(`✅ Bulletin de ${currentSalarie.nom_prenom} validé et enregistré !`);
        setTimeout(() => setSaveNotice(null), 3000);

        if (passerAuSuivant) {
          handleSelectNext();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [currentSalarie, currentVariables, selectedYear, selectedMonth, handleSelectNext]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAddFixedModalOpen) return;

      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInput = targetTag === "INPUT" || targetTag === "TEXTAREA" || targetTag === "SELECT";

      // Ctrl+S ou Cmd+S : Sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveCurrentBulletin(false);
        return;
      }

      // Entrée (hors champ texte long) : Valider & Passer au suivant
      if (e.key === "Enter" && targetTag !== "TEXTAREA") {
        e.preventDefault();
        handleSaveCurrentBulletin(true);
        return;
      }

      // Flèche Bas : Salarié suivant (quand pas dans un input)
      if (e.key === "ArrowDown" && !isInput) {
        e.preventDefault();
        handleSelectNext();
      }

      // Flèche Haut : Salarié précédent
      if (e.key === "ArrowUp" && !isInput) {
        e.preventDefault();
        handleSelectPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectNext, handleSelectPrev, handleSaveCurrentBulletin, isAddFixedModalOpen]);

  // ------------------------------------------------------------------
  // 3. ACTIONS DE MODIFICATION DIRECTE SUR LE SALARIÉ FOCUS
  // ------------------------------------------------------------------

  // Modification du salaire de base en direct
  const handleUpdateSalaireBase = (nouveauSalaire: number) => {
    if (!currentSalarie) return;
    const base = Math.max(0, nouveauSalaire);

    setSalaries((prev) =>
      prev.map((s) => (s.id === currentSalarie.id ? { ...s, salaire_base_theorique: base } : s))
    );
  };

  // Modification d'une variable du mois
  const handleVariableChange = (field: keyof BulletinCockpitVariables, val: any) => {
    if (!currentSalarie) return;

    setVariablesMap((prev) => ({
      ...prev,
      [currentSalarie.id]: {
        ...(prev[currentSalarie.id] || currentVariables!),
        [field]: val,
      },
    }));
  };

  // Modification d'une info personnelle du profil
  const handleProfileFieldChange = (field: keyof SalarieCockpit, val: any) => {
    if (!currentSalarie) return;

    setSalaries((prev) =>
      prev.map((s) => (s.id === currentSalarie.id ? { ...s, [field]: val } : s))
    );
  };

  // Sauvegarde des infos de profil
  const handleSaveProfile = async () => {
    if (!currentSalarie) return;
    setIsSaving(true);
    try {
      await sauvegarderProfilSalarie(currentSalarie.id, currentSalarie);
      setSaveNotice(`✅ Profil de ${currentSalarie.nom_prenom} mis à jour avec succès !`);
      setTimeout(() => setSaveNotice(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Assigner une rubrique fixe
  const handleConfirmAddFixed = async () => {
    if (!currentSalarie || !selectedRubriqueCode) return;
    const catItem = catalogue.find((c) => c.code === selectedRubriqueCode);
    if (!catItem) return;

    const newRubrique: RubriqueFixeAssignee = {
      code: catItem.code,
      libelle: catItem.libelle,
      type_valeur: catItem.type_valeur,
      cotisable: catItem.cotisable,
      imposable: catItem.imposable,
      valeur_defaut: customAmount,
    };

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === currentSalarie.id) {
          const filtered = s.rubriquesFixes.filter((r) => r.code !== selectedRubriqueCode);
          return {
            ...s,
            rubriquesFixes: [...filtered, newRubrique],
          };
        }
        return s;
      })
    );

    await assignerRubriqueFixeSalarie(currentSalarie.id, catItem.code, customAmount);
    setIsAddFixedModalOpen(false);
    setSaveNotice(`📌 Rubrique ${catItem.code} attachée au poste de ${currentSalarie.nom_prenom}`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Retirer une rubrique fixe
  const handleRemoveFixedRubrique = async (code: string) => {
    if (!currentSalarie) return;

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === currentSalarie.id) {
          return {
            ...s,
            rubriquesFixes: s.rubriquesFixes.filter((r) => r.code !== code),
          };
        }
        return s;
      })
    );

    await retirerRubriqueFixeSalarie(currentSalarie.id, code);
    setSaveNotice(`🗑️ Rubrique ${code} retirée du poste.`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Mettre à jour le montant d'une rubrique fixe
  const handleUpdateFixedRubriqueAmount = (code: string, newAmount: number) => {
    if (!currentSalarie) return;

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === currentSalarie.id) {
          return {
            ...s,
            rubriquesFixes: s.rubriquesFixes.map((r) =>
              r.code === code ? { ...r, valeur_defaut: Math.max(0, newAmount) } : r
            ),
          };
        }
        return s;
      })
    );
  };

  const filteredCatalogue = useMemo(() => {
    if (!rubriqueSearch.trim()) return catalogue;
    return catalogue.filter(
      (c) =>
        c.code.toLowerCase().includes(rubriqueSearch.toLowerCase()) ||
        c.libelle.toLowerCase().includes(rubriqueSearch.toLowerCase()) ||
        (c.categorie && c.categorie.toLowerCase().includes(rubriqueSearch.toLowerCase()))
    );
  }, [catalogue, rubriqueSearch]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)] pb-8 relative">
      {/* ====================================================================
          BARRE DE COMMANDE SUPÉRIEURE : LE COLLABORATEUR AU CENTRE
          ==================================================================== */}
      <header className="bg-white border border-[#E6E4DD] rounded-xl p-3.5 shadow-xs mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Navigation rapide entre collaborateurs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton pour ouvrir le tiroir des 200 salariés */}
          <button
            onClick={() => setIsFleetDrawerOpen(true)}
            className="btn-fintech-secondary text-xs flex items-center gap-2 py-1.5 px-3 bg-[#F8F7F4] hover:bg-[#EEF4F0] hover:border-[#A7F3D0] transition-all cursor-pointer font-semibold"
            title="Ouvrir la liste complète des 200 collaborateurs"
          >
            <Users className="w-3.5 h-3.5 text-[#0D3B2E]" />
            <span>Flotte (200)</span>
            <span className="text-[10px] bg-[#E6F3EE] text-[#0D3B2E] px-1.5 py-0.2 rounded font-mono font-bold">
              {stats.valides}/{stats.total}
            </span>
          </button>

          {/* Bouton Précédent */}
          <button
            onClick={handleSelectPrev}
            disabled={currentIdx <= 0}
            className="p-1.5 rounded-lg border border-[#E6E4DD] hover:bg-[#F2F0EC] disabled:opacity-40 disabled:cursor-not-allowed text-[#5A6065] transition-colors"
            title="Salarié précédent (Raccourci: ↑)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Quick-Switcher Déroulant Instantané */}
          <div className="relative">
            <button
              onClick={() => setIsQuickSwitcherOpen(!isQuickSwitcherOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#0D3B2E]/30 bg-[#F4F9F6] hover:bg-[#E6F3EE] transition-all cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentSalarie?.nom_prenom.charAt(0)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#0D3B2E]">
                    {currentSalarie?.matricule}
                  </span>
                  <span className="text-xs font-bold text-[#111315]">
                    {currentSalarie?.nom_prenom}
                  </span>
                </div>
                <span className="text-[10px] text-[#5A6065]">
                  {currentSalarie?.fonction} • {currentSalarie?.departement}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A6065] ml-1" />
            </button>

            {/* Menu Pop-up du Quick Switcher */}
            {isQuickSwitcherOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-[#E6E4DD] rounded-xl shadow-xl z-50 p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Chercher matricule, nom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-xs bg-[#F8F7F4] border border-[#E6E4DD] rounded outline-none focus:border-[#0D3B2E]"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#E6E4DD] text-xs">
                  {filteredSalaries.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSalarieId(s.id);
                        setIsQuickSwitcherOpen(false);
                      }}
                      className={`p-2 flex items-center justify-between cursor-pointer hover:bg-[#F4F9F6] ${
                        s.id === currentSalarie?.id ? "bg-[#EEF4F0] font-bold text-[#0D3B2E]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] shrink-0">{s.matricule}</span>
                        <span className="truncate">{s.nom_prenom}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#5A6065] shrink-0">
                        {formatDA(s.salaire_base_theorique, false)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={handleSelectNext}
            disabled={currentIdx >= filteredSalaries.length - 1}
            className="p-1.5 rounded-lg border border-[#E6E4DD] hover:bg-[#F2F0EC] disabled:opacity-40 disabled:cursor-not-allowed text-[#5A6065] transition-colors"
            title="Salarié suivant (Raccourci: ↓)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Période et Actions Globales */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#5A6065]">
            <Calendar className="w-3.5 h-3.5 text-[#0D3B2E]" />
            <span className="font-semibold">{MOIS_FR[selectedMonth - 1]} {selectedYear}</span>
          </div>

          <div className="h-4 w-px bg-[#E6E4DD]" />

          <Link
            href={`/paie/cloture?annee=${selectedYear}&mois=${selectedMonth}`}
            className="btn-fintech-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E]" />
            <span>Clôture & Déclarations</span>
          </Link>

          {/* Bouton Agrandir Espace / Masquer Navigation */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "btn-fintech-secondary text-xs flex items-center gap-1.5 py-1 px-2.5 transition-all cursor-pointer font-medium",
              !isSidebarOpen && "bg-[#E6F3EE] text-[#0D3B2E] border-[#A7F3D0]"
            )}
            title={
              isSidebarOpen
                ? "Masquer la navigation latérale pour agrandir l'espace de travail (Ctrl+B)"
                : "Afficher la navigation latérale (Ctrl+B)"
            }
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-[#5A6065]" />
                <span className="hidden xl:inline">Agrandir l'espace</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-[#0D3B2E]" />
                <span className="hidden xl:inline font-bold">Afficher Menu</span>
              </>
            )}
          </button>

          {/* Raccourci rappel */}
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#5A6065] bg-[#F2F0EC] px-2 py-0.5 rounded border border-[#E6E4DD]">
            [Entrée : Valider & Suivant]
          </span>
        </div>
      </header>

      {/* Notification Toast */}
      {saveNotice && (
        <div className="mb-4 p-2.5 bg-[#E6F3EE] border border-[#A7F3D0] text-[#065F46] rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <span>{saveNotice}</span>
          <button onClick={() => setSaveNotice(null)} className="text-[#065F46] hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ====================================================================
          GRILLE PRINCIPALE EN 2 VOLETS SPACIEUX : FOCUS TOTAL
          Volet Gauche (60%) : Studio Collaborateur & Fiche Complète
          Volet Droit  (40%) : Bulletin Vivant Réactif 0 ms
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* ==================================================================
            VOLET 1 : LE STUDIO DU COLLABORATEUR (7 COLS = ~58%)
            ================================================================== */}
        <section className="lg:col-span-7 space-y-4">
          {currentSalarie && currentVariables && (
            <>
              {/* Carte Principale du Collaborateur */}
              <div className="bg-white border border-[#E6E4DD] rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DD]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-[#0D3B2E] to-[#1E5C49] text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {currentSalarie.nom_prenom.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-black text-[#111315]">
                          {currentSalarie.nom_prenom}
                        </h2>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#F2F0EC] border border-[#E6E4DD] rounded text-[#5A6065]">
                          {currentSalarie.matricule}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            currentVariables.statut === "Validé"
                              ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                              : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                          }`}
                        >
                          {currentVariables.statut}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6065] mt-0.5">
                        <span className="font-semibold text-[#111315]">{currentSalarie.fonction}</span> • Service {currentSalarie.departement} • Contrat {currentSalarie.type_contrat}
                      </p>
                    </div>
                  </div>

                  {/* Boîte Salaire de Base Modifiable Directement */}
                  <div className="bg-[#F8F7F4] border border-[#E6E4DD] rounded-xl p-3 flex flex-col items-end shrink-0 sm:min-w-[200px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6065]">
                      Salaire de Base (R030)
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={currentSalarie.salaire_base_theorique}
                        onChange={(e) => handleUpdateSalaireBase(parseFloat(e.target.value) || 0)}
                        className="w-32 bg-white border border-[#E6E4DD] rounded px-2.5 py-1 text-right font-mono font-black text-base text-[#0D3B2E] outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                      />
                      <span className="text-xs font-bold font-mono text-[#0D3B2E]">DA</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] mt-0.5">
                      Base légale 173,33h
                    </span>
                  </div>
                </div>

                {/* Onglets de Navigation Spacieux */}
                <div className="flex items-center gap-2 mt-4 pt-1 border-b border-[#E6E4DD]">
                  <button
                    onClick={() => setActiveTab("variables")}
                    className={`pb-2.5 px-3 text-xs font-bold tracking-tight transition-all relative cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "variables"
                        ? "text-[#0D3B2E] border-b-2 border-b-[#0D3B2E]"
                        : "text-[#5A6065] hover:text-[#111315]"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Variables du Mois (Activité Réelle)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("fixes")}
                    className={`pb-2.5 px-3 text-xs font-bold tracking-tight transition-all relative cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "fixes"
                        ? "text-[#0D3B2E] border-b-2 border-b-[#0D3B2E]"
                        : "text-[#5A6065] hover:text-[#111315]"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Rubriques Fixes du Poste ({currentSalarie.rubriquesFixes.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("profil")}
                    className={`pb-2.5 px-3 text-xs font-bold tracking-tight transition-all relative cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "profil"
                        ? "text-[#0D3B2E] border-b-2 border-b-[#0D3B2E]"
                        : "text-[#5A6065] hover:text-[#111315]"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Fiche & Paramètres RH</span>
                  </button>
                </div>

                {/* ==============================================================
                    CONTENU DE L'ONGLET 1 : VARIABLES DU MOIS (ACTIVITÉ RÉELLE)
                    ============================================================== */}
                {activeTab === "variables" && (
                  <div className="pt-4 space-y-4">
                    {/* Absences Loi 90-11 */}
                    <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#991B1B]" />
                          <span className="text-xs font-bold text-[#111315]">
                            Absences Déductibles (Loi 90-11)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#991B1B]">
                          - {formatDA(currentBulletinCalc?.retenueAbsence || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">
                            Heures d'absence ce mois :
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="173.33"
                              value={currentVariables.heuresAbsence === 0 ? "" : currentVariables.heuresAbsence}
                              placeholder="0"
                              onChange={(e) =>
                                handleVariableChange("heuresAbsence", parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                            />
                            <span className="text-xs text-[#5A6065] font-mono">h</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">
                            Heures rémunérées résultantes :
                          </label>
                          <div className="bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono text-xs text-[#111315] font-semibold">
                            {currentBulletinCalc?.heuresTravaillees} h / 173,33h
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Heures Supplémentaires */}
                    <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-[#0D3B2E]" />
                          <span className="text-xs font-bold text-[#111315]">
                            Heures Supplémentaires (Loi 90-11)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#0D3B2E]">
                          + {formatDA(currentBulletinCalc?.totalHeuresSup || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">HS +50% (P1) :</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={currentVariables.hs50 === 0 ? "" : currentVariables.hs50}
                            placeholder="0"
                            onChange={(e) =>
                              handleVariableChange("hs50", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 text-center font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">HS +75% (P2) :</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={currentVariables.hs75 === 0 ? "" : currentVariables.hs75}
                            placeholder="0"
                            onChange={(e) =>
                              handleVariableChange("hs75", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 text-center font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">HS +100% (P3) :</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={currentVariables.hs100 === 0 ? "" : currentVariables.hs100}
                            placeholder="0"
                            onChange={(e) =>
                              handleVariableChange("hs100", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 text-center font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Panier & Transport */}
                    <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                      <span className="text-xs font-bold text-[#111315]">
                        Paniers & Transports du Mois (Hors Assiette CNAS)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">
                            Jours de panier réels (300 DA/j) :
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="31"
                              value={currentVariables.joursPanier}
                              onChange={(e) =>
                                handleVariableChange("joursPanier", parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                            />
                            <span className="text-xs font-mono text-[#5A6065]">jours</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-[#5A6065] block mb-1">
                            Forfait Transport conventionnel :
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="100"
                              min="0"
                              value={currentVariables.forfaitTransport}
                              onChange={(e) =>
                                handleVariableChange("forfaitTransport", parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                            />
                            <span className="text-xs font-mono text-[#5A6065]">DA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acomptes & Avances */}
                    <div className="p-3.5 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-[#92400E] block">
                          Acomptes & Avances sur Salaire à Déduire
                        </span>
                        <span className="text-[10px] text-[#92400E]/80">
                          Précompté directement sur le Net à Payer
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={currentVariables.avancesAcomptes === 0 ? "" : currentVariables.avancesAcomptes}
                          placeholder="0"
                          onChange={(e) =>
                            handleVariableChange("avancesAcomptes", parseFloat(e.target.value) || 0)
                          }
                          className="w-28 bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 text-right font-mono font-black text-xs text-[#991B1B] outline-none focus:border-[#0D3B2E]"
                        />
                        <span className="text-xs font-bold font-mono text-[#92400E]">DA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    CONTENU DE L'ONGLET 2 : RUBRIQUES FIXES DU POSTE
                    ============================================================== */}
                {activeTab === "fixes" && (
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#5A6065]">
                        Primes et indemnités contractuelles permanentes attachées à ce poste.
                      </p>
                      <button
                        onClick={() => {
                          setIsAddFixedModalOpen(true);
                          setRubriqueSearch("");
                          setSelectedRubriqueCode(catalogue[0]?.code || "R200");
                          setCustomAmount(5000);
                        }}
                        className="btn-fintech-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assigner une rubrique fixe</span>
                      </button>
                    </div>

                    {/* Liste des rubriques fixes */}
                    <div className="space-y-2">
                      {currentSalarie.rubriquesFixes.map((rub) => (
                        <div
                          key={rub.code}
                          className="p-3 rounded-xl bg-white border border-[#E6E4DD] hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-[#0D3B2E] bg-[#E6F3EE] px-2 py-0.5 rounded border border-[#A7F3D0]">
                              {rub.code}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#111315] truncate">
                                {rub.libelle}
                              </span>
                              <span className="text-[10px] text-[#94A3B8]">
                                {rub.cotisable === "OUI" ? "Cotisable CNAS" : "Non Cotisable"} •{" "}
                                {rub.imposable === "OUI" || rub.imposable === "IRG" ? "Imposable IRG" : "Exonéré"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              step="500"
                              min="0"
                              value={rub.valeur_defaut}
                              onChange={(e) =>
                                handleUpdateFixedRubriqueAmount(rub.code, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-2.5 py-1 text-right font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                            />
                            <span className="text-xs font-mono text-[#5A6065]">DA</span>

                            <button
                              onClick={() => handleRemoveFixedRubrique(rub.code)}
                              className="p-1.5 text-[#94A3B8] hover:text-[#991B1B] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                              title="Détacher cette rubrique fixe de ce collaborateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {currentSalarie.rubriquesFixes.length === 0 && (
                        <div className="p-6 text-center text-xs text-[#94A3B8] border border-dashed border-[#E6E4DD] rounded-xl bg-[#F8F7F4]">
                          Aucune rubrique fixe contractuelle attachée à ce collaborateur.
                          <br />
                          Cliquez sur "+ Assigner une rubrique fixe" pour en ajouter une parmi le catalogue 402.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    CONTENU DE L'ONGLET 3 : FICHE & INFOS PERSONNELLES DU COLLABORATEUR
                    ============================================================== */}
                {activeTab === "profil" && (
                  <div className="pt-4 space-y-4">
                    <p className="text-xs text-[#5A6065]">
                      Mettez à jour les informations administratives, contractuelles et fiscales de ce collaborateur.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Intitulé du Poste */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Fonction / Intitulé du Poste :
                        </label>
                        <input
                          type="text"
                          value={currentSalarie.fonction}
                          onChange={(e) => handleProfileFieldChange("fonction", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                      </div>

                      {/* Service / Département */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Service / Département :
                        </label>
                        <input
                          type="text"
                          value={currentSalarie.departement}
                          onChange={(e) => handleProfileFieldChange("departement", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                      </div>

                      {/* Type de contrat */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Type de Contrat :
                        </label>
                        <select
                          value={currentSalarie.type_contrat}
                          onChange={(e) => handleProfileFieldChange("type_contrat", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        >
                          <option value="CDI">CDI (Contrat à Durée Indéterminée)</option>
                          <option value="CDD">CDD (Contrat à Durée Déterminée)</option>
                          <option value="Stage/CTA">Stage / CTA</option>
                        </select>
                      </div>

                      {/* Situation Familiale */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Situation Familiale :
                        </label>
                        <select
                          value={currentSalarie.situation_familiale}
                          onChange={(e) => handleProfileFieldChange("situation_familiale", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        >
                          <option value="Célibataire">Célibataire</option>
                          <option value="Marié(e)">Marié(e)</option>
                          <option value="Divorcé(e)">Divorcé(e)</option>
                          <option value="Veuf(ve)">Veuf(ve)</option>
                        </select>
                      </div>

                      {/* Enfants à charge */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Enfants à charge :
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={currentSalarie.enfants_a_charge}
                          onChange={(e) =>
                            handleProfileFieldChange("enfants_a_charge", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                      </div>

                      {/* Régime IRG */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Régime Fiscal IRG (Barème 2022) :
                        </label>
                        <select
                          value={currentSalarie.regime_irg}
                          onChange={(e) => handleProfileFieldChange("regime_irg", e.target.value as any)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        >
                          <option value="general">Régime Général (Abattement 137/51)</option>
                          <option value="particulier">Régime Particulier (Abattement 93/61 - Handicapé/Moudjahid)</option>
                        </select>
                      </div>

                      {/* N° Sécurité Sociale */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          N° Sécurité Sociale (CNAS) :
                        </label>
                        <input
                          type="text"
                          value={currentSalarie.num_ss}
                          onChange={(e) => handleProfileFieldChange("num_ss", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-[#0D3B2E]"
                        />
                      </div>

                      {/* Compte Bancaire / CCP */}
                      <div>
                        <label className="text-[11px] font-bold text-[#111315] block mb-1">
                          Numéro de Compte / CCP / RIB :
                        </label>
                        <input
                          type="text"
                          value={currentSalarie.ccp_rib}
                          onChange={(e) => handleProfileFieldChange("ccp_rib", e.target.value)}
                          className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-[#0D3B2E]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6E4DD] flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="btn-fintech-primary text-xs flex items-center gap-1.5 py-2 px-4 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Enregistrer les modifications du profil</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ==================================================================
            VOLET 2 : LE BULLETIN VIVANT OFFICIEL (5 COLS = ~42%)
            ================================================================== */}
        <section className="lg:col-span-5 bg-white border border-[#E6E4DD] rounded-xl p-5 shadow-xs sticky top-4 overflow-y-auto print:border-none print:shadow-none space-y-4">
          {currentSalarie && currentVariables && currentBulletinCalc && (
            <>
              {/* En-tête officiel du bulletin */}
              <div className="border-b border-[#E6E4DD] pb-3 text-center space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A6065]">
                  NETIX SIRH • SARL ENTREPRISE ALGER
                </span>
                <h3 className="text-sm font-black text-[#111315]">
                  BULLETIN DE PAIE OFFICIEL
                </h3>
                <p className="text-xs text-[#5A6065]">
                  Période : {MOIS_FR[selectedMonth - 1]} {selectedYear}
                </p>
              </div>

              {/* Fiche récapitulative du salarié sur le bulletin */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8F7F4] p-3 rounded-lg border border-[#E6E4DD]">
                <div>
                  <span className="text-[#5A6065]">Matricule : </span>
                  <span className="font-mono font-bold text-[#111315]">{currentSalarie.matricule}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">N° Sécurité Sociale : </span>
                  <span className="font-mono text-[10px] text-[#111315]">{currentSalarie.num_ss}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Nom : </span>
                  <span className="font-bold text-[#111315]">{currentSalarie.nom_prenom}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Emploi : </span>
                  <span className="text-[#111315]">{currentSalarie.fonction}</span>
                </div>
              </div>

              {/* Tableau officiel des rubriques */}
              <div className="border border-[#E6E4DD] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#F2F0EC] border-b border-[#E6E4DD] text-[10px] text-[#5A6065]">
                    <tr>
                      <th className="py-1.5 px-2.5 text-left font-bold uppercase">Rubrique</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase">Gains</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase">Retenues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DD] font-mono text-[11px]">
                    {/* Salaire de base */}
                    <tr>
                      <td className="py-1 px-2.5 font-sans">R030 Salaire de Base (173,33h)</td>
                      <td className="py-1 px-2.5 text-right text-[#111315]">
                        {formatDA(currentSalarie.salaire_base_theorique, false)}
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue absence */}
                    {currentBulletinCalc.retenueAbsence > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2.5 font-sans">
                          Retenue Absence ({currentVariables.heuresAbsence}h)
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2.5 text-right">
                          {formatDA(currentBulletinCalc.retenueAbsence, false)}
                        </td>
                      </tr>
                    )}

                    {/* Rubriques fixes du poste */}
                    {currentSalarie.rubriquesFixes
                      .filter((r) => r.type_valeur === "Gain (+)")
                      .map((r) => (
                        <tr key={r.code}>
                          <td className="py-1 px-2.5 font-sans truncate max-w-[150px]">
                            {r.code} {r.libelle}
                          </td>
                          <td className="py-1 px-2.5 text-right text-[#111315]">
                            {formatDA(r.valeur_defaut, false)}
                          </td>
                          <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        </tr>
                      ))}

                    {/* Heures sup */}
                    {currentBulletinCalc.totalHeuresSup > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 font-sans">R120 Heures Supplémentaires</td>
                        <td className="py-1 px-2.5 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.totalHeuresSup, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* Sous-total Salaire de Poste */}
                    <tr className="bg-[#F8F7F4] font-bold text-[#111315]">
                      <td className="py-1 px-2.5 font-sans">SALAIRE DE POSTE (CNAS)</td>
                      <td className="py-1 px-2.5 text-right">
                        {formatDA(currentBulletinCalc.salaireDePoste, false)}
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Cotisation CNAS 9% */}
                    <tr>
                      <td className="py-1 px-2.5 font-sans">R950 Sécurité Sociale (9%)</td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2.5 text-right text-[#991B1B]">
                        {formatDA(currentBulletinCalc.cnasSalariale, false)}
                      </td>
                    </tr>

                    {/* Panier & Transport */}
                    {currentBulletinCalc.montantPanier > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 font-sans">
                          R250 Prime Panier ({currentVariables.joursPanier}j)
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.montantPanier, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {currentBulletinCalc.montantTransport > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 font-sans">R280 Indemnité Transport</td>
                        <td className="py-1 px-2.5 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.montantTransport, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* Salaire Brut */}
                    <tr className="bg-[#F8F7F4] font-semibold text-[#111315]">
                      <td className="py-1 px-2.5 font-sans">SALAIRE BRUT TOTAL</td>
                      <td className="py-1 px-2.5 text-right">
                        {formatDA(currentBulletinCalc.salaireBrutTotal, false)}
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue IRG Barème 2022 */}
                    <tr>
                      <td className="py-1 px-2.5 font-sans">
                        R980 IRG Barème (R: {formatDA(currentBulletinCalc.rTronqueIrg, false)})
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2.5 text-right font-bold text-[#991B1B]">
                        {formatDA(currentBulletinCalc.irgRetenu, false)}
                      </td>
                    </tr>

                    {/* Acomptes */}
                    {currentVariables.avancesAcomptes > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2.5 font-sans">R999 Acomptes déduits</td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2.5 text-right">
                          {formatDA(currentVariables.avancesAcomptes, false)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ENCADRÉ NET À PAYER */}
              <div className="p-4 rounded-xl bg-[#E6F3EE] border border-[#A7F3D0] space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-black tracking-wider text-[#0D3B2E]">
                    NET À PAYER (CENTIME EXACT)
                  </span>
                  <span className="text-2xl font-black font-mono text-[#0D3B2E]">
                    {formatDA(currentBulletinCalc.netAPayer)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#065F46] pt-1.5 border-t border-[#A7F3D0]/70">
                  <span>Coût Total Employeur (avec 25,5% CNAS) :</span>
                  <span className="font-mono font-bold">
                    {formatDA(currentBulletinCalc.coutTotalEmployeur)}
                  </span>
                </div>
              </div>

              {/* Actions Rapides */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleSaveCurrentBulletin(true)}
                  disabled={isSaving}
                  className="btn-fintech-primary w-full justify-center py-2.5 text-xs font-bold cursor-pointer"
                  title="Valider le bulletin et charger le salarié suivant (Entrée)"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Valider & Salarié Suivant (Entrée)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveCurrentBulletin(false)}
                    disabled={isSaving}
                    className="btn-fintech-secondary text-xs flex-1 justify-center py-2 cursor-pointer"
                    title="Sauvegarder sans changer de salarié (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5 text-[#5A6065]" />
                    <span>Enregistrer (Ctrl+S)</span>
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=bulletin`,
                        "_blank"
                      )
                    }
                    className="btn-fintech-secondary text-xs px-3 py-2 cursor-pointer flex items-center gap-1.5"
                    title="Ouvrir la fiche de paie dans un nouvel onglet"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                    <span>Imprimer</span>
                  </button>
                </div>

                {/* MODULE D'ÉDITION DES 3 DOCUMENTS DE PAIE (NOUVEL ONGLET) */}
                <div className="pt-3 border-t border-[#E6E4DD] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111315]">
                      Fiches & Justificatifs Réglementaires :
                    </span>
                    <span className="text-[10px] text-[#0D3B2E] font-medium bg-[#E6F3EE] px-1.5 py-0.2 rounded border border-[#A7F3D0]">
                      Nouvel Onglet
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() =>
                        window.open(
                          `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=bulletin`,
                          "_blank"
                        )
                      }
                      className="p-2 rounded-lg border border-[#E6E4DD] bg-white hover:bg-[#F4F9F6] hover:border-[#0D3B2E] hover:text-[#0D3B2E] transition-all flex items-center gap-2 cursor-pointer text-left"
                      title="Fiche de paie officielle algérienne prête pour remise au collaborateur"
                    >
                      <FileText className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">1. Fiche Salarié</span>
                        <span className="text-[9px] text-[#5A6065]">Bulletin officiel</span>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=calcul`,
                          "_blank"
                        )
                      }
                      className="p-2 rounded-lg border border-[#E6E4DD] bg-white hover:bg-[#F4F9F6] hover:border-[#0D3B2E] hover:text-[#0D3B2E] transition-all flex items-center gap-2 cursor-pointer text-left"
                      title="Fiche explicative détaillée du calcul (taux horaire, Loi 90-11, barème IRG)"
                    >
                      <Calculator className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">2. Explication Calcul</span>
                        <span className="text-[9px] text-[#5A6065]">Formules & IRG</span>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=charges`,
                          "_blank"
                        )
                      }
                      className="p-2 rounded-lg border border-[#E6E4DD] bg-white hover:bg-[#F4F9F6] hover:border-[#0D3B2E] hover:text-[#0D3B2E] transition-all flex items-center gap-2 cursor-pointer text-left"
                      title="Fiche des charges patronales et coût global employeur (DAC 34,5%)"
                    >
                      <Building2 className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">3. Charges Patronales</span>
                        <span className="text-[9px] text-[#5A6065]">DAC CNAS 34,5%</span>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=complet`,
                          "_blank"
                        )
                      }
                      className="p-2 rounded-lg border border-[#A7F3D0] bg-[#E6F3EE] hover:bg-[#D1EBE2] text-[#0D3B2E] transition-all flex items-center gap-2 cursor-pointer text-left"
                      title="Dossier complet en liasse (les 3 documents réunis prêts à imprimer)"
                    >
                      <Layers className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">Dossier Complet</span>
                        <span className="text-[9px] text-[#065F46]">Liasse 3 en 1</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ====================================================================
          TIROIR LATÉRAL COULISSANT : FLOTTE 200 COLLABORATEURS (DRAWER)
          ==================================================================== */}
      {isFleetDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#111315]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFleetDrawerOpen(false)}
          />

          {/* Tiroir */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-r border-[#E6E4DD] animate-in slide-in-from-left duration-200">
            {/* En-tête Tiroir */}
            <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0D3B2E]" />
                <h3 className="text-sm font-bold text-[#111315]">
                  Flotte des Collaborateurs ({salaries.length})
                </h3>
              </div>
              <button
                onClick={() => setIsFleetDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#5A6065] hover:text-[#111315] hover:bg-[#F2F0EC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="p-3 border-b border-[#E6E4DD] space-y-2 bg-[#F8F7F4]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Rechercher nom, matricule, poste..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E6E4DD] rounded-lg outline-none focus:border-[#0D3B2E]"
                  autoFocus
                />
              </div>

              {/* Filtres de statut */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    statusFilter === "ALL"
                      ? "bg-[#0D3B2E] text-white"
                      : "bg-white text-[#5A6065] border border-[#E6E4DD]"
                  }`}
                >
                  Tous ({salaries.length})
                </button>
                <button
                  onClick={() => setStatusFilter("VALIDE")}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    statusFilter === "VALIDE"
                      ? "bg-[#065F46] text-white"
                      : "bg-white text-[#5A6065] border border-[#E6E4DD]"
                  }`}
                >
                  Validés ({stats.valides})
                </button>
                <button
                  onClick={() => setStatusFilter("BROUILLON")}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    statusFilter === "BROUILLON"
                      ? "bg-[#92400E] text-white"
                      : "bg-white text-[#5A6065] border border-[#E6E4DD]"
                  }`}
                >
                  Brouillons ({stats.total - stats.valides})
                </button>
              </div>

              {/* Filtres par département */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                <button
                  onClick={() => setDeptFilter("ALL")}
                  className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                    deptFilter === "ALL"
                      ? "bg-[#0D3B2E] text-white"
                      : "bg-white text-[#5A6065] border border-[#E6E4DD]"
                  }`}
                >
                  Tous
                </button>
                {departements.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeptFilter(d)}
                    className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                      deptFilter === d
                        ? "bg-[#0D3B2E] text-white"
                        : "bg-white text-[#5A6065] border border-[#E6E4DD]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste défilante des 200 salariés */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E6E4DD]">
              {filteredSalaries.map((salarie) => {
                const isSelected = salarie.id === currentSalarie?.id;
                const vars = variablesMap[salarie.id];
                const isValide = vars?.statut === "Validé";

                return (
                  <div
                    key={salarie.id}
                    onClick={() => {
                      setSelectedSalarieId(salarie.id);
                      setIsFleetDrawerOpen(false);
                    }}
                    className={`p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#EEF4F0] border-l-4 border-l-[#0D3B2E]"
                        : "hover:bg-[#F8FAF9] bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F2F0EC] text-[#111315] flex items-center justify-center font-bold text-xs shrink-0">
                        {salarie.nom_prenom.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#0D3B2E]">
                            {salarie.matricule}
                          </span>
                          <span className="text-xs font-bold text-[#111315] truncate">
                            {salarie.nom_prenom}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#5A6065] truncate">
                          {salarie.fonction} • {salarie.departement}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono text-xs font-bold text-[#111315]">
                        {formatDA(salarie.salaire_base_theorique, false)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                          isValide
                            ? "bg-[#D1FAE5] text-[#065F46]"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        {isValide ? "Validé" : "Brouillon"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODALE D'ASSIGNATION DE RUBRIQUE FIXE AU POSTE
          ==================================================================== */}
      {isAddFixedModalOpen && currentSalarie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#111315]/40 backdrop-blur-xs"
            onClick={() => setIsAddFixedModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl border border-[#E6E4DD] shadow-2xl max-w-lg w-full p-5 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
              <div>
                <h3 className="text-sm font-bold text-[#111315]">
                  Assigner une Rubrique Fixe à {currentSalarie.nom_prenom}
                </h3>
                <span className="text-xs text-[#5A6065]">
                  Poste : {currentSalarie.fonction} • Service {currentSalarie.departement}
                </span>
              </div>
              <button
                onClick={() => setIsAddFixedModalOpen(false)}
                className="p-1 text-[#5A6065] hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recherche dans le catalogue 402 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111315]">
                Sélectionner parmi le catalogue officiel :
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Rechercher par code (R200, R202...) ou libellé (Nuisance, Astreinte...)"
                  value={rubriqueSearch}
                  onChange={(e) => setRubriqueSearch(e.target.value)}
                  className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-[#0D3B2E]"
                />
              </div>

              {/* Liste de choix */}
              <div className="max-h-48 overflow-y-auto border border-[#E6E4DD] rounded-lg divide-y divide-[#E6E4DD] text-xs">
                {filteredCatalogue.map((cat) => (
                  <div
                    key={cat.code}
                    onClick={() => setSelectedRubriqueCode(cat.code)}
                    className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      selectedRubriqueCode === cat.code
                        ? "bg-[#EEF4F0] font-semibold text-[#0D3B2E]"
                        : "hover:bg-[#F8FAF9] text-[#111315]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0D3B2E]">{cat.code}</span>
                      <span>{cat.libelle}</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">
                      {cat.cotisable === "OUI" ? "CNAS" : "Non cotisable"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Montant mensuel par défaut */}
            <div className="space-y-1.5 pt-2 border-t border-[#E6E4DD]">
              <label className="text-xs font-semibold text-[#111315]">
                Montant mensuel fixe (DA) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-[#111315] outline-none focus:border-[#0D3B2E]"
                />
                <span className="text-xs text-[#5A6065] font-mono">DA</span>
              </div>
            </div>

            {/* Boutons d'action modale */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E4DD]">
              <button
                onClick={() => setIsAddFixedModalOpen(false)}
                className="btn-fintech-secondary text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAddFixed}
                className="btn-fintech-primary text-xs"
              >
                Confirmer l'assignation au poste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
