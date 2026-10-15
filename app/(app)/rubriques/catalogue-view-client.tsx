"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, RubriqueCatalogue } from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Users, BookCopy, CheckCircle2 } from "lucide-react";

export interface CatalogueViewClientProps {
  catalogue: RubriqueCatalogue[];
  salaries: Salarie[];
}

export default function CatalogueViewClient({ catalogue, salaries }: CatalogueViewClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalogue" | "affectation">("catalogue");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

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
                  <th className="p-4 font-semibold text-[#64748B] text-right w-36">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCatalogue.slice(0, 100).map(r => (
                  <tr key={r.code} className="hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#4F46E5]">{r.code}</td>
                    <td className="p-4 font-medium text-[#0F172A]">{r.libelle || "Rubrique sans libellé"}</td>
                    <td className="p-4">{getCatBadge(r.categorie)}</td>
                    <td className="p-4 font-mono text-xs text-[#64748B]">{r.type_valeur || "standard"}</td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active en paie
                      </span>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
