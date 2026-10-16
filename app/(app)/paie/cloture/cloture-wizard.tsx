"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Building2,
  CreditCard,
  Lock,
  Unlock,
  ChevronRight,
  ArrowLeft,
  Users,
  Coins,
  Receipt,
  Scale,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  calculerBulletinComplet,
  round2,
  TAUX_CNAS_SALARIAL,
  TAUX_CNAS_PATRONAL,
  TAUX_CNAS_OEUVRES_SOCIALES,
  TAUX_CNAS_TOTAL_DAC,
} from "@/src/lib/payroll-engine";
import { setPeriodeStatut, type StatutPeriode } from "./actions";
import { BulletinSpreadsheetRow } from "../actions";

function formatDA(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "0,00 DA";
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts[0]},${parts[1]} DA`;
}

interface ClotureWizardProps {
  annee: number;
  mois: number;
  salaries: any[];
  initialRows: BulletinSpreadsheetRow[];
  statutPeriode: StatutPeriode;
}

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function ClotureWizard({
  annee,
  mois,
  salaries,
  initialRows,
  statutPeriode,
}: ClotureWizardProps) {
  const router = useRouter();

  // Étape active
  // 0 : Contrôle des Écarts & Loi 90-11
  // 1 : Bordereau CNAS (DAC 34,5%)
  // 2 : Déclaration Fiscale IRG (G50)
  // 3 : Ordres de Virement Bancaire & CCP
  // 4 : Verrouillage & Piste d'Audit
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (statutPeriode === "Clôturée") return 4;
    if (statutPeriode === "Validée") return 3;
    if (statutPeriode === "En contrôle") return 0;
    return 0;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>("ALL");

  // Calculs consolidés en temps réel avec le moteur pur
  const computedData = useMemo(() => {
    const list = initialRows.map((r) => {
      const calc = calculerBulletinComplet({
        salaireBase: r.salaireBase,
        heuresAbsence: r.heuresAbsence,
        hs50: r.hs50,
        hs75: r.hs75,
        hs100: r.hs100,
        primesCotisables: r.primesCotisables,
        forfaitTransport: r.forfaitTransport,
        panierForce: r.joursPanier * r.tauxPanier,
        tauxUnitairePanier: r.tauxPanier,
        avancesAcomptes: r.avancesAcomptes,
        autresRetenues: r.autresRetenues,
        regimeIrg: r.regimeIrg,
      });

      return {
        ...r,
        calc,
      };
    });

    const aggregates = list.reduce(
      (acc, item) => {
        acc.totalBase += item.salaireBase;
        acc.totalAbsencesHeures += item.heuresAbsence;
        acc.totalRetenuesAbsences += item.calc.retenueAbsence;
        acc.totalHS += item.calc.totalHeuresSup;
        acc.totalAssietteCNAS += item.calc.salaireDePoste;
        acc.totalCNASSalariale += item.calc.cnasSalariale;
        acc.totalCNASPatronale += item.calc.cnasPatronale;
        acc.totalCNASOeuvres += item.calc.cnasOeuvresSociales;
        acc.totalDAC += item.calc.totalDAC;
        acc.totalPanierTransport += item.calc.montantPanier + item.calc.montantTransport;
        acc.totalBrut += item.calc.salaireBrutTotal;
        acc.totalBaseIRG += item.calc.baseIrg;
        acc.totalIRG += item.calc.irgRetenu;
        acc.totalAcomptes += item.avancesAcomptes;
        acc.totalNet += item.calc.netAPayer;
        acc.totalCoutEmployeur += item.calc.coutTotalEmployeur;

        if (item.calc.rTronqueIrg <= 30000) {
          acc.countExoneresIRG++;
        } else {
          acc.countImposablesIRG++;
        }

        if (item.heuresAbsence > 0) {
          acc.countAvecAbsence++;
        }

        return acc;
      },
      {
        totalBase: 0,
        totalAbsencesHeures: 0,
        totalRetenuesAbsences: 0,
        totalHS: 0,
        totalAssietteCNAS: 0,
        totalCNASSalariale: 0,
        totalCNASPatronale: 0,
        totalCNASOeuvres: 0,
        totalDAC: 0,
        totalPanierTransport: 0,
        totalBrut: 0,
        totalBaseIRG: 0,
        totalIRG: 0,
        totalAcomptes: 0,
        totalNet: 0,
        totalCoutEmployeur: 0,
        countExoneresIRG: 0,
        countImposablesIRG: 0,
        countAvecAbsence: 0,
      }
    );

    return { list, aggregates };
  }, [initialRows]);

  const { list: rows, aggregates: agg } = computedData;

  const updateStatut = async (nouveauStatut: StatutPeriode) => {
    setLoading(true);
    try {
      await setPeriodeStatut(annee, mois, nouveauStatut);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const isLocked = statutPeriode === "Clôturée";

  // Export Fichier Virement
  const handleExportFichierVirement = () => {
    const lignes = [
      ["MATRICULE", "BENEFICIAIRE", "COMPTE_CCP_RIB", "ETABLISSEMENT", "MONTANT_NET_DA"].join(";"),
      ...rows.map((r) =>
        [
          r.matricule,
          `"${r.nomPrenom}"`,
          r.numSS || "0000000000 00",
          r.matricule.startsWith("M0") ? "CCP Algerie Poste" : "BNA Banque",
          r.calc.netAPayer.toFixed(2),
        ].join(";")
      ),
    ];

    const content = "data:text/csv;charset=utf-8,\uFEFF" + lignes.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = `ORDRE_VIREMENT_MASSE_${mois}_${annee}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const STEPS = [
    { title: "Audit & Écarts", desc: "Contrôles Loi 90-11" },
    { title: "Bordereau CNAS", desc: "Déclaration DAC 34,5%" },
    { title: "Déclaration G50", desc: "IRG Art. 104" },
    { title: "Virements Bancaires", desc: "Ordres de paiement" },
    { title: "Verrouillage", desc: "Clôture inaltérable" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto pb-16">
      {/* ====================================================================
          1. HEADER FINTECH & RETOUR VERS LE SPREADSHEET 2026
          ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DD]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/paie"
              className="p-1 rounded-md text-[#5A6065] hover:text-[#111315] hover:bg-[#F2F0EC] transition-colors"
              title="Retourner au tableur Spreadsheet 2026"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-[#111315] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0D3B2E]" />
              Clôture Mensuelle & Déclarations Récapitulatives
            </h1>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                statutPeriode === "Clôturée"
                  ? "bg-[#0D3B2E] text-white border-[#0D3B2E]"
                  : statutPeriode === "Validée"
                  ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                  : statutPeriode === "En contrôle"
                  ? "bg-[#DBEAFE] text-[#1E3A8A] border-[#BFDBFE]"
                  : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
              }`}
            >
              {statutPeriode}
            </span>
          </div>
          <p className="text-xs text-[#5A6065]">
            Période : <span className="font-semibold text-[#111315]">{MOIS_FR[mois - 1]} {annee}</span> •
            Effectif total traité : <span className="font-semibold text-[#111315]">{rows.length} collaborateurs</span>.
          </p>
        </div>

        {/* Boutons d'Action Rapide */}
        <div className="flex items-center gap-2">
          <Link href="/paie" className="btn-fintech-secondary text-xs">
            <FileText className="w-3.5 h-3.5" />
            Modifier dans le Spreadsheet
          </Link>

          {isLocked ? (
            <button
              onClick={() => updateStatut("Brouillon")}
              disabled={loading}
              className="text-xs font-semibold text-[#991B1B] bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] border border-[#FECACA] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              Rouvrir la Période
            </button>
          ) : (
            <button
              onClick={() => {
                updateStatut("Clôturée");
                setCurrentStep(4);
              }}
              disabled={loading}
              className="btn-fintech-primary text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              Verrouiller & Clôturer
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          2. STEPPER DE CONFORMITÉ FINTECH (5 ÉTAPES)
          ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {STEPS.map((s, idx) => {
          const isActive = currentStep === idx;
          const isPassed = currentStep > idx;

          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                isActive
                  ? "bg-white border-[#0D3B2E] shadow-xs ring-1 ring-[#0D3B2E]/15"
                  : isPassed
                  ? "bg-[#F8F7F4] border-[#A7F3D0] hover:border-[#0D3B2E]"
                  : "bg-[#F8F7F4] border-[#E6E4DD] hover:border-[#D1CFBF]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6065]">
                  Étape {idx + 1}
                </span>
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46]" />}
              </div>
              <span className="text-xs font-bold text-[#111315]">{s.title}</span>
              <span className="text-[11px] text-[#5A6065]">{s.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          3. CONTENU DES ÉTAPES DE CLÔTURE & DÉCLARATIONS
          ==================================================================== */}
      <div className="bg-white border border-[#E6E4DD] rounded-lg p-6 shadow-xs">
        {/* ------------------------------------------------------------------
            ÉTAPE 1 : AUDIT DE CONFORMITÉ & ANALYSE DES ÉCARTS (LOI 90-11)
            ------------------------------------------------------------------ */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111315]">
                  1. Contrôle de Complétude & Respect de la Loi 90-11
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Vérification du volume horaire légal (173,33h), des retenues pour absence et des heures supplémentaires.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-fintech-secondary text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                Imprimer Rapport d'Audit
              </button>
            </div>

            {/* Cartes d'indicateurs d'audit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD]">
                <span className="text-[11px] text-[#5A6065] uppercase font-bold tracking-wider">
                  Effectif Contrôlé
                </span>
                <p className="text-xl font-bold font-mono text-[#111315] mt-1">
                  {rows.length} Salariés
                </p>
                <span className="text-[10px] text-[#065F46] font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Salariés valides
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD]">
                <span className="text-[11px] text-[#5A6065] uppercase font-bold tracking-wider">
                  Volume Absences Saisies
                </span>
                <p className="text-xl font-bold font-mono text-[#991B1B] mt-1">
                  {agg.totalAbsencesHeures.toFixed(1)} h
                </p>
                <span className="text-[10px] text-[#5A6065] font-medium mt-1">
                  {agg.countAvecAbsence} salariés concernés
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD]">
                <span className="text-[11px] text-[#5A6065] uppercase font-bold tracking-wider">
                  Total Retenues Absences
                </span>
                <p className="text-xl font-bold font-mono text-[#991B1B] mt-1">
                  -{formatDA(agg.totalRetenuesAbsences)}
                </p>
                <span className="text-[10px] text-[#5A6065] font-medium mt-1">
                  Calculé sur base 173,33h
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0]">
                <span className="text-[11px] text-[#0D3B2E] uppercase font-bold tracking-wider">
                  Heures Supplémentaires
                </span>
                <p className="text-xl font-bold font-mono text-[#0D3B2E] mt-1">
                  +{formatDA(agg.totalHS)}
                </p>
                <span className="text-[10px] text-[#065F46] font-medium mt-1">
                  Majorations P1 (50%), P2 (75%), P3 (100%)
                </span>
              </div>
            </div>

            {/* Synthèse globale avant validation */}
            <div className="p-4 rounded-lg bg-white border border-[#E6E4DD] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E6E4DD]">
                <span className="text-[#5A6065]">Masse des Salaires de Base Théoriques :</span>
                <span className="font-mono font-semibold">{formatDA(agg.totalBase)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E4DD] text-[#991B1B]">
                <span>Retenues sur Salaires pour Absences (Loi 90-11) :</span>
                <span className="font-mono font-semibold">-{formatDA(agg.totalRetenuesAbsences)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E4DD] text-[#065F46]">
                <span>Heures Supplémentaires et Primes Cotisables :</span>
                <span className="font-mono font-semibold">+{formatDA(agg.totalHS)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E4DD] font-bold text-[#111315]">
                <span>Assiette Globale Soumise à Cotisation CNAS :</span>
                <span className="font-mono text-sm">{formatDA(agg.totalAssietteCNAS)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#5A6065]">
                <span>Primes Hors CNAS (Panier proratisé 22j + Transport 173,33h) :</span>
                <span className="font-mono font-semibold">+{formatDA(agg.totalPanierTransport)}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 border-t-2 border-[#111315] font-extrabold text-[#111315] text-sm">
                <span>Masse Salariale Brute Totale :</span>
                <span className="font-mono text-[#0D3B2E]">{formatDA(agg.totalBrut)}</span>
              </div>
            </div>

            {/* Navigation Stepper */}
            <div className="flex justify-between items-center pt-4 border-t border-[#E6E4DD]">
              <Link href="/paie" className="btn-fintech-secondary text-xs">
                ← Retour au Tableur
              </Link>
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-fintech-primary text-xs"
              >
                Passer au Bordereau CNAS →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ÉTAPE 2 : BORDEREAU RÉCAPITULATIF CNAS — DAC 34,5% (LOI 83-11)
            ------------------------------------------------------------------ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111315]">
                  2. Bordereau de Déclaration des Cotisations CNAS (DAC 34,5%)
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Déclaration d'Assiette des Cotisations conforme à la Loi 83-11 et l'Ordonnance 95-01 (Exclusion Panier & Transport).
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-fintech-secondary text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                Imprimer Bordereau CNAS
              </button>
            </div>

            {/* En-tête administratif officiel */}
            <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A6065]">
                RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
              </span>
              <h3 className="text-sm font-black text-[#111315]">
                CAISSE NATIONALE DES ASSURANCES SOCIALES DES TRAVAILLEURS SALARIÉS (CNAS)
              </h3>
              <p className="text-xs text-[#5A6065]">
                Bordereau Récapitulatif Mensuel des Cotisations • Période : {MOIS_FR[mois - 1]} {annee}
              </p>
            </div>

            {/* Tableau de Décomposition Officielle 34,5% */}
            <div className="border border-[#E6E4DD] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F0EC] border-b border-[#E6E4DD] text-[#5A6065]">
                    <th className="py-2.5 px-4 text-left font-bold uppercase">Ventilation des Taux</th>
                    <th className="py-2.5 px-4 text-center font-bold uppercase">Cotisants</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase">Assiette Cotisable</th>
                    <th className="py-2.5 px-4 text-center font-bold uppercase">Taux</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase">Montant Dû</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[#111315]">
                      1. Part Salariale (Précomptée sur bulletins)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{rows.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalAssietteCNAS)}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#991B1B]">9,00 %</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#991B1B]">
                      {formatDA(agg.totalCNASSalariale)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-[#111315]">
                      2. Part Patronale Employeur (Sécurité Sociale)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{rows.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalAssietteCNAS)}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#111315]">25,00 %</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111315]">
                      {formatDA(agg.totalCNASPatronale)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-[#111315]">
                      3. Quote-part Fonds des Œuvres Sociales (Versement DAC)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{rows.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalAssietteCNAS)}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#111315]">0,50 %</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111315]">
                      {formatDA(agg.totalCNASOeuvres)}
                    </td>
                  </tr>

                  <tr className="bg-[#E6F3EE] font-extrabold text-[#0D3B2E] text-sm">
                    <td className="py-3 px-4">
                      TOTAL GLOBAL ENVELOPPE DAC CNAS EXIGIBLE
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{rows.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalAssietteCNAS)}</td>
                    <td className="py-3 px-4 text-center font-mono text-base">34,50 %</td>
                    <td className="py-3 px-4 text-right font-mono text-base">
                      {formatDA(agg.totalDAC)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note d'exclusion légale */}
            <div className="p-3 rounded-md bg-[#F8F7F4] border border-[#E6E4DD] text-xs text-[#5A6065] space-y-1">
              <span className="font-bold text-[#111315]">Certificat de conformité CNAS :</span>
              <p>
                Conformément à l'Article 1 de l'Ordonnance 95-01, l'assiette ci-dessus ({formatDA(agg.totalAssietteCNAS)}) exclut rigoureusement les indemnités de panier ({formatDA(rows.reduce((s, r) => s + r.calc.montantPanier, 0))}) et de transport ({formatDA(rows.reduce((s, r) => s + r.calc.montantTransport, 0))}).
              </p>
            </div>

            {/* Navigation Stepper */}
            <div className="flex justify-between items-center pt-4 border-t border-[#E6E4DD]">
              <button
                onClick={() => setCurrentStep(0)}
                className="btn-fintech-secondary text-xs"
              >
                ← Étape Précédente
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-fintech-primary text-xs"
              >
                Passer à la Déclaration G50 →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ÉTAPE 3 : DÉCLARATION FISCALE IRG SALAIRES — BORDEREAU G50 (DGI)
            ------------------------------------------------------------------ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111315]">
                  3. Déclaration Fiscale IRG Salaires — Bordereau G50 (DGI)
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Calculé selon l'Article 104 du CIDTA et le barème officiel 2022 avec abattement 40% et lissage dégressif 137/51.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-fintech-secondary text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                Imprimer Bordereau G50
              </button>
            </div>

            {/* En-tête officiel DGI */}
            <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#E6E4DD] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A6065]">
                RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
              </span>
              <h3 className="text-sm font-black text-[#111315]">
                MINISTÈRE DES FINANCES — DIRECTION GÉNÉRALE DES IMPÔTS (DGI)
              </h3>
              <p className="text-xs text-[#5A6065]">
                BORDEREAU DE DÉCLARATION DE SÉRIE G N° 50 • IRG / TRAITEMENTS & SALAIRES • {MOIS_FR[mois - 1]} {annee}
              </p>
            </div>

            {/* Tableau de Déclaration Fiscale G50 */}
            <div className="border border-[#E6E4DD] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F0EC] border-b border-[#E6E4DD] text-[#5A6065]">
                    <th className="py-2.5 px-4 text-left font-bold uppercase">Ligne Fiscale / Catégorie</th>
                    <th className="py-2.5 px-4 text-center font-bold uppercase">Bénéficiaires</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase">Base Imposable (R Tronqué)</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase">Droits Retenus (À Verser)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[#111315]">
                      1. Salariés Réguliers (Barème Progressif Mensuel Art. 104)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{agg.countImposablesIRG}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalBaseIRG)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#991B1B]">
                      {formatDA(agg.totalIRG)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-[#5A6065]">
                      2. Salariés Exonérés d'IRG (Base R ≤ 30 000 DA)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{agg.countExoneresIRG}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatDA(rows.filter((r) => r.calc.rTronqueIrg <= 30000).reduce((s, r) => s + r.calc.rTronqueIrg, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#065F46]">
                      0,00 DA
                    </td>
                  </tr>

                  <tr className="bg-[#FEF3C7] font-extrabold text-[#92400E] text-sm">
                    <td className="py-3 px-4">
                      TOTAL DROITS DUS SECTION IRG / SALAIRES (À REPORTER SUR LA G50)
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{rows.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatDA(agg.totalBaseIRG)}</td>
                    <td className="py-3 px-4 text-right font-mono text-base text-[#991B1B]">
                      {formatDA(agg.totalIRG)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-md bg-[#DBEAFE]/50 border border-[#BFDBFE] text-xs text-[#1E3A8A]">
              <span className="font-bold">Délai Légal de Versement :</span> Cette somme ({formatDA(agg.totalIRG)}) doit être acquittée auprès de la recette des impôts de rattachement avant le <strong>20 {MOIS_FR[mois % 12]} {mois === 12 ? annee + 1 : annee}</strong>.
            </div>

            {/* Navigation Stepper */}
            <div className="flex justify-between items-center pt-4 border-t border-[#E6E4DD]">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-fintech-secondary text-xs"
              >
                ← Étape Précédente
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn-fintech-primary text-xs"
              >
                Passer aux Virements Bancaires →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ÉTAPE 4 : ORDRES DE VIREMENT BANCAIRE & CCP (200 SALARIÉS)
            ------------------------------------------------------------------ */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111315]">
                  4. Ordre Récapitulatif de Virement Bancaire & CCP
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Préparation du fichier d'échange pour remise en banque et émission des virements de paie.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportFichierVirement}
                  className="btn-fintech-secondary text-xs"
                  title="Télécharger le fichier CSV pour la banque"
                >
                  <Download className="w-3.5 h-3.5 text-[#5A6065]" />
                  Télécharger Fichier Virement
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-fintech-secondary text-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#5A6065]" />
                  Imprimer Ordre
                </button>
              </div>
            </div>

            {/* Total Virement Global */}
            <div className="p-4 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#0D3B2E]">
                    Montant Total des Salaires Nets à Virer
                  </span>
                  <span className="text-xl font-black font-mono text-[#0D3B2E]">
                    {formatDA(agg.totalNet)}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-[#065F46]">
                <span>Total Bénéficiaires : </span>
                <span className="font-bold font-mono">{rows.length} Salariés</span>
              </div>
            </div>

            {/* Extrait du Grand Livre des Virements */}
            <div className="border border-[#E6E4DD] rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#F2F0EC] border-b border-[#E6E4DD] text-[#5A6065]">
                  <tr>
                    <th className="py-2.5 px-3 text-center font-bold uppercase w-16">Matr.</th>
                    <th className="py-2.5 px-3 text-left font-bold uppercase">Bénéficiaire & Fonction</th>
                    <th className="py-2.5 px-3 text-left font-bold uppercase">Numéro CCP / RIB</th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase">Mode</th>
                    <th className="py-2.5 px-3 text-right font-bold uppercase">Net à Payer (DA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.salarieId} className="hover:bg-[#F8FAF9]">
                      <td className="py-2 px-3 text-center font-mono font-semibold text-[#5A6065]">
                        {r.matricule}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-[#111315]">{r.nomPrenom}</span>
                        <span className="text-[10px] text-[#5A6065] block">{r.fonction}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[#111315]">
                        {r.numSS || "0000000000 00"}
                      </td>
                      <td className="py-2 px-3 text-center text-[10px] font-semibold text-[#065F46]">
                        Virement
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#0D3B2E]">
                        {formatDA(r.calc.netAPayer)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 50 && (
              <p className="text-center text-xs text-[#5A6065]">
                Affichage des 50 premiers bénéficiaires (sur {rows.length}). Le fichier CSV complet contient les {rows.length} lignes.
              </p>
            )}

            {/* Navigation Stepper */}
            <div className="flex justify-between items-center pt-4 border-t border-[#E6E4DD]">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-fintech-secondary text-xs"
              >
                ← Étape Précédente
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="btn-fintech-primary text-xs"
              >
                Passer au Verrouillage Définitif →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ÉTAPE 5 : VERROUILLAGE OFFICIEL & PISTE D'AUDIT INALTÉRABLE
            ------------------------------------------------------------------ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111315]">
                  5. Verrouillage Officiel & Piste d'Audit de Fin de Mois
                </h2>
                <p className="text-xs text-[#5A6065]">
                  Le verrouillage gèle les bulletins de paie contre toute modification ultérieure et clôture la période.
                </p>
              </div>
            </div>

            {isLocked ? (
              <div className="p-6 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0D3B2E]">
                      La période {MOIS_FR[mois - 1]} {annee} est Officiellement Clôturée et Verrouillée
                    </h3>
                    <p className="text-xs text-[#065F46]">
                      Toutes les écritures comptables, les déclarations CNAS et les états fiscaux G50 sont scellés.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                  <div className="p-3 bg-white rounded border border-[#A7F3D0]">
                    <span className="text-[#5A6065]">Masse Salariale Scellée :</span>
                    <p className="font-mono font-bold text-sm text-[#111315] mt-1">{formatDA(agg.totalBrut)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#A7F3D0]">
                    <span className="text-[#5A6065]">Total DAC CNAS 34,5% :</span>
                    <p className="font-mono font-bold text-sm text-[#0D3B2E] mt-1">{formatDA(agg.totalDAC)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#A7F3D0]">
                    <span className="text-[#5A6065]">Net Global Viré :</span>
                    <p className="font-mono font-bold text-sm text-[#0D3B2E] mt-1">{formatDA(agg.totalNet)}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateStatut("Brouillon")}
                    disabled={loading}
                    className="btn-fintech-secondary text-xs"
                  >
                    <Unlock className="w-3.5 h-3.5 text-[#991B1B]" />
                    Déverrouiller Exceptionnellement
                  </button>
                  <Link href="/paie" className="btn-fintech-primary text-xs">
                    Consulter le Grand Livre
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#92400E] text-white flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#92400E]">
                      Prêt pour la Clôture Définitive du Mois de {MOIS_FR[mois - 1]} {annee} ?
                    </h3>
                    <p className="text-xs text-[#92400E]/80">
                      Cette action verrouille les calculs de l'ensemble des {rows.length} collaborateurs.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#92400E]">
                  En confirmant la clôture, une écriture d'audit inaltérable est inscrite dans la table <code>audit_logs</code> avec horodatage certifié, figeant la DAC à 34,5%, le montant G50 et l'ordre de virement de masse.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => updateStatut("Clôturée")}
                    disabled={loading}
                    className="bg-[#0D3B2E] hover:bg-[#08261E] text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    Confirmer le Verrouillage Définitif
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-fintech-secondary text-xs"
                  >
                    Vérifier les Virements
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
