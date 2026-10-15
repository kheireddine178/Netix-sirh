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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
          <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
            {[
              { id: "all", label: "Toutes" },
              { id: "attente", label: `À valider (${totalEnAttente})` },
              { id: "approuve", label: "Approuvées" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatut(f.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterStatut === f.id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">En attente de validation</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{totalEnAttente}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Demandes approuvées</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{totalApprouves}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Jours pris cumulés</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{totalJoursPris}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-[#4F46E5]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${
          message.type === 'success' 
            ? 'bg-teal-50 text-teal-900 border-teal-200' 
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
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Jours pris</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Jours en attente</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Reliquat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {salaries.map((s) => {
                  const stat = statsSalarie[s.id] || { pris: 0, enAttente: 0, reliquat: 30 };
                  return (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4 font-medium text-[#0F172A]">{s.nom_prenom}</td>
                      <td className="p-4 text-center text-[#64748B]">{stat.pris} j</td>
                      <td className="p-4 text-center text-amber-600 font-medium">{stat.enAttente > 0 ? `${stat.enAttente} j` : "-"}</td>
                      <td className="p-4 text-center font-medium text-[#0F172A]">{stat.reliquat} j</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConges.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#4F46E5]">
                      {c.salaries?.nom_prenom?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0F172A] text-sm">{c.salaries?.nom_prenom}</h4>
                      <p className="text-xs text-[#64748B]">{c.type_conge}</p>
                    </div>
                  </div>
                  <Badge variant={c.statut === "Approuvé" ? "success" : c.statut === "Rejeté" ? "danger" : "warning"}>
                    {c.statut}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Période</span>
                    <span className="font-medium text-[#0F172A]">
                      {new Date(c.date_debut).toLocaleDateString()} - {new Date(c.date_fin).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Durée</span>
                    <span className="font-medium text-[#0F172A]">{c.jours_ouvrables} jours</span>
                  </div>
                  {c.motif && (
                    <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-2 rounded line-clamp-2">
                      {c.motif}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-[#E2E8F0] flex justify-between gap-2">
                  {(c.statut === "En attente" || c.statut === "En attente validation RH") && (
                    <>
                      <Button 
                        variant="secondary" 
                        className="flex-1 text-teal-600 bg-teal-50 hover:bg-teal-100 border-none"
                        onClick={() => handleChangerStatut(c.id, "Approuvé")}
                        disabled={isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approuver
                      </Button>
                      <Button 
                        variant="secondary"
                        className="flex-1 text-red-600 bg-red-50 hover:bg-red-100 border-none"
                        onClick={() => handleChangerStatut(c.id, "Rejeté")}
                        disabled={isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Rejeter
                      </Button>
                    </>
                  )}
                  {c.statut === "Approuvé" && (
                    <Button 
                      variant="secondary"
                      className="w-full text-amber-600 bg-amber-50 hover:bg-amber-100 border-none"
                      onClick={() => handleChangerStatut(c.id, "En attente")}
                      disabled={isPending}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" /> Remettre en attente
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    className="px-3 text-[#64748B] hover:text-red-600"
                    onClick={() => handleSupprimer(c.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-[#0F172A]">Nouvelle demande</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreerConge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Collaborateur</label>
                  <Select value={formSalarieId} onChange={setFormSalarieId} options={salaries.map(s => ({ value: String(s.id), label: s.nom_prenom }))} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Type de congé</label>
                  <Select value={formType} onChange={setFormType} options={[
                    { value: "Annuel", label: "Congé Annuel" },
                    { value: "Maladie", label: "Maladie" },
                    { value: "Sans solde", label: "Sans solde" },
                    { value: "Maternité", label: "Maternité" }
                  ]} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F172A]">Du</label>
                    <Input type="date" value={formDebut} onChange={e => setFormDebut(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F172A]">Au</label>
                    <Input type="date" value={formFin} onChange={e => setFormFin(e.target.value)} required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Jours ouvrables</label>
                  <Input type="number" step="0.5" min="0.5" value={formJours} onChange={e => setFormJours(parseFloat(e.target.value))} required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Motif (optionnel)</label>
                  <textarea 
                    className="w-full min-h-[80px] p-2.5 text-sm rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                    value={formMotif}
                    onChange={e => setFormMotif(e.target.value)}
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={isPending}>Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
