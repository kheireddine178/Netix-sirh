"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  User,
  ChevronRight,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RubriqueCatalogueItem, type RubriqueFixeAssignee } from "@/app/(app)/paie/actions";
import { detecterModeRubrique } from "@/lib/paieCalcul";
import { LigneRubrique, type RubriqueLigne, type ModeRubrique } from "./LigneRubrique";
import { CatalogueRubriqueModal } from "./CatalogueRubriqueModal";

// ------------------------------------------------------------------
// Définitions des rubriques variables du système
// ------------------------------------------------------------------

const HS_CONFIGS: Record<string, { label: string; majoration: number }> = {
  R061: { label: "Heures Sup. +50% (Palier 1)", majoration: 1.5 },
  R065: { label: "Heures Sup. +75% (Palier 2)", majoration: 1.75 },
  R066: { label: "Heures Sup. +100% (Palier 3)", majoration: 2.0 },
};

const ABSENCES_CONFIGS: Record<string, string> = {
  R650: "Absence Maladie",
  R652: "Retards",
  R655: "Absence Irrégulière",
  R651: "Mise à Pied",
  R656: "Accident de Travail",
};

interface Props {
  salaireBaseTheorique: number;
  catalogue: RubriqueCatalogueItem[];
  rubriquesFixes: RubriqueFixeAssignee[];

  // HS initiales
  hs50Init: number;
  hs75Init: number;
  hs100Init: number;

  // Absences initiales
  maladie_hInit: number;
  miseAPied_hInit: number;
  retards_hInit: number;
  absenceIrreg_hInit: number;
  accidentTravail_hInit: number;

  // Panier initial
  joursPanierInit: number;
  tauxPanierInit: number;

  // Callbacks vers le parent
  onChangeSalaireBase: (v: number) => void;
  onChangeHS: (hs50: number, hs75: number, hs100: number) => void;
  onChangeAbsences: (totalHeures: number) => void;
  onChangePanier: (jours: number, taux: number) => void;
  onAssignerRubriquePermanente: (rubrique: RubriqueLigne) => Promise<void>;
  onRetirerRubriquePermanente: (code: string) => Promise<void>;
  onUpdateRubriquePermanente: (code: string, valeur1: number, valeur2?: number) => void;

  // Sauvegarde
  isSaving: boolean;
  onSave: (passerAuSuivant: boolean) => void;
  onOpenProfil: () => void;

  nomSalarie: string;
  matricule: string;
  fonction: string;
  statut: string;
}

const BASE_HORAIRE_LEGALE = 173.33;

function codeToNum(code: string): number {
  return parseInt(code.replace(/\D/g, ""), 10) || 0;
}

