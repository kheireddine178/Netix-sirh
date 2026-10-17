"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  User,
  ChevronRight,
  Save,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RubriqueCatalogueItem, type RubriqueFixeAssignee } from "@/app/(app)/paie/actions";
import { detecterModeRubrique } from "@/lib/paieCalcul";
import { calculerRetenueAbsence } from "@/src/lib/payroll-engine";
import { LigneRubrique, type RubriqueLigne, type ModeRubrique } from "./LigneRubrique";
import { CatalogueRubriqueModal } from "./CatalogueRubriqueModal";

// ------------------------------------------------------------------
// Constantes — Rubriques système toujours présentes
// ------------------------------------------------------------------

/** HS : toujours affichées dans la section Gains */
const HS_SYSTEME: RubriqueLigne[] = [
  {
    code: "R061",
    libelle: "Heures Sup. +50% (Palier 1)",
    type: "gain",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: true,
    imposable: "irg",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R065",
    libelle: "Heures Sup. +75% (Palier 2)",
    type: "gain",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: true,
    imposable: "irg",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R066",
    libelle: "Heures Sup. +100% (Palier 3)",
    type: "gain",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: true,
    imposable: "irg",
    estPermanente: false,
    estVerrouillee: false,
  },
];

/** Codes de majoration HS correspondants */
const HS_MAJORATION: Record<string, number> = {
  R061: 1.5,
  R065: 1.75,
  R066: 2.0,
};

/** Retenues sur absences : toujours affichées, valeur 0 par défaut */
const RETENUES_ABSENCES_SYSTEME: RubriqueLigne[] = [
  {
    code: "R650",
    libelle: "Absence pour Maladie",
    type: "retenue",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: false,
    imposable: "non_imposable",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R651",
    libelle: "Mise à Pied",
    type: "retenue",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: false,
    imposable: "non_imposable",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R652",
    libelle: "Retards",
    type: "retenue",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: false,
    imposable: "non_imposable",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R655",
    libelle: "Absence Irrégulière",
    type: "retenue",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: false,
    imposable: "non_imposable",
    estPermanente: false,
    estVerrouillee: false,
  },
  {
    code: "R656",
    libelle: "Accident de Travail",
    type: "retenue",
    mode: "heures",
    valeur1: 0,
    valeur2: 0,
    cotisable: false,
    imposable: "non_imposable",
    estPermanente: false,
    estVerrouillee: false,
  },
];

// ------------------------------------------------------------------
// Types Props
// ------------------------------------------------------------------

interface Props {
  salaireBaseTheorique: number;
  catalogue: RubriqueCatalogueItem[];
  rubriquesFixes: RubriqueFixeAssignee[];  // depuis le profil salarié (DB)
  
  // HS initiales (depuis variables sauvegardées)
  hs50Init: number;
  hs75Init: number;
  hs100Init: number;

  // Absences initiales (depuis variables sauvegardées)
  maladie_hInit: number;
  miseAPied_hInit: number;
  retards_hInit: number;
  absenceIrreg_hInit: number;
  accidentTravail_hInit: number;

  // Panier initial
  joursPanierInit: number;
  tauxPanierInit: number;

  // Callbacks vers le parent (cockpit-client)
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

// ------------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------------

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
  return {
    code: r.code,
    libelle: r.libelle,
    type: r.type_valeur === "Retenue (-)" ? "retenue" : "gain",
    mode,
    valeur1: r.valeur_defaut,
    valeur2: 0,
    cotisable: r.cotisable === "OUI",
    imposable:
      r.imposable === "OUI" || r.imposable === "IRG" ? "irg" : "non_imposable",
    estPermanente: true,
  };
}

