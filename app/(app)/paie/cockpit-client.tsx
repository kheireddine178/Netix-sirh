"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
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
  calculerRetenueAbsence,
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
import { detecterModeRubrique } from "@/lib/paieCalcul";
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
import { FicheSaisieUnifiee } from "@/components/paie/FicheSaisieUnifiee";
import { type RubriqueLigne } from "@/components/paie/LigneRubrique";

/**
 * Calcule dynamiquement le montant d'une rubrique fixe (DA ou % du Salaire de Base Réel)
 * Conforme à la règle PC PAIE DLG : Primes % calculées sur salaire réel déduit des absences.
 */
export function calculerMontantRubriqueFixe(
  rub: RubriqueFixeAssignee,
  salaireBaseReel: number
): number {
  const mode = rub.mode_calcul || detecterModeRubrique(rub.code, rub.libelle);
  if (mode === "pourcentage") {
    const val = rub.valeur1 !== undefined ? rub.valeur1 : rub.valeur_defaut;
    const taux = val > 1 ? val / 100 : val;
    return round2(salaireBaseReel * taux);
  }
  if (mode === "nombre_x_taux") {
    if (rub.valeur1 !== undefined && rub.valeur2 !== undefined && rub.valeur2 > 0) {
      return round2(rub.valeur1 * rub.valeur2);
    }
    return Math.max(0, rub.valeur_defaut);
  }
  const val = rub.valeur1 !== undefined ? rub.valeur1 : rub.valeur_defaut;
  return Math.max(0, val);
}

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

  // Onglet actif (pour la modale profil uniquement)
  const [showProfilModal, setShowProfilModal] = useState<boolean>(false);

  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<number>(mois);
  const [selectedYear, setSelectedYear] = useState<number>(annee);
  const [isExplicationDrawerOpen, setIsExplicationDrawerOpen] = useState<boolean>(false);

  // Synchroniser l'état local si les props serveur changent (navigation d'un mois à un autre)
  useEffect(() => {
    setSelectedMonth(mois);
    setSelectedYear(annee);
    setVariablesMap(initialVariables);
    setSalaries(initialSalaries);
  }, [mois, annee, initialVariables, initialSalaries]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();

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
        joursPanier: 0,
        tauxPanier: 0,
        forfaitTransport: 0,
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

    // Calcul du salaire de base réel (déduit des heures d'absences)
    const retenueAbsence = calculerRetenueAbsence(currentVariables.heuresAbsence, currentSalarie.salaire_base_theorique);
    const salaireBaseReel = Math.max(0, currentSalarie.salaire_base_theorique - retenueAbsence);

    // Calcul de la somme des primes fixes cotisables du salarié (en DA ou % du base réel)
    const totalPrimesFixesCotisables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

    // Primes variables cotisables du mois
    const totalPrimesVariablesCotisables = currentVariables.primesVariables
      .filter((p) => p.cotisable)
      .reduce((acc, p) => acc + p.montant, 0);

    const totalPrimesCotisables = totalPrimesFixesCotisables + totalPrimesVariablesCotisables;

    // Primes non cotisables mais imposables (ex: primes de véhicule, téléphone)
    const totalPrimesNonCotisablesImposables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "NON" && (r.imposable === "OUI" || r.imposable === "IRG"))
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

    // Retenues spécifiques fixes (ex: mutuelle)
    const totalRetenuesFixes = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Retenue (-)")
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

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
      pourcentage: salaries.length > 0 ? Math.round((countValides / salaries.length) * 100) : 0,
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

        const rubriquesAEnregistrer = (currentSalarie.rubriquesFixes || []).map((r) => ({
          code: r.code,
          valeur1: r.valeur1 !== undefined ? r.valeur1 : r.valeur_defaut,
          valeur2: r.valeur2 || 0,
        }));

        const res = await sauvegarderBulletinIndividuel(
          currentSalarie.id,
          selectedYear,
          selectedMonth,
          currentSalarie.salaire_base_theorique,
          updatedVars,
          rubriquesAEnregistrer
        );

        if (res.success) {
          setSaveNotice(`✅ Bulletin de ${currentSalarie.nom_prenom} validé et enregistré !`);
        } else {
          setSaveNotice(`❌ Erreur enregistrement : ${res.error || "Échec de sauvegarde"}`);
        }
        setTimeout(() => setSaveNotice(null), 3500);

        if (passerAuSuivant && res.success) {
          handleSelectNext();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [currentSalarie, currentVariables, selectedYear, selectedMonth, handleSelectNext]
  );

  // Changement explicite de période avec sauvegarde du brouillon en cours et rechargement serveur
  const handlePeriodChange = useCallback(
    async (newYear: number, newMonth: number) => {
      if (newYear === selectedYear && newMonth === selectedMonth) return;
      if (currentSalarie && currentVariables) {
        try {
          await handleSaveCurrentBulletin(false);
        } catch (e) {
          console.warn("Auto-sauvegarde avant changement de période :", e);
        }
      }
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      router.push(`/paie?annee=${newYear}&mois=${newMonth}`);
    },
    [selectedYear, selectedMonth, currentSalarie, currentVariables, handleSaveCurrentBulletin, router]
  );

  // Ouverture des documents officiels avec auto-sauvegarde préalable pour garantir la cohérence en DB
  const handleOpenDocument = useCallback(
    async (type: "bulletin" | "calcul" | "charges" | "complet") => {
      if (!currentSalarie || !currentVariables) return;
      setIsSaving(true);
      try {
        await handleSaveCurrentBulletin(false);
      } catch (e) {
        console.warn("Auto-sauvegarde avant ouverture de document :", e);
      } finally {
        setIsSaving(false);
      }
      window.open(
        `/document-paie?id=${currentSalarie.id}&annee=${selectedYear}&mois=${selectedMonth}&type=${type}`,
        "_blank"
      );
    },
    [currentSalarie, currentVariables, selectedYear, selectedMonth, handleSaveCurrentBulletin]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showProfilModal) return;

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
  }, [handleSelectNext, handleSelectPrev, handleSaveCurrentBulletin, showProfilModal]);

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
      const res = await sauvegarderProfilSalarie(currentSalarie.id, currentSalarie);
      if (res.success) {
        setSaveNotice(`✅ Profil de ${currentSalarie.nom_prenom} mis à jour avec succès !`);
      } else {
        setSaveNotice(`❌ Erreur mise à jour profil : ${res.error || "Échec"}`);
      }
      setTimeout(() => setSaveNotice(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Assigner une rubrique fixe (depuis FicheSaisieUnifiee)
  const handleAssignerRubriquePermanente = async (rubrique: RubriqueLigne) => {
    if (!currentSalarie) return;
    const catItem = catalogue.find((c) => c.code === rubrique.code);
    if (!catItem) return;

    const valDef = (rubrique.mode === "nombre_x_taux" && (rubrique.valeur2 || 0) > 0)
      ? (rubrique.valeur1 * rubrique.valeur2)
      : rubrique.valeur1;

    const newRubrique: RubriqueFixeAssignee = {
      code: catItem.code,
      libelle: catItem.libelle,
      type_valeur: catItem.type_valeur,
      cotisable: catItem.cotisable,
      imposable: catItem.imposable,
      valeur_defaut: valDef,
      mode_calcul: rubrique.mode === "heures" ? "montant_fixe" : rubrique.mode as any,
      valeur1: rubrique.valeur1,
      valeur2: rubrique.valeur2,
    };

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === currentSalarie.id) {
          const filtered = s.rubriquesFixes.filter((r) => r.code !== rubrique.code);
          // Tri par code numérique après ajout
          const updated = [...filtered, newRubrique].sort((a, b) => {
            const na = parseInt(a.code.replace(/\D/g, ""), 10) || 0;
            const nb = parseInt(b.code.replace(/\D/g, ""), 10) || 0;
            return na - nb;
          });
          return { ...s, rubriquesFixes: updated };
        }
        return s;
      })
    );

    const res = await assignerRubriqueFixeSalarie(
      currentSalarie.id,
      catItem.code,
      rubrique.valeur1,
      rubrique.mode,
      rubrique.valeur2
    );
    if (res.success) {
      setSaveNotice(`📌 ${catItem.code} — ${catItem.libelle} attaché(e) au profil de ${currentSalarie.nom_prenom}`);
    } else {
      setSaveNotice(`❌ Erreur : ${res.error || "Échec assignation"}`);
    }
    setTimeout(() => setSaveNotice(null), 3500);
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

    const res = await retirerRubriqueFixeSalarie(currentSalarie.id, code);
    if (res.success) {
      setSaveNotice(`🗑️ Rubrique ${code} retirée du poste.`);
    } else {
      setSaveNotice(`❌ Erreur retrait rubrique : ${res.error || "Échec"}`);
    }
    setTimeout(() => setSaveNotice(null), 3500);
  };

  // Mettre à jour le montant et le taux d'une rubrique fixe
  const handleUpdateFixedRubriqueAmount = (code: string, v1: number, v2?: number) => {
    if (!currentSalarie) return;

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === currentSalarie.id) {
          return {
            ...s,
            rubriquesFixes: s.rubriquesFixes.map((r) => {
              if (r.code !== code) return r;
              const mode = r.mode_calcul || detecterModeRubrique(r.code, r.libelle);
              const val2 = v2 !== undefined ? v2 : (r.valeur2 ?? 0);
              const valDefaut = (mode === "nombre_x_taux" && val2 > 0) ? (v1 * val2) : v1;
              return {
                ...r,
                valeur_defaut: Math.max(0, valDefaut),
                valeur1: Math.max(0, v1),
                valeur2: Math.max(0, val2),
              };
            }),
          };
        }
        return s;
      })
    );
  };

  if (salaries.length === 0) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center p-6 text-center animate-in fade-in-50 duration-200">
        <div className="max-w-md w-full bg-white border border-[#E6E4DD] rounded-2xl p-8 shadow-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E6F3EE] text-[#0D3B2E] flex items-center justify-center mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#111315] mb-2">Aucun collaborateur enregistré</h2>
          <p className="text-sm text-[#5A6065] mb-6 leading-relaxed">
            Pour préparer et calculer les bulletins de paie, vous devez avoir des salariés actifs enregistrés dans votre base de données.
          </p>
          <Link
            href="/salaries/nouveau"
            className="btn-fintech-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter votre premier salarié</span>
          </Link>
          <div className="mt-4 pt-4 border-t border-[#E6E4DD] w-full text-xs text-[#5A6065] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0D3B2E]" />
            <span>Moteur conforme Loi 90-11 & barème DGI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)] pb-8 relative">
      {/* ====================================================================
          BARRE DE COMMANDE SUPÉRIEURE : LE COLLABORATEUR AU CENTRE
          ==================================================================== */}
      <header className="bg-white border border-[#F0EFEA] rounded-xl px-4 py-3 shadow-2xs mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Navigation rapide entre collaborateurs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton pour ouvrir le tiroir des collaborateurs */}
          <button
            onClick={() => setIsFleetDrawerOpen(true)}
            className="text-xs flex items-center gap-2 py-1.5 px-3 bg-[#FAF9F8] hover:bg-[#EEF4F0] border border-[#E4E4E7] hover:border-[#0D3B2E] rounded-lg transition-all cursor-pointer font-semibold text-[#111827] shadow-2xs"
            title="Ouvrir la liste complète des collaborateurs"
          >
            <Users className="w-3.5 h-3.5 text-[#0D3B2E]" />
            <span>Effectif ({stats.total})</span>
            <span className="text-[10px] bg-[#E6F3EE] text-[#0D3B2E] px-1.5 py-0.5 rounded font-mono font-bold">
              {stats.valides}/{stats.total}
            </span>
          </button>

          {/* Bouton Précédent */}
          <button
            onClick={handleSelectPrev}
            disabled={currentIdx <= 0}
            className="p-1.5 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#52525B] transition-colors cursor-pointer shadow-2xs"
            title="Salarié précédent (Raccourci: ↑)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Quick-Switcher Déroulant Instantané */}
          <div className="relative">
            <button
              onClick={() => setIsQuickSwitcherOpen(!isQuickSwitcherOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white hover:border-[#0D3B2E] transition-all cursor-pointer text-left shadow-2xs"
            >
              <div className="w-6 h-6 rounded bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentSalarie?.nom_prenom.charAt(0)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0D3B2E]">
                    {currentSalarie?.matricule}
                  </span>
                  <span className="text-xs font-semibold text-[#111827]">
                    {currentSalarie?.nom_prenom}
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A]">
                  {currentSalarie?.fonction} • {currentSalarie?.departement}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717A] ml-1" />
            </button>

            {/* Menu Pop-up du Quick Switcher */}
            {isQuickSwitcherOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-[#E4E4E7] rounded-xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                  <input
                    type="text"
                    placeholder="Chercher matricule, nom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#FAF9F8] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#F4F3F0] text-xs">
                  {filteredSalaries.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSalarieId(s.id);
                        setIsQuickSwitcherOpen(false);
                      }}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#FAF9F8] transition-colors ${
                        s.id === currentSalarie?.id ? "bg-[#E6F3EE] font-bold text-[#0D3B2E]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] shrink-0 text-[#71717A]">{s.matricule}</span>
                        <span className="truncate">{s.nom_prenom}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#71717A] shrink-0">
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
            className="p-1.5 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#52525B] transition-colors cursor-pointer shadow-2xs"
            title="Salarié suivant (Raccourci: ↓)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sélecteur Dynamique de Période (Mois / Année) & Actions Globales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#FAF9F8] border border-[#E4E4E7] rounded-lg px-2 py-1 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => {
                let prevM = selectedMonth - 1;
                let prevY = selectedYear;
                if (prevM < 1) {
                  prevM = 12;
                  prevY -= 1;
                }
                handlePeriodChange(prevY, prevM);
              }}
              className="p-1 hover:bg-white rounded text-[#71717A] hover:text-[#111827] transition-colors cursor-pointer"
              title="Mois précédent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <Calendar className="w-3.5 h-3.5 text-[#0D3B2E] ml-1 shrink-0" />

            <select
              value={selectedMonth}
              onChange={(e) => handlePeriodChange(selectedYear, Number(e.target.value))}
              className="bg-transparent font-bold text-[#111827] outline-none cursor-pointer text-xs pr-1"
              title="Sélectionner le mois de calcul"
            >
              {MOIS_FR.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => handlePeriodChange(Number(e.target.value), selectedMonth)}
              className="bg-transparent font-bold text-[#111827] outline-none cursor-pointer text-xs"
              title="Sélectionner l'année"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                let nextM = selectedMonth + 1;
                let nextY = selectedYear;
                if (nextM > 12) {
                  nextM = 1;
                  nextY += 1;
                }
                handlePeriodChange(nextY, nextM);
              }}
              className="p-1 hover:bg-white rounded text-[#71717A] hover:text-[#111827] transition-colors cursor-pointer"
              title="Mois suivant"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#E4E4E7] hidden sm:block" />

          <Link
            href={`/paie/cloture?annee=${selectedYear}&mois=${selectedMonth}`}
            className="text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] text-[#52525B] hover:text-[#0D3B2E] transition-all cursor-pointer font-medium shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E]" />
            <span>Clôture & Déclarations</span>
          </Link>

          {/* Bouton Agrandir Espace / Masquer Navigation */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] transition-all cursor-pointer font-medium shadow-2xs",
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
                <PanelLeftClose className="w-3.5 h-3.5 text-[#71717A]" />
                <span className="hidden xl:inline text-[#52525B]">Agrandir l'espace</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-[#0D3B2E]" />
                <span className="hidden xl:inline font-bold">Afficher Menu</span>
              </>
            )}
          </button>

          {/* Raccourci rappel */}
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#71717A] bg-[#FAF9F8] px-2.5 py-1 rounded-md border border-[#E4E4E7]">
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
          {currentSalarie && currentVariables ? (
            <FicheSaisieUnifiee
              key={currentSalarie.id}
              salaireBaseTheorique={currentSalarie.salaire_base_theorique}
              catalogue={catalogue || []}
              rubriquesFixes={currentSalarie.rubriquesFixes || []}

              hs50Init={currentVariables.hs50}
              hs75Init={currentVariables.hs75}
              hs100Init={currentVariables.hs100}

              maladie_hInit={currentVariables.heuresAbsence}
              miseAPied_hInit={0}
              retards_hInit={0}
              absenceIrreg_hInit={0}
              accidentTravail_hInit={0}

              joursPanierInit={currentVariables.joursPanier}
              tauxPanierInit={currentVariables.tauxPanier}

              onChangeSalaireBase={handleUpdateSalaireBase}
              onChangeHS={(hs50, hs75, hs100) => {
                handleVariableChange("hs50", hs50);
                handleVariableChange("hs75", hs75);
                handleVariableChange("hs100", hs100);
              }}
              onChangeAbsences={(total) => handleVariableChange("heuresAbsence", total)}
              onChangePanier={(jours, taux) => {
                handleVariableChange("joursPanier", jours);
                handleVariableChange("tauxPanier", taux);
              }}
              onAssignerRubriquePermanente={handleAssignerRubriquePermanente}
              onRetirerRubriquePermanente={async (code) => {
                await handleRemoveFixedRubrique(code);
              }}
              onUpdateRubriquePermanente={(code, v1, v2) => {
                handleUpdateFixedRubriqueAmount(code, v1, v2);
              }}

              isSaving={isSaving}
              onSave={handleSaveCurrentBulletin}
              onOpenProfil={() => setShowProfilModal(true)}

              nomSalarie={currentSalarie.nom_prenom}
              matricule={currentSalarie.matricule}
              fonction={currentSalarie.fonction}
              statut={currentVariables.statut}
            />
          ) : null}

          {/* Modale Profil RH (accessible via bouton dans FicheSaisieUnifiee) */}
          {showProfilModal && currentSalarie && (
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#111315]/50 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setShowProfilModal(false)}
            >
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E6E4DD] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between bg-[#F8F7F4]">
                  <div>
                    <h3 className="text-sm font-black text-[#111315]">Fiche RH — {currentSalarie.nom_prenom}</h3>
                    <p className="text-[11px] text-[#5A6065]">{currentSalarie.matricule} • {currentSalarie.type_contrat}</p>
                  </div>
                  <button onClick={() => setShowProfilModal(false)} className="p-1.5 rounded-lg text-[#5A6065] hover:bg-[#E6E4DD] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Fonction / Intitulé du Poste :</label>
                      <input type="text" value={currentSalarie.fonction} onChange={(e) => handleProfileFieldChange("fonction", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Service / Département :</label>
                      <input type="text" value={currentSalarie.departement} onChange={(e) => handleProfileFieldChange("departement", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Type de Contrat :</label>
                      <select value={currentSalarie.type_contrat} onChange={(e) => handleProfileFieldChange("type_contrat", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]">
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Stage/CTA">Stage / CTA</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Situation Familiale :</label>
                      <select value={currentSalarie.situation_familiale} onChange={(e) => handleProfileFieldChange("situation_familiale", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]">
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Veuf(ve)">Veuf(ve)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Enfants à charge :</label>
                      <input type="number" min="0" max="15" value={currentSalarie.enfants_a_charge}
                        onChange={(e) => handleProfileFieldChange("enfants_a_charge", parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Régime Fiscal IRG :</label>
                      <select value={currentSalarie.regime_irg} onChange={(e) => handleProfileFieldChange("regime_irg", e.target.value as any)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#0D3B2E]">
                        <option value="general">Régime Général</option>
                        <option value="particulier">Régime Particulier</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">N° Sécurité Sociale :</label>
                      <input type="text" value={currentSalarie.num_ss} onChange={(e) => handleProfileFieldChange("num_ss", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-[#0D3B2E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#111315] block mb-1">Compte / CCP / RIB :</label>
                      <input type="text" value={currentSalarie.ccp_rib} onChange={(e) => handleProfileFieldChange("ccp_rib", e.target.value)}
                        className="w-full bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-[#0D3B2E]" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#E6E4DD] flex justify-end gap-3">
                    <button onClick={() => setShowProfilModal(false)}
                      className="px-4 py-2 text-xs font-semibold border border-[#E6E4DD] rounded-xl text-[#5A6065] hover:bg-[#F2F0EC] cursor-pointer">
                      Fermer
                    </button>
                    <button onClick={async () => { await handleSaveProfile(); setShowProfilModal(false); }} disabled={isSaving}
                      className="px-4 py-2 text-xs font-bold bg-[#0D3B2E] text-white rounded-xl hover:bg-[#0a3025] flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                      <Save className="w-3.5 h-3.5" />
                      Enregistrer le profil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ==================================================================
            VOLET 2 : LE BULLETIN VIVANT OFFICIEL (5 COLS = ~42%)
            ================================================================== */}
        <section className="lg:col-span-5 bg-white border border-[#F0EFEA] rounded-xl p-5 shadow-xs sticky top-4 overflow-y-auto print:border-none print:shadow-none space-y-4">
          {currentSalarie && currentVariables && currentBulletinCalc && (
            <>
              {/* En-tête officiel du bulletin */}
              <div className="border-b border-[#F0EFEA] pb-3 text-center space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                  NETIX SIRH • SARL ENTREPRISE ALGER
                </span>
                <h3 className="text-sm font-black text-[#111827]">
                  BULLETIN DE PAIE OFFICIEL
                </h3>
                <p className="text-xs text-[#71717A]">
                  Période : {MOIS_FR[selectedMonth - 1]} {selectedYear}
                </p>
              </div>

              {/* Fiche récapitulative du salarié sur le bulletin */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F8] p-3 rounded-lg border border-[#F0EFEA]">
                <div>
                  <span className="text-[#71717A]">Matricule : </span>
                  <span className="font-mono font-bold text-[#111827]">{currentSalarie.matricule}</span>
                </div>
                <div>
                  <span className="text-[#71717A]">N° Sécurité Sociale : </span>
                  <span className="font-mono text-[10px] text-[#111827]">{currentSalarie.num_ss}</span>
                </div>
                <div>
                  <span className="text-[#71717A]">Nom : </span>
                  <span className="font-bold text-[#111827]">{currentSalarie.nom_prenom}</span>
                </div>
                <div>
                  <span className="text-[#71717A]">Emploi : </span>
                  <span className="text-[#111827]">{currentSalarie.fonction}</span>
                </div>
              </div>

              {/* Tableau officiel des rubriques */}
              <div className="border border-[#F0EFEA] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF9F8] border-b border-[#F0EFEA] text-[10px] text-[#71717A]">
                    <tr>
                      <th className="py-1.5 px-2.5 text-left font-bold uppercase">Rubrique</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase">Gains</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase">Retenues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F3F0] font-mono text-[11px]">
                    {/* Salaire de base */}
                    <tr>
                      <td className="py-1.5 px-2.5 font-sans">R030 Salaire de Base (173,33h)</td>
                      <td className="py-1.5 px-2.5 text-right text-[#111827]">
                        {formatDA(currentSalarie.salaire_base_theorique, false)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                    </tr>

                    {/* Retenue absence */}
                    {currentBulletinCalc.retenueAbsence > 0 && (
                      <tr className="text-[#991B1B] bg-[#FFF8F8]">
                        <td className="py-1.5 px-2.5 font-sans">
                          Retenue Absence ({currentVariables.heuresAbsence}h)
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                        <td className="py-1.5 px-2.5 text-right font-bold">
                          {formatDA(currentBulletinCalc.retenueAbsence, false)}
                        </td>
                      </tr>
                    )}

                    {/* Rubriques fixes du poste */}
                    {(() => {
                      const retenueAbs = currentVariables
                        ? calculerRetenueAbsence(currentVariables.heuresAbsence, currentSalarie.salaire_base_theorique)
                        : 0;
                      const baseReel = Math.max(0, currentSalarie.salaire_base_theorique - retenueAbs);

                      return currentSalarie.rubriquesFixes
                        .filter((r) => r.type_valeur === "Gain (+)")
                        .map((r) => {
                          const mode = r.mode_calcul || detecterModeRubrique(r.code, r.libelle);
                          const isPct = mode === "pourcentage" && r.valeur_defaut <= 100;
                          const montant = calculerMontantRubriqueFixe(r, baseReel);
                          return (
                            <tr key={r.code}>
                              <td className="py-1.5 px-2.5 font-sans truncate max-w-[150px]">
                                {r.code} {r.libelle} {isPct ? `(${r.valeur_defaut}%)` : ""}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[#111827]">
                                {formatDA(montant, false)}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                            </tr>
                          );
                        });
                    })()}

                    {/* Heures sup */}
                    {currentBulletinCalc.totalHeuresSup > 0 && (
                      <tr>
                        <td className="py-1.5 px-2.5 font-sans">R120 Heures Supplémentaires</td>
                        <td className="py-1.5 px-2.5 text-right text-[#111827]">
                          {formatDA(currentBulletinCalc.totalHeuresSup, false)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                      </tr>
                    )}

                    {/* Sous-total Salaire de Poste */}
                    <tr className="bg-[#F4FBF8] font-bold text-[#0D3B2E] border-t border-b border-[#F0EFEA]">
                      <td className="py-1.5 px-2.5 font-sans">Salaire de Poste (CNAS)</td>
                      <td className="py-1.5 px-2.5 text-right">
                        {formatDA(currentBulletinCalc.salaireDePoste, false)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                    </tr>

                    {/* Cotisation CNAS 9% */}
                    <tr>
                      <td className="py-1.5 px-2.5 font-sans">R950 Sécurité Sociale (9%)</td>
                      <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold text-[#991B1B]">
                        {formatDA(currentBulletinCalc.cnasSalariale, false)}
                      </td>
                    </tr>

                    {/* Panier & Transport */}
                    {currentBulletinCalc.montantPanier > 0 && (
                      <tr>
                        <td className="py-1.5 px-2.5 font-sans">
                          R250 Prime Panier ({currentVariables.joursPanier}j)
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-[#111827]">
                          {formatDA(currentBulletinCalc.montantPanier, false)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                      </tr>
                    )}

                    {currentBulletinCalc.montantTransport > 0 && (
                      <tr>
                        <td className="py-1.5 px-2.5 font-sans">R280 Indemnité Transport</td>
                        <td className="py-1.5 px-2.5 text-right text-[#111827]">
                          {formatDA(currentBulletinCalc.montantTransport, false)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                      </tr>
                    )}

                    {/* Salaire Brut */}
                    <tr className="bg-[#FAF9F8] font-bold text-[#111827] border-t border-b border-[#F0EFEA]">
                      <td className="py-1.5 px-2.5 font-sans">Salaire Brut Total Rémunéré</td>
                      <td className="py-1.5 px-2.5 text-right">
                        {formatDA(currentBulletinCalc.salaireBrutTotal, false)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                    </tr>

                    {/* Retenue IRG Barème 2022 */}
                    <tr>
                      <td className="py-1.5 px-2.5 font-sans">
                        R980 IRG Barème (R: {formatDA(currentBulletinCalc.rTronqueIrg, false)})
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold text-[#991B1B]">
                        {formatDA(currentBulletinCalc.irgRetenu, false)}
                      </td>
                    </tr>

                    {/* Retenues spécifiques fixes (ex: Mutuelle) */}
                    {(() => {
                      const retenueAbs = currentVariables
                        ? calculerRetenueAbsence(currentVariables.heuresAbsence, currentSalarie.salaire_base_theorique)
                        : 0;
                      const baseReel = Math.max(0, currentSalarie.salaire_base_theorique - retenueAbs);

                      return currentSalarie.rubriquesFixes
                        .filter((r) => r.type_valeur === "Retenue (-)")
                        .map((r) => {
                          const mode = r.mode_calcul || detecterModeRubrique(r.code, r.libelle);
                          const isPct = mode === "pourcentage" && r.valeur_defaut <= 100;
                          const montant = calculerMontantRubriqueFixe(r, baseReel);
                          return (
                            <tr key={r.code} className="text-[#991B1B]">
                              <td className="py-1.5 px-2.5 font-sans truncate max-w-[150px]">
                                {r.code} {r.libelle} {isPct ? `(${r.valeur_defaut}%)` : ""}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                              <td className="py-1.5 px-2.5 text-right font-semibold text-[#991B1B]">
                                {formatDA(montant, false)}
                              </td>
                            </tr>
                          );
                        });
                    })()}

                    {/* Acomptes */}
                    {currentVariables.avancesAcomptes > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1.5 px-2.5 font-sans">R999 Acomptes déduits</td>
                        <td className="py-1.5 px-2.5 text-right text-[#A1A1AA]">—</td>
                        <td className="py-1.5 px-2.5 text-right font-semibold">
                          {formatDA(currentVariables.avancesAcomptes, false)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ENCADRÉ NET À PAYER ZEN & ÉLÉGANT */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#F4FBF8] to-[#E6F3EE] border border-[#A7F3D0]/70 space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#065F46]">
                    Net à Payer au Salarié
                  </span>
                  <span className="text-2xl font-black tabular-nums text-[#0D3B2E]">
                    {formatDA(currentBulletinCalc.netAPayer)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#065F46] pt-1.5 border-t border-[#A7F3D0]/60">
                  <span>Coût Total Employeur (avec 25,5% CNAS) :</span>
                  <span className="tabular-nums font-bold">
                    {formatDA(currentBulletinCalc.coutTotalEmployeur)}
                  </span>
                </div>
              </div>

              {/* Action Bar Sticky & Unique */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleSaveCurrentBulletin(true)}
                  disabled={isSaving}
                  className="w-full justify-center py-2.5 bg-[#0D3B2E] hover:bg-[#092B21] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  title="Valider le bulletin et charger le salarié suivant (Entrée)"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Valider & Salarié Suivant (Entrée)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveCurrentBulletin(false)}
                    disabled={isSaving}
                    className="flex-1 justify-center py-2 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] text-xs font-medium text-[#52525B] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    title="Sauvegarder sans changer de salarié (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>Enregistrer (Ctrl+S)</span>
                  </button>

                  <button
                    onClick={() => handleOpenDocument("bulletin")}
                    className="px-3 py-2 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAF9F8] text-xs font-medium text-[#52525B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Ouvrir la fiche de paie officielle dans un nouvel onglet"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>Imprimer</span>
                  </button>
                </div>

                {/* MODULE D'ÉDITION DES 3 DOCUMENTS DE PAIE (SYNCHRONISÉ) */}
                <div className="pt-3 border-t border-[#F0EFEA] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111827]">
                      Fiches & Justificatifs Réglementaires :
                    </span>
                    <span className="text-[10px] text-[#0D3B2E] font-medium bg-[#E6F3EE] px-2 py-0.5 rounded-full">
                      {MOIS_FR[selectedMonth - 1]} {selectedYear}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleOpenDocument("bulletin")}
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
                      onClick={() => setIsExplicationDrawerOpen(true)}
                      className="p-2 rounded-lg border border-[#0D3B2E]/40 bg-[#F4F9F6] hover:bg-[#E6F3EE] hover:border-[#0D3B2E] text-[#0D3B2E] transition-all flex items-center gap-2 cursor-pointer text-left shadow-2xs"
                      title="Ouvrir l'explication pédagogique en direct pour le mois sélectionné"
                    >
                      <Calculator className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">2. Explication Calcul</span>
                        <span className="text-[9px] text-[#065F46] font-semibold">Live & Formules</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleOpenDocument("charges")}
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
                      onClick={() => handleOpenDocument("complet")}
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

      {/* ── VOLET LATÉRAL D'EXPLICATION DU CALCUL DE PAIE (LIVE & PÉDAGOGIQUE) ── */}
      <Drawer
        isOpen={isExplicationDrawerOpen}
        onClose={() => setIsExplicationDrawerOpen(false)}
        title="Explication Détaillée du Calcul de Paie"
        description={`${currentSalarie?.nom_prenom} (${currentSalarie?.matricule}) · Période : ${MOIS_FR[selectedMonth - 1]} ${selectedYear}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsExplicationDrawerOpen(false)}
              className="btn-fintech-secondary text-xs py-2 px-3"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => handleOpenDocument("calcul")}
              className="btn-fintech-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ouvrir la Note Officielle PDF</span>
            </button>
          </div>
        }
      >
        {currentBulletinCalc && currentSalarie && currentVariables && (
          <div className="flex flex-col gap-4 text-xs">
            {/* Bannière Période et Statut */}
            <div className="p-3 rounded-xl bg-[#F4F9F6] border border-[#A7F3D0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0D3B2E]" />
                <span className="font-bold text-[#0D3B2E]">
                  Période active : {MOIS_FR[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  currentVariables.statut === "Validé"
                    ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                    : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                )}
              >
                {currentVariables.statut || "Brouillon en cours"}
              </span>
            </div>

            {/* Étape 1 : Loi 90-11 & Temps de Travail */}
            <div className="p-4 rounded-xl bg-white border border-[#E6E4DD] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span className="font-bold text-[#111315]">
                    Temps de Travail Légal & Salaire de Base (Loi 90-11)
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#5A6065]">173,33 h/mois</span>
              </div>
              <p className="text-[11px] text-[#5A6065] leading-relaxed">
                Durée légale mensuelle : <strong>173,33 heures</strong>. Le taux horaire sert de référence pour valoriser le travail effectif et déduire les absences.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD]">
                  <span className="text-[10px] text-[#5A6065] block">Taux horaire de base :</span>
                  <strong className="text-[#111315] font-mono">
                    {formatDA(currentSalarie.salaire_base_theorique)} ÷ 173,33 = {formatDA(currentBulletinCalc.tauxHoraire)}/h
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD]">
                  <span className="text-[10px] text-[#5A6065] block">Heures payées :</span>
                  <strong className="text-[#0D3B2E] font-mono">
                    {currentBulletinCalc.heuresTravaillees} h
                    {currentVariables.heuresAbsence > 0 ? ` (-${currentVariables.heuresAbsence}h absence)` : " (Temps plein)"}
                  </strong>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E6E4DD] text-[11px]">
                <span className="text-[#5A6065]">Salaire de base réel (après déduction absences) :</span>
                <strong className="font-mono text-[#111315]">{formatDA(currentBulletinCalc.salaireBase)}</strong>
              </div>
            </div>

            {/* Étape 2 : Cotisation Sécurité Sociale CNAS (9%) */}
            <div className="p-4 rounded-xl bg-white border border-[#E6E4DD] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span className="font-bold text-[#111315]">
                    Sécurité Sociale · Décret n°06-373 & Ord. n°95-01
                  </span>
                </div>
                <span className="font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full text-[10px]">
                  Taux légal 9,00%
                </span>
              </div>
              <p className="text-[11px] text-[#5A6065] leading-relaxed">
                L'assiette cotisable correspond au <strong>Salaire de Poste</strong>. Les indemnités de panier ({formatDA(currentBulletinCalc.montantPanier)}) et de transport ({formatDA(currentBulletinCalc.montantTransport)}) sont exonérées de cotisations CNAS selon l'Art. 1 de l'Ordonnance n°95-01.
              </p>
              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5A6065]">Assiette cotisable (Salaire de Poste) :</span>
                  <strong className="font-mono text-[#111315]">{formatDA(currentBulletinCalc.salaireDePoste)}</strong>
                </div>
                <div className="flex justify-between text-[#991B1B]">
                  <span>Cotisation CNAS Salariale (9,00%) :</span>
                  <strong className="font-mono">- {formatDA(currentBulletinCalc.cnasSalariale)}</strong>
                </div>
                <div className="flex justify-between text-[#5A6065]">
                  <span>Cotisation CNAS Patronale (26,00%) :</span>
                  <span className="font-mono">{formatDA(currentBulletinCalc.cnasPatronale)}</span>
                </div>
              </div>
            </div>

            {/* Étape 3 : Impôt sur le Revenu Global (IRG Art. 104) */}
            <div className="p-4 rounded-xl bg-white border border-[#E6E4DD] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span className="font-bold text-[#111315]">
                    Fiscalité des Salaires · Art. 104 CIDTA / LF 2022-2024
                  </span>
                </div>
                <span className="text-[10px] text-[#5A6065] font-mono">Troncature à 10 DA</span>
              </div>
              <p className="text-[11px] text-[#5A6065] leading-relaxed">
                Base imposable tronquée à la dizaine de dinar inférieure : <strong>{formatDA(currentBulletinCalc.rTronqueIrg)}</strong>.
                Barème progressif avec abattement général de 40% (plafonné à 1 500 DA / minimum 1 000 DA).
              </p>
              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5A6065]">Base Imposable IRG :</span>
                  <strong className="font-mono text-[#111315]">{formatDA(currentBulletinCalc.baseIrg)}</strong>
                </div>
                <div className="flex justify-between text-[#5A6065]">
                  <span>IRG Brut barème légal :</span>
                  <span className="font-mono">{formatDA(currentBulletinCalc.detailIrg.irgBrutBareme)}</span>
                </div>
                <div className="flex justify-between text-[#065F46]">
                  <span>Abattement légal (40% / dégressif) :</span>
                  <strong className="font-mono">- {formatDA(currentBulletinCalc.detailIrg.abattementTotal)}</strong>
                </div>
                <div className="flex justify-between text-[#991B1B] font-bold border-t border-[#E6E4DD] pt-1 mt-1">
                  <span>IRG Net à retenir :</span>
                  <span className="font-mono">- {formatDA(currentBulletinCalc.irgRetenu)}</span>
                </div>
              </div>
            </div>

            {/* Étape 4 : Récapitulatif Final */}
            <div className="p-4 rounded-xl bg-[#0D3B2E] text-white space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0] block">
                Synthèse Financière du Mois ({MOIS_FR[selectedMonth - 1]} {selectedYear})
              </span>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-semibold">Net à Payer au Collaborateur :</span>
                <span className="text-xl font-mono font-black text-white">{formatDA(currentBulletinCalc.netAPayer)}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-[#A7F3D0] border-t border-white/20 pt-1.5 mt-1">
                <span>Coût Total Employeur (avec DAC 34,5%) :</span>
                <span className="font-mono font-bold text-white">{formatDA(currentBulletinCalc.coutTotalEmployeur)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