function formatDA(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "0,00 DA";
  const parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${parts[0]},${parts[1]} DA`;
}

function rubriqueFixeToLigne(r: RubriqueFixeAssignee): RubriqueLigne {
  const mode = (r.mode_calcul as ModeRubrique) ||
    (detecterModeRubrique(r.code, r.libelle) as ModeRubrique);
  const val1 = r.valeur1 !== undefined ? r.valeur1 : r.valeur_defaut;
  const val2 = r.valeur2 !== undefined ? r.valeur2 : (mode === "nombre_x_taux" ? (val1 > 0 ? 1 : 0) : 0);
  return {
    code: r.code,
    libelle: r.libelle,
    type: r.type_valeur === "Retenue (-)" ? "retenue" : "gain",
    mode,
    valeur1: val1,
    valeur2: val2,
    cotisable: r.cotisable === "OUI",
    imposable:
      r.imposable === "OUI" || r.imposable === "IRG" ? "irg" : "non_imposable",
    estPermanente: true,
  };
}

export function FicheSaisieUnifiee({
  salaireBaseTheorique,
  catalogue,
  rubriquesFixes,
  hs50Init,
  hs75Init,
  hs100Init,
  maladie_hInit,
  miseAPied_hInit,
  retards_hInit,
  absenceIrreg_hInit,
  accidentTravail_hInit,
  joursPanierInit,
  tauxPanierInit,
  onChangeSalaireBase,
  onChangeHS,
  onChangeAbsences,
  onChangePanier,
  onAssignerRubriquePermanente,
  onRetirerRubriquePermanente,
  onUpdateRubriquePermanente,
  isSaving,
  onSave,
  onOpenProfil,
  nomSalarie,
  matricule,
  fonction,
  statut,
}: Props) {
  // ── État local des HS ──
  const [hs, setHs] = useState({
    R061: hs50Init || 0,
    R065: hs75Init || 0,
    R066: hs100Init || 0,
  });

  // Progressive disclosure : quelles HS afficher (seulement celles > 0 ou explicitement ouvertes)
  const [visibleHsCodes, setVisibleHsCodes] = useState<string[]>(() => {
    const list: string[] = [];
    if (hs50Init > 0) list.push("R061");
    if (hs75Init > 0) list.push("R065");
    if (hs100Init > 0) list.push("R066");
    return list;
  });

  // ── État local des absences (par code) ──
  const [absences, setAbsences] = useState({
    R650: maladie_hInit || 0,
    R651: miseAPied_hInit || 0,
    R652: retards_hInit || 0,
    R655: absenceIrreg_hInit || 0,
    R656: accidentTravail_hInit || 0,
  });

  // Progressive disclosure : quelles absences afficher
  const [visibleAbsenceCodes, setVisibleAbsenceCodes] = useState<string[]>(() => {
    const list: string[] = [];
    if (maladie_hInit > 0) list.push("R650");
    if (retards_hInit > 0) list.push("R652");
    if (absenceIrreg_hInit > 0) list.push("R655");
    if (miseAPied_hInit > 0) list.push("R651");
    if (accidentTravail_hInit > 0) list.push("R656");
    return list;
  });

  // ── Panier ──
  const [joursPanier, setJoursPanier] = useState(joursPanierInit || 0);
  const [tauxPanier, setTauxPanier] = useState(tauxPanierInit || 0);
  const [isPanierVisible, setIsPanierVisible] = useState(
    () => joursPanierInit > 0 || tauxPanierInit > 0
  );

  // Synchronisation si le salarié sélectionné change
  useEffect(() => {
    setHs({
      R061: hs50Init || 0,
      R065: hs75Init || 0,
      R066: hs100Init || 0,
    });
    const hsList: string[] = [];
    if (hs50Init > 0) hsList.push("R061");
    if (hs75Init > 0) hsList.push("R065");
    if (hs100Init > 0) hsList.push("R066");
    setVisibleHsCodes(hsList);

    setAbsences({
      R650: maladie_hInit || 0,
      R651: miseAPied_hInit || 0,
      R652: retards_hInit || 0,
      R655: absenceIrreg_hInit || 0,
      R656: accidentTravail_hInit || 0,
    });
    const absList: string[] = [];
    if (maladie_hInit > 0) absList.push("R650");
    if (retards_hInit > 0) absList.push("R652");
    if (absenceIrreg_hInit > 0) absList.push("R655");
    if (miseAPied_hInit > 0) absList.push("R651");
    if (accidentTravail_hInit > 0) absList.push("R656");
    setVisibleAbsenceCodes(absList);

    setJoursPanier(joursPanierInit || 0);
    setTauxPanier(tauxPanierInit || 0);
    setIsPanierVisible(joursPanierInit > 0 || tauxPanierInit > 0);
  }, [
    hs50Init,
    hs75Init,
    hs100Init,
    maladie_hInit,
    miseAPied_hInit,
    retards_hInit,
    absenceIrreg_hInit,
    accidentTravail_hInit,
    joursPanierInit,
    tauxPanierInit,
  ]);

  // ── Salaire de base avec formatage virgule ──
  const formatVirgule = (val: number): string => {
    if (!val && val !== 0) return "0,00";
    return val.toFixed(2).replace(".", ",");
  };

  const [salaireBaseInput, setSalaireBaseInput] = useState<string>(() =>
    formatVirgule(salaireBaseTheorique)
  );
  const [isBaseFocused, setIsBaseFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isBaseFocused) {
      setSalaireBaseInput(formatVirgule(salaireBaseTheorique));
    }
  }, [salaireBaseTheorique, isBaseFocused]);

  // ── Modale d'ajout catalogue ──
  const [modalType, setModalType] = useState<"gain" | "retenue" | null>(null);

  // ── Menus déroulants d'ajout rapide (Progressive Disclosure) ──
  const [showAddGainMenu, setShowAddGainMenu] = useState(false);
  const [showAddRetenueMenu, setShowAddRetenueMenu] = useState(false);
  const addGainMenuRef = useRef<HTMLDivElement>(null);
  const addRetenueMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addGainMenuRef.current && !addGainMenuRef.current.contains(event.target as Node)) {
        setShowAddGainMenu(false);
      }
      if (addRetenueMenuRef.current && !addRetenueMenuRef.current.contains(event.target as Node)) {
        setShowAddRetenueMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Calculs dérivés ──
  const totalHeuresAbsence = useMemo(
    () => Object.values(absences).reduce((s, v) => s + v, 0),
    [absences]
  );

  const tauxHoraire = useMemo(
    () => (salaireBaseTheorique > 0 ? salaireBaseTheorique / BASE_HORAIRE_LEGALE : 0),
    [salaireBaseTheorique]
  );

  const salaireBaseReel = useMemo(
    () => Math.max(0, salaireBaseTheorique - tauxHoraire * totalHeuresAbsence),
    [salaireBaseTheorique, tauxHoraire, totalHeuresAbsence]
  );

  // ── Rubriques permanentes (gain) triées ──
  const rubriquesGainPermanentes = useMemo(() => {
    return (rubriquesFixes || [])
      .filter((r) => r.type_valeur === "Gain (+)")
      .map(rubriqueFixeToLigne)
      .sort((a, b) => codeToNum(a.code) - codeToNum(b.code));
  }, [rubriquesFixes]);

  // ── Rubriques permanentes (retenue, hors absences) triées ──
  const rubriquesRetenuePermanentes = useMemo(() => {
    const absenceCodes = Object.keys(ABSENCES_CONFIGS);
    return (rubriquesFixes || [])
      .filter((r) => r.type_valeur === "Retenue (-)" && !absenceCodes.includes(r.code))
      .map(rubriqueFixeToLigne)
      .sort((a, b) => codeToNum(a.code) - codeToNum(b.code));
  }, [rubriquesFixes]);

  // ── Codes déjà présents ──
  const codesExistants = useMemo(
    () => (rubriquesFixes || []).map((r) => r.code),
    [rubriquesFixes]
  );

  // ── Callbacks HS & Absences ──
  const handleHsChange = useCallback(
    (code: string, val: number) => {
      setHs((prev) => {
        const next = { ...prev, [code]: val };
        onChangeHS(next.R061, next.R065, next.R066);
        return next;
      });
    },
    [onChangeHS]
  );

  const handleRemoveHs = useCallback(
    (code: string) => {
      setHs((prev) => {
        const next = { ...prev, [code]: 0 };
        onChangeHS(next.R061, next.R065, next.R066);
        return next;
      });
      setVisibleHsCodes((prev) => prev.filter((c) => c !== code));
    },
    [onChangeHS]
  );

  const handleAbsenceChange = useCallback(
    (code: string, val: number) => {
      setAbsences((prev) => {
        const next = { ...prev, [code]: val };
        const total = Object.values(next).reduce((s, v) => s + v, 0);
        onChangeAbsences(total);
        return next;
      });
    },
    [onChangeAbsences]
  );

  const handleRemoveAbsence = useCallback(
    (code: string) => {
      setAbsences((prev) => {
        const next = { ...prev, [code]: 0 };
        const total = Object.values(next).reduce((s, v) => s + v, 0);
        onChangeAbsences(total);
        return next;
      });
      setVisibleAbsenceCodes((prev) => prev.filter((c) => c !== code));
    },
    [onChangeAbsences]
  );

  const handlePanierChange = useCallback(
    (jours: number, taux: number) => {
      setJoursPanier(jours);
      setTauxPanier(taux);
      onChangePanier(jours, taux);
    },
    [onChangePanier]
  );

  const handleRemovePanier = useCallback(() => {
    setJoursPanier(0);
    setTauxPanier(0);
    setIsPanierVisible(false);
    onChangePanier(0, 0);
  }, [onChangePanier]);

  // ── Total gains ──
  const totalGains = useMemo(() => {
    let t = 0;
    Object.entries(hs).forEach(([code, val]) => {
      const cfg = HS_CONFIGS[code];
      t += val * tauxHoraire * (cfg?.majoration || 1);
    });
    rubriquesGainPermanentes.forEach((r) => {
      if (r.mode === "pourcentage") {
        const taux = r.valeur1 > 1 ? r.valeur1 / 100 : r.valeur1;
        t += salaireBaseReel * taux;
      } else if (r.mode === "nombre_x_taux") {
        const rate = r.valeur2 && r.valeur2 > 0 ? r.valeur2 : 1;
        t += r.valeur1 * rate;
      } else {
        t += r.valeur1;
      }
    });
    if (isPanierVisible) {
      t += joursPanier * tauxPanier;
    }
    return t;
  }, [hs, tauxHoraire, rubriquesGainPermanentes, salaireBaseReel, isPanierVisible, joursPanier, tauxPanier]);

  // ── Total retenues ──
  const totalRetenues = useMemo(() => {
    let t = totalHeuresAbsence * tauxHoraire;
    rubriquesRetenuePermanentes.forEach((r) => {
      if (r.mode === "nombre_x_taux") {
        const rate = r.valeur2 && r.valeur2 > 0 ? r.valeur2 : 1;
        t += r.valeur1 * rate;
      } else {
        t += r.valeur1;
      }
    });
    return t;
  }, [totalHeuresAbsence, tauxHoraire, rubriquesRetenuePermanentes]);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════
          0. IDENTITÉ SALARIÉ (Clean Zen Pill)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#F0EFEA] rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {nomSalarie.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#111827] truncate">{nomSalarie}</h2>
              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 bg-[#F4F4F5] rounded text-[#52525B] shrink-0">
                {matricule}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                  statut === "Validé"
                    ? "bg-[#E6F3EE] text-[#065F46]"
                    : "bg-[#FEF3C7] text-[#92400E]"
                )}
              >
                {statut}
              </span>
            </div>
            <p className="text-xs text-[#71717A] truncate mt-0.5">{fonction}</p>
          </div>
        </div>

        <button
          onClick={onOpenProfil}
          className="flex items-center gap-1 text-xs font-medium text-[#52525B] hover:text-[#0D3B2E] hover:bg-[#F4F4F5] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <User className="w-3.5 h-3.5" />
          <span>Fiche RH</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          1. SALAIRE DE BASE (R030) — Focus Typographique
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#F0EFEA] rounded-xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#71717A]">
              R030 • Salaire de Base Théorique
            </span>
            <p className="text-xs text-[#71717A] mt-0.5">
              173,33h/mois • Taux horaire :{" "}
              <span className="font-mono font-medium text-[#111827]">
                {formatDA(tauxHoraire)}/h
              </span>
            </p>
          </div>
          {totalHeuresAbsence > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-[#991B1B]">Base réelle après déduction :</span>
              <p className="font-mono font-bold text-xs text-[#065F46]">
                {formatDA(salaireBaseReel)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={isBaseFocused ? salaireBaseInput : formatVirgule(salaireBaseTheorique)}
            placeholder="0,00"
            onFocus={() => {
              setIsBaseFocused(true);
              setSalaireBaseInput(formatVirgule(salaireBaseTheorique));
            }}
            onChange={(e) => {
              const raw = e.target.value;
              setSalaireBaseInput(raw);
              const cleanNum = parseFloat(raw.replace(/\s/g, "").replace(",", "."));
              if (!isNaN(cleanNum) && isFinite(cleanNum)) {
                onChangeSalaireBase(cleanNum);
              }
            }}
            onBlur={() => {
              setIsBaseFocused(false);
              const cleanNum = parseFloat(
                salaireBaseInput.replace(/\s/g, "").replace(",", ".")
              );
              const finalVal = isNaN(cleanNum) ? 0 : cleanNum;
              setSalaireBaseInput(formatVirgule(finalVal));
              onChangeSalaireBase(finalVal);
            }}
            className="flex-1 bg-[#FAF9F8] border border-[#E4E4E7] rounded-lg px-3.5 py-2 text-right font-mono font-bold text-lg text-[#111827] outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20 transition-all"
          />
          <span className="text-xs font-mono font-bold text-[#71717A] shrink-0">DA</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. SECTION GAINS & PRIMES (Progressive Disclosure)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#F0EFEA] rounded-xl shadow-2xs overflow-hidden">
        {/* En-tête Zen Minimaliste */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF9F8] border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#065F46]" />
            <span className="text-xs font-bold text-[#111827] tracking-tight">
              Gains & Primes
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#065F46] tabular-nums">
              +{formatDA(totalGains)}
            </span>

            {/* Menu Popover Ajouter */}
            <div className="relative" ref={addGainMenuRef}>
              <button
                type="button"
                onClick={() => setShowAddGainMenu(!showAddGainMenu)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0D3B2E] bg-white border border-[#E4E4E7] hover:border-[#0D3B2E] px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              </button>

              {showAddGainMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-50 p-1.5 space-y-1 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowAddGainMenu(false);
                      setModalType("gain");
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F4F4F5] font-semibold text-[#111827] flex items-center justify-between cursor-pointer"
                  >
                    <span>Prime du catalogue...</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#0D3B2E]" />
                  </button>

                  <div className="h-px bg-[#F4F4F5] my-1" />
                  <div className="px-2 py-0.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                    Heures Supplémentaires
                  </div>

                  {Object.entries(HS_CONFIGS).map(([code, cfg]) => {
                    const isAlreadyVisible = visibleHsCodes.includes(code);
                    return (
                      <button
                        key={code}
                        disabled={isAlreadyVisible}
                        onClick={() => {
                          if (!isAlreadyVisible) {
                            setVisibleHsCodes((prev) => [...prev, code]);
                          }
                          setShowAddGainMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer",
                          isAlreadyVisible
                            ? "opacity-50 cursor-not-allowed bg-[#F4F4F5] text-[#A1A1AA]"
                            : "hover:bg-[#E6F3EE] text-[#065F46]"
                        )}
                      >
                        <span>{cfg.label}</span>
                        <span className="font-mono text-[10px] text-[#71717A]">{code}</span>
                      </button>
                    );
                  })}

                  <div className="h-px bg-[#F4F4F5] my-1" />

                  <button
                    disabled={isPanierVisible}
                    onClick={() => {
                      setIsPanierVisible(true);
                      setShowAddGainMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer",
                      isPanierVisible
                        ? "opacity-50 cursor-not-allowed bg-[#F4F4F5] text-[#A1A1AA]"
                        : "hover:bg-[#E6F3EE] text-[#065F46]"
                    )}
                  >
                    <span>Indemnité de Panier (R250)</span>
                    <span className="font-mono text-[10px] text-[#71717A]">Nb × Taux</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lignes Actives (Uniquement ce qui compte) */}
        <div className="divide-y divide-[#F4F3F0]">
          {/* 1. Primes permanentes du poste */}
          {rubriquesGainPermanentes.map((rub) => (
            <LigneRubrique
              key={rub.code}
              rubrique={rub}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => onUpdateRubriquePermanente(rub.code, v, rub.valeur2)}
              onChangeValeur2={(v) => onUpdateRubriquePermanente(rub.code, rub.valeur1, v)}
              onRemove={() => onRetirerRubriquePermanente(rub.code)}
            />
          ))}

          {/* 2. Heures supplémentaires actives */}
          {visibleHsCodes.map((code) => {
            const cfg = HS_CONFIGS[code];
            const currentHours = hs[code as keyof typeof hs] || 0;
            return (
              <LigneRubrique
                key={code}
                rubrique={{
                  code,
                  libelle: cfg?.label || code,
                  type: "gain",
                  mode: "heures",
                  valeur1: currentHours,
                  valeur2: 0,
                  cotisable: true,
                  imposable: "irg",
                  estPermanente: false,
                }}
                salaireBaseReel={salaireBaseReel}
                tauxHoraire={tauxHoraire}
                majoration={cfg?.majoration || 1}
                onChangeValeur1={(v) => handleHsChange(code, v)}
                onRemove={() => handleRemoveHs(code)}
              />
            );
          })}

          {/* 3. Panier (si activé) */}
          {isPanierVisible && (
            <LigneRubrique
              rubrique={{
                code: "R250",
                libelle: "Indemnité de Panier",
                type: "gain",
                mode: "nombre_x_taux",
                valeur1: joursPanier,
                valeur2: tauxPanier,
                cotisable: false,
                imposable: "irg",
                estPermanente: false,
              }}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => handlePanierChange(v, tauxPanier)}
              onChangeValeur2={(v) => handlePanierChange(joursPanier, v)}
              onRemove={handleRemovePanier}
            />
          )}

          {/* État vide élégant */}
          {rubriquesGainPermanentes.length === 0 &&
            visibleHsCodes.length === 0 &&
            !isPanierVisible && (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-[#71717A]">
                  Aucune prime ou heure supplémentaire ce mois-ci.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddGainMenu(true)}
                  className="mt-2 text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                >
                  + Ajouter une prime ou heure sup
                </button>
              </div>
            )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SECTION RETENUES & ABSENCES (Progressive Disclosure)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#F0EFEA] rounded-xl shadow-2xs overflow-hidden">
        {/* En-tête Zen Minimaliste */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF9F8] border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-[#991B1B]" />
            <span className="text-xs font-bold text-[#111827] tracking-tight">
              Retenues & Absences
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#991B1B] tabular-nums">
              −{formatDA(totalRetenues)}
            </span>

            {/* Menu Popover Ajouter Retenue / Absence */}
            <div className="relative" ref={addRetenueMenuRef}>
              <button
                type="button"
                onClick={() => setShowAddRetenueMenu(!showAddRetenueMenu)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#991B1B] bg-white border border-[#E4E4E7] hover:border-[#991B1B] px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              </button>

              {showAddRetenueMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-50 p-1.5 space-y-1 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-2 py-0.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                    Signaler une Absence (heures)
                  </div>

                  {Object.entries(ABSENCES_CONFIGS).map(([code, label]) => {
                    const isAlreadyVisible = visibleAbsenceCodes.includes(code);
                    return (
                      <button
                        key={code}
                        disabled={isAlreadyVisible}
                        onClick={() => {
                          if (!isAlreadyVisible) {
                            setVisibleAbsenceCodes((prev) => [...prev, code]);
                          }
                          setShowAddRetenueMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer",
                          isAlreadyVisible
                            ? "opacity-50 cursor-not-allowed bg-[#F4F4F5] text-[#A1A1AA]"
                            : "hover:bg-[#FDF2F2] text-[#991B1B]"
                        )}
                      >
                        <span>{label}</span>
                        <span className="font-mono text-[10px] text-[#71717A]">{code}</span>
                      </button>
                    );
                  })}

                  <div className="h-px bg-[#F4F4F5] my-1" />

                  <button
                    onClick={() => {
                      setShowAddRetenueMenu(false);
                      setModalType("retenue");
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F4F4F5] font-semibold text-[#111827] flex items-center justify-between cursor-pointer"
                  >
                    <span>Retenue du catalogue (Mutuelle...)</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#991B1B]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lignes Actives */}
        <div className="divide-y divide-[#F4F3F0]">
          {/* 1. Absences actives */}
          {visibleAbsenceCodes.map((code) => {
            const label = ABSENCES_CONFIGS[code] || code;
            const hours = absences[code as keyof typeof absences] || 0;
            return (
              <LigneRubrique
                key={code}
                rubrique={{
                  code,
                  libelle: label,
                  type: "retenue",
                  mode: "heures",
                  valeur1: hours,
                  valeur2: 0,
                  cotisable: false,
                  imposable: "non_imposable",
                  estPermanente: false,
                }}
                salaireBaseReel={salaireBaseReel}
                tauxHoraire={tauxHoraire}
                onChangeValeur1={(v) => handleAbsenceChange(code, v)}
                onRemove={() => handleRemoveAbsence(code)}
              />
            );
          })}

          {/* 2. Retenues permanentes (Mutuelle, etc.) */}
          {rubriquesRetenuePermanentes.map((rub) => (
            <LigneRubrique
              key={rub.code}
              rubrique={rub}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => onUpdateRubriquePermanente(rub.code, v, rub.valeur2)}
              onChangeValeur2={(v) => onUpdateRubriquePermanente(rub.code, rub.valeur1, v)}
              onRemove={() => onRetirerRubriquePermanente(rub.code)}
            />
          ))}

          {/* État vide élégant */}
          {visibleAbsenceCodes.length === 0 && rubriquesRetenuePermanentes.length === 0 && (
            <div className="py-6 px-4 text-center">
              <p className="text-xs text-[#71717A]">
                Aucune absence ou retenue enregistrée. Présence complète (173,33h).
              </p>
              <button
                type="button"
                onClick={() => setShowAddRetenueMenu(true)}
                className="mt-2 text-xs font-semibold text-[#991B1B] hover:underline cursor-pointer"
              >
                + Signaler une absence ou retard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODALE CATALOGUE
          ═══════════════════════════════════════════════════ */}
      {modalType && (
        <CatalogueRubriqueModal
          catalogue={catalogue}
          typeFiltre={modalType}
          codesExistants={codesExistants}
          onConfirm={async (rubrique) => {
            await onAssignerRubriquePermanente(rubrique);
            setModalType(null);
          }}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}
