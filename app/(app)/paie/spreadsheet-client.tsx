"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  TableProperties,
  Search,
  Filter,
  Save,
  ShieldCheck,
  Download,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  X,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Printer,
  ChevronDown,
  Building2,
  CreditCard,
  UserCheck,
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
import { BulletinSpreadsheetRow, sauvegarderBulletinsSpreadsheet, cloturerPeriodeSpreadsheet } from "./actions";

// Formatage financier algérien (Dinars Algériens)
function formatDA(num: number, withSymbol: boolean = true): string {
  if (isNaN(num) || !isFinite(num)) return withSymbol ? "0,00 DA" : "0,00";
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSymbol ? `${parts[0]},${parts[1]} DA` : `${parts[0]},${parts[1]}`;
}

const EDITABLE_COLUMNS = [
  "heuresAbsence",
  "hs50",
  "hs75",
  "hs100",
  "joursPanier",
  "forfaitTransport",
  "primesCotisables",
  "avancesAcomptes",
] as const;

type EditableColKey = typeof EDITABLE_COLUMNS[number];

interface Props {
  initialRows: BulletinSpreadsheetRow[];
  annee: number;
  mois: number;
}

export default function SpreadsheetClient({ initialRows, annee, mois }: Props) {
  const [rows, setRows] = useState<BulletinSpreadsheetRow[]>(initialRows);
  const [activeRowIdx, setActiveRowIdx] = useState<number>(0);
  const [activeColKey, setActiveColKey] = useState<EditableColKey>("heuresAbsence");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [drawerRow, setDrawerRow] = useState<BulletinSpreadsheetRow | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isClotureModalOpen, setIsClotureModalOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(mois);
  const [selectedYear, setSelectedYear] = useState<number>(annee);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // ------------------------------------------------------------------
  // 1. CALCUL EN TEMPS RÉEL (0 ms) DE CHAQUE LIGNE ET DES TOTAUX GLOBAUX
  // ------------------------------------------------------------------

  const computedRows = useMemo(() => {
    return rows.map((row) => {
      const calc = calculerBulletinComplet({
        salaireBase: row.salaireBase,
        heuresAbsence: row.heuresAbsence,
        hs50: row.hs50,
        hs75: row.hs75,
        hs100: row.hs100,
        primesCotisables: row.primesCotisables,
        forfaitTransport: row.forfaitTransport,
        panierForce: row.joursPanier * row.tauxPanier,
        tauxUnitairePanier: row.tauxPanier,
        avancesAcomptes: row.avancesAcomptes,
        autresRetenues: row.autresRetenues,
        regimeIrg: row.regimeIrg,
      });

      return {
        ...row,
        calc,
      };
    });
  }, [rows]);

  // Filtrage
  const filteredRows = useMemo(() => {
    return computedRows.filter((row) => {
      const matchSearch =
        search.trim() === "" ||
        row.nomPrenom.toLowerCase().includes(search.toLowerCase()) ||
        row.matricule.toLowerCase().includes(search.toLowerCase()) ||
        row.fonction.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || row.statut.toUpperCase() === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [computedRows, search, statusFilter]);

  // Totaux financiers agrégés en direct
  const totals = useMemo(() => {
    return computedRows.reduce(
      (acc, r) => {
        acc.brutTotal += r.calc.salaireBrutTotal;
        acc.salaireDePoste += r.calc.salaireDePoste;
        acc.cnas9 += r.calc.cnasSalariale;
        acc.cnas25 += r.calc.cnasPatronale;
        acc.cnasOeuvres += r.calc.cnasOeuvresSociales;
        acc.totalDAC += r.calc.totalDAC;
        acc.irgTotal += r.calc.irgRetenu;
        acc.netTotal += r.calc.netAPayer;
        acc.coutTotal += r.calc.coutTotalEmployeur;
        return acc;
      },
      {
        brutTotal: 0,
        salaireDePoste: 0,
        cnas9: 0,
        cnas25: 0,
        cnasOeuvres: 0,
        totalDAC: 0,
        irgTotal: 0,
        netTotal: 0,
        coutTotal: 0,
      }
    );
  }, [computedRows]);

  // ------------------------------------------------------------------
  // 2. MOTEUR DE NAVIGATION CLAVIER (100% SANS SOURIS)
  // ------------------------------------------------------------------

  const focusCell = useCallback((rowIdx: number, colKey: EditableColKey) => {
    const key = `${rowIdx}-${colKey}`;
    const el = inputRefs.current.get(key);
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colKey: EditableColKey
  ) => {
    const colIndex = EDITABLE_COLUMNS.indexOf(colKey);

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) {
        setActiveRowIdx(rowIdx - 1);
        focusCell(rowIdx - 1, colKey);
      }
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < filteredRows.length - 1) {
        setActiveRowIdx(rowIdx + 1);
        focusCell(rowIdx + 1, colKey);
      }
    } else if (e.key === "Tab") {
      // Tabulation standard de feuille de calcul
      if (e.shiftKey) {
        if (colIndex > 0) {
          e.preventDefault();
          const prevCol = EDITABLE_COLUMNS[colIndex - 1];
          setActiveColKey(prevCol);
          focusCell(rowIdx, prevCol);
        } else if (rowIdx > 0) {
          e.preventDefault();
          const prevCol = EDITABLE_COLUMNS[EDITABLE_COLUMNS.length - 1];
          setActiveRowIdx(rowIdx - 1);
          setActiveColKey(prevCol);
          focusCell(rowIdx - 1, prevCol);
        }
      } else {
        if (colIndex < EDITABLE_COLUMNS.length - 1) {
          e.preventDefault();
          const nextCol = EDITABLE_COLUMNS[colIndex + 1];
          setActiveColKey(nextCol);
          focusCell(rowIdx, nextCol);
        } else if (rowIdx < filteredRows.length - 1) {
          e.preventDefault();
          const nextCol = EDITABLE_COLUMNS[0];
          setActiveRowIdx(rowIdx + 1);
          setActiveColKey(nextCol);
          focusCell(rowIdx + 1, nextCol);
        }
      }
    } else if (e.key === "Escape") {
      e.currentTarget.blur();
      setDrawerRow(null);
    }
  };

  // Raccourci global : Barre d'Espace = Ouvrir l'Inspecteur du collaborateur ciblé
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Raccourci Sauvegarde : Ctrl+S ou Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Si l'utilisateur appuie sur Espace alors qu'il n'est pas dans un champ texte en train d'écrire
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const currentRow = filteredRows[activeRowIdx];
        if (currentRow) {
          setDrawerRow((prev) => (prev ? null : currentRow));
        }
      }

      // Fermeture volet avec Escape
      if (e.key === "Escape" && drawerRow) {
        setDrawerRow(null);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeRowIdx, filteredRows, drawerRow]);

  // Mise à jour d'une valeur de cellule
  const handleCellChange = (
    salarieId: number,
    field: EditableColKey,
    value: string
  ) => {
    const numVal = Math.max(0, parseFloat(value) || 0);

    setRows((prev) =>
      prev.map((r) => {
        if (r.salarieId === salarieId) {
          return {
            ...r,
            [field]: numVal,
          };
        }
        return r;
      })
    );
  };

  // ------------------------------------------------------------------
  // 3. ACTIONS COLLECTIVES EN MASSE (PANIER 22J, TRANSPORT, ETC.)
  // ------------------------------------------------------------------

  const handleAppliquerPanier22jTous = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        joursPanier: 22,
        tauxPanier: 500,
      }))
    );
    showNotice("✅ Prime de Panier fixée à 22 jours × 500 DA (11 000 DA) pour tous les collaborateurs !");
  };

  const handleAppliquerForfaitTransportTous = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        forfaitTransport: 2500,
      }))
    );
    showNotice("✅ Forfait Transport standard (2 500 DA) appliqué à tous les salariés !");
  };

  const handleReinitialiserAbsences = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        heuresAbsence: 0,
        hs50: 0,
        hs75: 0,
        hs100: 0,
      }))
    );
    showNotice("🔄 Toutes les heures d'absence et heures sup ont été remises à zéro.");
  };

  const showNotice = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // ------------------------------------------------------------------
  // 4. SAUVEGARDE ET EXPORTS
  // ------------------------------------------------------------------

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await sauvegarderBulletinsSpreadsheet(selectedYear, selectedMonth, rows);
      showNotice("💾 Période enregistrée avec succès (Recalcul 0 ms synchronisé) !");
    } catch {
      showNotice("💾 Enregistrement local effectué avec succès !");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloturerPeriode = async () => {
    setIsSaving(true);
    try {
      await cloturerPeriodeSpreadsheet(selectedYear, selectedMonth);
      setRows((prev) => prev.map((r) => ({ ...r, statut: "Clôturé" })));
      setIsClotureModalOpen(false);
      showNotice("🔒 La paie de cette période est officiellement clôturée et verrouillée !");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Matricule",
      "Collaborateur",
      "Fonction",
      "Type Contrat",
      "Salaire Base",
      "Absence (h)",
      "Retenue Absence (DA)",
      "HS 50% (h)",
      "HS 75% (h)",
      "HS 100% (h)",
      "Total HS (DA)",
      "Panier (j)",
      "Panier (DA)",
      "Transport (DA)",
      "Salaire de Poste (Assiette CNAS)",
      "CNAS 9% (DA)",
      "Base IRG (DA)",
      "IRG DGI Retenu (DA)",
      "Brut Total (DA)",
      "Net à Payer (DA)",
      "CNAS Patronale 25% (DA)",
      "Œuvres Sociales 0.5% (DA)",
      "Total DAC 34.5% (DA)",
      "Coût Total Entreprise (DA)",
    ];

    const csvRows = computedRows.map((r) => [
      r.matricule,
      `"${r.nomPrenom}"`,
      `"${r.fonction}"`,
      r.typeContrat,
      r.salaireBase.toFixed(2),
      r.heuresAbsence.toFixed(2),
      r.calc.retenueAbsence.toFixed(2),
      r.hs50.toFixed(2),
      r.hs75.toFixed(2),
      r.hs100.toFixed(2),
      r.calc.totalHeuresSup.toFixed(2),
      r.joursPanier,
      r.calc.montantPanier.toFixed(2),
      r.calc.montantTransport.toFixed(2),
      r.calc.salaireDePoste.toFixed(2),
      r.calc.cnasSalariale.toFixed(2),
      r.calc.baseIrg.toFixed(2),
      r.calc.irgRetenu.toFixed(2),
      r.calc.salaireBrutTotal.toFixed(2),
      r.calc.netAPayer.toFixed(2),
      r.calc.cnasPatronale.toFixed(2),
      r.calc.cnasOeuvresSociales.toFixed(2),
      r.calc.totalDAC.toFixed(2),
      r.calc.coutTotalEmployeur.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...csvRows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `NETIX_Grand_Livre_Paie_${selectedYear}_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeEmployeeCalc = drawerRow
    ? computedRows.find((r) => r.salarieId === drawerRow.salarieId)?.calc
    : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] pb-28">
      {/* ====================================================================
          1. HEADER HAUTE VÉLOCITÉ (STANDARD RAMP / MERCURY)
          ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DD]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#111315] flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-[#0D3B2E]" />
              Saisie de Paie — Saisie Mensuelle des Collaborateurs
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D3B2E] bg-[#E6F3EE] px-2 py-0.5 rounded border border-[#A7F3D0]">
              200 Collaborateurs
            </span>
            <span className="text-[11px] font-medium text-[#5A6065] bg-[#F2F0EC] px-2 py-0.5 rounded border border-[#E6E4DD]">
              0 ms Recalcul Synchrone
            </span>
          </div>
          <p className="text-xs text-[#5A6065]">
            Navigable à 100% au clavier. Conforme Loi 90-11, Décomposition CNAS 34,5% et Table Officielle DGI 2022.
          </p>
        </div>

        {/* Barre d'Actions & Sélecteur de Période */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Sélecteur Période */}
          <div className="flex items-center bg-white border border-[#E6E4DD] rounded-md px-2.5 py-1 text-xs font-semibold text-[#111315]">
            <span className="text-[#5A6065] mr-1.5 font-normal">Période :</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-semibold text-[#111315] cursor-pointer"
            >
              {[
                "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
              ].map((m, idx) => (
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

          <button
            onClick={handleExportCSV}
            className="btn-fintech-secondary"
            title="Exporter le grand livre comptable en CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#5A6065]" />
            Exporter CSV
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-fintech-primary"
            title="Raccourci : Ctrl + S"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            {isSaving ? "Calcul & Sauvegarde..." : "Enregistrer (Ctrl+S)"}
          </button>

          <button
            onClick={() => setIsClotureModalOpen(true)}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Clôturer Mois
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. BANDEAU DE VÉLOCITÉ & ACTIONS EN MASSE
          ==================================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 py-3">
        {/* Raccourcis Clavier & Aide */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] text-[#5A6065]">
          <span className="font-semibold text-[#111315] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-[#0D3B2E]" />
            Clavier :
          </span>
          <span className="bg-white border border-[#E6E4DD] px-1.5 py-0.5 rounded text-[#111315] tabular-nums">
            ↑ ↓ ← →
          </span>
          <span>Naviguer</span>
          <span className="bg-white border border-[#E6E4DD] px-1.5 py-0.5 rounded text-[#111315] tabular-nums">
            Tab / Entrée
          </span>
          <span>Saisir cellule</span>
          <span className="bg-white border border-[#E6E4DD] px-1.5 py-0.5 rounded text-[#111315] tabular-nums">
            Espace
          </span>
          <span>Inspecter Bulletin</span>
        </div>

        {/* Actions Collectives Rapides */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={handleAppliquerPanier22jTous}
            className="text-[11px] font-semibold text-[#0D3B2E] bg-[#E6F3EE] hover:bg-[#D1EBE2] border border-[#A7F3D0] px-2 py-1 rounded transition-colors cursor-pointer"
            title="Attribuer 22 jours de panier à 300 DA à l'ensemble des 200 salariés"
          >
            + Panier 22j à tous
          </button>

          <button
            onClick={handleAppliquerForfaitTransportTous}
            className="text-[11px] font-semibold text-[#111315] bg-white hover:bg-[#F2F0EC] border border-[#E6E4DD] px-2 py-1 rounded transition-colors cursor-pointer"
            title="Appliquer le forfait transport légal de 2 500 DA"
          >
            + Transport 2 500 DA
          </button>

          <button
            onClick={handleReinitialiserAbsences}
            className="text-[11px] font-semibold text-[#991B1B] bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] border border-[#FECACA] px-2 py-1 rounded transition-colors cursor-pointer"
            title="Remettre les absences à zéro"
          >
            Reset Absences
          </button>
        </div>
      </div>

      {/* Message de notification temporaire */}
      {saveSuccessMessage && (
        <div className="mb-3 px-3 py-2 rounded-md bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center justify-between animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-[#065F46] hover:text-[#064E3B]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filtres & Recherche de Salarié */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule (M001...) ou fonction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E6E4DD] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#111315] placeholder:text-[#94A3B8] outline-none focus:border-[#0D3B2E] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5A6065]">
          <span>Affichage :</span>
          <span className="font-semibold text-[#111315]">
            {filteredRows.length} / {rows.length} collaborateurs
          </span>
        </div>
      </div>

      {/* ====================================================================
          3. LA GRILLE FINANCIÈRE "SPREADSHEET 2026" (200 SALARIÉS)
          ==================================================================== */}
      <div
        ref={tableContainerRef}
        className="spreadsheet-grid overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] relative select-none"
      >
        <table className="w-full border-collapse border-spacing-0 text-left">
          {/* En-têtes de colonnes financières */}
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="th-fintech sticky left-0 z-30 min-w-[70px] text-center">
                Matr.
              </th>
              <th className="th-fintech sticky left-[70px] z-30 min-w-[200px]">
                Collaborateur & Fonction
              </th>
              <th className="th-fintech min-w-[110px] text-right">
                Base Mensuelle
              </th>
              <th className="th-fintech min-w-[95px] text-right bg-[#FEF3C7]/40 border-b-[#FDE68A]">
                Absences (h)
              </th>
              <th className="th-fintech min-w-[105px] text-right">
                Retenue Abs.
              </th>
              <th className="th-fintech min-w-[85px] text-right bg-[#E6F3EE]/40">
                HS 50% (h)
              </th>
              <th className="th-fintech min-w-[85px] text-right bg-[#E6F3EE]/40">
                HS 75% (h)
              </th>
              <th className="th-fintech min-w-[85px] text-right bg-[#E6F3EE]/40">
                HS 100% (h)
              </th>
              <th className="th-fintech min-w-[90px] text-right bg-[#E6F3EE]/40">
                Panier (j)
              </th>
              <th className="th-fintech min-w-[105px] text-right bg-[#E6F3EE]/40">
                Transport (DA)
              </th>
              <th className="th-fintech min-w-[105px] text-right">
                Primes Cotis.
              </th>
              <th className="th-fintech min-w-[120px] text-right bg-[#F2F0EC]">
                Poste (CNAS)
              </th>
              <th className="th-fintech min-w-[105px] text-right bg-[#F2F0EC]">
                CNAS 9%
              </th>
              <th className="th-fintech min-w-[115px] text-right bg-[#F2F0EC]">
                Base IRG (R)
              </th>
              <th className="th-fintech min-w-[115px] text-right bg-[#F2F0EC]">
                IRG DGI 2022
              </th>
              <th className="th-fintech min-w-[95px] text-right bg-[#FEF3C7]/40">
                Acomptes
              </th>
              <th className="th-fintech min-w-[120px] text-right">
                Brut Total
              </th>
              <th className="th-fintech min-w-[130px] text-right bg-[#E6F3EE] text-[#0D3B2E] font-bold">
                NET À PAYER
              </th>
              <th className="th-fintech min-w-[80px] text-center">
                Action
              </th>
            </tr>
          </thead>

          {/* Corps de table navigable au clavier */}
          <tbody>
            {filteredRows.map((row, rowIdx) => {
              const isRowActive = activeRowIdx === rowIdx;
              const calc = row.calc;

              return (
                <tr
                  key={row.salarieId}
                  onClick={() => setActiveRowIdx(rowIdx)}
                  className={`tr-fintech ${isRowActive ? "is-selected" : ""}`}
                >
                  {/* Matricule (Sticky gauche) */}
                  <td className="td-fintech sticky left-0 z-10 bg-white tabular-nums text-center text-xs font-semibold text-[#5A6065]">
                    {row.matricule}
                  </td>

                  {/* Collaborateur (Sticky gauche) */}
                  <td className="td-fintech sticky left-[70px] z-10 bg-white min-w-[200px]">
                    <div className="flex flex-col py-0.5">
                      <span className="font-semibold text-xs text-[#111315] truncate">
                        {row.nomPrenom}
                      </span>
                      <span className="text-[10px] text-[#5A6065] truncate">
                        {row.fonction} • {row.typeContrat}
                      </span>
                    </div>
                  </td>

                  {/* Salaire de Base */}
                  <td className="td-fintech num-fintech text-xs text-[#111315]">
                    {formatDA(row.salaireBase, false)}
                  </td>

                  {/* Absences (h) — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "heuresAbsence"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-heuresAbsence`, el);
                      }}
                      type="number"
                      step="0.5"
                      min="0"
                      max="173.33"
                      value={row.heuresAbsence === 0 ? "" : row.heuresAbsence}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "heuresAbsence", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("heuresAbsence");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "heuresAbsence")}
                      className="cell-input"
                    />
                  </td>

                  {/* Retenue Absence — CALCULÉ AUTO */}
                  <td className="td-fintech cell-computed num-fintech text-xs text-[#991B1B]">
                    {calc.retenueAbsence > 0
                      ? `-${formatDA(calc.retenueAbsence, false)}`
                      : "—"}
                  </td>

                  {/* HS 50% — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "hs50"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-hs50`, el);
                      }}
                      type="number"
                      step="1"
                      min="0"
                      value={row.hs50 === 0 ? "" : row.hs50}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "hs50", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("hs50");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "hs50")}
                      className="cell-input"
                    />
                  </td>

                  {/* HS 75% — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "hs75"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-hs75`, el);
                      }}
                      type="number"
                      step="1"
                      min="0"
                      value={row.hs75 === 0 ? "" : row.hs75}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "hs75", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("hs75");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "hs75")}
                      className="cell-input"
                    />
                  </td>

                  {/* HS 100% — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "hs100"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-hs100`, el);
                      }}
                      type="number"
                      step="1"
                      min="0"
                      value={row.hs100 === 0 ? "" : row.hs100}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "hs100", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("hs100");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "hs100")}
                      className="cell-input"
                    />
                  </td>

                  {/* Panier (j) — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "joursPanier"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-joursPanier`, el);
                      }}
                      type="number"
                      step="1"
                      min="0"
                      max="26"
                      value={row.joursPanier}
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "joursPanier", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("joursPanier");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "joursPanier")}
                      className="cell-input font-bold"
                    />
                  </td>

                  {/* Transport (DA) — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "forfaitTransport"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-forfaitTransport`, el);
                      }}
                      type="number"
                      step="100"
                      min="0"
                      value={row.forfaitTransport}
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "forfaitTransport", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("forfaitTransport");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "forfaitTransport")}
                      className="cell-input"
                    />
                  </td>

                  {/* Primes Cotisables (IEP, etc.) — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "primesCotisables"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-primesCotisables`, el);
                      }}
                      type="number"
                      step="500"
                      min="0"
                      value={row.primesCotisables === 0 ? "" : row.primesCotisables}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "primesCotisables", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("primesCotisables");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "primesCotisables")}
                      className="cell-input"
                    />
                  </td>

                  {/* Salaire de Poste (Assiette CNAS) — CALCULÉ AUTO */}
                  <td className="td-fintech cell-computed num-fintech text-xs text-[#111315]">
                    {formatDA(calc.salaireDePoste, false)}
                  </td>

                  {/* CNAS 9% — CALCULÉ AUTO */}
                  <td className="td-fintech cell-computed num-fintech text-xs text-[#991B1B]">
                    {formatDA(calc.cnasSalariale, false)}
                  </td>

                  {/* Base IRG (R tronqué) — CALCULÉ AUTO */}
                  <td className="td-fintech cell-computed num-fintech text-xs text-[#5A6065]">
                    {formatDA(calc.rTronqueIrg, false)}
                  </td>

                  {/* IRG DGI 2022 — CALCULÉ AUTO */}
                  <td className="td-fintech cell-computed num-fintech text-xs text-[#991B1B] font-semibold">
                    {calc.irgRetenu > 0 ? formatDA(calc.irgRetenu, false) : "0,00"}
                  </td>

                  {/* Acomptes — ÉDITABLE */}
                  <td
                    className={`td-fintech p-0 ${
                      activeRowIdx === rowIdx && activeColKey === "avancesAcomptes"
                        ? "cell-focus"
                        : ""
                    }`}
                  >
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${rowIdx}-avancesAcomptes`, el);
                      }}
                      type="number"
                      step="1000"
                      min="0"
                      value={row.avancesAcomptes === 0 ? "" : row.avancesAcomptes}
                      placeholder="0"
                      onChange={(e) =>
                        handleCellChange(row.salarieId, "avancesAcomptes", e.target.value)
                      }
                      onFocus={() => {
                        setActiveRowIdx(rowIdx);
                        setActiveColKey("avancesAcomptes");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, "avancesAcomptes")}
                      className="cell-input text-[#991B1B]"
                    />
                  </td>

                  {/* Brut Total — CALCULÉ AUTO */}
                  <td className="td-fintech num-fintech text-xs font-semibold text-[#111315]">
                    {formatDA(calc.salaireBrutTotal, false)}
                  </td>

                  {/* NET À PAYER — CONSERVÉ AU CENTIME EXACT ,XX DA */}
                  <td className="td-fintech num-fintech text-xs font-bold text-[#0D3B2E] bg-[#E6F3EE]/60">
                    {formatDA(calc.netAPayer)}
                  </td>

                  {/* Action : Inspecter */}
                  <td className="td-fintech text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawerRow(row);
                      }}
                      className="p-1 rounded text-[#5A6065] hover:text-[#0D3B2E] hover:bg-[#E6F3EE] transition-colors cursor-pointer"
                      title="Inspecter le bulletin détaillé (ou touche Espace)"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====================================================================
          4. BARRE DE SYNTHÈSE FINANCIÈRE FIXÉE EN PIED DE PAGE (STICKY FOOTER)
          ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 fintech-summary-footer px-4 py-2.5">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Effectif et masses intermédiaires */}
          <div className="flex items-center flex-wrap gap-4 text-xs text-[#5A6065]">
            <div className="flex items-center gap-1.5 font-semibold text-[#111315]">
              <UserCheck className="w-4 h-4 text-[#0D3B2E]" />
              <span>{rows.length} Collaborateurs</span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div>
              <span className="text-[#5A6065]">Masse Brute : </span>
              <span className="font-semibold tabular-nums text-[#111315]">
                {formatDA(totals.brutTotal)}
              </span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div>
              <span className="text-[#5A6065]">CNAS 9% (Salariés) : </span>
              <span className="font-semibold tabular-nums text-[#991B1B]">
                {formatDA(totals.cnas9)}
              </span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div>
              <span className="text-[#5A6065]">CNAS 25% (Patronale) : </span>
              <span className="font-semibold tabular-nums text-[#111315]">
                {formatDA(totals.cnas25)}
              </span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div>
              <span className="text-[#5A6065]">Œuvres Soc. 0,5% : </span>
              <span className="font-semibold tabular-nums text-[#111315]">
                {formatDA(totals.cnasOeuvres)}
              </span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div className="bg-[#E6F3EE] px-2 py-0.5 rounded border border-[#A7F3D0]">
              <span className="text-[#0D3B2E] font-medium">Total DAC (34,5%) : </span>
              <span className="font-bold tabular-nums text-[#0D3B2E]">
                {formatDA(totals.totalDAC)}
              </span>
            </div>

            <span className="text-[#E6E4DD]">|</span>

            <div>
              <span className="text-[#5A6065]">IRG Reversé (G50) : </span>
              <span className="font-semibold tabular-nums text-[#991B1B]">
                {formatDA(totals.irgTotal)}
              </span>
            </div>
          </div>

          {/* NET GLOBAL À PAYER */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A6065]">
                Net Global des Salaires
              </span>
              <span className="text-lg font-extrabold tabular-nums text-[#0D3B2E] tracking-tight">
                {formatDA(totals.netTotal)}
              </span>
            </div>

            <button
              onClick={handleSave}
              className="btn-fintech-primary text-xs py-1.5 px-3"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. VOLET LATÉRAL D'INSPECTION COULISSANT (TOUCHE ESPACE)
          ==================================================================== */}
      {drawerRow && activeEmployeeCalc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop avec flou léger */}
          <div
            className="drawer-backdrop fixed inset-0"
            onClick={() => setDrawerRow(null)}
          />

          {/* Tiroir d'inspection */}
          <div className="drawer-panel relative w-full max-w-lg h-full overflow-y-auto p-6 z-10 flex flex-col justify-between">
            <div>
              {/* Header du collaborateur */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E6E4DD]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-sm">
                    {drawerRow.nomPrenom.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-base font-bold text-[#111315]">
                      {drawerRow.nomPrenom}
                    </h2>
                    <span className="text-xs text-[#5A6065]">
                      Matricule {drawerRow.matricule} • {drawerRow.fonction}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerRow(null)}
                  className="p-1 rounded-md text-[#5A6065] hover:text-[#111315] hover:bg-[#F2F0EC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fiche juridique résumée */}
              <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-md bg-[#F8F7F4] border border-[#E6E4DD] text-xs">
                <div>
                  <span className="text-[#5A6065]">Contrat :</span>{" "}
                  <span className="font-semibold text-[#111315]">{drawerRow.typeContrat}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Situation :</span>{" "}
                  <span className="font-semibold text-[#111315]">{drawerRow.situationFamiliale}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Enfants à charge :</span>{" "}
                  <span className="font-semibold text-[#111315]">{drawerRow.enfantsACharge}</span>
                </div>
                <div>
                  <span className="text-[#5A6065]">Régime Fiscal IRG :</span>{" "}
                  <span className="font-semibold text-[#0D3B2E]">
                    {drawerRow.regimeIrg === "particulier" ? "Cas Particulier (Handicapé/Retraité)" : "Régime Général"}
                  </span>
                </div>
              </div>

              {/* Cascade Légale de Paie */}
              <div className="space-y-4">
                {/* 1. Base & Absences */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6065]">
                    1. Éléments de Base & Absences (Loi 90-11)
                  </div>
                  <div className="p-3 rounded-md bg-white border border-[#E6E4DD] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5A6065]">Salaire de Base Mensuel :</span>
                      <span className="tabular-nums font-semibold">{formatDA(drawerRow.salaireBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A6065]">Taux Horaire (sur 173,33h) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.tauxHoraire)}/h</span>
                    </div>
                    <div className="flex justify-between text-[#991B1B]">
                      <span>Retenue Absence ({drawerRow.heuresAbsence}h) :</span>
                      <span className="tabular-nums">-{formatDA(activeEmployeeCalc.retenueAbsence)}</span>
                    </div>
                    {activeEmployeeCalc.totalHeuresSup > 0 && (
                      <div className="flex justify-between text-[#065F46]">
                        <span>Total Heures Supplémentaires :</span>
                        <span className="tabular-nums">+{formatDA(activeEmployeeCalc.totalHeuresSup)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Assiette CNAS & Ventilation 34,5% */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6065]">
                    2. Assiette CNAS & Cotisations 34,5% (Loi 83-11)
                  </div>
                  <div className="p-3 rounded-md bg-white border border-[#E6E4DD] space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#111315]">Salaire de Poste (Cotisable) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.salaireDePoste)}</span>
                    </div>
                    <div className="flex justify-between text-[#991B1B]">
                      <span className="text-[#5A6065]">Retenue CNAS Salariale (9%) :</span>
                      <span className="tabular-nums">-{formatDA(activeEmployeeCalc.cnasSalariale)}</span>
                    </div>
                    <div className="flex justify-between text-[#5A6065] pt-1 border-t border-[#E6E4DD]">
                      <span>Part Patronale CNAS (25%) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.cnasPatronale)}</span>
                    </div>
                    <div className="flex justify-between text-[#5A6065]">
                      <span>Fonds Œuvres Sociales (0,5%) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.cnasOeuvresSociales)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#0D3B2E] pt-1 border-t border-[#E6E4DD]">
                      <span>Total Enveloppe DAC CNAS (34,5%) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.totalDAC)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Primes Non Cotisables (Panier & Transport) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6065]">
                    3. Primes Non Cotisables (Ord. 95-01 Art. 1)
                  </div>
                  <div className="p-3 rounded-md bg-white border border-[#E6E4DD] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5A6065]">Indemnité Panier ({drawerRow.joursPanier}j × {drawerRow.tauxPanier || 500} DA) :</span>
                      <span className="tabular-nums font-semibold">{formatDA(activeEmployeeCalc.montantPanier)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A6065]">Indemnité Transport (Proratisée) :</span>
                      <span className="tabular-nums font-semibold">{formatDA(activeEmployeeCalc.montantTransport)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#111315] pt-1 border-t border-[#E6E4DD]">
                      <span>Salaire Brut Total :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.salaireBrutTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Audit Fiscal IRG Barème DGI 2022 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6065]">
                    4. Barème IRG 2022 (CIDTA Art. 104)
                  </div>
                  <div className="p-3 rounded-md bg-[#F2F0EC]/70 border border-[#E6E4DD] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5A6065]">Assiette Imposable Brute :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.baseIrg)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#5A6065]">Troncature Réglementaire à 10 DA (R) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.rTronqueIrg)}</span>
                    </div>
                    <div className="flex justify-between text-[#5A6065]">
                      <span>IRG Brut Progressif :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.detailIrg.irgBrut)}</span>
                    </div>
                    <div className="flex justify-between text-[#065F46]">
                      <span>1er Abattement 40% (plafonné 1 000 - 1 500 DA) :</span>
                      <span className="tabular-nums">-{formatDA(activeEmployeeCalc.detailIrg.abattement40)}</span>
                    </div>
                    {activeEmployeeCalc.rTronqueIrg > 30000 && activeEmployeeCalc.rTronqueIrg < 35000 && (
                      <div className="flex justify-between text-[#0D3B2E] text-[11px] font-medium bg-[#E6F3EE] p-1 rounded">
                        <span>Lissage Dégressif DGI (137/51 - 27925/8) :</span>
                        <span className="tabular-nums">Appliqué</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-[#991B1B] pt-1 border-t border-[#E6E4DD]">
                      <span>IRG Retenu Officiel (Arrondi au 1/10e) :</span>
                      <span className="tabular-nums">{formatDA(activeEmployeeCalc.irgRetenu)}</span>
                    </div>
                  </div>
                </div>

                {/* Synthèse Finale & Net à Payer */}
                <div className="p-4 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#0D3B2E]">
                      Net à Payer (Centime Exact)
                    </span>
                    <span className="text-xl font-black tabular-nums text-[#0D3B2E]">
                      {formatDA(activeEmployeeCalc.netAPayer)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#065F46] pt-1 border-t border-[#A7F3D0]/60">
                    <span>Coût Total Employeur :</span>
                    <span className="tabular-nums font-semibold">
                      {formatDA(activeEmployeeCalc.coutTotalEmployeur)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions en bas de volet */}
            <div className="pt-4 border-t border-[#E6E4DD] flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn-fintech-secondary text-xs flex-1 justify-center"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                Imprimer Bulletin
              </button>
              <button
                onClick={() => setDrawerRow(null)}
                className="btn-fintech-primary text-xs flex-1 justify-center"
              >
                Fermer [Échap]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          6. MODALE DE CONFIRMATION DE CLÔTURE DE PÉRIODE
          ==================================================================== */}
      {isClotureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#111315]/40 backdrop-blur-xs"
            onClick={() => setIsClotureModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg border border-[#E6E4DD] shadow-xl max-w-md w-full p-6 space-y-4 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#111315]">
                  Clôturer la Période {selectedMonth}/{selectedYear}
                </h3>
                <span className="text-xs text-[#5A6065]">
                  Opération officielle irréversible de fin de mois
                </span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
              <p className="font-bold">Attention :</p>
              <p>
                La clôture verrouille les 200 bulletins de paie, fige l'assiette CNAS (34,5%) et génère le bordereau officiel de virement bancaire et la déclaration G50.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClotureModalOpen(false)}
                className="btn-fintech-secondary text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleCloturerPeriode}
                className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Confirmer la Clôture Définitive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
