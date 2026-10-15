"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Salarie, MissionGlobalRow } from "../salaries/actions";
import {
  changerStatutMissionGlobal,
  supprimerMissionGlobal,
  creerMissionSalarie,
} from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Search, Plane, Clock, CheckCircle2, CheckCircle, XCircle, Trash2, Users, MapPin, Calendar, FileText } from "lucide-react";

export interface MissionsViewClientProps {
  missions: MissionGlobalRow[];
  salaries: Salarie[];
}

export default function MissionsViewClient({
  missions,
  salaries,
}: MissionsViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "folders">("list");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formObjet, setFormObjet] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formTransport, setFormTransport] = useState("Véhicule de service");

  const totalEnAttente = missions.filter((m) => m.statut === "En attente").length;
  const totalApprouvees = missions.filter((m) => m.statut === "Approuvée").length;
  const totalTerminees = missions.filter((m) => m.statut === "Terminée").length;

  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutMissionGlobal(id, statut);
        setMessage({ type: "success", text: `Mission ${statut.toLowerCase()}.` });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ordre de mission ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerMissionGlobal(id);
        setMessage({ type: "success", text: "Ordre de mission supprimé." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formObjet || !formDestination || !formDebut || !formFin) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("objet", formObjet);
    formData.append("destination", formDestination);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("moyen_transport", formTransport);
    formData.append("statut", "Approuvée");

    startTransition(async () => {
      try {
        await creerMissionSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setFormObjet("");
        setFormDestination("");
        setFormDebut("");
        setFormFin("");
        setMessage({ type: "success", text: "Nouvel ordre de mission enregistré." });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: "Erreur lors de l'enregistrement de la mission." });
      }
    });
  };

  const filteredMissions = missions.filter((m) => {
    if (filterStatut === "attente") {
      if (m.statut !== "En attente") return false;
    } else if (filterStatut === "approuve") {
      if (m.statut !== "Approuvée") return false;
    } else if (filterStatut === "termine") {
      if (m.statut !== "Terminée") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (m.salaries?.nom_prenom || "").toLowerCase();
      const obj = m.objet.toLowerCase();
      const dest = m.destination.toLowerCase();
      if (!nom.includes(q) && !obj.includes(q) && !dest.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Missions & Déplacements"
        subtitle="Gérez les ordres de missions et les déplacements professionnels"
        primaryAction={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel ordre de mission
          </Button>
        }
        secondaryActions={
          <Button variant="secondary" onClick={() => setViewMode(viewMode === "folders" ? "list" : "folders")} className="gap-2">
            <Users className="w-4 h-4" />
            {viewMode === "folders" ? "Vue Missions" : "Dossiers Collaborateurs"}
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
              { id: "approuve", label: `Approuvées (${totalApprouvees})` },
              { id: "termine", label: `Terminées (${totalTerminees})` },
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Total missions</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{missions.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <Plane className="w-6 h-6 text-[#4F46E5]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">En attente</p>
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
                <p className="text-sm font-medium text-[#64748B]">Approuvées</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{totalApprouvees}</p>
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
                <p className="text-sm font-medium text-[#64748B]">Terminées</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-2">{totalTerminees}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-slate-600" />
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

      {viewMode === "folders" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Total Missions</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">En attente</th>
                  <th className="p-4 font-semibold text-[#64748B] text-center">Approuvées/En cours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {salaries.map((s) => {
                  const sMissions = missions.filter(m => m.salarie_id === s.id);
                  const att = sMissions.filter(m => m.statut === "En attente").length;
                  const app = sMissions.filter(m => m.statut === "Approuvée").length;
                  
                  if (sMissions.length === 0) return null;

                  return (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4 font-medium text-[#0F172A]">{s.nom_prenom}</td>
                      <td className="p-4 text-center font-medium text-[#0F172A]">{sMissions.length}</td>
                      <td className="p-4 text-center text-amber-600 font-medium">{att > 0 ? att : "-"}</td>
                      <td className="p-4 text-center text-teal-600 font-medium">{app > 0 ? app : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#4F46E5]">
                      {m.salaries?.nom_prenom?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0F172A] text-sm">{m.salaries?.nom_prenom}</h4>
                      <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {m.destination}
                      </p>
                    </div>
                  </div>
                  <Badge variant={m.statut === "Approuvée" ? "success" : m.statut === "Terminée" ? "neutral" : "warning"}>
                    {m.statut}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex gap-2 text-sm text-[#0F172A]">
                    <FileText className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    <span className="font-medium">{m.objet}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-[#0F172A]">
                    <Calendar className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    <span>
                      {new Date(m.date_debut).toLocaleDateString()} - {new Date(m.date_fin).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm text-[#0F172A]">
                    <Plane className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    <span>{m.moyen_transport}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#E2E8F0] flex justify-between gap-2">
                  {m.statut === "En attente" && (
                    <Button 
                      variant="secondary" 
                      className="flex-1 text-teal-600 bg-teal-50 hover:bg-teal-100 border-none"
                      onClick={() => handleChangerStatut(m.id, "Approuvée")}
                      disabled={isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approuver
                    </Button>
                  )}
                  {m.statut === "Approuvée" && (
                    <Button 
                      variant="secondary"
                      className="flex-1 text-[#4F46E5] bg-[#EEF2FF] hover:bg-indigo-100 border-none"
                      onClick={() => handleChangerStatut(m.id, "Terminée")}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Marquer terminée
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    className="px-3 text-[#64748B] hover:text-red-600"
                    onClick={() => handleSupprimer(m.id)}
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
                <h3 className="text-lg font-semibold text-[#0F172A]">Nouvel ordre de mission</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreerMission} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Collaborateur</label>
                  <Select value={formSalarieId} onChange={setFormSalarieId} options={salaries.map(s => ({ value: String(s.id), label: s.nom_prenom }))} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Objet de la mission</label>
                  <Input value={formObjet} onChange={e => setFormObjet(e.target.value)} required placeholder="Ex: Réunion client, Audit..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Destination</label>
                  <Input value={formDestination} onChange={e => setFormDestination(e.target.value)} required placeholder="Ex: Oran, Alger..." />
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
                  <label className="text-sm font-medium text-[#0F172A]">Moyen de transport</label>
                  <Select value={formTransport} onChange={setFormTransport} options={[
                    { value: "Véhicule de service", label: "Véhicule de service" },
                    { value: "Véhicule personnel", label: "Véhicule personnel" },
                    { value: "Avion", label: "Avion" },
                    { value: "Train", label: "Train" }
                  ]} />
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
