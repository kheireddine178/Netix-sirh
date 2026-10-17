"use client";

import React from "react";
import { Trash2, Star, Calendar, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type ModeRubrique = "pourcentage" | "nombre_x_taux" | "montant_fixe" | "heures";

export interface RubriqueLigne {
  code: string;
  libelle: string;
  type: "gain" | "retenue";
  mode: ModeRubrique;
  valeur1: number;  // taux% | nb heures | nb jours | montant DA
  valeur2: number;  // taux unitaire (ex: 500 DA/j pour panier)
  cotisable: boolean;
  imposable: "irg" | "dix_pct" | "non_imposable";
  estPermanente: boolean; // si true => stocké dans salarie_rubriques DB
  estVerrouillee?: boolean; // R030, R061, etc. — toujours présentes, non supprimables
}

interface Props {
  rubrique: RubriqueLigne;
  salaireBaseReel: number;    // Pour calculer les montants % en live
  tauxHoraire: number;        // Pour calculer les montants HS en live
  majoration?: number;        // Taux de majoration HS (1.5, 1.75, 2.0)
  onChangeValeur1: (v: number) => void;
  onChangeValeur2?: (v: number) => void;
  onRemove?: () => void;
  className?: string;
}

// ------------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------------

function formatDA(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "0,00 DA";
  const parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${parts[0]},${parts[1]} DA`;
}

function calculerMontant(rub: RubriqueLigne, salaireBaseReel: number, tauxHoraire: number, majoration = 1): number {
  switch (rub.mode) {
    case "pourcentage": {
      const taux = rub.valeur1 > 1 ? rub.valeur1 / 100 : rub.valeur1;
      return Math.max(0, salaireBaseReel * taux);
    }
    case "nombre_x_taux":
      return Math.max(0, rub.valeur1 * rub.valeur2);
    case "heures":
      return Math.max(0, rub.valeur1 * tauxHoraire * majoration);
    case "montant_fixe":
    default:
      return Math.max(0, rub.valeur1);
  }
}

const INPUT_BASE =
  "bg-white border border-[#E6E4DD] rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs outline-none transition-colors focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20 text-right";

const CODE_BADGE_GAIN =
  "font-mono text-[11px] font-black px-2 py-0.5 rounded border bg-[#E6F3EE] text-[#0D3B2E] border-[#A7F3D0] shrink-0";
const CODE_BADGE_RETENUE =
  "font-mono text-[11px] font-black px-2 py-0.5 rounded border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] shrink-0";

// ------------------------------------------------------------------
// Composant
// ------------------------------------------------------------------

export function LigneRubrique({
  rubrique,
  salaireBaseReel,
  tauxHoraire,
  majoration = 1,
  onChangeValeur1,
  onChangeValeur2,
  onRemove,
  className,
}: Props) {
  const montant = calculerMontant(rubrique, salaireBaseReel, tauxHoraire, majoration);
  const isGain = rubrique.type === "gain";
  const isRetenue = rubrique.type === "retenue";

  const montantClass = isGain
    ? "text-[#0D3B2E] font-mono font-black text-xs tabular-nums"
    : "text-[#991B1B] font-mono font-black text-xs tabular-nums";

  const montantPrefix = isGain ? "+" : "−";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group",
        isGain
          ? "bg-white border-[#E6E4DD] hover:border-[#A7F3D0] hover:bg-[#F4FBF8]"
          : "bg-white border-[#E6E4DD] hover:border-[#FECACA] hover:bg-[#FFF8F8]",
        rubrique.estVerrouillee && "opacity-90",
        className
      )}
    >
      {/* Code badge */}
      <span className={isGain ? CODE_BADGE_GAIN : CODE_BADGE_RETENUE}>
        {rubrique.code}
      </span>

      {/* Libellé + métadonnées */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-[#111315] truncate">
            {rubrique.libelle}
          </span>
          {/* Indicateur permanente vs mensuelle */}
          {rubrique.estPermanente ? (
            <span title="Rubrique permanente du poste (enregistrée)">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            </span>
          ) : (
            <span title="Rubrique de ce mois uniquement">
              <Calendar className="w-3 h-3 text-[#94A3B8] shrink-0" />
            </span>
          )}
          {rubrique.estVerrouillee && (
            <span title="Rubrique système">
              <Lock className="w-3 h-3 text-[#CBD5E1] shrink-0" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#94A3B8]">
            {rubrique.cotisable ? "CNAS ✓" : "hors CNAS"} •{" "}
            {rubrique.imposable === "irg"
              ? "IRG ✓"
              : rubrique.imposable === "dix_pct"
              ? "Imp. 10%"
              : "Exonéré"}
          </span>
        </div>
      </div>

      {/* Zone de saisie selon le mode */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* ── MODE POURCENTAGE ────────────────────────────── */}
        {rubrique.mode === "pourcentage" && (
          <div className="flex items-center gap-1 flex-col items-end">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="200"
                value={rubrique.valeur1 ?? 0}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onChangeValeur1(parseFloat(e.target.value) || 0)}
                className={cn(INPUT_BASE, "w-16 text-center")}
                disabled={rubrique.estVerrouillee}
              />
              <span className="text-[11px] font-bold text-[#0D3B2E]">%</span>
            </div>
            <span className={cn(montantClass, "text-[10px]")}>
              {montantPrefix} {formatDA(montant)}
            </span>
          </div>
        )}

        {/* ── MODE NOMBRE × TAUX ──────────────────────────── */}
        {rubrique.mode === "nombre_x_taux" && (
          <div className="flex items-center gap-1 flex-col items-end">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="1"
                min="0"
                value={rubrique.valeur1 ?? 0}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onChangeValeur1(parseFloat(e.target.value) || 0)}
                className={cn(INPUT_BASE, "w-14 text-center")}
                disabled={rubrique.estVerrouillee}
              />
              <span className="text-[10px] text-[#5A6065] font-mono">×</span>
              <input
                type="number"
                step="50"
                min="0"
                value={rubrique.valeur2 ?? 0}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onChangeValeur2?.(parseFloat(e.target.value) || 0)}
                className={cn(INPUT_BASE, "w-16 text-center")}
                disabled={rubrique.estVerrouillee}
              />
              <span className="text-[10px] text-[#5A6065] font-mono">DA</span>
            </div>
            <span className={cn(montantClass, "text-[10px]")}>
              {montantPrefix} {formatDA(montant)}
            </span>
          </div>
        )}

        {/* ── MODE HEURES (absences, HS) ────────────────── */}
        {rubrique.mode === "heures" && (
          <div className="flex items-center gap-1 flex-col items-end">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="173.33"
                value={rubrique.valeur1 ?? 0}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onChangeValeur1(parseFloat(e.target.value) || 0)}
                className={cn(INPUT_BASE, "w-16 text-center")}
                disabled={rubrique.estVerrouillee}
              />
              <span className="text-[11px] font-mono text-[#5A6065]">h</span>
            </div>
            {montant > 0 && (
              <span className={cn(montantClass, "text-[10px]")}>
                {isGain ? "+" : "−"} {formatDA(montant)}
              </span>
            )}
          </div>
        )}

        {/* ── MODE MONTANT FIXE ────────────────────────── */}
        {rubrique.mode === "montant_fixe" && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="500"
              min="0"
              value={rubrique.valeur1 ?? 0}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onChangeValeur1(parseFloat(e.target.value) || 0)}
              className={cn(INPUT_BASE, "w-24")}
              disabled={rubrique.estVerrouillee}
            />
            <span className="text-[11px] font-mono text-[#5A6065]">DA</span>
          </div>
        )}
      </div>

      {/* Bouton supprimer */}
      {!rubrique.estVerrouillee && onRemove && (
        <button
          onClick={onRemove}
          title="Retirer cette rubrique"
          className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {/* Espace pour maintenir l'alignement quand pas de bouton supprimer */}
      {(rubrique.estVerrouillee || !onRemove) && (
        <div className="w-[30px] shrink-0" />
      )}
    </div>
  );
}
