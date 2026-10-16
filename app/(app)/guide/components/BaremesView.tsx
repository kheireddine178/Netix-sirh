"use client";

import React from "react";
import { Scale, Calendar, Info } from "lucide-react";

export function BaremesView() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          Réglementation Officielle des Cotisations & Impôts
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Barèmes Légaux & Taux de Cotisations (Algérie)</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Synthèse des cotisations de sécurité sociale (CNAS/CNR/CNAC), du barème progressif de l'Impôt sur le Revenu Global (CIDTA Art. 104) et des seuils nationaux en vigueur.
        </p>
      </div>

      {/* Grid: CNAS Rates & Key Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CNAS Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Sécurité Sociale</span>
              <h3 className="text-base font-bold text-slate-900">Cotisations CNAS / CNR / CNAC</h3>
            </div>
            <span className="text-xs tabular-nums font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              Décret n°06-373
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Branche de cotisation</th>
                  <th className="py-3 px-4 text-center">Part Salarié</th>
                  <th className="py-3 px-4 text-center">Part Patronale</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Assurances Sociales (maladie, maternité, invalidité)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">1,50 %</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">13,00 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">14,50 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Accidents du Travail & Maladie Pro (AT/MP)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">1,25 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">1,25 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Retraite (Caisse Nationale des Retraites - CNR)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">6,75 %</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">7,50 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">14,25 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Assurance Chômage (CNAC)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">0,50 %</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">1,00 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">1,50 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Retraite anticipée (Loi n°97-13)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">0,25 %</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">0,25 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">0,50 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Fonds des œuvres sociales (FOS)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">0,50 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">0,50 %</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-800">Fonds de formation continue & péréquation (FCCL / TAF)</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-600">2,50 %</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900">2,50 %</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-500 text-emerald-950">
                  <td className="py-3 px-4 text-sm">TOTAL DES COTISATIONS</td>
                  <td className="py-3 px-4 text-center tabular-nums text-sm text-emerald-800">9,00 %</td>
                  <td className="py-3 px-4 text-center tabular-nums text-sm text-emerald-800">26,00 %</td>
                  <td className="py-3 px-4 text-right tabular-nums text-sm text-emerald-900">35,00 %</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            * Note : Le versement mensuel à la CNAS est exigible avant le <strong>15 du mois suivant</strong>. L'assiette CNAS exclut les frais professionnels justifiés et le panier (Ord. n°95-01 Art. 1).
          </div>
        </div>

        {/* National Thresholds & Key Indicators */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block mb-1">Seuils Légaux</span>
            <h3 className="text-base font-bold text-slate-900 mb-4">Indicateurs Nationaux de Référence</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium block">SNMG Mensuel</span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">24 000 DA</span>
                <span className="text-[11px] text-slate-500 block mt-1">Décret présidentiel n°23-411</span>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40">
                <span className="text-xs text-emerald-700 font-medium block">Seuil d'Exonération IRG</span>
                <span className="text-xl font-bold text-emerald-900 tabular-nums">30 000 DA / mois</span>
                <span className="text-[11px] text-emerald-700 block mt-1">CIDTA Art. 104-3 (LF 2022)</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium block">Abattement IRG Mensuel</span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">1 000 – 1 500 DA</span>
                <span className="text-[11px] text-slate-500 block mt-1">40 % avec plancher et plafond</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium block">Taux Primes Non Mensuelles</span>
                <span className="text-xl font-bold text-indigo-700 tabular-nums">10,00 % fixe</span>
                <span className="text-[11px] text-slate-500 block mt-1">Taux libératoire (13e mois, bilan)</span>
              </div>
            </div>
          </div>

          {/* Declarative Calendar Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Calendrier des Échéances RH & Paie</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-800">15 de chaque mois</span>
                <span className="text-slate-600">Paiement cotisations CNAS du mois précédent</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-800">31 Janvier (N+1)</span>
                <span className="text-slate-600">Déclaration Annuelle des Cotisations (DAC CNAS)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-800">30 Avril (N+1)</span>
                <span className="text-slate-600">Déclaration Annuelle des Salaires (DAS DGI)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-800">Sous 24 Heures</span>
                <span className="text-slate-600">Déclaration d'Accident du Travail (AT) à la CNAS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barème IRG 6 Tranches */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Fiscalité des Rémunérations</span>
            <h3 className="text-base font-bold text-slate-900">Barème Progressif IRG — Art. 104 CIDTA (LF 2022 → LF 2025)</h3>
          </div>
          <span className="text-xs tabular-nums font-medium text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            DGI Algérie · Circulaire n°01/2014
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tranche Annuelle (DA)</th>
                <th className="py-3 px-4">Équivalent Mensuel (DA)</th>
                <th className="py-3 px-4 text-center">Taux</th>
                <th className="py-3 px-4">Formule de Calcul Annuelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="bg-emerald-50/40 text-emerald-900">
                <td className="py-3 px-4 tabular-nums">N'excède pas 240 000 DA</td>
                <td className="py-3 px-4 tabular-nums">≤ 20 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-emerald-700 text-sm">0 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-500">IRG brut = 0 DA</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 tabular-nums text-slate-800">240 001 à 480 000 DA</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">20 001 à 40 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900 text-sm">23 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">(Revenu − 240 000) × 23 %</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 tabular-nums text-slate-800">480 001 à 960 000 DA</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">40 001 à 80 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900 text-sm">27 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">55 200 + (Revenu − 480 000) × 27 %</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 tabular-nums text-slate-800">960 001 à 1 920 000 DA</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">80 001 à 160 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900 text-sm">30 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">184 800 + (Revenu − 960 000) × 30 %</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 tabular-nums text-slate-800">1 920 001 à 3 840 000 DA</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">160 001 à 320 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900 text-sm">33 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">472 800 + (Revenu − 1 920 000) × 33 %</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 tabular-nums text-slate-800">Supérieure à 3 840 000 DA</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">&gt; 320 000 DA / mois</td>
                <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900 text-sm">35 %</td>
                <td className="py-3 px-4 tabular-nums text-slate-600">1 106 400 + (Revenu − 3 840 000) × 35 %</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Abatements Explanatory Callout */}
        <div className="p-5 bg-[#FAFBFD] border-t border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <Info className="w-4 h-4 text-indigo-600" />
            Mécanismes Obligatoires d'Abattements Fiscaux (Art. 104 CIDTA)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 rounded-xl bg-white border border-slate-200/70">
              <strong className="text-slate-800 block mb-1">1. Premier Abattement de 40 %</strong>
              Appliqué sur l'IRG brut obtenu par le barème. Cet abattement ne peut être inférieur à <strong>1 000 DA/mois</strong> (12 000 DA/an) ni supérieur à <strong>1 500 DA/mois</strong> (18 000 DA/an).
            </div>
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <strong className="text-amber-900 block mb-1">2. Second Abattement Dégressif (30 001 à 42 500 DA)</strong>
              Pour les salaires situés dans cette tranche médiane, la DGI applique un second abattement pour éviter tout effet de seuil brutal :
              <code className="block mt-1 tabular-nums text-[11px] bg-white/80 p-1.5 rounded border border-amber-200 text-amber-900">
                IRG net = IRG(1er abattement) × (93/61) − (81 213/41)
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
