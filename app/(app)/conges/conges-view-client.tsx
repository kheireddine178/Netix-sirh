"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Salarie, CongeGlobalRow } from "../salaries/actions";
import {
  changerStatutCongeGlobal,
  supprimerCongeGlobal,
  creerCongeSalarie,
} from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Search, CheckCircle2, Clock, Trash2, CheckCircle, XCircle, AlertCircle, CalendarDays, Users } from "lucide-react";

export interface CongesViewClientProps {
  conges: CongeGlobalRow[];
  salaries: Salarie[];
  statsSalarie: Record<number, { pris: number; enAttente: number; reliquat: number }>;
}

export default function CongesViewClient({
  conges,
  salaries,
  statsSalarie,
}: CongesViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "balances">("list");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New leave form state
  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formType, setFormType] = useState("Annuel");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formJours, setFormJours] = useState(1);
  const [formMotif, setFormMotif] = useState("");

  const totalEnAttente = conges.filter((c) => c.statut === "En attente" || c.statut === "En attente validation RH").length;
  const totalApprouves = conges.filter((c) => c.statut === "Approuvé").length;
  const totalJoursPris = conges
    .filter((c) => c.statut === "Approuvé" && c.type_conge === "Annuel")
    .reduce((sum, c) => sum + (c.jours_ouvrables || 0), 0);

  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutCongeGlobal(id, statut);
        setMessage({ type: "success", text: `Statut mis à jour : ${statut}.` });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande de congé ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerCongeGlobal(id);
        setMessage({ type: "success", text: "Demande de congé supprimée." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerConge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formDebut || !formFin || formJours <= 0) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("type_conge", formType);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("jours_ouvrables", String(formJours));
    formData.append("motif", formMotif);
    formData.append("statut", "Approuvé");

    startTransition(async () => {
      try {
        await creerCongeSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setFormMotif("");
        setFormDebut("");
        setFormFin("");
        setFormJours(1);
        setMessage({ type: "success", text: "Nouvelle demande de congé créée et validée." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de l'enregistrement du congé." });
      }
    });
  };

  const filteredConges = conges.filter((c) => {
    if (filterStatut === "attente") {
      if (c.statut !== "En attente" && c.statut !== "En attente validation RH") return false;
    } else if (filterStatut === "approuve") {
      if (c.statut !== "Approuvé") return false;
    } else if (filterStatut === "rejete") {
      if (c.statut !== "Rejeté") return false;
    } else if (filterStatut === "annuel") {
      if (c.type_conge !== "Annuel") return false;
    } else if (filterStatut === "maladie") {
      if (c.type_conge !== "Maladie" && c.type_conge !== "Sans solde") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (c.salaries?.nom_prenom || "").toLowerCase();
      const matricule = (c.salaries?.matricule || "").toLowerCase();
      const motif = (c.motif || "").toLowerCase();
      if (!nom.includes(q) && !matricule.includes(q) && !motif.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Congés & Absences"
        subtitle="Gérez les demandes de congés et le planning des absences"
        primaryAction={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle demande
          </Button>
        }
        secondaryActions={
          <Button variant="secondary" onClick={() => setViewMode(viewMode === "balances" ? "list" : "balances")} className="gap-2">
            <Users className="w-4 h-4" />
            {viewMode === "balances" ? "Vue Demandes" : "Soldes Collaborateurs"}
          </Button>
        }
      >
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
          <div className="flex bg-[#F0EFEA] p-1 rounded-lg">
            {[
              { id: "all", label: "Toutes" },
              { id: "attente", label: `À valider (${totalEnAttente})` },
              { id: "approuve", label: "Approuvées" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatut(f.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  filterStatut === f.id ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#111827]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#71717A]">En attente de validation</p>
                <p className="text-2xl font-semibold tabular-nums text-[#111827] mt-1">{totalEnAttente}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg border border-amber-200/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#71717A]">Demandes approuvées</p>
                <p className="text-2xl font-semibold tabular-nums text-[#111827] mt-1">{totalApprouves}</p>
              </div>
              <div className="w-10 h-10 bg-[#E6F3EE] rounded-lg border border-[#A7F3D0]/60 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#0D3B2E]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#71717A]">Jours pris cumulés</p>
                <p className="text-2xl font-semibold tabular-nums text-[#111827] mt-1">{totalJoursPris}</p>
              </div>
              <div className="w-10 h-10 bg-[#FAF9F8] rounded-lg border border-[#F0EFEA] flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[#71717A]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${
          message.type === 'success' 
            ? 'bg-[#E6F3EE] text-[#0D3B2E] border-[#A7F3D0]' 
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {viewMode === "balances" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FAF9F8] border-b border-[#F0EFEA]">
                  <th className="p-4 font-semibold text-[#71717A]">Collaborateur</th>
                  <th className="p-4 font-semibold text-[#71717A] text-center">Jours pris</th>
                  <th className="p-4 font-semibold text-[#71717A] text-center">Jours en attente</th>
                  <th className="p-4 font-semibold text-[#71717A] text-center">Reliquat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {salaries.map((s) => {
                  const stat = statsSalarie[s.id] || { pris: 0, enAttente: 0, reliquat: 30 };
                  return (
                    <tr key={s.id} className="hover:bg-[#FAF9F8] transition-colors">
                      <td className="p-4 font-medium text-[#111827]">{s.nom_prenom}</td>
                      <td className="p-4 text-center tabular-nums text-[#71717A]">{stat.pris} j</td>
                      <td className="p-4 text-center tabular-nums text-amber-600 font-medium">{stat.enAttente > 0 ? `${stat.enAttente} j` : "-"}</td>
                      <td className="p-4 text-center tabular-nums font-semibold text-[#111827]">{stat.reliquat} j</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConges.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E6F3EE] border border-[#A7F3D0] flex items-center justify-center text-xs font-bold text-[#0D3B2E]">
                      {c.salaries?.nom_prenom?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827] text-sm">{c.salaries?.nom_prenom}</h4>
                      <p className="text-xs text-[#71717A]">{c.type_conge}</p>
                    </div>
                  </div>
                  <Badge variant={c.statut === "Approuvé" ? "success" : c.statut === "Rejeté" ? "danger" : "warning"}>
                    {c.statut}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717A]">Période</span>
                    <span className="font-medium text-[#111827]">
                      {new Date(c.date_debut).toLocaleDateString()} - {new Date(c.date_fin).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717A]">Durée</span>
                    <span className="font-semibold tabular-nums text-[#111827]">{c.jours_ouvrables} jours</span>
                  </div>
                  {c.motif && (
                    <p className="text-xs text-[#71717A] bg-[#FAF9F8] border border-[#F0EFEA] p-2 rounded line-clamp-2">
                      {c.motif}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-[#F0EFEA] flex justify-between gap-2">
                  {(c.statut === "En attente" || c.statut === "En attente validation RH") && (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="flex-1 text-[#0D3B2E] bg-[#E6F3EE] hover:bg-[#d8ece4] border-[#A7F3D0]"
                        onClick={() => handleChangerStatut(c.id, "Approuvé")}
                        disabled={isPending}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approuver
                      </Button>
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                        onClick={() => handleChangerStatut(c.id, "Rejeté")}
                        disabled={isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejeter
                      </Button>
                    </>
                  )}
                  {c.statut === "Approuvé" && (
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="w-full text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                      onClick={() => handleChangerStatut(c.id, "En attente")}
                      disabled={isPending}
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Remettre en attente
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="px-2.5 text-[#71717A] hover:text-red-600"
                    onClick={() => handleSupprimer(c.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border border-[#F0EFEA] bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F0EFEA]">
                <h3 className="text-base font-semibold text-[#111827]">Nouvelle demande de congé</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#71717A] hover:text-[#111827]">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreerConge} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Collaborateur</label>
                  <Select value={formSalarieId} onChange={setFormSalarieId} options={salaries.map(s => ({ value: String(s.id), label: s.nom_prenom }))} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Type de congé</label>
                  <Select value={formType} onChange={setFormType} options={[
                    { value: "Annuel", label: "Congé Annuel" },
                    { value: "Maladie", label: "Maladie" },
                    { value: "Sans solde", label: "Sans solde" },
                    { value: "Maternité", label: "Maternité" }
                  ]} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#111827]">Du</label>
                    <Input type="date" value={formDebut} onChange={e => setFormDebut(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#111827]">Au</label>
                    <Input type="date" value={formFin} onChange={e => setFormFin(e.target.value)} required />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Jours ouvrables</label>
                  <Input type="number" step="0.5" min="0.5" value={formJours} onChange={e => setFormJours(parseFloat(e.target.value))} required />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Motif (optionnel)</label>
                  <textarea 
                    className="w-full min-h-[75px] p-2.5 text-xs rounded-lg border border-[#E4E4E7] focus:outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                    value={formMotif}
                    onChange={e => setFormMotif(e.target.value)}
                  />
                </div>
                
                <div className="pt-3 flex justify-end gap-2 border-t border-[#F0EFEA]">
                  <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                  <Button type="submit" size="sm" disabled={isPending}>Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
