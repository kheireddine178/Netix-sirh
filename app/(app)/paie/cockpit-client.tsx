"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Layers,
  Sparkles,
  Info,
  Sliders,
  X,
  RotateCcw,
  Download,
  AlertTriangle,
  UserCheck,
  DollarSign,
} from "lucide-react";
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
  const [search, setSearch] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [selectedMonth, setSelectedMonth] = useState<number>(mois);
  const [selectedYear, setSelectedYear] = useState<number>(annee);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Modale d'ajout de rubrique fixe
  const [isAddFixedModalOpen, setIsAddFixedModalOpen] = useState<boolean>(false);
  const [rubriqueSearch, setRubriqueSearch] = useState<string>("");
  const [selectedRubriqueCode, setSelectedRubriqueCode] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<number>(5000);

  // Le salarié actuellement affiché au centre et à droite
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

  // Liste filtrée des salariés à gauche
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const matchSearch =
        search.trim() === "" ||
        s.nom_prenom.toLowerCase().includes(search.toLowerCase()) ||
        s.matricule.toLowerCase().includes(search.toLowerCase()) ||
        s.fonction.toLowerCase().includes(search.toLowerCase());

      const matchDept = deptFilter === "ALL" || s.departement === deptFilter;

      const vars = variablesMap[s.id];
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VALIDE" && vars?.statut === "Validé") ||
        (statusFilter === "BROUILLON" && (!vars || vars.statut === "Brouillon"));

      return matchSearch && matchDept && matchStatus;
    });
  }, [salaries, search, deptFilter, statusFilter, variablesMap]);

  // Départements uniques pour filtres
  const departements = useMemo(() => {
    const set = new Set(salaries.map((s) => s.departement));
    return Array.from(set);
  }, [salaries]);

  // Totaux globaux de l'ensemble des 200 salariés
  const globalTotals = useMemo(() => {
    let brutTotal = 0;
    let netTotal = 0;
    let cnasDAC = 0;
    let countValides = 0;

    for (const s of salaries) {
      const v = variablesMap[s.id];
      const totalPrimesFixes = s.rubriquesFixes
        .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
        .reduce((sum, r) => sum + r.valeur_defaut, 0);

      const res = calculerBulletinComplet({
        salaireBase: s.salaire_base_theorique,
        heuresAbsence: v?.heuresAbsence || 0,
        hs50: v?.hs50 || 0,
        hs75: v?.hs75 || 0,
        hs100: v?.hs100 || 0,
        primesCotisables: totalPrimesFixes,
        forfaitTransport: v?.forfaitTransport || 2500,
        panierForce: (v?.joursPanier ?? 22) * (v?.tauxPanier ?? 300),
        tauxUnitairePanier: v?.tauxPanier ?? 300,
        avancesAcomptes: v?.avancesAcomptes || 0,
        autresRetenues: v?.autresRetenues || 0,
        regimeIrg: s.regime_irg,
      });

      brutTotal += res.salaireBrutTotal;
      netTotal += res.netAPayer;
      cnasDAC += res.totalDAC;
      if (v?.statut === "Validé") {
        countValides++;
      }
    }

    return {
      brutTotal,
      netTotal,
      cnasDAC,
      countValides,
      percentValides: Math.round((countValides / salaries.length) * 100),
    };
  }, [salaries, variablesMap]);

  // ------------------------------------------------------------------
  // 2. GESTION DU CLAVIER POUR LE PILOTAGE HAUTE VÉLOCITÉ
  // ------------------------------------------------------------------

  const handleSelectNext = useCallback(() => {
    const currentIdx = filteredSalaries.findIndex((s) => s.id === selectedSalarieId);
    if (currentIdx < filteredSalaries.length - 1) {
      setSelectedSalarieId(filteredSalaries[currentIdx + 1].id);
    }
  }, [filteredSalaries, selectedSalarieId]);

  const handleSelectPrev = useCallback(() => {
    const currentIdx = filteredSalaries.findIndex((s) => s.id === selectedSalarieId);
    if (currentIdx > 0) {
      setSelectedSalarieId(filteredSalaries[currentIdx - 1].id);
    }
  }, [filteredSalaries, selectedSalarieId]);

  // Sauvegarde unitaire du bulletin
  const handleSaveCurrentBulletin = useCallback(
    async (passerAuSuivant: boolean = false) => {
      if (!currentSalarie || !currentVariables) return;
      setIsSaving(true);

      try {
        // Marquer comme Validé
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

      // Raccourci Sauvegarde sans avance : Ctrl+S ou Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveCurrentBulletin(false);
        return;
      }

      // Raccourci Validation & Salarié Suivant : Entrée
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveCurrentBulletin(true);
        return;
      }

      // Flèche Bas : Salarié suivant (quand pas en train d'écrire dans un champ)
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

  // Mise à jour d'une variable du mois
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

  // ------------------------------------------------------------------
  // 3. ASSIGNER / RETIRER DES RUBRIQUES FIXES SPÉCIFIQUES AU POSTE
  // ------------------------------------------------------------------

  const handleOpenAddFixedModal = () => {
    setIsAddFixedModalOpen(true);
    setRubriqueSearch("");
    setSelectedRubriqueCode(catalogue[0]?.code || "R200");
    setCustomAmount(5000);
  };

  const handleConfirmAddFixed = () => {
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
          // Si déjà existante, mettre à jour, sinon insérer
          const filtered = s.rubriquesFixes.filter((r) => r.code !== selectedRubriqueCode);
          return {
            ...s,
            rubriquesFixes: [...filtered, newRubrique],
          };
        }
        return s;
      })
    );

    setIsAddFixedModalOpen(false);
    setSaveNotice(`📌 Rubrique ${catItem.code} attachée au profil de ${currentSalarie.nom_prenom}`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleRemoveFixedRubrique = (code: string) => {
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

    setSaveNotice(`🗑️ Rubrique ${code} retirée du poste.`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

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

  // Catalogue filtré pour la modal
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
    <div className="flex flex-col min-h-[calc(100vh-70px)] pb-6">
      {/* ====================================================================
          1. BARRE DE COMMANDE SUPÉRIEURE (FINTECH ALABASTER)
          ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#E6E4DD]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-[#111315] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0D3B2E]" />
              Cockpit de Paie & Rémunération par Collaborateur
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D3B2E] bg-[#E6F3EE] px-2 py-0.5 rounded border border-[#A7F3D0]">
              200 Collaborateurs
            </span>
            <span className="text-[11px] font-medium text-[#5A6065] bg-[#F2F0EC] px-2 py-0.5 rounded border border-[#E6E4DD]">
              Packages de Rémunération Dédiés
            </span>
          </div>
          <p className="text-xs text-[#5A6065]">
            Chaque poste dispose de ses propres rubriques fixes et de sa saisie mensuelle. Calcul synchrone 0 ms Loi 90-11 & DGI 2022.
          </p>
        </div>

        {/* Sélecteur de période & Indicateurs Clés */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sélecteur Période */}
          <div className="flex items-center bg-white border border-[#E6E4DD] rounded-md px-2.5 py-1 text-xs font-semibold text-[#111315]">
            <span className="text-[#5A6065] mr-1.5 font-normal">Période :</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-semibold text-[#111315] cursor-pointer"
            >
              {MOIS_FR.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <span className="mx-1 text-[#94A3B8]">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-semibold text-[#111315] cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Jauge d'avancement du mois */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F2F0EC] px-2.5 py-1 rounded-md border border-[#E6E4DD] text-xs">
            <span className="text-[#5A6065]">Traitement :</span>
            <span className="font-mono font-bold text-[#0D3B2E]">
              {globalTotals.countValides} / {salaries.length} validés
            </span>
            <div className="w-16 h-2 rounded-full bg-[#E6E4DD] overflow-hidden">
              <div
                className="h-full bg-[#0D3B2E] transition-all duration-300"
                style={{ width: `${globalTotals.percentValides}%` }}
              />
            </div>
          </div>

          <Link href="/paie/cloture" className="btn-fintech-secondary text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A6065]" />
            Clôture & Déclarations
          </Link>
        </div>
      </div>

      {/* Message temporaire d'action */}
      {saveNotice && (
        <div className="mt-2 px-3 py-1.5 rounded-md bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center justify-between">
          <span>{saveNotice}</span>
          <button onClick={() => setSaveNotice(null)} className="text-[#065F46]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ====================================================================
          2. ARCHITECTURE SPLIT-SCREEN EN 3 VOLETS COORDONNÉS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 flex-1 items-start">
        {/* ==================================================================
            VOLET 1 : FLEET NAVIGATOR (LISTE DES 200 COLLABORATEURS - 3 COLS)
            ================================================================== */}
        <div className="lg:col-span-3 bg-white border border-[#E6E4DD] rounded-lg shadow-xs flex flex-col h-[calc(100vh-160px)] sticky top-4 overflow-hidden">
          {/* Header Recherche & Filtres */}
          <div className="p-3 border-b border-[#E6E4DD] space-y-2 bg-[#F8F7F4]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Rechercher salarié ou matricule..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#E6E4DD] rounded-md pl-8 pr-2.5 py-1 text-xs text-[#111315] placeholder:text-[#94A3B8] outline-none focus:border-[#0D3B2E]"
              />
            </div>

            {/* Filtre Département */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                onClick={() => setDeptFilter("ALL")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
                  deptFilter === "ALL"
                    ? "bg-[#0D3B2E] text-white"
                    : "bg-white text-[#5A6065] border border-[#E6E4DD] hover:bg-[#F2F0EC]"
                }`}
              >
                Tous ({salaries.length})
              </button>
              {departements.slice(0, 4).map((d) => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
                    deptFilter === d
                      ? "bg-[#0D3B2E] text-white"
                      : "bg-white text-[#5A6065] border border-[#E6E4DD] hover:bg-[#F2F0EC]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Raccourci d'aide clavier */}
          <div className="px-3 py-1 bg-[#F2F0EC] border-b border-[#E6E4DD] text-[10px] text-[#5A6065] flex items-center justify-between">
            <span>Navigation rapide :</span>
            <span className="font-mono bg-white px-1 py-0.5 rounded border border-[#E6E4DD] text-[#111315]">
              [↑ ↓] Changer de salarié
            </span>
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
                  onClick={() => setSelectedSalarieId(salarie.id)}
                  className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#EEF4F0] border-l-4 border-l-[#0D3B2E]"
                      : "hover:bg-[#F8FAF9] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-[#5A6065] shrink-0">
                      {salarie.matricule}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[#111315] truncate">
                        {salarie.nom_prenom}
                      </span>
                      <span className="text-[10px] text-[#5A6065] truncate">
                        {salarie.fonction}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono text-xs font-bold text-[#0D3B2E]">
                      {formatDA(salarie.salaire_base_theorique, false)}
                    </span>
                    <span className="text-[9px] text-[#94A3B8]">
                      {salarie.rubriquesFixes.length} rubriques
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================================
            VOLET 2 : PROFIL SUR-MESURE & VARIABLES DU MOIS (5 COLS)
            ================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {currentSalarie && currentVariables && currentBulletinCalc && (
            <>
              {/* Carte d'identité et de poste du collaborateur */}
              <div className="bg-white border border-[#E6E4DD] rounded-lg p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {currentSalarie.nom_prenom.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#111315]">
                          {currentSalarie.nom_prenom}
                        </h2>
                        <span className="font-mono text-xs font-bold bg-[#F2F0EC] px-1.5 py-0.5 rounded border border-[#E6E4DD] text-[#5A6065]">
                          {currentSalarie.matricule}
                        </span>
                      </div>
                      <span className="text-xs text-[#5A6065]">
                        {currentSalarie.fonction} • Service {currentSalarie.departement}
                      </span>
                    </div>
                  </div>

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

                {/* Métadonnées légales */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#E6E4DD] text-[11px] text-[#5A6065]">
                  <div>
                    <span>Contrat :</span>{" "}
                    <span className="font-semibold text-[#111315]">{currentSalarie.type_contrat}</span>
                  </div>
                  <div>
                    <span>Situation :</span>{" "}
                    <span className="font-semibold text-[#111315]">{currentSalarie.situation_familiale}</span>
                  </div>
                  <div>
                    <span>Enfants :</span>{" "}
                    <span className="font-semibold text-[#111315]">{currentSalarie.enfants_a_charge} à charge</span>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------
                  BLOC A : LES RUBRIQUES FIXES CONTRACTUELLES DU POSTE
                  -------------------------------------------------------------- */}
              <div className="bg-white border border-[#E6E4DD] rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0D3B2E]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                      1. Rubriques Fixes du Poste (Structure Contractuelle)
                    </h3>
                  </div>

                  <button
                    onClick={handleOpenAddFixedModal}
                    className="text-[11px] font-semibold text-[#0D3B2E] bg-[#E6F3EE] hover:bg-[#D1EBE2] border border-[#A7F3D0] px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Assigner une rubrique fixe
                  </button>
                </div>

                <p className="text-[11px] text-[#5A6065]">
                  Ces éléments définissent la structure de rémunération spécifique à ce poste. Ils sont conservés d'un mois sur l'autre.
                </p>

                {/* Ligne Salaire de Base */}
                <div className="p-2.5 rounded-md bg-[#F8F7F4] border border-[#E6E4DD] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#111315]">
                      R030 — Salaire de Base Conventionnel
                    </span>
                    <span className="text-[10px] text-[#5A6065]">
                      Base contractuelle sur 173,33h légales
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#111315]">
                    {formatDA(currentSalarie.salaire_base_theorique)}
                  </div>
                </div>

                {/* Liste des rubriques fixes attachées */}
                <div className="space-y-1.5">
                  {currentSalarie.rubriquesFixes.map((rub) => (
                    <div
                      key={rub.code}
                      className="p-2 rounded-md bg-white border border-[#E6E4DD] hover:border-[#D1CFBF] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-[#0D3B2E] shrink-0">
                          {rub.code}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[#111315] truncate">
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
                          className="w-24 bg-[#F8F7F4] border border-[#E6E4DD] rounded px-2 py-1 text-right font-mono font-semibold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                        <span className="text-[10px] text-[#94A3B8]">DA</span>

                        <button
                          onClick={() => handleRemoveFixedRubrique(rub.code)}
                          className="p-1 text-[#94A3B8] hover:text-[#991B1B] hover:bg-[#FEE2E2] rounded transition-colors"
                          title="Détacher cette rubrique fixe de ce collaborateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {currentSalarie.rubriquesFixes.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#94A3B8] border border-dashed border-[#E6E4DD] rounded-md">
                      Aucune prime fixe supplémentaire rattachée à ce poste.
                    </div>
                  )}
                </div>
              </div>

              {/* --------------------------------------------------------------
                  BLOC B : VARIABLES DU MOIS EN COURS (ACTIVITÉ RÉELLE)
                  -------------------------------------------------------------- */}
              <div className="bg-white border border-[#E6E4DD] rounded-lg p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E4DD] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0D3B2E]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                      2. Variables de la Période ({MOIS_FR[selectedMonth - 1]} {selectedYear})
                    </h3>
                  </div>

                  <span className="text-[10px] text-[#5A6065] font-mono">
                    Taux Horaire : {formatDA(currentBulletinCalc.tauxHoraire)}/h
                  </span>
                </div>

                {/* Absences déductibles (Loi 90-11) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#111315]">
                      Absences Déductibles (Loi 90-11)
                    </span>
                    <span className="font-mono text-xs font-bold text-[#991B1B]">
                      {currentBulletinCalc.retenueAbsence > 0
                        ? `-${formatDA(currentBulletinCalc.retenueAbsence)}`
                        : "0,00 DA"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD]">
                      <span className="text-xs text-[#5A6065]">Heures d'absence :</span>
                      <div className="flex items-center gap-1">
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
                          className="w-16 bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                        <span className="text-[10px] text-[#5A6065]">h</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD]">
                      <span className="text-xs text-[#5A6065]">Heures travaillées :</span>
                      <span className="font-mono font-bold text-xs text-[#111315]">
                        {currentBulletinCalc.heuresTravaillees} h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Heures Supplémentaires */}
                <div className="space-y-1.5 pt-2 border-t border-[#E6E4DD]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#111315]">
                      Heures Supplémentaires (Loi 90-11)
                    </span>
                    <span className="font-mono text-xs font-bold text-[#065F46]">
                      +{formatDA(currentBulletinCalc.totalHeuresSup)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD] flex flex-col gap-1">
                      <span className="text-[10px] text-[#5A6065]">HS 50% (P1)</span>
                      <input
                        type="number"
                        min="0"
                        value={currentVariables.hs50 === 0 ? "" : currentVariables.hs50}
                        placeholder="0"
                        onChange={(e) => handleVariableChange("hs50", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono text-xs outline-none focus:border-[#0D3B2E]"
                      />
                    </div>
                    <div className="p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD] flex flex-col gap-1">
                      <span className="text-[10px] text-[#5A6065]">HS 75% (P2)</span>
                      <input
                        type="number"
                        min="0"
                        value={currentVariables.hs75 === 0 ? "" : currentVariables.hs75}
                        placeholder="0"
                        onChange={(e) => handleVariableChange("hs75", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono text-xs outline-none focus:border-[#0D3B2E]"
                      />
                    </div>
                    <div className="p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD] flex flex-col gap-1">
                      <span className="text-[10px] text-[#5A6065]">HS 100% (P3)</span>
                      <input
                        type="number"
                        min="0"
                        value={currentVariables.hs100 === 0 ? "" : currentVariables.hs100}
                        placeholder="0"
                        onChange={(e) => handleVariableChange("hs100", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono text-xs outline-none focus:border-[#0D3B2E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Panier & Transport */}
                <div className="space-y-1.5 pt-2 border-t border-[#E6E4DD]">
                  <span className="text-xs font-semibold text-[#111315]">
                    Paniers & Transports du Mois (Hors Assiette CNAS)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#111315]">Jours Panier :</span>
                        <span className="text-[10px] text-[#94A3B8]">Taux : 300 DA/j</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="26"
                          value={currentVariables.joursPanier}
                          onChange={(e) =>
                            handleVariableChange("joursPanier", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-14 bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                        <span className="text-[10px] text-[#5A6065]">j</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-[#F8F7F4] border border-[#E6E4DD] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#111315]">Transport :</span>
                        <span className="text-[10px] text-[#94A3B8]">Base 173,33h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="100"
                          min="0"
                          value={currentVariables.forfaitTransport}
                          onChange={(e) =>
                            handleVariableChange("forfaitTransport", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-white border border-[#E6E4DD] rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs outline-none focus:border-[#0D3B2E]"
                        />
                        <span className="text-[10px] text-[#5A6065]">DA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retenues et Acomptes */}
                <div className="pt-2 border-t border-[#E6E4DD] flex items-center justify-between p-2 rounded bg-[#FEF3C7]/40 border-[#FDE68A]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#92400E]">
                      Acomptes & Avances sur Salaire à Déduire
                    </span>
                    <span className="text-[10px] text-[#92400E]/80">
                      Montant précompté sur le Net à Payer
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={currentVariables.avancesAcomptes === 0 ? "" : currentVariables.avancesAcomptes}
                      placeholder="0"
                      onChange={(e) =>
                        handleVariableChange("avancesAcomptes", parseFloat(e.target.value) || 0)
                      }
                      className="w-24 bg-white border border-[#E6E4DD] rounded px-2 py-1 text-right font-mono font-bold text-xs text-[#991B1B] outline-none focus:border-[#0D3B2E]"
                    />
                    <span className="text-[10px] text-[#92400E]">DA</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================================================================
            VOLET 3 : LE BULLETIN VIVANT OFFICIEL (0 MS LIVE CANVAS - 4 COLS)
            ================================================================== */}
        <div className="lg:col-span-4 bg-white border border-[#E6E4DD] rounded-lg p-5 shadow-xs flex flex-col justify-between h-[calc(100vh-160px)] sticky top-4 overflow-y-auto print:border-none print:shadow-none">
          {currentSalarie && currentVariables && currentBulletinCalc && (
            <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8F7F4] p-2.5 rounded border border-[#E6E4DD]">
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
                  <span className="font-semibold text-[#111315]">{currentSalarie.nom_prenom}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Emploi : </span>
                  <span className="text-[#111315]">{currentSalarie.fonction}</span>
                </div>
              </div>

              {/* Tableau officiel des lignes du bulletin */}
              <div className="border border-[#E6E4DD] rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#F2F0EC] border-b border-[#E6E4DD] text-[10px] text-[#5A6065]">
                    <tr>
                      <th className="py-1.5 px-2 text-left font-bold uppercase">Rubrique</th>
                      <th className="py-1.5 px-2 text-right font-bold uppercase">Gains</th>
                      <th className="py-1.5 px-2 text-right font-bold uppercase">Retenues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DD] font-mono text-[11px]">
                    {/* Salaire de base */}
                    <tr>
                      <td className="py-1 px-2 font-sans">R030 Salaire de Base (173,33h)</td>
                      <td className="py-1 px-2 text-right text-[#111315]">
                        {formatDA(currentSalarie.salaire_base_theorique, false)}
                      </td>
                      <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue absence */}
                    {currentBulletinCalc.retenueAbsence > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2 font-sans">
                          Retenue Absence ({currentVariables.heuresAbsence}h)
                        </td>
                        <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2 text-right">
                          {formatDA(currentBulletinCalc.retenueAbsence, false)}
                        </td>
                      </tr>
                    )}

                    {/* Rubriques fixes du poste */}
                    {currentSalarie.rubriquesFixes
                      .filter((r) => r.type_valeur === "Gain (+)")
                      .map((r) => (
                        <tr key={r.code}>
                          <td className="py-1 px-2 font-sans truncate max-w-[150px]">
                            {r.code} {r.libelle}
                          </td>
                          <td className="py-1 px-2 text-right text-[#111315]">
                            {formatDA(r.valeur_defaut, false)}
                          </td>
                          <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                        </tr>
                      ))}

                    {/* Heures sup */}
                    {currentBulletinCalc.totalHeuresSup > 0 && (
                      <tr>
                        <td className="py-1 px-2 font-sans">R120 Heures Supplémentaires</td>
                        <td className="py-1 px-2 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.totalHeuresSup, false)}
                        </td>
                        <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* SOUS-TOTAL : SALAIRE DE POSTE */}
                    <tr className="bg-[#F8F7F4] font-bold text-[#111315]">
                      <td className="py-1 px-2 font-sans">SALAIRE DE POSTE (CNAS)</td>
                      <td className="py-1 px-2 text-right">
                        {formatDA(currentBulletinCalc.salaireDePoste, false)}
                      </td>
                      <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue CNAS 9% */}
                    <tr>
                      <td className="py-1 px-2 font-sans">R950 Sécurité Sociale (9%)</td>
                      <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2 text-right text-[#991B1B]">
                        {formatDA(currentBulletinCalc.cnasSalariale, false)}
                      </td>
                    </tr>

                    {/* Panier & Transport */}
                    {currentBulletinCalc.montantPanier > 0 && (
                      <tr>
                        <td className="py-1 px-2 font-sans">
                          R250 Prime Panier ({currentVariables.joursPanier}j)
                        </td>
                        <td className="py-1 px-2 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.montantPanier, false)}
                        </td>
                        <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {currentBulletinCalc.montantTransport > 0 && (
                      <tr>
                        <td className="py-1 px-2 font-sans">R280 Indemnité Transport</td>
                        <td className="py-1 px-2 text-right text-[#111315]">
                          {formatDA(currentBulletinCalc.montantTransport, false)}
                        </td>
                        <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* BRUT TOTAL */}
                    <tr className="bg-[#F8F7F4] font-semibold text-[#111315]">
                      <td className="py-1 px-2 font-sans">SALAIRE BRUT TOTAL</td>
                      <td className="py-1 px-2 text-right">
                        {formatDA(currentBulletinCalc.salaireBrutTotal, false)}
                      </td>
                      <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* IRG Retenu Barème 2022 */}
                    <tr>
                      <td className="py-1 px-2 font-sans">
                        R980 IRG Barème (R: {formatDA(currentBulletinCalc.rTronqueIrg, false)})
                      </td>
                      <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2 text-right font-bold text-[#991B1B]">
                        {formatDA(currentBulletinCalc.irgRetenu, false)}
                      </td>
                    </tr>

                    {/* Acomptes */}
                    {currentVariables.avancesAcomptes > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2 font-sans">R999 Acomptes déduits</td>
                        <td className="py-1 px-2 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2 text-right">
                          {formatDA(currentVariables.avancesAcomptes, false)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ENCADRÉ NET À PAYER */}
              <div className="p-3.5 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#0D3B2E]">
                    NET À PAYER (CENTIME EXACT)
                  </span>
                  <span className="text-xl font-black font-mono text-[#0D3B2E]">
                    {formatDA(currentBulletinCalc.netAPayer)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#065F46] pt-1 border-t border-[#A7F3D0]/70">
                  <span>Coût Total Employeur (avec 25,5% CNAS) :</span>
                  <span className="font-mono font-bold">
                    {formatDA(currentBulletinCalc.coutTotalEmployeur)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Barre d'Actions Bas de Bulletin */}
          <div className="pt-3 border-t border-[#E6E4DD] space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveCurrentBulletin(true)}
                disabled={isSaving}
                className="btn-fintech-primary text-xs flex-1 justify-center py-2"
                title="Raccourci : Entrée"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Valider & Salarié Suivant (Entrée)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveCurrentBulletin(false)}
                disabled={isSaving}
                className="btn-fintech-secondary text-xs flex-1 justify-center"
                title="Raccourci : Ctrl+S"
              >
                <Save className="w-3.5 h-3.5 text-[#5A6065]" />
                Enregistrer (Ctrl+S)
              </button>

              <button
                onClick={() => window.print()}
                className="btn-fintech-secondary text-xs px-3"
                title="Imprimer le bulletin de paie officiel"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODALE D'ASSIGNATION DE RUBRIQUE FIXE AU POSTE
          ==================================================================== */}
      {isAddFixedModalOpen && currentSalarie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#111315]/40 backdrop-blur-xs"
            onClick={() => setIsAddFixedModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg border border-[#E6E4DD] shadow-xl max-w-lg w-full p-5 space-y-4 z-10">
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

            {/* Recherche dans le catalogue */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111315]">
                Choisir parmi les rubriques du catalogue officiel :
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Rechercher par code (R200, R202...) ou libellé (Nuisance, Astreinte...)"
                  value={rubriqueSearch}
                  onChange={(e) => setRubriqueSearch(e.target.value)}
                  className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded pl-8 pr-2.5 py-1 text-xs outline-none focus:border-[#0D3B2E]"
                />
              </div>

              {/* Liste de choix des rubriques */}
              <div className="max-h-48 overflow-y-auto border border-[#E6E4DD] rounded divide-y divide-[#E6E4DD] text-xs">
                {filteredCatalogue.map((cat) => (
                  <div
                    key={cat.code}
                    onClick={() => setSelectedRubriqueCode(cat.code)}
                    className={`p-2 cursor-pointer flex items-center justify-between transition-colors ${
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
                  className="w-full bg-white border border-[#E6E4DD] rounded px-3 py-1.5 font-mono font-bold text-sm text-[#111315] outline-none focus:border-[#0D3B2E]"
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
