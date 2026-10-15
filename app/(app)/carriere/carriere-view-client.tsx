"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Salarie, PromotionGlobalRow, SanctionGlobalRow } from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, TrendingUp, Scale, Users, ArrowRight, FileText } from "lucide-react";

export interface CarriereViewClientProps {
  promotions: PromotionGlobalRow[];
  sanctions: SanctionGlobalRow[];
  salaries: Salarie[];
}

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, " ") + " DA";
}

export default function CarriereViewClient({
  promotions,
  sanctions,
  salaries,
}: CarriereViewClientProps) {
  const [tab, setTab] = useState<"promotions" | "sanctions" | "folders">("promotions");
  const [search, setSearch] = useState("");

  const filteredPromotions = promotions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.salaries?.nom_prenom || "").toLowerCase().includes(q) || (p.nouveau_poste || "").toLowerCase().includes(q);
  });

  const filteredSanctions = sanctions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.salaries?.nom_prenom || "").toLowerCase().includes(q) || (s.type_sanction || "").toLowerCase().includes(q) || (s.motif || "").toLowerCase().includes(q);
  });

  const tabs = [
    { id: "promotions", label: `Promotions (${promotions.length})`, icon: TrendingUp },
    { id: "sanctions", label: `Disciplinaire (${sanctions.length})`, icon: Scale },
    { id: "folders", label: "Dossiers individuels", icon: Users },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="Carrière & Discipline"
        subtitle="Suivi des évolutions de carrière, promotions et registre disciplinaire"
        secondaryActions={
          <Button variant="secondary" href="/salaries">
            Collaborateurs
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex bg-[#F1F5F9] p-1 rounded-lg gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 w-64" />
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:border-[#4F46E5] transition-colors" onClick={() => setTab("promotions")}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Évolutions & Promotions</p>
              <p className="text-2xl font-semibold text-[#0F172A] mt-2">{promotions.length} acte(s)</p>
            </div>
            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-300 transition-colors" onClick={() => setTab("sanctions")}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Registre Disciplinaire</p>
              <p className="text-2xl font-semibold text-[#0F172A] mt-2">{sanctions.length} sanction(s)</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <Scale className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Effectif total</p>
              <p className="text-2xl font-semibold text-[#0F172A] mt-2">{salaries.length} salarié(s)</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {tab === "promotions" ? (
        filteredPromotions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-[#94A3B8]">
              Aucune promotion enregistrée dans l&apos;historique.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                    <th className="p-4 font-semibold text-[#64748B]">Évolution de poste</th>
                    <th className="p-4 font-semibold text-[#64748B]">Date d&apos;effet</th>
                    <th className="p-4 font-semibold text-[#64748B] text-right">Nouveau salaire</th>
                    <th className="p-4 font-semibold text-[#64748B] text-right">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredPromotions.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4">
                        <Link href={`/salaries/${p.salarie_id}/carriere`} className="flex items-center gap-3 hover:text-[#4F46E5] transition-colors">
                          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs font-bold text-pink-600">
                            {(p.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{p.salaries?.nom_prenom || `Salarié #${p.salarie_id}`}</span>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#94A3B8] line-through">{p.ancien_poste || "Poste initial"}</span>
                          <ArrowRight className="w-3 h-3 text-pink-500" />
                          <span className="font-semibold text-[#0F172A]">{p.nouveau_poste}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-[#64748B]">
                        {p.date_effet.split("-").reverse().join("/")}
                      </td>
                      <td className="p-4 text-right font-semibold text-[#4F46E5]">
                        {formatDA(p.salaire_base_nouveau)}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/salaries/${p.salarie_id}/carriere/pdf-decision?id=${p.id}`} target="_blank">
                          <Button variant="secondary" className="gap-2 text-xs">
                            <FileText className="w-3 h-3" /> PDF
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : tab === "sanctions" ? (
        filteredSanctions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-[#94A3B8]">
              Le registre disciplinaire est vierge (aucune sanction notifiée).
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="p-4 font-semibold text-[#64748B]">Collaborateur</th>
                    <th className="p-4 font-semibold text-[#64748B]">Nature</th>
                    <th className="p-4 font-semibold text-[#64748B]">Date</th>
                    <th className="p-4 font-semibold text-[#64748B]">Motif légal</th>
                    <th className="p-4 font-semibold text-[#64748B] text-center">Mise à pied</th>
                    <th className="p-4 font-semibold text-[#64748B] text-right">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredSanctions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4">
                        <Link href={`/salaries/${s.salarie_id}/carriere`} className="flex items-center gap-3 hover:text-[#4F46E5] transition-colors">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-600">
                            {(s.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{s.salaries?.nom_prenom || `Salarié #${s.salarie_id}`}</span>
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge variant="danger">{s.type_sanction}</Badge>
                      </td>
                      <td className="p-4 font-mono text-sm text-[#64748B]">
                        {s.date_sanction.split("-").reverse().join("/")}
                      </td>
                      <td className="p-4 text-sm text-[#64748B]">{s.motif}</td>
                      <td className="p-4 text-center font-semibold text-[#0F172A]">
                        {s.duree_mise_a_pied ? `${s.duree_mise_a_pied} j` : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/salaries/${s.salarie_id}/carriere/pdf-sanction?id=${s.id}`} target="_blank">
                          <Button variant="secondary" className="gap-2 text-xs text-red-700 hover:text-red-800">
                            <FileText className="w-3 h-3" /> PDF
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salaries.map((s) => (
            <Link key={s.id} href={`/salaries/${s.id}/carriere`}>
              <Card className="hover:border-[#4F46E5] hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#4F46E5] shrink-0">
                    {s.nom_prenom.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F172A] truncate">{s.nom_prenom}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">{s.fonction || "Poste non renseigné"}</p>
                  </div>
                  <Badge variant={s.actif ? "success" : "neutral"}>{s.actif ? "Actif" : "Inactif"}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
