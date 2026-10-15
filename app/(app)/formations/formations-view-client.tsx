"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GraduationCap, Plus, Search, BookOpen, Users, CheckCircle2, FileText, Trash2, XCircle, X } from "lucide-react";
import {
  type InscriptionGlobalRow,
  type FormationRow,
  type Salarie,
  changerStatutInscriptionGlobal,
  supprimerInscriptionGlobal,
  creerInscriptionGenerale,
  creerFormationCatalogue,
} from "../salaries/actions";

interface Props {
  inscriptions: InscriptionGlobalRow[];
  catalogue: FormationRow[];
  salaries: Salarie[];
}

const statutVariant = (st: string) => {
  if (st === "Terminée") return "success";
  if (st === "En cours") return "brand";
  if (st === "Prévue") return "warning";
  return "neutral";
};

export default function FormationsViewClient({ inscriptions, catalogue, salaries }: Props) {
  const [activeTab, setActiveTab] = useState<"inscriptions" | "catalogue" | "salaries">("inscriptions");
  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModalInscription, setShowModalInscription] = useState(false);
  const [showModalFormation, setShowModalFormation] = useState(false);
  const [preselectedFormationId, setPreselectedFormationId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalInscriptions = inscriptions.length;
  const enCoursOuPrevues = inscriptions.filter(i => i.statut === "En cours" || i.statut === "Prévue").length;
  const terminees = inscriptions.filter(i => i.statut === "Terminée").length;
  const budgetInvesti = inscriptions.reduce((sum, i) => sum + (i.formations?.prix_da || 0), 0);

  const inscriptionsFiltrees = inscriptions.filter(item => {
    if (filterStatut !== "Tous" && item.statut !== filterStatut) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.salaries?.nom_prenom || "").toLowerCase().includes(q) ||
        (item.salaries?.matricule || "").toLowerCase().includes(q) ||
        (item.formations?.titre || "").toLowerCase().includes(q) ||
        (item.formations?.organisme || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const catalogueFiltre = catalogue.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.titre.toLowerCase().includes(q) || f.theme.toLowerCase().includes(q) || f.organisme.toLowerCase().includes(q);
  });

  const handleChangerStatut = (id: number, statut: string) => {
    startTransition(async () => { await changerStatutInscriptionGlobal(id, statut); });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Supprimer cette inscription ?")) return;
    startTransition(async () => { await supprimerInscriptionGlobal(id); });
  };

  const handleCreerInscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await creerInscriptionGenerale(new FormData(e.currentTarget));
        setShowModalInscription(false);
        setPreselectedFormationId(null);
      } catch (err: any) { alert(err.message); }
    });
  };

  const handleCreerFormation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await creerFormationCatalogue(new FormData(e.currentTarget));
        setShowModalFormation(false);
      } catch (err: any) { alert(err.message); }
    });
  };

  const tabs = [
    { id: "inscriptions", label: `Sessions (${inscriptions.length})`, icon: GraduationCap },
    { id: "catalogue", label: `Catalogue (${catalogue.length})`, icon: BookOpen },
    { id: "salaries", label: `Par salarié (${salaries.length})`, icon: Users },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Formations & Talents"
        subtitle="Plan de formation, inscriptions et suivi des compétences"
        primaryAction={
          <Button onClick={() => { setPreselectedFormationId(null); setShowModalInscription(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Inscrire un salarié
          </Button>
        }
        secondaryActions={
          <Button variant="secondary" onClick={() => setShowModalFormation(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nouveau module
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex bg-[#F1F5F9] p-1 rounded-lg gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="pl-9 w-64" />
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total inscriptions", value: totalInscriptions, icon: GraduationCap, color: "text-[#4F46E5] bg-indigo-50" },
          { label: "En cours / Prévues", value: enCoursOuPrevues, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Terminées", value: terminees, icon: CheckCircle2, color: "text-teal-600 bg-teal-50" },
          { label: "Budget investi", value: budgetInvesti.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA", icon: FileText, color: "text-purple-600 bg-purple-50" },
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

      {activeTab === "inscriptions" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["Tous", "En cours", "Prévue", "Terminée", "Annulée"].map(st => (
              <button key={st} onClick={() => setFilterStatut(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterStatut === st ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {inscriptionsFiltrees.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-sm text-[#94A3B8]">Aucune inscription ne correspond aux critères.</CardContent></Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                      <th className="p-4 font-semibold text-[#64748B]">Formation</th>
                      <th className="p-4 font-semibold text-[#64748B]">Organisme</th>
                      <th className="p-4 font-semibold text-[#64748B]">Début</th>
                      <th className="p-4 font-semibold text-[#64748B]">Durée / Coût</th>
                      <th className="p-4 font-semibold text-[#64748B] text-center">Statut</th>
                      <th className="p-4 font-semibold text-[#64748B] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {inscriptionsFiltrees.map(item => (
                      <tr key={item.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="p-4">
                          <Link href={`/salaries/${item.salarie_id}`} className="font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors">
                            {item.salaries?.nom_prenom || `Salarié #${item.salarie_id}`}
                          </Link>
                          {item.salaries?.matricule && <p className="text-xs text-[#64748B]">{item.salaries.matricule}</p>}
                        </td>
                        <td className="p-4 font-medium text-[#0F172A]">{item.formations?.titre || `Formation #${item.formation_id}`}</td>
                        <td className="p-4 text-[#64748B]">
                          <div>{item.formations?.organisme || "—"}</div>
                          {item.formations?.theme && <div className="text-xs text-[#94A3B8]">{item.formations.theme}</div>}
                        </td>
                        <td className="p-4 font-mono text-[#64748B]">
                          {item.date_debut ? item.date_debut.split("-").reverse().join("/") : "—"}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#0F172A]">{item.formations?.duree_jours || 0} j</span>
                          <div className="text-xs text-[#64748B]">
                            {(item.formations?.prix_da || 0).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={statutVariant(item.statut)}>{item.statut}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {item.statut !== "Terminée" && (
                              <Button variant="secondary" className="text-xs text-teal-600 bg-teal-50 border-none hover:bg-teal-100 gap-1"
                                disabled={isPending} onClick={() => handleChangerStatut(item.id, "Terminée")}>
                                <CheckCircle2 className="w-3 h-3" /> Terminer
                              </Button>
                            )}
                            <Button variant="ghost" className="px-2 text-[#64748B] hover:text-red-600"
                              disabled={isPending} onClick={() => handleSupprimer(item.id)}>
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
        </div>
      )}

      {activeTab === "catalogue" && (
        <div className="flex flex-col gap-4">
          {catalogueFiltre.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-sm text-[#94A3B8]">Le catalogue est vide.</CardContent></Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-4 font-semibold text-[#64748B]">Formation</th>
                      <th className="p-4 font-semibold text-[#64748B]">Thème</th>
                      <th className="p-4 font-semibold text-[#64748B]">Organisme</th>
                      <th className="p-4 font-semibold text-[#64748B]">Durée</th>
                      <th className="p-4 font-semibold text-[#64748B]">Coût unitaire</th>
                      <th className="p-4 font-semibold text-[#64748B] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {catalogueFiltre.map(f => (
                      <tr key={f.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="p-4 font-semibold text-[#0F172A]">{f.titre}</td>
                        <td className="p-4"><Badge variant="neutral">{f.theme || "Général"}</Badge></td>
                        <td className="p-4 text-[#64748B]">{f.organisme || "Interne"}</td>
                        <td className="p-4 font-semibold text-[#0F172A]">{f.duree_jours} j</td>
                        <td className="p-4 font-semibold text-purple-700">{f.prix_da.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA</td>
                        <td className="p-4 text-right">
                          <Button variant="secondary" className="text-xs" onClick={() => { setPreselectedFormationId(f.id); setShowModalInscription(true); }}>
                            <Plus className="w-3 h-3 mr-1" /> Inscrire
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "salaries" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salaries.map(s => {
            const insc = inscriptions.filter(i => i.salarie_id === s.id);
            const enCours = insc.filter(i => i.statut === "En cours" || i.statut === "Prévue").length;
            return (
              <Card key={s.id} className="hover:border-[#4F46E5] hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#4F46E5]">
                        {s.nom_prenom.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/salaries/${s.id}`} className="font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors text-sm">{s.nom_prenom}</Link>
                        <p className="text-xs text-[#64748B]">{s.fonction || "Non renseigné"}</p>
                      </div>
                    </div>
                    {enCours > 0 ? <Badge variant="brand">{enCours} active(s)</Badge> : <Badge variant="neutral">{insc.length} total</Badge>}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-[#E2E8F0]">
                    <Link href={`/salaries/${s.id}/formations`} className="flex-1">
                      <Button variant="secondary" className="w-full text-xs gap-1">
                        <GraduationCap className="w-3 h-3" /> Dossier Formation
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModalInscription && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#4F46E5]" /> Inscrire un collaborateur
                </h3>
                <button onClick={() => setShowModalInscription(false)}><X className="w-5 h-5 text-[#64748B]" /></button>
              </div>
              <form onSubmit={handleCreerInscription} className="space-y-4 text-sm">
                <div className="space-y-1">
                  <label className="font-medium text-[#0F172A]">Collaborateur *</label>
                  <select name="salarie_id" required className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none">
                    <option value="">Sélectionner...</option>
                    {salaries.map(s => <option key={s.id} value={s.id}>{s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[#0F172A]">Module de formation *</label>
                  <select name="formation_id" required defaultValue={preselectedFormationId || ""} className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none">
                    <option value="">Sélectionner...</option>
                    {catalogue.map(f => <option key={f.id} value={f.id}>{f.titre} — {f.organisme || "Interne"} ({f.duree_jours}j)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Date de début *</label>
                    <Input type="date" name="date_debut" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Statut initial</label>
                    <select name="statut" defaultValue="Prévue" className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none">
                      <option value="Prévue">Prévue</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowModalInscription(false)}>Annuler</Button>
                  <Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Confirmer l'inscription"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showModalFormation && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" /> Nouveau module au catalogue
                </h3>
                <button onClick={() => setShowModalFormation(false)}><X className="w-5 h-5 text-[#64748B]" /></button>
              </div>
              <form onSubmit={handleCreerFormation} className="space-y-4 text-sm">
                <div className="space-y-1">
                  <label className="font-medium text-[#0F172A]">Intitulé de la formation *</label>
                  <Input name="titre" required placeholder="ex: Sécurité industrielle, Management..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Thème</label>
                    <Input name="theme" placeholder="ex: Technique, RH..." />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Organisme formateur</label>
                    <Input name="organisme" placeholder="ex: INPED, Interne..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Durée (jours)</label>
                    <Input type="number" name="duree_jours" min="1" defaultValue="3" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-[#0F172A]">Prix unitaire (DA)</label>
                    <Input type="number" name="prix_da" min="0" step="100" defaultValue="25000" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowModalFormation(false)}>Annuler</Button>
                  <Button type="submit" disabled={isPending}>{isPending ? "Création..." : "Ajouter au catalogue"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
