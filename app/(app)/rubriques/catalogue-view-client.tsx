"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, RubriqueCatalogue } from "../salaries/actions";
import { assignerRubriqueFixeSalarie } from "../paie/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Users, BookCopy, CheckCircle2, PlusCircle, X, Check } from "lucide-react";

export interface CatalogueViewClientProps {
  catalogue: RubriqueCatalogue[];
  salaries: Salarie[];
}

export default function CatalogueViewClient({ catalogue, salaries }: CatalogueViewClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalogue" | "affectation">("catalogue");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  // Modale d'affectation directe
  const [selectedRubrique, setSelectedRubrique] = useState<RubriqueCatalogue | null>(null);
  const [affectSalarieId, setAffectSalarieId] = useState<number>(salaries[0]?.id || 1);
  const [nombre, setNombre] = useState<number>(22);
  const [taux, setTaux] = useState<number>(500);
  const [montantFixe, setMontantFixe] = useState<number>(5000);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const openAffectModal = (r: RubriqueCatalogue) => {
    setSelectedRubrique(r);
    if (r.categorie === "nombre_x_taux" || r.code.startsWith("R52")) {
      setNombre(22);
      setTaux(500);
    } else {
      setMontantFixe(5000);
    }
  };

  const handleConfirmAffectation = async () => {
    if (!selectedRubrique || !affectSalarieId) return;
    setIsAssigning(true);
    try {
      const isNombreTaux = selectedRubrique.categorie === "nombre_x_taux" || selectedRubrique.code.startsWith("R52");
      const finalAmount = isNombreTaux ? nombre * taux : montantFixe;
      await assignerRubriqueFixeSalarie(affectSalarieId, selectedRubrique.code, finalAmount);
      const sal = salaries.find(s => s.id === affectSalarieId);
      setNotice(`✅ Rubrique ${selectedRubrique.code} (${selectedRubrique.libelle}) affectée à ${sal?.nom_prenom || "l'employé"} pour ${finalAmount.toLocaleString("fr-FR")} DA !`);
      setSelectedRubrique(null);
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice("Erreur lors de l'affectation");
      setTimeout(() => setNotice(null), 3000);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredCatalogue = catalogue.filter(r => {
    if (catFilter !== "all" && r.categorie !== catFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.code.toLowerCase().includes(q) || (r.libelle || "").toLowerCase().includes(q);
  });

  const getCatBadge = (cat: string) => {
    const map: Record<string, { label: string; variant: "brand" | "success" | "warning" | "neutral" }> = {
      pourcentage: { label: "Pourcentage (%)", variant: "brand" },
      montant_fixe: { label: "Montant Fixe (DA)", variant: "success" },
      nombre_x_taux: { label: "Nombre × Taux", variant: "warning" },
      regularisation: { label: "Régularisation", variant: "neutral" },
    };
    const entry = map[cat];
    if (entry) return <Badge variant={entry.variant}>{entry.label}</Badge>;
    return <Badge variant="neutral">{cat}</Badge>;
  };

  const catFilters = [
    { id: "all", label: "Toutes" },
    { id: "pourcentage", label: "% Pourcentage" },
    { id: "montant_fixe", label: "Montant Fixe" },
    { id: "nombre_x_taux", label: "Nombre × Taux" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Catalogue des Rubriques de Paie"
        subtitle="Plan de paie et paramétrage des primes, indemnités et retenues"
        secondaryActions={
          <div className="flex gap-2">
            <Button variant="secondary" href="/parametres">Paramètres & Taux</Button>
            <Button variant="secondary" onClick={() => setTab(tab === "catalogue" ? "affectation" : "catalogue")} className="gap-2">
              {tab === "catalogue" ? <><Users className="w-4 h-4" /> Affectation par salarié</> : <><BookCopy className="w-4 h-4" /> Plan de paie</>}
            </Button>
          </div>
        }
      >
        {tab === "catalogue" && (
          <div className="flex items-center gap-4 mt-6">
            <div className="flex bg-[#F1F5F9] p-1 rounded-lg gap-1">
              {catFilters.map(f => (
                <button key={f.id} onClick={() => setCatFilter(f.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${catFilter === f.id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Code ou libellé..." className="pl-9 w-64" />
            </div>
            <span className="text-sm font-medium text-[#64748B]">{catalogue.length} rubriques</span>
          </div>
        )}
      </PageHeader>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-semibold flex items-center justify-between shadow-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {tab === "affectation" ? (
        <Card className="max-w-xl">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#0F172A] mb-2">Affecter des rubriques à un collaborateur</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Sélectionnez un salarié pour activer ou désactiver les primes personnalisées sur son bulletin.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0F172A]">Sélectionner un collaborateur</label>
              <select
                defaultValue=""
                onChange={e => { const id = e.target.value; if (id) router.push(`/salaries/${id}/rubriques`); }}
                className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none"
              >
                <option value="" disabled>Choisir un salarié...</option>
                {salaries.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""} — {s.fonction || "Poste non défini"}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-4 font-semibold text-[#64748B] w-24">Code</th>
                  <th className="p-4 font-semibold text-[#64748B]">Libellé</th>
                  <th className="p-4 font-semibold text-[#64748B] w-40">Mode de calcul</th>
                  <th className="p-4 font-semibold text-[#64748B] w-32">Type</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center w-28">Statut</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCatalogue.slice(0, 100).map(r => {
                  const isNombreTaux = r.categorie === "nombre_x_taux" || r.code.startsWith("R52");
                  return (
                    <tr key={r.code} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#4F46E5]">{r.code}</td>
                      <td className="p-4 font-medium text-[#0F172A]">{r.libelle || "Rubrique sans libellé"}</td>
                      <td className="p-4">{getCatBadge(r.categorie)}</td>
                      <td className="p-4 font-mono text-xs text-[#64748B]">{r.type_valeur || "standard"}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active en paie
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openAffectModal(r)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isNombreTaux
                              ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                              : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]"
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          {isNombreTaux ? "Saisir (N×T)" : "Affecter"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredCatalogue.length > 100 && (
            <div className="p-3 text-center text-xs text-[#94A3B8] bg-[#F8FAFC] border-t border-[#E2E8F0]">
              Affichage des 100 premières rubriques sur {filteredCatalogue.length}. Utilisez la recherche pour affiner.
            </div>
          )}
        </Card>
      )}

      {/* MODALE D'AFFECTATION DIRECTE AVEC SAISIE NOMBRE * TAUX */}
      {selectedRubrique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedRubrique(null)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="font-mono text-indigo-600 font-bold">{selectedRubrique.code}</span>
                  <span>{selectedRubrique.libelle}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Mode : {getCatBadge(selectedRubrique.categorie)}
                </span>
              </div>
              <button onClick={() => setSelectedRubrique(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Salarié destinataire */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Salarié bénéficiaire :
              </label>
              <select
                value={affectSalarieId}
                onChange={e => setAffectSalarieId(parseInt(e.target.value, 10))}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {salaries.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.matricule ? `[${s.matricule}] ` : ""}{s.nom_prenom} — {s.fonction || "Collaborateur"}
                  </option>
                ))}
              </select>
            </div>

            {/* Saisie Nombre x Taux OU Montant */}
            {selectedRubrique.categorie === "nombre_x_taux" || selectedRubrique.code.startsWith("R52") ? (
              <div className="space-y-2.5 p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-xs font-bold text-amber-900">
                  Option Nombre × Taux (ex: Panier " 22 panier * 500 da ")
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nombre / Quantité :
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={nombre}
                      onChange={e => setNombre(parseFloat(e.target.value) || 0)}
                      placeholder="22"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Taux unitaire (DA) :
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={taux}
                      onChange={e => setTaux(parseFloat(e.target.value) || 0)}
                      placeholder="500"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-semibold">Total calculé :</span>
                  <span className="font-mono font-bold text-amber-950 text-sm">
                    {nombre} × {taux.toLocaleString("fr-FR")} DA = {(nombre * taux).toLocaleString("fr-FR")} DA
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  {selectedRubrique.categorie === "pourcentage" ? "Pourcentage (%) :" : "Montant mensuel fixe (DA) :"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={selectedRubrique.categorie === "pourcentage" ? "0.5" : "500"}
                    min="0"
                    value={montantFixe}
                    onChange={e => setMontantFixe(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono font-bold text-xs outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    {selectedRubrique.categorie === "pourcentage" ? "%" : "DA"}
                  </span>
                </div>
              </div>
            )}

            {/* Boutons actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedRubrique(null)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleConfirmAffectation} disabled={isAssigning}>
                {isAssigning ? "Affectation..." : "Confirmer l'affectation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
