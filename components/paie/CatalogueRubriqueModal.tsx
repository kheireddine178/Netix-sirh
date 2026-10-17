"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Check, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RubriqueCatalogueItem } from "@/app/(app)/paie/actions";
import { detecterModeRubrique } from "@/lib/paieCalcul";
import { type ModeRubrique, type RubriqueLigne } from "./LigneRubrique";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface Props {
  catalogue: RubriqueCatalogueItem[];
  typeFiltre: "gain" | "retenue"; // n'afficher que les gains ou les retenues
  codesExistants: string[];       // codes déjà assignés (griser dans la liste)
  onConfirm: (rubrique: RubriqueLigne) => void;
  onClose: () => void;
}

// ------------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------------

function codeToNum(code: string): number {
  return parseInt(code.replace(/\D/g, ""), 10) || 0;
}

function modeLabel(mode: ModeRubrique): string {
  switch (mode) {
    case "pourcentage":   return "% du Base";
    case "nombre_x_taux": return "Nb × Taux";
    case "heures":        return "Heures";
    case "montant_fixe":
    default:              return "Montant DA";
  }
}

const BADGE_MODE: Record<ModeRubrique, string> = {
  pourcentage:    "bg-teal-50 text-teal-700 border-teal-200",
  nombre_x_taux:  "bg-blue-50 text-blue-700 border-blue-200",
  heures:         "bg-orange-50 text-orange-700 border-orange-200",
  montant_fixe:   "bg-[#F2F0EC] text-[#5A6065] border-[#E6E4DD]",
};

const INPUT_BASE =
  "bg-white border border-[#E6E4DD] rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20";

// ------------------------------------------------------------------
// Composant
// ------------------------------------------------------------------

