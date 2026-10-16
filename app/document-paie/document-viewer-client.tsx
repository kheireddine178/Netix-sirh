"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Printer,
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
  Download,
  Info,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Award,
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
} from "../(app)/paie/actions";
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
  const [salaries] = useState<SalarieCockpit[]>(initialSalaries);
  const [variablesMap] = useState<Record<number, BulletinCockpitVariables>>(initialVariables);
  const [selectedSalarieId, setSelectedSalarieId] = useState<number>(initialSalarieId);
  const [docType, setDocType] = useState<DocumentType>(initialType);

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

  // Calcul du bulletin du collaborateur
  const calc = useMemo(() => {
    if (!currentSalarie || !currentVariables) return null;

    const totalPrimesFixesCotisables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "OUI")
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

    const totalPrimesVariablesCotisables = currentVariables.primesVariables
      .filter((p) => p.cotisable)
      .reduce((acc, p) => acc + p.montant, 0);

    const totalPrimesCotisables = totalPrimesFixesCotisables + totalPrimesVariablesCotisables;

    const totalPrimesNonCotisablesImposables = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Gain (+)" && r.cotisable === "NON" && (r.imposable === "OUI" || r.imposable === "IRG"))
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

    const totalRetenuesFixes = currentSalarie.rubriquesFixes
      .filter((r) => r.type_valeur === "Retenue (-)")
      .reduce((acc, r) => acc + r.valeur_defaut, 0);

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

  if (!currentSalarie || !currentVariables || !calc) {
    return <div className="p-8 text-center text-sm">Chargement du document de paie...</div>;
  }

  // Montant en toutes lettres
  const netEnLettres = montantEnLettresDA(calc.netAPayer);

  return (
    <div className="min-h-screen bg-[#F0EDE8] text-[#111315] font-sans flex flex-col items-center">
      {/* ====================================================================
          BARRE SUPÉRIEURE FLOTTANTE (PRINT:HIDDEN)
          ==================================================================== */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E6E4DD] px-4 py-2.5 shadow-sm print:hidden w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Titre et collaborateur */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111315]">
                Netix SIRH • Édition Documents de Paie
              </span>
              <span className="font-mono text-[10px] bg-[#E6F3EE] text-[#0D3B2E] px-1.5 py-0.2 rounded font-bold border border-[#A7F3D0]">
                {MOIS_FR[mois - 1]} {annee}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6065]">
              Collaborateur : <strong className="text-[#111315]">{currentSalarie.nom_prenom}</strong> ({currentSalarie.matricule}) • {currentSalarie.fonction}
            </p>
          </div>
        </div>

        {/* Sélecteur des 4 types de documents */}
        <div className="flex items-center bg-[#F2F0EC] p-0.5 rounded-lg border border-[#E6E4DD] text-xs">
          <button
            onClick={() => setDocType("bulletin")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              docType === "bulletin"
                ? "bg-white text-[#0D3B2E] shadow-2xs"
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
                ? "bg-white text-[#0D3B2E] shadow-2xs"
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
                ? "bg-white text-[#0D3B2E] shadow-2xs"
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
                ? "bg-[#0D3B2E] text-white shadow-2xs"
                : "text-[#5A6065] hover:text-[#111315]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dossier Complet (3 en 1)</span>
          </button>
        </div>

        {/* Navigation collaborateur & Boutons Impression / Fermer */}
        <div className="flex items-center gap-2">
          {/* Navigation Précédent / Suivant */}
          <div className="flex items-center gap-1 bg-[#F8F7F4] border border-[#E6E4DD] rounded-lg p-0.5">
            <button
              onClick={handleSelectPrev}
              disabled={currentIdx <= 0}
              className="p-1 rounded text-[#5A6065] hover:text-[#111315] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Salarié précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-1 font-semibold text-[#5A6065]">
              {currentIdx + 1}/{salaries.length}
            </span>
            <button
              onClick={handleSelectNext}
              disabled={currentIdx >= salaries.length - 1}
              className="p-1 rounded text-[#5A6065] hover:text-[#111315] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Salarié suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bouton Imprimer */}
          <button
            onClick={() => window.print()}
            className="btn-fintech-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Lancer l'impression ou l'export PDF du document affiché"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / PDF</span>
          </button>

          {/* Bouton Fermer */}
          <button
            onClick={() => window.close()}
            className="p-1.5 rounded-lg border border-[#E6E4DD] hover:bg-[#F2F0EC] text-[#5A6065] transition-colors"
            title="Fermer cet onglet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ====================================================================
          CORPS DU DOCUMENT : FORMAT A4 RÉALISTE & STYLES PRINT
          ==================================================================== */}
      <main className="py-6 px-4 w-full flex flex-col items-center gap-8 print:p-0 print:gap-0">
        {/* ==================================================================
            DOCUMENT 1 : BULLETIN DE PAIE OFFICIEL DE L'EMPLOYÉ
            ================================================================== */}
        {(docType === "bulletin" || docType === "complet") && (
          <article className="a4-sheet bg-white border border-[#D9D6CE] shadow-lg rounded-sm w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between text-[#111315] print:border-none print:shadow-none print:p-8 print:max-w-none print:m-0 print:break-after-page">
            <div className="space-y-5">
              {/* En-tête de l'entreprise */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-[#111315]">
                <div className="space-y-1">
                  <h1 className="text-lg font-black tracking-tight text-[#111315]">
                    SARL ENTREPRISE ALGER
                  </h1>
                  <p className="text-[11px] text-[#5A6065] leading-tight">
                    Zone Industrielle Oued Smar, Lot N° 42, Alger<br />
                    N.I.F : 001916012345678 • N.I.S : 19801234567 • R.C : 16/00-1234567B19<br />
                    N° Adhérent CNAS : 16-98765432-10
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block bg-[#0D3B2E] text-white px-3 py-1 rounded text-xs font-black tracking-wider uppercase">
                    BULLETIN DE PAIE
                  </div>
                  <p className="text-xs font-bold text-[#111315]">
                    Période : {MOIS_FR[mois - 1]} {annee}
                  </p>
                  <p className="text-[10px] text-[#5A6065]">
                    Date de paiement : 31/{mois.toString().padStart(2, "0")}/{annee}
                  </p>
                </div>
              </div>

              {/* Fiche d'identification du salarié */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8F7F4] p-3.5 rounded border border-[#E6E4DD]">
                <div className="space-y-1">
                  <div>
                    <span className="text-[#5A6065]">Nom & Prénom : </span>
                    <span className="font-bold text-[#111315]">{currentSalarie.nom_prenom}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Matricule : </span>
                    <span className="font-mono font-bold text-[#0D3B2E]">{currentSalarie.matricule}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Fonction / Emploi : </span>
                    <span className="font-semibold text-[#111315]">{currentSalarie.fonction}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Service / Département : </span>
                    <span>{currentSalarie.departement}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right sm:text-left">
                  <div>
                    <span className="text-[#5A6065]">N° Sécurité Sociale : </span>
                    <span className="font-mono font-semibold">{currentSalarie.num_ss}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Situation & Enfants : </span>
                    <span>{currentSalarie.situation_familiale} • {currentSalarie.enfants_a_charge} enfant(s)</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Contrat : </span>
                    <span className="font-semibold">{currentSalarie.type_contrat}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6065]">Mode de paiement : </span>
                    <span className="font-mono text-[11px]">{currentSalarie.mode_paiement} ({currentSalarie.ccp_rib})</span>
                  </div>
                </div>
              </div>

              {/* Tableau officiel des rubriques */}
              <div className="border border-[#111315] rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#F2F0EC] border-b border-[#111315] text-[10px] text-[#111315]">
                    <tr>
                      <th className="py-1.5 px-2.5 text-left font-bold uppercase w-16">Code</th>
                      <th className="py-1.5 px-2.5 text-left font-bold uppercase">Désignation de la Rubrique</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase w-20">Base</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase w-16">Taux</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase w-28">Gains (+)</th>
                      <th className="py-1.5 px-2.5 text-right font-bold uppercase w-28">Retenues (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DD] font-mono text-[11px]">
                    {/* Salaire de base */}
                    <tr>
                      <td className="py-1 px-2.5 text-[#5A6065]">R030</td>
                      <td className="py-1 px-2.5 font-sans font-medium">Salaire de Base Conventionnel</td>
                      <td className="py-1 px-2.5 text-right text-[#5A6065]">173.33 h</td>
                      <td className="py-1 px-2.5 text-right text-[#5A6065]">—</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-[#111315]">
                        {formatDA(currentSalarie.salaire_base_theorique, false)}
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue absence */}
                    {calc.retenueAbsence > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2.5">R100</td>
                        <td className="py-1 px-2.5 font-sans">Retenue Absence non rémunérée</td>
                        <td className="py-1 px-2.5 text-right">{currentVariables.heuresAbsence} h</td>
                        <td className="py-1 px-2.5 text-right">{formatDA(calc.tauxHoraire, false)}</td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2.5 text-right font-semibold">
                          {formatDA(calc.retenueAbsence, false)}
                        </td>
                      </tr>
                    )}

                    {/* Primes fixes contractuelles */}
                    {currentSalarie.rubriquesFixes
                      .filter((r) => r.type_valeur === "Gain (+)")
                      .map((rub) => (
                        <tr key={rub.code}>
                          <td className="py-1 px-2.5 text-[#5A6065]">{rub.code}</td>
                          <td className="py-1 px-2.5 font-sans">{rub.libelle}</td>
                          <td className="py-1 px-2.5 text-right text-[#5A6065]">—</td>
                          <td className="py-1 px-2.5 text-right text-[#5A6065]">—</td>
                          <td className="py-1 px-2.5 text-right font-semibold text-[#111315]">
                            {formatDA(rub.valeur_defaut, false)}
                          </td>
                          <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        </tr>
                      ))}

                    {/* Heures supplémentaires */}
                    {calc.totalHeuresSup > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 text-[#5A6065]">R120</td>
                        <td className="py-1 px-2.5 font-sans">
                          Heures Supplémentaires (+50%: {currentVariables.hs50}h, +75%: {currentVariables.hs75}h, +100%: {currentVariables.hs100}h)
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#5A6065]">—</td>
                        <td className="py-1 px-2.5 text-right text-[#5A6065]">—</td>
                        <td className="py-1 px-2.5 text-right font-semibold text-[#111315]">
                          {formatDA(calc.totalHeuresSup, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* SOUS-TOTAL : SALAIRE DE POSTE (ASSIETTE CNAS) */}
                    <tr className="bg-[#F8F7F4] font-bold text-[#111315] border-t-2 border-b border-[#111315]">
                      <td colSpan={2} className="py-1.5 px-2.5 font-sans uppercase">
                        Salaire de Poste (Assiette Cotisable Sécurité Sociale)
                      </td>
                      <td colSpan={2} className="py-1.5 px-2.5 text-right text-[#5A6065]">
                        Cotisable
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#0D3B2E]">
                        {formatDA(calc.salaireDePoste, false)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Cotisation CNAS 9% */}
                    <tr>
                      <td className="py-1 px-2.5 text-[#5A6065]">R950</td>
                      <td className="py-1 px-2.5 font-sans">Cotisation Sécurité Sociale (Part Ouvrière)</td>
                      <td className="py-1 px-2.5 text-right">{formatDA(calc.salaireDePoste, false)}</td>
                      <td className="py-1 px-2.5 text-right">9,00 %</td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2.5 text-right font-bold text-[#991B1B]">
                        {formatDA(calc.cnasSalariale, false)}
                      </td>
                    </tr>

                    {/* Panier & Transport */}
                    {calc.montantPanier > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 text-[#5A6065]">R250</td>
                        <td className="py-1 px-2.5 font-sans">Indemnité de Panier (Restauration)</td>
                        <td className="py-1 px-2.5 text-right">{currentVariables.joursPanier} j</td>
                        <td className="py-1 px-2.5 text-right">300 DA</td>
                        <td className="py-1 px-2.5 text-right font-semibold text-[#111315]">
                          {formatDA(calc.montantPanier, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {calc.montantTransport > 0 && (
                      <tr>
                        <td className="py-1 px-2.5 text-[#5A6065]">R280</td>
                        <td className="py-1 px-2.5 font-sans">Indemnité Forfaitaire de Transport</td>
                        <td className="py-1 px-2.5 text-right">173.33 h</td>
                        <td className="py-1 px-2.5 text-right">—</td>
                        <td className="py-1 px-2.5 text-right font-semibold text-[#111315]">
                          {formatDA(calc.montantTransport, false)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    )}

                    {/* SOUS-TOTAL : SALAIRE BRUT TOTAL */}
                    <tr className="bg-[#F8F7F4] font-semibold text-[#111315] border-t border-b border-[#E6E4DD]">
                      <td colSpan={2} className="py-1 px-2.5 font-sans">
                        SALAIRE BRUT TOTAL (Gains Imposables + Exonérés)
                      </td>
                      <td colSpan={2} className="py-1 px-2.5 text-right text-[#5A6065]">Brut</td>
                      <td className="py-1 px-2.5 text-right font-bold">
                        {formatDA(calc.salaireBrutTotal, false)}
                      </td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                    </tr>

                    {/* Retenue IRG Barème 2022 */}
                    <tr>
                      <td className="py-1 px-2.5 text-[#5A6065]">R980</td>
                      <td className="py-1 px-2.5 font-sans">
                        I.R.G Barème Officiel LF 2022 (Assiette R tronquée: {formatDA(calc.rTronqueIrg, false)})
                      </td>
                      <td className="py-1 px-2.5 text-right">{formatDA(calc.baseIrg, false)}</td>
                      <td className="py-1 px-2.5 text-right">Barème</td>
                      <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                      <td className="py-1 px-2.5 text-right font-bold text-[#991B1B]">
                        {formatDA(calc.irgRetenu, false)}
                      </td>
                    </tr>

                    {/* Acomptes & Retenues */}
                    {currentVariables.avancesAcomptes > 0 && (
                      <tr className="text-[#991B1B]">
                        <td className="py-1 px-2.5 text-[#5A6065]">R999</td>
                        <td className="py-1 px-2.5 font-sans">Acomptes et avances sur salaire</td>
                        <td className="py-1 px-2.5 text-right">—</td>
                        <td className="py-1 px-2.5 text-right">—</td>
                        <td className="py-1 px-2.5 text-right text-[#94A3B8]">—</td>
                        <td className="py-1 px-2.5 text-right font-bold">
                          {formatDA(currentVariables.avancesAcomptes, false)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ENCADRÉ NET À PAYER EN GRAND & EN TOUTES LETTRES */}
              <div className="bg-[#E6F3EE] border-2 border-[#0D3B2E] rounded p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#065F46] block">
                      NET À PAYER AU SALARIÉ (VIREMENT BANCAIRE)
                    </span>
                    <span className="text-xs text-[#0D3B2E] font-medium italic">
                      Arrêté à la somme de : <strong>{netEnLettres}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-[#0D3B2E]">
                      {formatDA(calc.netAPayer)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cumuls annuels */}
              <div className="grid grid-cols-4 gap-2 text-[10px] bg-[#F8F7F4] p-2.5 rounded border border-[#E6E4DD]">
                <div>
                  <span className="text-[#5A6065] block">Brut fiscal cumulé :</span>
                  <span className="font-mono font-bold">{formatDA(calc.salaireBrutTotal * mois)}</span>
                </div>
                <div>
                  <span className="text-[#5A6065] block">Cotisable CNAS cumulé :</span>
                  <span className="font-mono font-bold">{formatDA(calc.salaireDePoste * mois)}</span>
                </div>
                <div>
                  <span className="text-[#5A6065] block">Retenue IRG cumulée :</span>
                  <span className="font-mono font-bold text-[#991B1B]">{formatDA(calc.irgRetenu * mois)}</span>
                </div>
                <div>
                  <span className="text-[#5A6065] block">Heures travaillées :</span>
                  <span className="font-mono font-bold">{calc.heuresTravaillees} h</span>
                </div>
              </div>
            </div>

            {/* Pied de page et signatures légales */}
            <div className="pt-6 border-t border-[#E6E4DD] space-y-4">
              <div className="grid grid-cols-2 gap-8 text-xs text-center">
                <div className="border border-dashed border-[#CBD5E1] p-4 rounded h-24 flex flex-col justify-between">
                  <span className="font-bold text-[#5A6065]">Cachet & Signature de l'Employeur</span>
                  <span className="text-[9px] text-[#94A3B8]">Pour la Direction des Ressources Humaines</span>
                </div>
                <div className="border border-dashed border-[#CBD5E1] p-4 rounded h-24 flex flex-col justify-between">
                  <span className="font-bold text-[#5A6065]">Signature & Émargement du Salarié</span>
                  <span className="text-[9px] text-[#94A3B8]">Précédé de la mention « Lu et approuvé »</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-[#5A6065] space-y-0.5">
                <p>
                  Dans votre intérêt et pour faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
                </p>
                <p className="font-mono text-[9px] text-[#94A3B8]">
                  Document généré le {new Date().toLocaleDateString("fr-DZ")} par Netix SIRH 2.0 • Conforme Loi 90-11 & Décret Exécutif 22-01
                </p>
              </div>
            </div>
          </article>
        )}

        {/* ==================================================================
            DOCUMENT 2 : FICHE EXPLICATIVE DU CALCUL DE PAIE
            ================================================================== */}
        {(docType === "calcul" || docType === "complet") && (
          <article className="a4-sheet bg-white border border-[#D9D6CE] shadow-lg rounded-sm w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between text-[#111315] print:border-none print:shadow-none print:p-8 print:max-w-none print:m-0 print:break-after-page">
            <div className="space-y-5">
              {/* En-tête */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-[#0D3B2E]">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#0D3B2E] uppercase tracking-wider block">
                    TRANSPARENCE RH & PÉDAGOGIE FISCALE
                  </span>
                  <h2 className="text-lg font-black text-[#111315]">
                    NOTE D'EXPLICATION DU CALCUL DE SALAIRE
                  </h2>
                  <p className="text-xs text-[#5A6065]">
                    Décomposition mathématique et juridique des formules de rémunération appliquées.
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

              {/* 4 Blocs explicatifs clairs */}
              <div className="space-y-4 text-xs">
                {/* 1. Temps de travail et absences */}
                <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs">1</span>
                    <h3 className="font-bold text-sm text-[#111315]">
                      Temps de Travail Légal, Taux Horaire & Absences (Loi 90-11)
                    </h3>
                  </div>
                  <p className="text-[#5A6065] leading-relaxed">
                    Selon la législation du travail algérienne, le volume mensuel légal est de <strong>173,33 heures</strong> (40 heures par semaine × 52 semaines / 12 mois).
                  </p>
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD] font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span>• Taux horaire de base :</span>
                      <span className="font-bold">{formatDA(currentSalarie.salaire_base_theorique, false)} DA ÷ 173,33h = {formatDA(calc.tauxHoraire, false)} DA/h</span>
                    </div>
                    {currentVariables.heuresAbsence > 0 ? (
                      <div className="flex justify-between text-[#991B1B]">
                        <span>• Déduction pour absence ({currentVariables.heuresAbsence} h) :</span>
                        <span className="font-bold">{currentVariables.heuresAbsence}h × {formatDA(calc.tauxHoraire, false)} DA = - {formatDA(calc.retenueAbsence)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[#065F46]">
                        <span>• Heures travaillées :</span>
                        <span>173,33 h (Aucune absence déduite)</span>
                      </div>
                    )}
                    {calc.totalHeuresSup > 0 && (
                      <div className="flex justify-between text-[#0D3B2E]">
                        <span>• Majoration Heures Supplémentaires :</span>
                        <span>+ {formatDA(calc.totalHeuresSup)} (+50%, +75%, +100%)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Assiette cotisable CNAS */}
                <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs">2</span>
                    <h3 className="font-bold text-sm text-[#111315]">
                      Assiette Cotisable de Sécurité Sociale (Loi 83-11 & Ord. 95-01)
                    </h3>
                  </div>
                  <p className="text-[#5A6065] leading-relaxed">
                    Le <strong>Salaire de Poste</strong> correspond à la somme du salaire de base (net d'absences) et de toutes les indemnités liées aux conditions de travail et au rendement. La cotisation salariale prélevée à la source est de <strong>9,00%</strong>.
                  </p>
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD] font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span>• Salaire de Poste cotisable (Assiette CNAS) :</span>
                      <span className="font-bold text-[#0D3B2E]">{formatDA(calc.salaireDePoste)}</span>
                    </div>
                    <div className="flex justify-between text-[#991B1B]">
                      <span>• Prélèvement CNAS Part Ouvrière (9%) :</span>
                      <span className="font-bold">{formatDA(calc.salaireDePoste, false)} × 9% = - {formatDA(calc.cnasSalariale)}</span>
                    </div>
                    <div className="text-[10px] text-[#5A6065] pt-1 border-t border-[#E6E4DD]">
                      * Note légale : Les indemnités de Panier ({formatDA(calc.montantPanier)}) et de Transport ({formatDA(calc.montantTransport)}) sont des remboursements de frais réels et sont <strong>exonérées de cotisations CNAS</strong>.
                    </div>
                  </div>
                </div>

                {/* 3. Barème IRG 2022 */}
                <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="font-bold text-sm text-[#111315]">
                      Barème d'Imposition Fiscale IRG (CIDTA Art. 104 / LF 2022)
                    </h3>
                  </div>
                  <p className="text-[#5A6065] leading-relaxed">
                    L'Impôt sur le Revenu Global (IRG) est calculé sur le montant brut diminué de la cotisation CNAS. La loi impose une <strong>troncature à la dizaine de dinar inférieure</strong> avant application du barème progressif et des deux abattements légaux.
                  </p>
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD] font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span>• Base imposable brute :</span>
                      <span>{formatDA(calc.baseIrg)} (R tronqué officiel: {formatDA(calc.rTronqueIrg)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• IRG Brut progressif par tranches :</span>
                      <span>{formatDA(calc.detailIrg.irgBrut)}</span>
                    </div>
                    <div className="flex justify-between text-[#065F46]">
                      <span>• 1er Abattement légal (40% plafonné entre 1 000 et 1 500 DA) :</span>
                      <span>- {formatDA(calc.detailIrg.abattement40)}</span>
                    </div>
                    {calc.rTronqueIrg > 30000 && calc.rTronqueIrg < 35000 && (
                      <div className="flex justify-between text-[#0D3B2E]">
                        <span>• 2e Abattement Dégressif (Zone 30 000 - 35 000 DA : Formule 137/51) :</span>
                        <span>Appliqué</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-[#991B1B] pt-1 border-t border-[#E6E4DD]">
                      <span>• IRG Net Retenu au bulletin (Arrondi DGI au dixième) :</span>
                      <span>- {formatDA(calc.irgRetenu)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Arbre vers le Net à Payer */}
                <div className="p-4 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs">4</span>
                    <h3 className="font-bold text-sm text-[#0D3B2E]">
                      Passage Synthétique au Salaire Net à Payer
                    </h3>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-[#A7F3D0] font-mono text-xs space-y-1">
                    <div className="flex justify-between text-[#111315]">
                      <span>(+) Salaire Brut Total Rémunéré :</span>
                      <span className="font-bold">{formatDA(calc.salaireBrutTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#991B1B]">
                      <span>(-) Cotisation Sécurité Sociale (9%) :</span>
                      <span>- {formatDA(calc.cnasSalariale)}</span>
                    </div>
                    <div className="flex justify-between text-[#991B1B]">
                      <span>(-) Retenue Fiscale IRG Barème :</span>
                      <span>- {formatDA(calc.irgRetenu)}</span>
                    </div>
                    {currentVariables.avancesAcomptes > 0 && (
                      <div className="flex justify-between text-[#991B1B]">
                        <span>(-) Acomptes & Avances déduits :</span>
                        <span>- {formatDA(currentVariables.avancesAcomptes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#0D3B2E] font-black text-sm pt-2 border-t-2 border-[#0D3B2E]">
                      <span>(=) SALAIRE NET À PAYER :</span>
                      <span>{formatDA(calc.netAPayer)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E4DD] text-center text-[10px] text-[#5A6065]">
              Document d'assistance et de transparence édité par le Service RH • SARL ENTREPRISE ALGER
            </div>
          </article>
        )}

        {/* ==================================================================
            DOCUMENT 3 : FICHE DES CHARGES PATRONALES & COÛT GLOBAL
            ================================================================== */}
        {(docType === "charges" || docType === "complet") && (
          <article className="a4-sheet bg-white border border-[#D9D6CE] shadow-lg rounded-sm w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between text-[#111315] print:border-none print:shadow-none print:p-8 print:max-w-none print:m-0 print:break-after-page">
            <div className="space-y-5">
              {/* En-tête */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-[#1E3A8A]">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#1E3A8A] uppercase tracking-wider block">
                    DIRECTION FINANCIÈRE & RESSOURCES HUMAINES
                  </span>
                  <h2 className="text-lg font-black text-[#111315]">
                    ANALYSE DES CHARGES PATRONALES & COÛT SALARIAL
                  </h2>
                  <p className="text-xs text-[#5A6065]">
                    Ventilation des cotisations employeur et de l'enveloppe globale DAC (34,5%).
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

              {/* 1. Synthèse financière */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD]">
                  <span className="text-[10px] text-[#5A6065] block">Salaire Net Salarié :</span>
                  <span className="text-sm font-black font-mono text-[#0D3B2E]">
                    {formatDA(calc.netAPayer)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD]">
                  <span className="text-[10px] text-[#5A6065] block">Salaire de Poste (CNAS) :</span>
                  <span className="text-sm font-bold font-mono text-[#111315]">
                    {formatDA(calc.salaireDePoste)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                  <span className="text-[10px] text-[#1E3A8A] block">Charges Patronales (25,5%) :</span>
                  <span className="text-sm font-black font-mono text-[#1E3A8A]">
                    {formatDA(calc.cnasPatronale + calc.cnasOeuvresSociales)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0]">
                  <span className="text-[10px] text-[#065F46] block">Coût Global Entreprise :</span>
                  <span className="text-sm font-black font-mono text-[#0D3B2E]">
                    {formatDA(calc.coutTotalEmployeur)}
                  </span>
                </div>
              </div>

              {/* 2. Tableau de ventilation officiel de la DAC CNAS (34,5%) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                    Ventilation Légale du Bordereau CNAS — Déclaration DAC 34,5%
                  </h3>
                  <span className="text-[11px] font-mono text-[#5A6065]">
                    Assiette soumise : <strong>{formatDA(calc.salaireDePoste)}</strong>
                  </span>
                </div>

                <div className="border border-[#111315] rounded overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-[#F2F0EC] border-b border-[#111315] text-[10px] text-[#111315]">
                      <tr>
                        <th className="py-2 px-3 text-left font-bold uppercase">Branche de Sécurité Sociale</th>
                        <th className="py-2 px-3 text-left font-bold uppercase">Organisme Bénéficiaire</th>
                        <th className="py-2 px-3 text-right font-bold uppercase w-20">Taux</th>
                        <th className="py-2 px-3 text-right font-bold uppercase w-32">Montant (DA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E4DD] font-mono text-[11px]">
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Assurances Sociales (Maladie, Maternité, Invalidité, Décès)</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">CNAS</td>
                        <td className="py-1.5 px-3 text-right">12,50 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.125, false)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Accidents du Travail et Maladies Professionnelles (AT/MP)</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">CNAS</td>
                        <td className="py-1.5 px-3 text-right">1,25 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.0125, false)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Assurance Vieillesse & Retraite</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">CNR</td>
                        <td className="py-1.5 px-3 text-right">10,00 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.10, false)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Assurance Chômage des Travailleurs Salariés</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">CNAC</td>
                        <td className="py-1.5 px-3 text-right">1,00 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.01, false)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Fonds de Retraite Anticipée</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">CNR</td>
                        <td className="py-1.5 px-3 text-right">0,25 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.0025, false)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans">Quote-part Fonds des Œuvres Sociales (FOS)</td>
                        <td className="py-1.5 px-3 font-sans text-[#5A6065]">Comité Entreprise</td>
                        <td className="py-1.5 px-3 text-right">0,50 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold">
                          {formatDA(calc.salaireDePoste * 0.005, false)}
                        </td>
                      </tr>

                      {/* Sous-total Patronal */}
                      <tr className="bg-[#EFF6FF] font-bold text-[#1E3A8A]">
                        <td colSpan={2} className="py-2 px-3 font-sans uppercase">
                          Total Charges Patronales Entreprise (25,50%)
                        </td>
                        <td className="py-2 px-3 text-right">25,50 %</td>
                        <td className="py-2 px-3 text-right">
                          {formatDA(calc.cnasPatronale + calc.cnasOeuvresSociales, false)}
                        </td>
                      </tr>

                      {/* Part Salarié */}
                      <tr>
                        <td colSpan={2} className="py-1.5 px-3 font-sans text-[#5A6065]">
                          Part Ouvrière Précomptée sur le Bulletin Salarié (9,00%)
                        </td>
                        <td className="py-1.5 px-3 text-right text-[#5A6065]">9,00 %</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-[#5A6065]">
                          {formatDA(calc.cnasSalariale, false)}
                        </td>
                      </tr>

                      {/* TOTAL BORDEREAU DAC 34,5% */}
                      <tr className="bg-[#111315] font-black text-white text-xs">
                        <td colSpan={2} className="py-2 px-3 font-sans uppercase tracking-wider">
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

              {/* 3. Calendrier des obligations et échéances */}
              <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] space-y-2 text-xs">
                <h4 className="font-bold text-[#111315] uppercase tracking-wider text-[11px]">
                  Calendrier des Échéances Légales de Règlement (Mois Suivant M+1)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD]">
                    <span className="text-[10px] text-[#5A6065] block">Échéance 1 : Fin de Mois</span>
                    <strong className="text-xs text-[#0D3B2E]">Virement Net Salarié</strong>
                    <p className="text-[10px] text-[#5A6065] mt-0.5">Ordre de virement bancaire / CCP</p>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD]">
                    <span className="text-[10px] text-[#5A6065] block">Échéance 2 : Avant le 20</span>
                    <strong className="text-xs text-[#991B1B]">Déclaration Fiscale G50</strong>
                    <p className="text-[10px] text-[#5A6065] mt-0.5">Versement IRG aux Impôts ({formatDA(calc.irgRetenu)})</p>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-[#E6E4DD]">
                    <span className="text-[10px] text-[#5A6065] block">Échéance 3 : Avant le 30</span>
                    <strong className="text-xs text-[#1E3A8A]">Bordereau CNAS (DAC)</strong>
                    <p className="text-[10px] text-[#5A6065] mt-0.5">Versement 34,5% à la CNAS ({formatDA(calc.totalDAC)})</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E4DD] text-center text-[10px] text-[#5A6065]">
              Document confidentiel de gestion financière • SARL ENTREPRISE ALGER • Netix SIRH 2.0
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
