"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  Download,
  ExternalLink,
  X,
  FileText,
  Calculator,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  User,
  CreditCard,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  PieChart,
  Loader2,
} from "lucide-react";
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
import {
  SalarieCockpit,
  BulletinCockpitVariables,
} from "../(app)/paie/actions";
import { calculerMontantRubriqueFixe } from "../(app)/paie/cockpit-client";
import { montantEnLettresDA } from "@/lib/numberToWords";

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

type DocumentType = "bulletin" | "calcul" | "charges" | "complet";

interface Props {
  initialSalaries: SalarieCockpit[];
  initialVariables: Record<number, BulletinCockpitVariables>;
  annee: number;
  mois: number;
  initialSalarieId: number;
  initialType: DocumentType;
}

export default function DocumentViewerClient({
  initialSalaries,
  initialVariables,
  annee,
  mois,
  initialSalarieId,
  initialType,
}: Props) {
  const router = useRouter();
  const [salaries] = useState<SalarieCockpit[]>(initialSalaries);
  const [variablesMap] = useState<Record<number, BulletinCockpitVariables>>(initialVariables);
  const [selectedSalarieId, setSelectedSalarieId] = useState<number>(initialSalarieId);
  const [docType, setDocType] = useState<DocumentType>(initialType);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Collaborateur actuellement affiché
  const currentSalarie = useMemo(() => {
    return salaries.find((s) => s.id === selectedSalarieId) || salaries[0];
  }, [salaries, selectedSalarieId]);

  const currentIdx = useMemo(() => {
    return salaries.findIndex((s) => s.id === currentSalarie?.id);
  }, [salaries, currentSalarie]);

  const currentVariables = useMemo(() => {
    if (!currentSalarie) return null;
    return (
      variablesMap[currentSalarie.id] || {
        salarieId: currentSalarie.id,
        annee,
        mois,
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
        statut: "Validé",
      }
    );
  }, [currentSalarie, variablesMap, annee, mois]);

  // Calcul du bulletin du collaborateur (harmonisé avec le moteur Cockpit)
  const calc = useMemo(() => {
    if (!currentSalarie || !currentVariables) return null;

    // Proratisation salaire réel selon absences Loi 90-11
    const retenueAbsence = calculerRetenueAbsence(currentVariables.heuresAbsence, currentSalarie.salaire_base_theorique);
    const salaireBaseReel = Math.max(0, currentSalarie.salaire_base_theorique - retenueAbsence);

    const totalPrimesFixesCotisables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

    const totalPrimesVariablesCotisables = currentVariables.primesVariables
      .filter((p) => p.cotisable)
      .reduce((acc, p) => acc + p.montant, 0);

    const totalPrimesCotisables = totalPrimesFixesCotisables + totalPrimesVariablesCotisables;

    const totalPrimesNonCotisablesImposables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "NON" && (r.imposable === "OUI" || r.imposable === "IRG"))
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

    const totalRetenuesFixes = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Retenue (-)")
      .reduce((acc, r) => acc + calculerMontantRubriqueFixe(r, salaireBaseReel), 0);

    return calculerBulletinComplet({
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
  }, [currentSalarie, currentVariables]);

  const handleSelectNext = () => {
    if (currentIdx < salaries.length - 1) {
      setSelectedSalarieId(salaries[currentIdx + 1].id);
    }
  };

  const handleSelectPrev = () => {
    if (currentIdx > 0) {
      setSelectedSalarieId(salaries[currentIdx - 1].id);
    }
  };

  // =========================================================================
  // MOTEUR DE GÉNÉRATION DE VRAI FICHIER PDF (TÉLÉCHARGEMENT & NOUVEL ONGLET)
  // =========================================================================
  const generateRealPdf = async (action: "download" | "open") => {
    if (isGeneratingPdf || typeof window === "undefined") return;

    try {
      setIsGeneratingPdf(true);

      // Chargement dynamique de html2pdf.js s'il n'est pas déjà présent
      if (!(window as any).html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      const element = document.getElementById("pdf-target-sheet");

      if (!element) {
        throw new Error("Élément introuvable");
      }

      const safeName = currentSalarie.nom_prenom.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Bulletin_Paie_${safeName}_${MOIS_FR[mois - 1]}_${annee}.pdf`;

      const opt = {
        margin: [6, 8, 6, 8],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      if (action === "download") {
        await html2pdf().set(opt).from(element).save();
      } else {
        const pdfWorker = html2pdf().set(opt).from(element).toPdf();
        const pdf = await pdfWorker.get("pdf");
        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      }
    } catch (err) {
      console.error("Erreur lors de la génération PDF :", err);
      // Repli sur l'impression native du navigateur
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!currentSalarie || !currentVariables || !calc) {
    return <div className="p-8 text-center text-sm">Chargement du document de paie...</div>;
  }

  // Montant en toutes lettres
  const netEnLettres = montantEnLettresDA(calc.netAPayer);

  // Pourcentages pour le graphique des charges (aucun bleu)
  const pctNet = Math.round((calc.netAPayer / calc.coutTotalEmployeur) * 100);
  const pctCnasPatronale = Math.round(((calc.cnasPatronale + calc.cnasOeuvresSociales) / calc.coutTotalEmployeur) * 100);
  const pctIrg = Math.round((calc.irgRetenu / calc.coutTotalEmployeur) * 100);
  const pctCnasSalariale = 100 - pctNet - pctCnasPatronale - pctIrg;

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#111315] font-sans flex flex-col items-center">
      {/* ====================================================================
          BARRE SUPÉRIEURE FLOTTANTE (PRINT:HIDDEN)
          ==================================================================== */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E6E4DD] px-4 py-2.5 shadow-xs print:hidden w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Titre et collaborateur */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs shadow-xs font-mono">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111315]">
                Netix SIRH • Édition Documents de Paie
              </span>
              <div className="flex items-center gap-1 bg-[#F8F7F4] border border-[#E6E4DD] rounded-md px-1.5 py-0.5 text-xs">
                <Calendar className="w-3 h-3 text-[#0D3B2E]" />
                <select
                  value={mois}
                  onChange={(e) => {
                    const newM = Number(e.target.value);
                    router.push(`/document-paie?id=${currentSalarie.id}&annee=${annee}&mois=${newM}&type=${docType}`);
                  }}
                  className="bg-transparent font-bold text-[#0D3B2E] outline-none cursor-pointer text-xs"
                  title="Changer le mois visualisé"
                >
                  {MOIS_FR.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={annee}
                  onChange={(e) => {
                    const newY = Number(e.target.value);
                    router.push(`/document-paie?id=${currentSalarie.id}&annee=${newY}&mois=${mois}&type=${docType}`);
                  }}
                  className="bg-transparent font-bold text-[#0D3B2E] outline-none cursor-pointer text-xs"
                  title="Changer l'année visualisée"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-[#5A6065]">
              Collaborateur : <strong className="text-[#111315]">{currentSalarie.nom_prenom}</strong> ({currentSalarie.matricule}) • {currentSalarie.fonction}
            </p>
          </div>
        </div>

        {/* Sélecteur des 4 types de documents */}
        <div className="flex items-center bg-[#F2F0EC] p-1 rounded-lg border border-[#E6E4DD] text-xs">
          <button
            onClick={() => setDocType("bulletin")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              docType === "bulletin"
                ? "bg-white text-[#0D3B2E] shadow-xs"
                : "text-[#5A6065] hover:text-[#111315]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Bulletin Salarié</span>
          </button>

          <button
            onClick={() => setDocType("calcul")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              docType === "calcul"
                ? "bg-white text-[#0D3B2E] shadow-xs"
                : "text-[#5A6065] hover:text-[#111315]"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>2. Explication Calcul</span>
          </button>

          <button
            onClick={() => setDocType("charges")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              docType === "charges"
                ? "bg-white text-[#0D3B2E] shadow-xs"
                : "text-[#5A6065] hover:text-[#111315]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. Charges Patronales</span>
          </button>

          <button
            onClick={() => setDocType("complet")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              docType === "complet"
                ? "bg-[#0D3B2E] text-white shadow-xs"
                : "text-[#5A6065] hover:text-[#111315]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dossier Complet</span>
          </button>
        </div>

        {/* Contrôles de navigation et d'actions PDF réelles */}
        <div className="flex items-center gap-2">
          {/* Navigation Précédent / Suivant */}
          <div className="flex items-center border border-[#E6E4DD] rounded-lg bg-white px-1 py-0.5">
            <button
              onClick={handleSelectPrev}
              disabled={currentIdx <= 0}
              className="p-1 rounded text-[#5A6065] hover:text-[#111315] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Salarié précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums text-xs px-2 font-semibold text-[#5A6065]">
              {currentIdx + 1}/{salaries.length}
            </span>
            <button
              onClick={handleSelectNext}
              disabled={currentIdx >= salaries.length - 1}
              className="p-1 rounded text-[#5A6065] hover:text-[#111315] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Salarié suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bouton Télécharger Vrai PDF */}
          <button
            onClick={() => generateRealPdf("download")}
            disabled={isGeneratingPdf}
            className="btn-fintech-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Télécharger directement un vrai fichier PDF sur votre ordinateur"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? "Génération PDF..." : "Télécharger PDF"}</span>
          </button>

          {/* Bouton Ouvrir en PDF (Nouvel Onglet) */}
          <button
            onClick={() => generateRealPdf("open")}
            disabled={isGeneratingPdf}
            className="btn-fintech-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Ouvrir le document directement dans le lecteur PDF de Chrome"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#5A6065]" />
            <span className="hidden sm:inline">Ouvrir en PDF</span>
          </button>

          {/* Bouton Impression Papier Propre */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg border border-[#E6E4DD] hover:bg-[#F2F0EC] text-[#5A6065] transition-colors cursor-pointer"
            title="Imprimer sur papier (Format A4 direct)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Bouton Fermer */}
          <button
            onClick={() => window.close()}
            className="p-1.5 rounded-lg border border-[#E6E4DD] hover:bg-[#F2F0EC] text-[#5A6065] transition-colors cursor-pointer"
            title="Fermer cet onglet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ====================================================================
          CORPS DU DOCUMENT : FORMAT A4 RÉALISTE & ZERO OVERFLOW
          ==================================================================== */}
      <main className="py-8 px-4 w-full flex flex-col items-center gap-10 print:p-0 print:gap-0">
        {/* ==================================================================
            DOCUMENT 1 : BULLETIN DE SALAIRE ÉPURÉ ET MODERNE
            (SANS AUCUNE SIGNATURE, SANS COMPTEURS ENCOMBRANTS, ZERO BLEU)
            ================================================================== */}
        {(docType === "bulletin" || docType === "complet") && (
          <article
            id="pdf-target-sheet"
            className="a4-sheet bg-white border border-[#E2E0D8] shadow-md rounded-lg w-full max-w-[210mm] p-7 sm:p-9 text-[#111315] print:border-none print:shadow-none print:p-6 print:max-w-none print:m-0 print:break-after-page space-y-5"
          >
            {/* En-tête Entreprise & Période */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E6E4DD]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs font-mono">
                    N
                  </div>
                  <h1 className="text-base font-extrabold tracking-tight text-[#111315]">
                    SARL ENTREPRISE ALGER
                  </h1>
                </div>
                <p className="text-[11px] text-[#5A6065] leading-relaxed">
                  Zone Industrielle Oued Smar, Lot N° 42, Alger<br />
                  <span className="text-[#71777D]">
                    NIF: 001916012345678 • NIS: 19801234567 • RC: 16/00-1234567B19 • Adhérent CNAS: 16-98765432-10
                  </span>
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#065F46] bg-[#E6F3EE] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
                  Bulletin de Paie
                </span>
                <div className="text-sm font-extrabold text-[#111315] tracking-tight">
                  {MOIS_FR[mois - 1]} {annee}
                </div>
                <p className="text-[10px] text-[#5A6065]">
                  Paiement : 31/{mois.toString().padStart(2, "0")}/{annee} • Virement bancaire
                </p>
              </div>
            </div>

            {/* Fiche d'identification du salarié (3 colonnes claires) */}
            <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-xl p-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Col 1 : Identité */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6065] block">
                    Collaborateur
                  </span>
                  <div className="font-bold text-sm text-[#111315]">
                    {currentSalarie.nom_prenom}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#5A6065]">
                    <span>Matricule :</span>
                    <span className="font-semibold text-[#0D3B2E] bg-white px-1.5 py-0.5 rounded border border-[#E6E4DD]">
                      {currentSalarie.matricule}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A6065]">
                    <span>N° Sécurité Sociale : </span>
                    <strong className="text-[#111315] font-mono">{currentSalarie.num_ss}</strong>
                  </div>
                </div>

                {/* Col 2 : Poste & Organisation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6065] block">
                    Poste & Contrat
                  </span>
                  <div className="font-semibold text-[#111315]">
                    {currentSalarie.fonction}
                  </div>
                  <div className="text-[11px] text-[#5A6065]">
                    Service : <span className="text-[#111315]">{currentSalarie.departement}</span>
                  </div>
                  <div className="text-[11px] text-[#5A6065]">
                    Contrat : <strong className="text-[#111315]">{currentSalarie.type_contrat}</strong> • 173,33 h/mois
                  </div>
                </div>

                {/* Col 3 : Règlement & Situation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6065] block">
                    Paiement & Situation
                  </span>
                  <div className="text-[11px] text-[#111315]">
                    Virement Bancaire : <span className="font-mono text-[10px] text-[#5A6065]">{currentSalarie.ccp_rib}</span>
                  </div>
                  <div className="text-[11px] text-[#5A6065]">
                    Situation : {currentSalarie.situation_familiale} ({currentSalarie.enfants_a_charge} enfant(s))
                  </div>
                  <div className="text-[11px] text-[#5A6065]">
                    Régime fiscal : <span className="text-[#111315] font-medium">{currentSalarie.regime_irg}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLEAU DES RUBRIQUES — STRUCTURE LIMPIDE EN 2 SECTIONS */}
            <div className="border border-[#E6E4DD] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-[#F8F7F4] border-b border-[#E6E4DD] text-[10px] text-[#5A6065] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3 text-left font-bold w-16">Code</th>
                    <th className="py-2 px-3 text-left font-bold">Désignation de la Rubrique</th>
                    <th className="py-2 px-3 text-right font-bold w-20">Base</th>
                    <th className="py-2 px-3 text-right font-bold w-20">Taux</th>
                    <th className="py-2 px-3 text-right font-bold w-28">Gains (+)</th>
                    <th className="py-2 px-3 text-right font-bold w-28">Retenues (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8] tabular-nums text-[11px]">
                  {/* SECTION 1 : RÉMUNÉRATION BRUTE */}
                  <tr className="bg-[#FAF9F6]">
                    <td colSpan={6} className="py-1 px-3 font-bold text-[10px] uppercase tracking-wider text-[#5A6065]">
                      1. Éléments de Rémunération Brute
                    </td>
                  </tr>

                  {/* Salaire de base */}
                  <tr className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-1.5 px-3 text-[#5A6065] font-mono">R030</td>
                    <td className="py-1.5 px-3 font-medium text-[#111315]">Salaire de Base Conventionnel</td>
                    <td className="py-1.5 px-3 text-right text-[#5A6065]">173,33 h</td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                      {formatDA(currentSalarie.salaire_base_theorique, false)}
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                  </tr>

                  {/* Retenue absence */}
                  {calc.retenueAbsence > 0 && (
                    <tr className="bg-[#FEF2F2]/60 text-[#991B1B]">
                      <td className="py-1.5 px-3 font-mono">R100</td>
                      <td className="py-1.5 px-3">Retenue Absence non rémunérée</td>
                      <td className="py-1.5 px-3 text-right">{currentVariables.heuresAbsence} h</td>
                      <td className="py-1.5 px-3 text-right">{formatDA(calc.tauxHoraire, false)}</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right font-semibold">
                        {formatDA(calc.retenueAbsence, false)}
                      </td>
                    </tr>
                  )}

                  {/* Primes fixes cotisables */}
                  {currentSalarie.rubriquesFixes
                    .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
                    .map((rub) => (
                      <tr key={rub.code} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-1.5 px-3 text-[#5A6065] font-mono">{rub.code}</td>
                        <td className="py-1.5 px-3 text-[#111315]">{rub.libelle}</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                          {formatDA(rub.valeur_defaut, false)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      </tr>
                    ))}

                  {/* Primes variables cotisables */}
                  {currentVariables.primesVariables
                    .filter((p) => p.cotisable)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-1.5 px-3 text-[#5A6065] font-mono">{p.code}</td>
                        <td className="py-1.5 px-3 text-[#111315]">{p.libelle}</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                          {formatDA(p.montant, false)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      </tr>
                    ))}

                  {/* Heures supplémentaires */}
                  {calc.totalHeuresSup > 0 && (
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#5A6065] font-mono">R120</td>
                      <td className="py-1.5 px-3 text-[#111315]">
                        Heures Supplémentaires (+50%: {currentVariables.hs50}h, +75%: {currentVariables.hs75}h, +100%: {currentVariables.hs100}h)
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.totalHeuresSup, false)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    </tr>
                  )}

                  {/* SOUS-TOTAL 1 : SALAIRE DE POSTE (ASSIETTE CNAS) */}
                  <tr className="bg-[#F4F3F0] font-bold text-[#0D3B2E] border-t border-b border-[#E6E4DD]">
                    <td colSpan={2} className="py-1.5 px-3 text-xs">
                      Salaire de Poste (Assiette Cotisable Sécurité Sociale)
                    </td>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-[10px] text-[#5A6065] font-normal uppercase">
                      Assiette cotisable
                    </td>
                    <td className="py-1.5 px-3 text-right text-xs">
                      {formatDA(calc.salaireDePoste, false)}
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                  </tr>

                  {/* Indemnités non cotisables : Panier & Transport */}
                  {calc.montantPanier > 0 && (
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#5A6065] font-mono">R250</td>
                      <td className="py-1.5 px-3 text-[#111315]">Indemnité de Panier (Restauration)</td>
                      <td className="py-1.5 px-3 text-right text-[#5A6065]">{currentVariables.joursPanier} j</td>
                      <td className="py-1.5 px-3 text-right text-[#5A6065]">{formatDA(currentVariables.tauxPanier || 500, false)} DA</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.montantPanier, false)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    </tr>
                  )}

                  {calc.montantTransport > 0 && (
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#5A6065] font-mono">R280</td>
                      <td className="py-1.5 px-3 text-[#111315]">Indemnité Forfaitaire de Transport</td>
                      <td className="py-1.5 px-3 text-right text-[#5A6065]">173,33 h</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.montantTransport, false)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    </tr>
                  )}

                  {/* Autres primes non cotisables */}
                  {currentSalarie.rubriquesFixes
                    .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "NON")
                    .map((rub) => (
                      <tr key={rub.code} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-1.5 px-3 text-[#5A6065] font-mono">{rub.code}</td>
                        <td className="py-1.5 px-3 text-[#111315]">{rub.libelle}</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                          {formatDA(rub.valeur_defaut, false)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      </tr>
                    ))}

                  {/* SOUS-TOTAL 2 : SALAIRE BRUT TOTAL */}
                  <tr className="bg-[#FAF9F6] font-bold text-[#111315] border-t border-b border-[#E6E4DD]">
                    <td colSpan={2} className="py-1.5 px-3 text-xs">
                      Salaire Brut Total Rémunéré
                    </td>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-[10px] text-[#5A6065] font-normal uppercase">
                      Total gains
                    </td>
                    <td className="py-1.5 px-3 text-right text-xs">
                      {formatDA(calc.salaireBrutTotal, false)}
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                  </tr>

                  {/* SECTION 2 : COTISATIONS ET RETENUES LÉGALES */}
                  <tr className="bg-[#FAF9F6]">
                    <td colSpan={6} className="py-1 px-3 font-bold text-[10px] uppercase tracking-wider text-[#5A6065]">
                      2. Cotisations Sociales & Retenues Fiscales
                    </td>
                  </tr>

                  {/* Cotisation CNAS 9% */}
                  <tr className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-1.5 px-3 text-[#5A6065] font-mono">R950</td>
                    <td className="py-1.5 px-3 text-[#111315]">Cotisation Sécurité Sociale (Part Ouvrière 9%)</td>
                    <td className="py-1.5 px-3 text-right text-[#5A6065]">{formatDA(calc.salaireDePoste, false)}</td>
                    <td className="py-1.5 px-3 text-right text-[#5A6065]">9,00 %</td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-[#991B1B]">
                      {formatDA(calc.cnasSalariale, false)}
                    </td>
                  </tr>

                  {/* Retenue IRG Barème LF 2022 */}
                  <tr className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-1.5 px-3 text-[#5A6065] font-mono">R980</td>
                    <td className="py-1.5 px-3 text-[#111315]">
                      Impôt sur le Revenu Global — IRG Barème LF 2022 (R: {formatDA(calc.rTronqueIrg, false)})
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#5A6065]">{formatDA(calc.baseIrg, false)}</td>
                    <td className="py-1.5 px-3 text-right text-[#5A6065]">Barème</td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-[#991B1B]">
                      {formatDA(calc.irgRetenu, false)}
                    </td>
                  </tr>

                  {/* Acomptes ou avances */}
                  {currentVariables.avancesAcomptes > 0 && (
                    <tr className="text-[#991B1B] hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 font-mono">R999</td>
                      <td className="py-1.5 px-3">Acomptes et avances sur salaire déduits</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                      <td className="py-1.5 px-3 text-right font-semibold">
                        {formatDA(currentVariables.avancesAcomptes, false)}
                      </td>
                    </tr>
                  )}

                  {/* Retenues fixes diverses */}
                  {currentSalarie.rubriquesFixes
                    .filter((r) => r.type_valeur === "Retenue (-)")
                    .map((rub) => (
                      <tr key={rub.code} className="text-[#991B1B] hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-1.5 px-3 font-mono">{rub.code}</td>
                        <td className="py-1.5 px-3">{rub.libelle}</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(rub.valeur_defaut, false)}
                        </td>
                      </tr>
                    ))}

                  {/* SOUS-TOTAL 3 : TOTAL DES RETENUES */}
                  <tr className="bg-[#FAF9F6] font-bold text-[#991B1B] border-t border-b border-[#E6E4DD]">
                    <td colSpan={2} className="py-1.5 px-3 text-xs">
                      Total des Retenues Salariales
                    </td>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-[10px] text-[#5A6065] font-normal uppercase">
                      Total retenues
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#94A3B8]">—</td>
                    <td className="py-1.5 px-3 text-right text-xs">
                      {formatDA(calc.totalRetenues, false)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ENCADRÉ MODERNE : NET À PAYER AU SALARIÉ (CONCLUSION DU BULLETIN) */}
            <div className="bg-[#EBF7F2] border border-[#A7F3D0] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#065F46]">
                    Net à Payer au Salarié
                  </span>
                  <span className="text-[10px] font-semibold text-[#0D3B2E] bg-white px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    Virement Bancaire
                  </span>
                </div>
                <p className="text-xs text-[#0D3B2E] font-medium leading-relaxed">
                  Arrêté à la somme de : <strong>{netEnLettres}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-3xl font-black tabular-nums text-[#0D3B2E] tracking-tight">
                  {formatDA(calc.netAPayer)}
                </span>
              </div>
            </div>
          </article>
        )}

        {/* ==================================================================
            DOCUMENT 2 : NOTE D'EXPLICATION DU CALCUL (PÉDAGOGIQUE & MODERNE)
            ================================================================== */}
        {(docType === "calcul" || docType === "complet") && (
          <article className="a4-sheet bg-white border border-[#E2E0D8] shadow-md rounded-lg w-full max-w-[210mm] p-7 sm:p-9 text-[#111315] print:border-none print:shadow-none print:p-6 print:max-w-none print:m-0 print:break-after-page space-y-5">
            {/* En-tête */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E6E4DD]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider bg-[#E6F3EE] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                  Pédagogie & Transparence RH
                </span>
                <h2 className="text-base font-extrabold text-[#111315] tracking-tight">
                  Comprendre Votre Fiche de Paie
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Décomposition pas à pas des règles légales et formules mathématiques appliquées ce mois-ci.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#111315] block">
                  {currentSalarie.nom_prenom} ({currentSalarie.matricule})
                </span>
                <span className="text-[11px] text-[#5A6065]">
                  Période : {MOIS_FR[mois - 1]} {annee}
                </span>
              </div>
            </div>

            {/* FRISE VISUELLE EN 4 ÉTAPES CLAIRES */}
            <div className="space-y-3.5 text-xs">
              {/* ÉTAPE 1 : TEMPS ET BASE */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    <h3 className="font-bold text-xs text-[#111315]">
                      Temps de Travail Légal & Salaire de Base (Loi 90-11)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#5A6065] font-mono">173,33 h/mois</span>
                </div>
                <p className="text-[11px] text-[#5A6065] leading-relaxed">
                  Le mois de travail légal en Algérie est fixé à <strong>173,33 heures</strong> (40 heures par semaine × 52 semaines ÷ 12 mois). Le taux horaire sert de base pour déduire les absences ou rémunérer les heures supplémentaires.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E6E4DD]">
                    <span className="text-[#5A6065] block text-[10px]">Taux horaire de base :</span>
                    <span className="font-bold text-[#111315]">{formatDA(calc.tauxHoraire)} / heure</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E6E4DD]">
                    <span className="text-[#5A6065] block text-[10px]">Heures payées :</span>
                    <span className="font-bold text-[#0D3B2E]">
                      {calc.heuresTravaillees} h {currentVariables.heuresAbsence > 0 ? `(-${currentVariables.heuresAbsence}h absence)` : "(Temps plein)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ÉTAPE 2 : ASSIETTE COTISABLE CNAS */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    <h3 className="font-bold text-xs text-[#111315]">
                      L'Assiette de Sécurité Sociale — Salaire de Poste & CNAS (9%)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                    Taux légal 9,00%
                  </span>
                </div>
                <p className="text-[11px] text-[#5A6065] leading-relaxed">
                  La Sécurité Sociale est calculée sur le <strong>Salaire de Poste</strong> (salaire de base + primes de poste cotisables). Les indemnités de Panier ({formatDA(calc.montantPanier)}) et de Transport ({formatDA(calc.montantTransport)}) constituent des remboursements de frais réels et sont <strong>exonérées de cotisation CNAS</strong>.
                </p>
                <div className="p-3 rounded-lg bg-white border border-[#E6E4DD] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5A6065]">Salaire de Poste (Assiette CNAS) :</span>
                    <strong className="text-[#111315]">{formatDA(calc.salaireDePoste)}</strong>
                  </div>
                  <div className="flex justify-between text-[#991B1B]">
                    <span>Cotisation CNAS Part Salariale (9,00%) :</span>
                    <strong>- {formatDA(calc.cnasSalariale)}</strong>
                  </div>
                </div>
              </div>

              {/* ÉTAPE 3 : BARÈME IRG 2022 */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                      3
                    </span>
                    <h3 className="font-bold text-xs text-[#111315]">
                      L'Impôt sur le Revenu Global — IRG Barème LF 2022 (Décret 22-01)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#5A6065] font-mono">Troncature légale (R)</span>
                </div>
                <p className="text-[11px] text-[#5A6065] leading-relaxed">
                  L'IRG est retenu à la source selon le barème progressif officiel. L'assiette imposable est <strong>tronquée à la dizaine de dinar inférieure</strong> (ex: {formatDA(calc.baseIrg, false)} ➔ {formatDA(calc.rTronqueIrg, false)}). Un abattement légal de 40% (plafonné à 1 500 DA) et un abattement dégressif (zone 30 000 - 35 000 DA) sont appliqués.
                </p>
                <div className="p-3 rounded-lg bg-white border border-[#E6E4DD] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5A6065]">Base Imposable Brute (R tronqué) :</span>
                    <strong className="text-[#111315]">{formatDA(calc.rTronqueIrg)}</strong>
                  </div>
                  <div className="flex justify-between text-[#065F46]">
                    <span>Abattements fiscaux appliqués :</span>
                    <span>- {formatDA(calc.detailIrg.abattement40 + calc.detailIrg.abattementDegressif)}</span>
                  </div>
                  <div className="flex justify-between text-[#991B1B] pt-1 border-t border-[#E6E4DD]">
                    <span className="font-semibold">IRG Net Retenu au Bulletin :</span>
                    <strong>- {formatDA(calc.irgRetenu)}</strong>
                  </div>
                </div>
              </div>

              {/* ÉTAPE 4 : SYNTHÈSE VERS LE NET FINAL */}
              <div className="p-4 rounded-xl bg-[#EBF7F2] border border-[#A7F3D0] space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-[10px]">
                    4
                  </span>
                  <h3 className="font-bold text-xs text-[#0D3B2E]">
                    Synthèse de Calcul : Du Salaire Brut au Net Versé
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#A7F3D0]">
                    <span className="text-[10px] text-[#5A6065] block">Salaire Brut Total</span>
                    <span className="font-bold text-[#111315]">{formatDA(calc.salaireBrutTotal)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#A7F3D0]">
                    <span className="text-[10px] text-[#991B1B] block">Retenue CNAS 9%</span>
                    <span className="font-bold text-[#991B1B]">- {formatDA(calc.cnasSalariale)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#A7F3D0]">
                    <span className="text-[10px] text-[#991B1B] block">Retenue IRG</span>
                    <span className="font-bold text-[#991B1B]">- {formatDA(calc.irgRetenu)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0D3B2E] text-white">
                    <span className="text-[10px] text-white/80 block">Net à Payer</span>
                    <span className="font-black text-sm">{formatDA(calc.netAPayer)}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* ==================================================================
            DOCUMENT 3 : NOTE DES CHARGES PATRONALES & COÛT GLOBAL
            (ZERO COULEUR BLEUE — DESIGN ÉMERAUDE & ALBATRE PUR)
            ================================================================== */}
        {(docType === "charges" || docType === "complet") && (
          <article className="a4-sheet bg-white border border-[#E2E0D8] shadow-md rounded-lg w-full max-w-[210mm] p-7 sm:p-9 text-[#111315] print:border-none print:shadow-none print:p-6 print:max-w-none print:m-0 print:break-after-page space-y-5">
            {/* En-tête */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E6E4DD]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0D3B2E] uppercase tracking-wider bg-[#E6F3EE] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                  Direction Financière & RH
                </span>
                <h2 className="text-base font-extrabold text-[#111315] tracking-tight">
                  Analyse des Charges Patronales & Coût Global
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Ventilation des cotisations employeur et de l'enveloppe légale DAC (34,50%).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#111315] block">
                  {currentSalarie.nom_prenom} ({currentSalarie.matricule})
                </span>
                <span className="text-[11px] text-[#5A6065]">
                  Période : {MOIS_FR[mois - 1]} {annee}
                </span>
              </div>
            </div>

            {/* 1. TOP 4 KPI CARDS (ZERO BLEU) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1]">
                <span className="text-[10px] text-[#5A6065] block font-medium">Net Salarié Versé :</span>
                <span className="text-base font-black tabular-nums text-[#0D3B2E]">
                  {formatDA(calc.netAPayer)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1]">
                <span className="text-[10px] text-[#5A6065] block font-medium">Salaire de Poste (CNAS) :</span>
                <span className="text-base font-bold tabular-nums text-[#111315]">
                  {formatDA(calc.salaireDePoste)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4F3F0] border border-[#E6E4DD]">
                <span className="text-[10px] text-[#5A6065] block font-medium">Charges Patronales (25,5%) :</span>
                <span className="text-base font-black tabular-nums text-[#0D3B2E]">
                  {formatDA(calc.cnasPatronale + calc.cnasOeuvresSociales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#EBF7F2] border border-[#A7F3D0]">
                <span className="text-[10px] text-[#065F46] block font-medium">Coût Global Entreprise :</span>
                <span className="text-base font-black tabular-nums text-[#0D3B2E]">
                  {formatDA(calc.coutTotalEmployeur)}
                </span>
              </div>
            </div>

            {/* BARRE VISUELLE DE RÉPARTITION DES COÛTS (ZERO BLEU) */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111315]">Répartition Globale du Coût Employeur</span>
                <span className="text-[11px] text-[#5A6065] font-mono">100% = {formatDA(calc.coutTotalEmployeur)}</span>
              </div>

              {/* Barre segmentée harmonieuse */}
              <div className="h-3.5 w-full bg-[#E6E4DD] rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${pctNet}%` }}
                  className="bg-[#0D3B2E] h-full"
                  title={`Net Salarié: ${pctNet}%`}
                />
                <div
                  style={{ width: `${pctCnasPatronale}%` }}
                  className="bg-[#059669] h-full"
                  title={`Charges Patronales: ${pctCnasPatronale}%`}
                />
                <div
                  style={{ width: `${pctIrg}%` }}
                  className="bg-[#DC2626] h-full"
                  title={`Impôt IRG: ${pctIrg}%`}
                />
                <div
                  style={{ width: `${pctCnasSalariale}%` }}
                  className="bg-[#6EE7B7] h-full"
                  title={`CNAS Salariale: ${pctCnasSalariale}%`}
                />
              </div>

              {/* Légende */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-[#5A6065] pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D3B2E]" />
                  <span>Net Salarié ({pctNet}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <span>Charges Patronales ({pctCnasPatronale}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span>Impôt IRG G50 ({pctIrg}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6EE7B7]" />
                  <span>CNAS Salarié ({pctCnasSalariale}%)</span>
                </div>
              </div>
            </div>

            {/* TABLEAU DE VENTILATION DAC CNAS (34,50%) (ZERO BLEU) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111315]">
                  Ventilation Légale du Bordereau CNAS — Déclaration DAC 34,50%
                </h3>
                <span className="text-[11px] text-[#5A6065]">
                  Assiette soumise : <strong className="text-[#111315]">{formatDA(calc.salaireDePoste)}</strong>
                </span>
              </div>

              <div className="border border-[#E6E4DD] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-[#F8F7F4] border-b border-[#E6E4DD] text-[10px] text-[#5A6065] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold">Branche de Sécurité Sociale</th>
                      <th className="py-2 px-3 text-left font-bold w-28">Organisme</th>
                      <th className="py-2 px-3 text-right font-bold w-20">Taux</th>
                      <th className="py-2 px-3 text-right font-bold w-32">Montant (DA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDE8] tabular-nums text-[11px]">
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Assurances Sociales (Maladie, Maternité, Invalidité, Décès)</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">CNAS</td>
                      <td className="py-1.5 px-3 text-right">12,50 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.125, false)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Accidents du Travail et Maladies Professionnelles (AT/MP)</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">CNAS</td>
                      <td className="py-1.5 px-3 text-right">1,25 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.0125, false)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Assurance Vieillesse & Retraite</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">CNR</td>
                      <td className="py-1.5 px-3 text-right">10,00 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.10, false)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Assurance Chômage des Travailleurs Salariés</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">CNAC</td>
                      <td className="py-1.5 px-3 text-right">1,00 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.01, false)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Fonds de Retraite Anticipée</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">CNR</td>
                      <td className="py-1.5 px-3 text-right">0,25 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.0025, false)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-1.5 px-3 text-[#111315]">Quote-part Fonds des Œuvres Sociales (FOS)</td>
                      <td className="py-1.5 px-3 text-[#5A6065]">Comité Entreprise</td>
                      <td className="py-1.5 px-3 text-right">0,50 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#111315]">
                        {formatDA(calc.salaireDePoste * 0.005, false)}
                      </td>
                    </tr>

                    {/* Sous-total Patronal */}
                    <tr className="bg-[#F4F3F0] font-bold text-[#0D3B2E]">
                      <td colSpan={2} className="py-2 px-3 text-xs uppercase">
                        Total Charges Patronales Entreprise (25,50%)
                      </td>
                      <td className="py-2 px-3 text-right">25,50 %</td>
                      <td className="py-2 px-3 text-right">
                        {formatDA(calc.cnasPatronale + calc.cnasOeuvresSociales, false)}
                      </td>
                    </tr>

                    {/* Part Salarié */}
                    <tr className="hover:bg-[#FAF9F6] transition-colors">
                      <td colSpan={2} className="py-1.5 px-3 text-[#5A6065]">
                        Part Ouvrière Précomptée sur le Bulletin Salarié (9,00%)
                      </td>
                      <td className="py-1.5 px-3 text-right text-[#5A6065]">9,00 %</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#5A6065]">
                        {formatDA(calc.cnasSalariale, false)}
                      </td>
                    </tr>

                    {/* TOTAL BORDEREAU DAC 34,5% */}
                    <tr className="bg-[#0D3B2E] font-extrabold text-white text-xs">
                      <td colSpan={2} className="py-2 px-3 uppercase tracking-wider">
                        Total Global Déclaration DAC CNAS à Verser
                      </td>
                      <td className="py-2 px-3 text-right text-[#A7F3D0]">34,50 %</td>
                      <td className="py-2 px-3 text-right text-[#A7F3D0]">
                        {formatDA(calc.totalDAC, true)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. CALENDRIER DES ÉCHÉANCES LÉGALES (ZERO BLEU) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-1">
                <span className="text-[10px] text-[#5A6065] block uppercase font-bold tracking-wider">Échéance 1 : Fin de Mois</span>
                <div className="font-bold text-xs text-[#0D3B2E]">Virement Salaire Net</div>
                <p className="text-[10px] text-[#71777D]">Ordre de virement bancaire ou CCP</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-1">
                <span className="text-[10px] text-[#5A6065] block uppercase font-bold tracking-wider">Échéance 2 : Avant le 20 (M+1)</span>
                <div className="font-bold text-xs text-[#991B1B]">Déclaration Fiscale G50</div>
                <p className="text-[10px] text-[#71777D]">Versement IRG aux Impôts ({formatDA(calc.irgRetenu)})</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] space-y-1">
                <span className="text-[10px] text-[#5A6065] block uppercase font-bold tracking-wider">Échéance 3 : Avant le 30 (M+1)</span>
                <div className="font-bold text-xs text-[#0D3B2E]">Bordereau DAC CNAS</div>
                <p className="text-[10px] text-[#71777D]">Versement 34,50% à la CNAS ({formatDA(calc.totalDAC)})</p>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