export function CatalogueRubriqueModal({
  catalogue,
  typeFiltre,
  codesExistants,
  onConfirm,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [estPermanente, setEstPermanente] = useState(true);

  // Valeurs de saisie selon le mode
  const [valeur1, setValeur1] = useState<number>(0);
  const [valeur2, setValeur2] = useState<number>(0);

  const searchRef = useRef<HTMLInputElement>(null);

  // Focus auto à l'ouverture
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Catalogue filtré : type + recherche + trié par code numérique
  const rubriquesDisponibles = useMemo(() => {
    const filtered = catalogue.filter((c) => {
      const isCorrectType =
        typeFiltre === "gain"
          ? c.type_valeur === "Gain (+)"
          : c.type_valeur === "Retenue (-)";
      if (!isCorrectType) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.libelle.toLowerCase().includes(q) ||
        (c.categorie && c.categorie.toLowerCase().includes(q))
      );
    });

    // Tri numérique
    return filtered.sort((a, b) => codeToNum(a.code) - codeToNum(b.code));
  }, [catalogue, typeFiltre, search]);

  // Rubrique sélectionnée
  const selectedItem = useMemo(
    () => rubriquesDisponibles.find((c) => c.code === selectedCode) || null,
    [rubriquesDisponibles, selectedCode]
  );

  // Mode de calcul détecté pour la rubrique sélectionnée
  const modeDetecte = useMemo((): ModeRubrique => {
    if (!selectedItem) return "montant_fixe";
    const m = selectedItem.mode_calcul || detecterModeRubrique(selectedItem.code, selectedItem.libelle);
    if (m === "nombre_x_taux") return "nombre_x_taux";
    if (m === "pourcentage") return "pourcentage";
    return "montant_fixe";
  }, [selectedItem]);

  // Sélection auto du premier résultat de recherche
  useEffect(() => {
    if (rubriquesDisponibles.length > 0 && !selectedCode) {
      setSelectedCode(rubriquesDisponibles[0].code);
    }
  }, [rubriquesDisponibles, selectedCode]);

  // Réinitialiser valeurs quand on change de rubrique (tout à 0 par défaut)
  useEffect(() => {
    setValeur1(0);
    setValeur2(0);
  }, [selectedCode, modeDetecte]);

  const handleConfirm = () => {
    if (!selectedItem) return;

    const mode: ModeRubrique = modeDetecte;
    const newRubrique: RubriqueLigne = {
      code: selectedItem.code,
      libelle: selectedItem.libelle,
      type: typeFiltre,
      mode,
      valeur1,
      valeur2,
      cotisable: selectedItem.cotisable === "OUI",
      imposable:
        selectedItem.imposable === "OUI" || selectedItem.imposable === "IRG"
          ? "irg"
          : "non_imposable",
      estPermanente,
    };
    onConfirm(newRubrique);
  };

  const isAlreadyAdded = (code: string) => codesExistants.includes(code);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111315]/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E6E4DD] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* ── En-tête ── */}
        <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between bg-[#F8F7F4]">
          <div>
            <h3 className="text-sm font-black text-[#111315]">
              {typeFiltre === "gain" ? "Ajouter un gain / prime" : "Ajouter une retenue"}
            </h3>
            <p className="text-[11px] text-[#5A6065] mt-0.5">
              Catalogue officiel • Tri par code numérique
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A6065] hover:bg-[#E6E4DD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Recherche ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Code (ex: R200) ou libellé..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedCode(""); // reset sélection quand on cherche
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#E6E4DD] rounded-xl bg-[#F8F7F4] outline-none focus:border-[#0D3B2E] focus:bg-white transition-colors"
            />
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-1.5 px-1">
            {rubriquesDisponibles.length} rubrique{rubriquesDisponibles.length > 1 ? "s" : ""} disponible{rubriquesDisponibles.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Liste des rubriques (scrollable) ── */}
        <div className="mx-4 mb-3 border border-[#E6E4DD] rounded-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto divide-y divide-[#F2F0EC]">
            {rubriquesDisponibles.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#94A3B8]">
                Aucune rubrique trouvée pour « {search} »
              </div>
            ) : (
              rubriquesDisponibles.map((item) => {
                const isSelected = item.code === selectedCode;
                const alreadyAdded = isAlreadyAdded(item.code);
                const itemMode = item.mode_calcul || detecterModeRubrique(item.code, item.libelle) as ModeRubrique;

                return (
                  <button
                    key={item.code}
                    onClick={() => !alreadyAdded && setSelectedCode(item.code)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[#E6F3EE] border-l-2 border-l-[#0D3B2E]"
                        : alreadyAdded
                        ? "opacity-40 cursor-not-allowed bg-[#F8F7F4]"
                        : "hover:bg-[#F8F7F4]"
                    )}
                  >
                    {/* Code */}
                    <span className="font-mono text-[11px] font-black text-[#0D3B2E] bg-[#E6F3EE] px-1.5 py-0.5 rounded border border-[#A7F3D0] shrink-0 min-w-[48px] text-center">
                      {item.code}
                    </span>
                    {/* Libellé */}
                    <span className="flex-1 text-xs font-semibold text-[#111315] truncate">
                      {item.libelle}
                    </span>
                    {/* Mode badge */}
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0",
                      BADGE_MODE[(itemMode as ModeRubrique)] || BADGE_MODE.montant_fixe
                    )}>
                      {modeLabel(itemMode as ModeRubrique)}
                    </span>
                    {/* Check si déjà ajoutée */}
                    {alreadyAdded && (
                      <Check className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                    )}
                    {isSelected && !alreadyAdded && (
                      <div className="w-2 h-2 rounded-full bg-[#0D3B2E] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panneau de saisie de la valeur (si rubrique sélectionnée) ── */}
        {selectedItem && (
          <div className="mx-4 mb-3 p-3.5 bg-[#F4FBF8] border border-[#A7F3D0] rounded-xl space-y-3">
            <p className="text-xs font-bold text-[#065F46]">
              {selectedItem.code} — {selectedItem.libelle}
            </p>

            {/* ── POURCENTAGE ── */}
            {modeDetecte === "pourcentage" && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#5A6065] shrink-0">Taux :</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="200"
                  value={valeur1}
                  onChange={(e) => setValeur1(parseFloat(e.target.value) || 0)}
                  className={cn(INPUT_BASE, "w-20")}
                  autoFocus
                />
                <span className="text-xs font-bold text-[#0D3B2E]">%</span>
                <span className="text-[10px] text-[#5A6065]">du salaire de base réel</span>
              </div>
            )}

            {/* ── NOMBRE × TAUX ── */}
            {modeDetecte === "nombre_x_taux" && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-[11px] text-[#5A6065] shrink-0">Nombre :</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={valeur1}
                  onChange={(e) => setValeur1(parseFloat(e.target.value) || 0)}
                  className={cn(INPUT_BASE, "w-16")}
                  autoFocus
                />
                <span className="text-xs font-mono text-[#5A6065]">×</span>
                <label className="text-[11px] text-[#5A6065] shrink-0">Taux unitaire :</label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={valeur2}
                  onChange={(e) => setValeur2(parseFloat(e.target.value) || 0)}
                  className={cn(INPUT_BASE, "w-20")}
                />
                <span className="text-xs font-mono text-[#5A6065]">DA</span>
                <span className="text-xs font-black text-[#0D3B2E] ml-auto">
                  = {(valeur1 * valeur2).toLocaleString("fr-DZ")} DA
                </span>
              </div>
            )}

            {/* ── MONTANT FIXE ── */}
            {modeDetecte === "montant_fixe" && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#5A6065] shrink-0">Montant :</label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={valeur1}
                  onChange={(e) => setValeur1(parseFloat(e.target.value) || 0)}
                  className={cn(INPUT_BASE, "w-28")}
                  autoFocus
                />
                <span className="text-xs font-bold text-[#5A6065]">DA</span>
              </div>
            )}

            {/* Option : permanente ou mensuelle */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#A7F3D0]">
              <button
                onClick={() => setEstPermanente(!estPermanente)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer",
                  estPermanente
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-[#F8F7F4] border-[#E6E4DD] text-[#5A6065]"
                )}
              >
                <Star className={cn("w-3.5 h-3.5", estPermanente ? "fill-amber-400 text-amber-400" : "text-[#94A3B8]")} />
                {estPermanente ? "Permanente (poste)" : "Ce mois uniquement"}
              </button>
              <p className="text-[10px] text-[#94A3B8] leading-tight">
                {estPermanente
                  ? "Enregistrée dans le profil, active chaque mois"
                  : "Saisie unique ce mois, non mémorisée"}
              </p>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="p-4 pt-0 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold border border-[#E6E4DD] rounded-xl text-[#5A6065] hover:bg-[#F2F0EC] transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedItem || (modeDetecte !== "nombre_x_taux" ? valeur1 === 0 : valeur1 === 0 && valeur2 === 0)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              selectedItem
                ? "bg-[#0D3B2E] text-white hover:bg-[#0a3025] shadow-sm"
                : "bg-[#E6E4DD] text-[#94A3B8] cursor-not-allowed"
            )}
          >
            <Check className="w-3.5 h-3.5" />
            Ajouter la rubrique
          </button>
        </div>
      </div>
    </div>
  );
}
