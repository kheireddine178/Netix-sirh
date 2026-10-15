"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Parametres } from "@/lib/paieCalcul";
import { updateParametres, reinitialiserParametres } from "./actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, RotateCcw, Building2, Wallet, Clock, Calculator, Shield, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function ParametresForm({ initial }: { initial: Parametres }) {
  const [parametres, setParametres] = useState<Parametres>(initial);
  const [bareme, setBareme] = useState<[number, number | null, number][]>(initial.bareme_irg);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function updateBareme(idx: number, field: "de" | "a" | "taux", value: string) {
    setBareme((prev) => {
      const next = [...prev];
      const row = [...next[idx]] as [number, number | null, number];
      if (field === "de") row[0] = parseFloat(value) || 0;
      if (field === "a") row[1] = value === "" ? null : parseFloat(value) || 0;
      if (field === "taux") row[2] = parseFloat(value) || 0;
      next[idx] = row;
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    formData.set("bareme_irg_json", JSON.stringify(bareme));
    startTransition(async () => {
      try {
        const result = await updateParametres(formData);
        setParametres(result);
        setBareme(result.bareme_irg);
        setMessage({ text: "Paramètres légaux et informations employeur enregistrés avec succès.", type: "success" });
        router.refresh();
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : "Erreur d'enregistrement", type: "error" });
      }
    });
  }

  function handleReset() {
    if (!confirm("Attention : Réinitialiser tous les paramètres aux barèmes officiels par défaut (LF 2024 / SNMG 20 000 DA) ?")) return;
    startTransition(async () => {
      try {
        const result = await reinitialiserParametres();
        setParametres(result);
        setBareme(result.bareme_irg);
        setMessage({ text: "Tous les paramètres ont été réinitialisés aux valeurs légales officielles.", type: "success" });
        router.refresh();
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : "Erreur de réinitialisation", type: "error" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Paramètres & Taux"
        subtitle="Droit du travail & fiscalité algérienne (LF 2024 / CIDTA)"
        primaryAction={
          <Button onClick={() => formRef.current?.requestSubmit()} disabled={isPending} className="gap-2">
            <Save className="w-4 h-4" /> {isPending ? "Enregistrement…" : "Enregistrer les paramètres"}
          </Button>
        }
        secondaryActions={
          <Button variant="secondary" onClick={handleReset} disabled={isPending} className="gap-2 text-[#64748B] hover:text-[#0F172A]">
            <RotateCcw className="w-4 h-4" /> Rétablir les barèmes légaux
          </Button>
        }
      />

      {message && (
        <div className={`p-4 rounded-lg flex items-center justify-between text-sm font-medium border ${message.type === "success" ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
          <button type="button" onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-6">
        
        {/* SECTION 1 : INFORMATIONS EMPLOYEUR */}
        <Card>
          <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#4F46E5]" />
              <CardTitle className="text-base">Informations de l'Entreprise & Identifiants Fiscaux</CardTitle>
            </div>
            <CardDescription>Ces mentions légales sont automatiquement imprimées sur les bulletins de paie PDF et les états officiels.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="employeur_nom" className="text-sm font-medium text-[#0F172A]">Raison sociale / Nom de l'entreprise</label>
                <Input id="employeur_nom" name="employeur_nom" defaultValue={parametres.employeur_nom} placeholder="Ex : SARL Netix Industrie" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employeur_adresse" className="text-sm font-medium text-[#0F172A]">Adresse du siège social</label>
                <Input id="employeur_adresse" name="employeur_adresse" defaultValue={parametres.employeur_adresse} placeholder="Ex : Zone industrielle, Oran, Algérie" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employeur_nif" className="text-sm font-medium text-[#0F172A]">NIF</label>
                <Input id="employeur_nif" name="employeur_nif" defaultValue={parametres.employeur_nif} placeholder="Ex : 000123456789012" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employeur_nis" className="text-sm font-medium text-[#0F172A]">NIS</label>
                <Input id="employeur_nis" name="employeur_nis" defaultValue={parametres.employeur_nis} placeholder="Ex : 012345678" className="font-mono" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label htmlFor="employeur_affiliation_cnas" className="text-sm font-medium text-[#0F172A]">N° d'Affiliation Employeur CNAS</label>
                <Input id="employeur_affiliation_cnas" name="employeur_affiliation_cnas" defaultValue={parametres.employeur_affiliation_cnas} placeholder="Ex : 16/123456/78" className="font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 : SNMG & COTISATIONS CNAS */}
        <Card>
          <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-base">SNMG, Temps de Travail & Cotisations Sociales CNAS</CardTitle>
            </div>
            <CardDescription>Barèmes nationaux régis par la loi 90-11 et la législation de sécurité sociale.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="snmg" className="text-sm font-medium text-[#0F172A]">SNMG mensuel (DA)</label>
                <Input id="snmg" name="snmg" type="number" step="0.01" defaultValue={parametres.snmg} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Réf : 20 000 DA</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="duree_legale_mensuelle" className="text-sm font-medium text-[#0F172A]">Durée légale mensuelle (h)</label>
                <Input id="duree_legale_mensuelle" name="duree_legale_mensuelle" type="number" step="0.01" defaultValue={parametres.duree_legale_mensuelle} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">40h/sem = 173.33h</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="taux_cnas_salarie" className="text-sm font-medium text-[#0F172A]">Taux CNAS Salarié (%)</label>
                <Input id="taux_cnas_salarie" name="taux_cnas_salarie_pct" type="number" step="0.01" defaultValue={parametres.taux_cnas_salarie * 100} className="font-mono font-bold text-teal-700" />
                <p className="text-xs text-[#64748B]">Retenue ouvrière (9%)</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="taux_cnas_employeur" className="text-sm font-medium text-[#0F172A]">Taux CNAS Employeur (%)</label>
                <Input id="taux_cnas_employeur" name="taux_cnas_employeur_pct" type="number" step="0.01" defaultValue={parametres.taux_cnas_employeur * 100} className="font-mono font-bold text-indigo-700" />
                <p className="text-xs text-[#64748B]">Charge patronale (26%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 : MAJORATIONS HEURES SUPPLÉMENTAIRES */}
        <Card>
          <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Majorations des Heures Supplémentaires (Loi 90-11 Art. 32)</CardTitle>
            </div>
            <CardDescription>Coefficients légaux multiplicateurs du taux horaire de base selon les paliers de travail.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="majoration_hs_1" className="text-sm font-medium text-[#0F172A]">Palier 1 : Normales (+50%)</label>
                <Input id="majoration_hs_1" name="majoration_hs_1" type="number" step="0.01" defaultValue={parametres.majoration_hs_1} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Coefficient 1.50</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="majoration_hs_2" className="text-sm font-medium text-[#0F172A]">Palier 2 : Nuit / Dérogatoires (+75%)</label>
                <Input id="majoration_hs_2" name="majoration_hs_2" type="number" step="0.01" defaultValue={parametres.majoration_hs_2} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Coefficient 1.75</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="majoration_hs_3" className="text-sm font-medium text-[#0F172A]">Palier 3 : Fériés / Repos légal (+100%)</label>
                <Input id="majoration_hs_3" name="majoration_hs_3" type="number" step="0.01" defaultValue={parametres.majoration_hs_3} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Coefficient 2.00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4 : BARÈME PROGRESSIF IRG */}
        <Card>
          <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Barème Progressif IRG (Art. 104 CIDTA / Barème Officiel)</CardTitle>
            </div>
            <CardDescription>Tranches d'imposition mensuelles calculées en cascade sur le salaire imposable.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white border-b border-[#E2E8F0]">
                    <th className="p-4 font-semibold text-[#64748B]">Tranche</th>
                    <th className="p-4 font-semibold text-[#64748B]">De (DA / mois)</th>
                    <th className="p-4 font-semibold text-[#64748B]">À (DA / mois)</th>
                    <th className="p-4 font-semibold text-[#64748B] text-right">Taux appliqué</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {bareme.map((t, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4 font-medium text-[#64748B]">Tranche {i + 1}</td>
                      <td className="p-4">
                        <Input type="number" step="0.01" value={t[0]} onChange={(e) => updateBareme(i, "de", e.target.value)} className="w-36 font-mono" />
                      </td>
                      <td className="p-4">
                        <Input type={t[1] === null ? "text" : "number"} step="0.01" value={t[1] === null ? "" : t[1]} placeholder="Illimité" onChange={(e) => updateBareme(i, "a", e.target.value)} className="w-36 font-mono" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Input type="number" step="0.01" value={Math.round(t[2] * 100 * 100) / 100} onChange={(e) => updateBareme(i, "taux", String((parseFloat(e.target.value) || 0) / 100))} className="w-24 text-right font-mono font-bold text-purple-700" />
                          <span className="font-bold text-[#64748B]">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5 : ABATTEMENT ET EXONÉRATION IRG */}
        <Card>
          <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base">Seuil d'Exonération Totale & Abattement Légal de 40%</CardTitle>
            </div>
            <CardDescription>Exonération en deçà de 30 000 DA et mécanisme de décote prévu par le code des impôts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="seuil_exoneration_irg" className="text-sm font-medium text-[#0F172A]">Seuil d'exonération totale (DA)</label>
                <Input id="seuil_exoneration_irg" name="seuil_exoneration_irg" type="number" step="0.01" defaultValue={parametres.seuil_exoneration_irg} className="font-mono font-bold text-amber-700" />
                <p className="text-xs text-[#64748B]">Imposable ≤ 30 000 = 0 IRG</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="taux_abattement_irg" className="text-sm font-medium text-[#0F172A]">Taux d'abattement légal (%)</label>
                <Input id="taux_abattement_irg" name="taux_abattement_irg_pct" type="number" step="0.01" defaultValue={parametres.taux_abattement_irg * 100} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Abattement général : 40%</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="abattement_irg_min" className="text-sm font-medium text-[#0F172A]">Abattement minimum (DA/mois)</label>
                <Input id="abattement_irg_min" name="abattement_irg_min" type="number" step="0.01" defaultValue={parametres.abattement_irg_min} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Minimum : 1 000 DA</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="abattement_irg_max" className="text-sm font-medium text-[#0F172A]">Abattement maximum (DA/mois)</label>
                <Input id="abattement_irg_max" name="abattement_irg_max" type="number" step="0.01" defaultValue={parametres.abattement_irg_max} className="font-mono font-medium" />
                <p className="text-xs text-[#64748B]">Plafond : 1 500 DA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end pt-4 pb-12">
          <Button type="submit" disabled={isPending} className="gap-2">
            <Save className="w-4 h-4" /> {isPending ? "Enregistrement en cours…" : "Enregistrer les paramètres"}
          </Button>
        </div>
      </form>
    </div>
  );
}
