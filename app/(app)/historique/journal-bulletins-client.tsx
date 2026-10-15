"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Calculator, FileText, Trash2, Search, DollarSign, ShieldCheck, Receipt, Hash, ChevronRight } from "lucide-react";
import {
  type BulletinGlobalItem,
  type Salarie,
  supprimerBulletin,
} from "../salaries/actions";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmtDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/[\u202F\u00A0]/g, " ") + " DA";
}

interface Props {
  bulletins: BulletinGlobalItem[];
  salaries: Salarie[];
}

export default function JournalBulletinsClient({ bulletins, salaries }: Props) {
  const router = useRouter();
  const now = new Date();
  const [selectedMois, setSelectedMois] = useState<number | "tous">("tous");
  const [selectedAnnee, setSelectedAnnee] = useState<number | "tous">("tous");
  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const anneesDisponibles = Array.from(new Set(bulletins.map(b => b.annee))).sort((a, b) => b - a);
  if (anneesDisponibles.length === 0) anneesDisponibles.push(now.getFullYear());

  const bulletinsFiltres = bulletins.filter(b => {
    if (selectedAnnee !== "tous" && b.annee !== selectedAnnee) return false;
    if (selectedMois !== "tous" && b.mois !== selectedMois) return false;
    if (filterStatut !== "Tous" && (b.statut || "Calculé") !== filterStatut) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (b.salaries?.nom_prenom || "").toLowerCase().includes(q) || (b.salaries?.matricule || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalMasseNette = bulletinsFiltres.reduce((sum, b) => sum + (b.net_a_payer || 0), 0);
  const totalRetenueSS = bulletinsFiltres.reduce((sum, b) => sum + (b.retenue_ss || 0), 0);
  const totalIRG = bulletinsFiltres.reduce((sum, b) => sum + (b.irg || 0), 0);

  const handleSupprimerBulletin = (salarieId: number, bulletinId: number, mois: number, annee: number) => {
    if (!confirm(`Supprimer définitivement ce bulletin de ${NOMS_MOIS[mois - 1]} ${annee} ?\n\nCette action est irréversible.`)) return;
    startTransition(async () => {
      try {
        await supprimerBulletin(salarieId, bulletinId);
        router.refresh();
      } catch (err: any) { alert(err.message || "Erreur lors de la suppression"); }
    });
  };

  const statutVariant = (st: string | null | undefined) => {
    if (st === "Clôturé") return "neutral";
    if (st === "Validé") return "success";
    return "brand";
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Journal Général de Paie"
        subtitle="Historique et journal de tous les bulletins de salaire émis"
        primaryAction={<Button variant="primary" href="/saisie">Nouvelle saisie de paie</Button>}
        secondaryActions={<Button variant="secondary" href="/rapports">Rapports & G50</Button>}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#64748B]">Année</span>
              <select value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value === "tous" ? "tous" : parseInt(e.target.value, 10))}
                className="p-2 rounded-md border border-[#E2E8F0] text-sm bg-white focus:ring-1 focus:ring-[#4F46E5] focus:outline-none">
                <option value="tous">Toutes</option>
                {anneesDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#64748B]">Mois</span>
              <select value={selectedMois} onChange={e => setSelectedMois(e.target.value === "tous" ? "tous" : parseInt(e.target.value, 10))}
                className="p-2 rounded-md border border-[#E2E8F0] text-sm bg-white focus:ring-1 focus:ring-[#4F46E5] focus:outline-none">
                <option value="tous">Tous</option>
                {NOMS_MOIS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
              {["Tous", "Calculé", "Validé", "Clôturé"].map(st => (
                <button key={st} onClick={() => setFilterStatut(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatut === st ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="pl-9 w-56" />
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Masse salariale nette", value: fmtDA(totalMasseNette), icon: DollarSign, color: "text-teal-600 bg-teal-50" },
          { label: "Cotisations CNAS (9%)", value: fmtDA(totalRetenueSS), icon: ShieldCheck, color: "text-blue-600 bg-blue-50" },
          { label: "Impôt IRG précompté", value: fmtDA(totalIRG), icon: Receipt, color: "text-purple-600 bg-purple-50" },
          { label: "Bulletins affichés", value: bulletinsFiltres.length.toString(), icon: Hash, color: "text-[#64748B] bg-slate-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">{label}</p>
                <p className="text-xl font-semibold text-[#0F172A] mt-2">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bulletinsFiltres.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calculator className="w-10 h-10 mx-auto mb-3 text-[#94A3B8]" />
            <p className="font-semibold text-sm text-[#0F172A]">Aucun bulletin ne correspond aux critères.</p>
            <p className="text-xs text-[#64748B] mt-1">
              Effectuez une saisie depuis <Link href="/saisie" className="text-[#4F46E5] hover:underline font-medium">Saisie mensuelle</Link>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                  <th className="p-4 font-semibold text-[#64748B]">Période</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right">Salaire base</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right">CNAS (9%)</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right">IRG</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right">Net à payer</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Statut</th>
                  <th className="p-4 font-semibold text-[#64748B] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bulletinsFiltres.map(b => (
                  <tr key={b.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/salaries/${b.salarie_id}`} className="font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors">
                        {b.salaries?.nom_prenom || `Salarié #${b.salarie_id}`}
                      </Link>
                      {(b.salaries?.matricule || b.salaries?.fonction) && (
                        <p className="text-xs text-[#64748B]">
                          {b.salaries?.matricule && `Matr. ${b.salaries.matricule}`}
                          {b.salaries?.fonction && ` • ${b.salaries.fonction}`}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-medium text-[#0F172A] whitespace-nowrap">{NOMS_MOIS[b.mois - 1]} {b.annee}</td>
                    <td className="p-4 text-right text-[#64748B] font-mono whitespace-nowrap">{fmtDA(b.salaire_base_reel)}</td>
                    <td className="p-4 text-right text-blue-700 font-mono whitespace-nowrap">{fmtDA(b.retenue_ss)}</td>
                    <td className="p-4 text-right text-purple-700 font-mono whitespace-nowrap">{fmtDA(b.irg)}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 font-semibold font-mono border border-teal-200">
                        {fmtDA(b.net_a_payer)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={statutVariant(b.statut)}>{b.statut || "Calculé"}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/salaries/${b.salarie_id}/bulletin/explication?annee=${b.annee}&mois=${b.mois}`}>
                          <Button variant="secondary" className="text-xs">Détail</Button>
                        </Link>
                        <a href={`/salaries/${b.salarie_id}/bulletin/pdf?annee=${b.annee}&mois=${b.mois}&variante=salarie`} target="_blank" rel="noreferrer">
                          <Button variant="secondary" className="text-xs gap-1 text-[#4F46E5]">
                            <FileText className="w-3 h-3" /> PDF
                          </Button>
                        </a>
                        <Button variant="ghost" className="px-2 text-[#64748B] hover:text-red-600"
                          disabled={isPending} onClick={() => handleSupprimerBulletin(b.salarie_id, b.id, b.mois, b.annee)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Accès direct par collaborateur</h3>
          <div className="flex flex-wrap gap-2">
            {salaries.map(s => (
              <Link key={s.id} href={`/salaries/${s.id}/historique`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-indigo-50/30 transition-all">
                {s.nom_prenom}
                {s.matricule && <span className="text-[#94A3B8]">({s.matricule})</span>}
                <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
