"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listerToutesAvances, changerStatutAvance, type AvanceSalaireRow } from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { CheckCircle2, XCircle, AlertCircle, Clock, User, Users, Wallet, Filter, Check, X } from "lucide-react";

export default function GestionAvancesClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avances, setAvances] = useState<AvanceSalaireRow[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filterStatut, setFilterStatut] = useState<"all" | "attente" | "approuvee" | "rejetee">("all");

  useEffect(() => {
    listerToutesAvances().then((data) => {
      setAvances(data);
      setChargement(false);
    });
  }, []);

  const handleChangerStatut = async (id: number, statut: string) => {
    startTransition(async () => {
      try {
        await changerStatutAvance(id, statut);
        const data = await listerToutesAvances();
        setAvances(data);
        router.refresh();
      } catch (err) {
        alert("Erreur lors de la modification du statut.");
      }
    });
  };

  const enAttenteCount = avances.filter((a) => a.statut === "En attente").length;
  const filteredAvances = avances.filter((a) => {
    if (filterStatut === "attente") return a.statut === "En attente";
    if (filterStatut === "approuvee") return a.statut === "Approuvée";
    if (filterStatut === "rejetee") return a.statut === "Rejetée";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Link href="/saisie" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <User className="w-4 h-4" /> Saisie individuelle
          </Link>
          <Link href="/saisie/collective" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <Users className="w-4 h-4" /> Grille collective
          </Link>
          <Link href="/saisie/avances" className="flex items-center gap-2 hover:text-[#4F46E5] transition-colors bg-[#F8FAFC] px-3 py-1.5 rounded-md font-medium text-[#4F46E5]">
            <Wallet className="w-4 h-4" /> Acomptes & Avances
          </Link>
        </div>

        <PageHeader
          title="Gestion des Avances & Acomptes"
          subtitle="Suivez et validez les demandes d'avances sur salaires"
        />
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#4F46E5]" />
            <CardTitle className="text-base">Filtres de statut</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {enAttenteCount > 0 ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none gap-1.5 px-3 py-1">
                <AlertCircle className="w-3.5 h-3.5" /> {enAttenteCount} en attente
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-none gap-1.5 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tout est à jour
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={filterStatut} onValueChange={(v: any) => setFilterStatut(v)} className="w-full border-b border-[#E2E8F0]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none w-full justify-start overflow-x-auto hide-scrollbar border-0">
              <TabsTrigger 
                value="all" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4F46E5] data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-none px-6 py-4 bg-transparent font-medium"
              >
                Toutes
              </TabsTrigger>
              <TabsTrigger 
                value="attente" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4F46E5] data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-none px-6 py-4 bg-transparent font-medium flex items-center gap-2"
              >
                À valider <Badge variant="secondary" className="bg-[#F1F5F9] text-[#64748B] ml-1">{enAttenteCount}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="approuvee" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4F46E5] data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-none px-6 py-4 bg-transparent font-medium"
              >
                Approuvées
              </TabsTrigger>
              <TabsTrigger 
                value="rejetee" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4F46E5] data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-none px-6 py-4 bg-transparent font-medium"
              >
                Rejetées
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto">
            {chargement ? (
              <div className="p-12 text-center text-sm font-medium text-[#64748B] flex flex-col items-center justify-center gap-3">
                <Clock className="w-6 h-6 animate-spin text-[#CBD5E1]" /> Chargement des demandes...
              </div>
            ) : filteredAvances.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-[#94A3B8]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Aucune demande trouvée</h3>
                  <p className="text-sm text-[#64748B] max-w-sm">
                    Il n'y a pas d'acomptes ou d'avances correspondant à ce filtre de statut.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-6 py-4 font-semibold text-[#64748B]">Collaborateur</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B] w-24">Période</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B] w-36 text-right">Montant</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B]">Motif</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B] w-32">Date</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B] w-32 text-center">Statut</th>
                    <th className="px-6 py-4 font-semibold text-[#64748B] w-48 text-right">Décision RH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredAvances.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0F172A]">
                          {a.salaries?.nom_prenom || `Salarié #${a.salarie_id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#64748B]">
                        {String(a.mois).padStart(2, "0")}/{a.annee}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold font-mono text-[#4F46E5]">
                          {a.montant.toLocaleString("fr-FR").replace(/[\\u202F\\u00A0]/g, " ")} DA
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#64748B] max-w-[200px] truncate" title={a.motif || ""}>
                        {a.motif || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#64748B]">
                        {new Date(a.cree_le).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`
                            ${a.statut === "Approuvée" ? "bg-teal-50 text-teal-700 border-teal-200" : ""}
                            ${a.statut === "Rejetée" ? "bg-red-50 text-red-700 border-red-200" : ""}
                            ${a.statut === "En attente" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                          `}
                        >
                          {a.statut}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.statut === "En attente" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleChangerStatut(a.id, "Approuvée")}
                              className="h-8 bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Valider
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={isPending}
                              onClick={() => handleChangerStatut(a.id, "Rejetée")}
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5 text-xs"
                            >
                              <X className="w-3.5 h-3.5" /> Refuser
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#94A3B8] font-medium flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Traitée
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