// ------------------------------------------------------------------
// Composant principal
// ------------------------------------------------------------------

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
    R061: hs50Init,
    R065: hs75Init,
    R066: hs100Init,
  });

  // ── État local des absences (par code) ──
  const [absences, setAbsences] = useState({
    R650: maladie_hInit,
    R651: miseAPied_hInit,
    R652: retards_hInit,
    R655: absenceIrreg_hInit,
    R656: accidentTravail_hInit,
  });

  // ── Panier ──
  const [joursPanier, setJoursPanier] = useState(joursPanierInit || 0);
  const [tauxPanier, setTauxPanier] = useState(tauxPanierInit || 0);

  // ── Salaire de base avec formatage virgule (ex: 20000,00) ──
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

  // ── Modale d'ajout ──
  const [modalType, setModalType] = useState<"gain" | "retenue" | null>(null);

  // ── Calculs dérivés ──
  const totalHeuresAbsence = useMemo(
    () => Object.values(absences).reduce((s, v) => s + v, 0),
    [absences]
  );

  const tauxHoraire = useMemo(
    () => salaireBaseTheorique / BASE_HORAIRE_LEGALE,
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
    const absenceCodes = RETENUES_ABSENCES_SYSTEME.map((r) => r.code);
    return (rubriquesFixes || [])
      .filter((r) => r.type_valeur === "Retenue (-)" && !absenceCodes.includes(r.code))
      .map(rubriqueFixeToLigne)
      .sort((a, b) => codeToNum(a.code) - codeToNum(b.code));
  }, [rubriquesFixes]);

  // ── Codes déjà présents (pour griser dans la modale) ──
  const codesExistants = useMemo(
    () => (rubriquesFixes || []).map((r) => r.code),
    [rubriquesFixes]
  );

  // ── Callbacks ──
  const handleHsChange = useCallback((code: string, val: number) => {
    setHs((prev) => {
      const next = { ...prev, [code]: val };
      onChangeHS(next.R061, next.R065, next.R066);
      return next;
    });
  }, [onChangeHS]);

  const handleAbsenceChange = useCallback((code: string, val: number) => {
    setAbsences((prev) => {
      const next = { ...prev, [code]: val };
      const total = Object.values(next).reduce((s, v) => s + v, 0);
      onChangeAbsences(total);
      return next;
    });
  }, [onChangeAbsences]);

  const handlePanierChange = useCallback((jours: number, taux: number) => {
    setJoursPanier(jours);
    setTauxPanier(taux);
    onChangePanier(jours, taux);
  }, [onChangePanier]);

  // Section header helper
  const SectionHeader = ({
    icon: Icon,
    label,
    total,
    color,
    onAdd,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    total: number;
    color: "green" | "red";
    onAdd?: () => void;
  }) => (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 rounded-t-xl border-b",
      color === "green"
        ? "bg-[#E6F3EE] border-[#A7F3D0]"
        : "bg-[#FEF2F2] border-[#FECACA]"
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color === "green" ? "text-[#065F46]" : "text-[#991B1B]")} />
        <span className={cn("text-xs font-black uppercase tracking-wide", color === "green" ? "text-[#065F46]" : "text-[#991B1B]")}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("font-mono font-black text-xs tabular-nums", color === "green" ? "text-[#0D3B2E]" : "text-[#991B1B]")}>
          {color === "green" ? "+" : "−"} {formatDA(total)}
        </span>
        {onAdd && (
          <button
            onClick={onAdd}
            className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer",
              color === "green"
                ? "bg-white border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]"
                : "bg-white border-[#FECACA] text-[#991B1B] hover:bg-[#FEE2E2]"
            )}
          >
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );

  // ── Total gains (HS + permanentes) pour affichage header ──
  const totalGains = useMemo(() => {
    let t = 0;
    // HS
    Object.entries(hs).forEach(([code, val]) => {
      t += val * tauxHoraire * (HS_MAJORATION[code] || 1);
    });
    // Rubriques permanentes gain
    rubriquesGainPermanentes.forEach((r) => {
      if (r.mode === "pourcentage") {
        const taux = r.valeur1 > 1 ? r.valeur1 / 100 : r.valeur1;
        t += salaireBaseReel * taux;
      } else if (r.mode === "nombre_x_taux") {
        t += r.valeur1 * r.valeur2;
      } else {
        t += r.valeur1;
      }
    });
    // Panier
    t += joursPanier * tauxPanier;
    return t;
  }, [hs, tauxHoraire, rubriquesGainPermanentes, salaireBaseReel, joursPanier, tauxPanier]);

  // ── Total retenues (absences + permanentes retenues) ──
  const totalRetenues = useMemo(() => {
    let t = totalHeuresAbsence * tauxHoraire;
    rubriquesRetenuePermanentes.forEach((r) => {
      t += r.mode === "montant_fixe" ? r.valeur1 : r.valeur1 * r.valeur2;
    });
    return t;
  }, [totalHeuresAbsence, tauxHoraire, rubriquesRetenuePermanentes]);

  return (
    <div className="space-y-4">

      {/* ═══════════════════════════════════════════════════
          0. IDENTITÉ SALARIÉ + LIEN PROFIL
          ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D3B2E] to-[#1E5C49] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            {nomSalarie.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-[#111315]">{nomSalarie}</h2>
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-[#F2F0EC] border border-[#E6E4DD] rounded text-[#5A6065]">
                {matricule}
              </span>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                statut === "Validé"
                  ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                  : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
              )}>
                {statut}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6065] mt-0.5">{fonction}</p>
          </div>
        </div>
        <button
          onClick={onOpenProfil}
          className="flex items-center gap-1.5 text-[11px] text-[#5A6065] hover:text-[#0D3B2E] transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          Fiche RH
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          1. SALAIRE DE BASE (R030)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E6E4DD] rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6065]">
              R030 — Salaire de Base Théorique
            </span>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
              Base légale 173,33h/mois — Taux horaire :{" "}
              <span className="font-mono font-bold text-[#0D3B2E]">{formatDA(tauxHoraire)}/h</span>
            </p>
          </div>
          {totalHeuresAbsence > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-[#94A3B8]">Base réelle :</span>
              <p className="font-mono font-black text-sm text-[#0D3B2E]">
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
              const cleanNum = parseFloat(salaireBaseInput.replace(/\s/g, "").replace(",", "."));
              const finalVal = isNaN(cleanNum) ? 0 : cleanNum;
              setSalaireBaseInput(formatVirgule(finalVal));
              onChangeSalaireBase(finalVal);
            }}
            className="flex-1 bg-[#F8F7F4] border border-[#E6E4DD] rounded-xl px-4 py-2.5 text-right font-mono font-black text-xl text-[#0D3B2E] outline-none focus:border-[#0D3B2E] focus:ring-2 focus:ring-[#0D3B2E]/10 transition-all"
          />
          <span className="text-sm font-black font-mono text-[#0D3B2E] shrink-0">DA</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. SECTION GAINS (HS + primes permanentes + panier)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#A7F3D0] rounded-xl overflow-hidden shadow-xs">
        <SectionHeader
          icon={TrendingUp}
          label="Gains & Primes"
          total={totalGains}
          color="green"
          onAdd={() => setModalType("gain")}
        />

        <div className="p-3 space-y-2">
          {/* ── Heures supplémentaires (toujours présentes) ── */}
          {HS_SYSTEME.map((hs_ligne) => (
            <LigneRubrique
              key={hs_ligne.code}
              rubrique={{ ...hs_ligne, valeur1: hs[hs_ligne.code as keyof typeof hs] }}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              majoration={HS_MAJORATION[hs_ligne.code]}
              onChangeValeur1={(v) => handleHsChange(hs_ligne.code, v)}
            />
          ))}

          {/* ── Panier (Nombre × Taux) ── */}
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
          />

          {/* ── Rubriques permanentes (gains) — triées ── */}
          {rubriquesGainPermanentes.map((rub) => (
            <LigneRubrique
              key={rub.code}
              rubrique={rub}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => onUpdateRubriquePermanente(rub.code, v)}
              onChangeValeur2={(v) => onUpdateRubriquePermanente(rub.code, rub.valeur1, v)}
              onRemove={() => onRetirerRubriquePermanente(rub.code)}
            />
          ))}

          {/* Message si vide */}
          {rubriquesGainPermanentes.length === 0 && (
            <div
              className="p-3 text-center text-[11px] text-[#94A3B8] border border-dashed border-[#D1FAE5] rounded-xl bg-[#F4FBF8] cursor-pointer hover:bg-[#E6F3EE] transition-colors"
              onClick={() => setModalType("gain")}
            >
              <Plus className="w-4 h-4 mx-auto mb-1 text-[#A7F3D0]" />
              Cliquez pour ajouter une prime ou indemnité
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. SECTION RETENUES (absences + retenues permanentes)
          ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#FECACA] rounded-xl overflow-hidden shadow-xs">
        <SectionHeader
          icon={TrendingDown}
          label="Retenues & Absences"
          total={totalRetenues}
          color="red"
          onAdd={() => setModalType("retenue")}
        />

        <div className="p-3 space-y-2">
          {/* ── Absences (toujours présentes, valeur 0 par défaut) ── */}
          {RETENUES_ABSENCES_SYSTEME.map((abs) => (
            <LigneRubrique
              key={abs.code}
              rubrique={{ ...abs, valeur1: absences[abs.code as keyof typeof absences] }}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => handleAbsenceChange(abs.code, v)}
            />
          ))}

          {/* ── Rubriques permanentes (retenues) — triées ── */}
          {rubriquesRetenuePermanentes.map((rub) => (
            <LigneRubrique
              key={rub.code}
              rubrique={rub}
              salaireBaseReel={salaireBaseReel}
              tauxHoraire={tauxHoraire}
              onChangeValeur1={(v) => onUpdateRubriquePermanente(rub.code, v)}
              onRemove={() => onRetirerRubriquePermanente(rub.code)}
            />
          ))}

          {/* Message si pas de retenues permanentes */}
          {rubriquesRetenuePermanentes.length === 0 && (
            <div
              className="p-3 text-center text-[11px] text-[#94A3B8] border border-dashed border-[#FECACA] rounded-xl bg-[#FFF8F8] cursor-pointer hover:bg-[#FEF2F2] transition-colors"
              onClick={() => setModalType("retenue")}
            >
              <Plus className="w-4 h-4 mx-auto mb-1 text-[#FECACA]" />
              Cliquez pour ajouter une retenue (mutuelle, etc.)
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          4. BOUTONS SAUVEGARDE
          ═══════════════════════════════════════════════════ */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => onSave(true)}
          disabled={isSaving}
          className="w-full py-2.5 bg-[#0D3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0a3025] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
        >
          <CheckCircle2 className="w-4 h-4" />
          Valider & Salarié Suivant (Entrée)
        </button>
        <button
          onClick={() => onSave(false)}
          disabled={isSaving}
          className="w-full py-2 border border-[#E6E4DD] rounded-xl text-xs font-semibold text-[#5A6065] flex items-center justify-center gap-2 hover:bg-[#F2F0EC] transition-colors cursor-pointer disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          Enregistrer (Ctrl+S)
        </button>
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
