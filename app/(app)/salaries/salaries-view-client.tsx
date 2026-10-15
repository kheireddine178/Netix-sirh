"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Eye,
  FileText,
  Building2,
  Calendar,
  Wallet,
  LayoutGrid,
  List,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Salarie } from "./actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { formatDA } from "@/lib/utils";

export interface SalariesViewClientProps {
  salaries: Salarie[];
  totalCount: number;
  page: number;
  limit: number;
  search: string;
  status: string;
}

export default function SalariesViewClient({
  salaries,
  totalCount,
  page,
  limit,
  search: initialSearch,
  status: initialStatus,
}: SalariesViewClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialStatus === "all" ? "all" : initialStatus === "inactive" ? "inactive" : "active");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filtrage selon onglet de statut
  const filteredSalaries = useMemo(() => {
    if (activeTab === "active") return salaries.filter((s) => s.actif);
    if (activeTab === "inactive") return salaries.filter((s) => !s.actif);
    return salaries;
  }, [salaries, activeTab]);

  const countActifs = salaries.filter((s) => s.actif).length;
  const countInactifs = salaries.filter((s) => !s.actif).length;

  const tabItems = [
    { id: "active", label: "Collaborateurs Actifs", badge: countActifs },
    { id: "all", label: "Tous les Dossiers", badge: salaries.length },
    { id: "inactive", label: "Inactifs / Sortis", badge: countInactifs },
  ];

  // Colonnes du tableau de bord d'annuaire
  const columns: Column<Salarie>[] = [
    {
      key: "matricule",
      header: "Matricule",
      width: "120px",
      render: (s) => (
        <span className="font-mono text-xs text-[#4F46E5] font-bold">
          {s.matricule || "—"}
        </span>
      ),
    },
    {
      key: "nom_prenom",
      header: "Collaborateur",
      render: (s) => {
        const initials = s.nom_prenom
          .trim()
          .split(/\s+/)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "N";

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <Link
                href={`/salaries/${s.id}`}
                className="font-bold text-[#0F172A] hover:text-[#4F46E5] transition-colors"
              >
                {s.nom_prenom}
              </Link>
              <span className="text-xs text-[#64748B]">
                {s.fonction || "Fonction non définie"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "salaire_base_theorique",
      header: "Salaire de Base",
      isCurrency: true,
      render: (s) => (
        <span className="tabular-nums font-semibold text-[#0F172A]">
          {formatDA(s.salaire_base_theorique)}
        </span>
      ),
    },
    {
      key: "ccp_rib",
      header: "RIB / CNAS",
      render: (s) => (
        <div className="flex flex-col text-xs text-[#64748B]">
          <span className="tabular-nums">
            {s.ccp_rib ? `RIB: ${s.ccp_rib.slice(0, 10)}...` : "RIB manquant"}
          </span>
          <span className="tabular-nums text-[11px] text-[#94A3B8]">
            {s.date_visite_medicale ? "Visite médicale OK" : "Visite à planifier"}
          </span>
        </div>
      ),
    },
    {
      key: "actif",
      header: "Statut",
      align: "center",
      render: (s) => (
        <Badge variant={s.actif ? "success" : "neutral"} size="sm" dot={s.actif}>
          {s.actif ? "En poste" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Dossier",
      align: "right",
      sortable: false,
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="secondary" size="sm">
            <Link href={`/salaries/${s.id}`} className="flex items-center gap-1.5 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>Consulter</span>
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PageHeader conforme §4.2 */}
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/dashboard" },
          { label: "Équipe", href: "/salaries" },
          { label: "Collaborateurs" },
        ]}
        title="Annuaire des Collaborateurs"
        subtitle="Registre unique du personnel, suivi des dossiers administratifs et gestion des fiches de poste (Loi 90-11)."
        primaryAction={
          <Button
            variant="primary"
            href="/salaries/nouveau"
            icon={<UserPlus className="w-4 h-4 text-white" />}
          >
            Nouveau Collaborateur
          </Button>
        }
        secondaryActions={
          <div className="flex items-center border border-[#E2E8F0] rounded-lg p-0.5 bg-white">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Vue Tableau"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Vue Cartes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {/* Onglets de filtrage */}
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId)}
        />
      </PageHeader>

      {/* VUE TABLEAU PAR DÉFAUT */}
      {viewMode === "table" ? (
        <DataTable
          data={filteredSalaries}
          columns={columns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Rechercher par nom, prénom, matricule, fonction..."
          pageSize={10}
          exportFileName="annuaire-salaries-netix"
          emptyStateTitle="Aucun collaborateur trouvé"
          emptyStateDescription="Aucun dossier ne correspond aux critères de sélection."
          onRowClick={(s) => router.push(`/salaries/${s.id}`)}
        />
      ) : (
        /* VUE EN CARTES D'IDENTITÉ PROFESSIONNELLES */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalaries.map((s) => {
            const initials = s.nom_prenom
              .trim()
              .split(/\s+/)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "N";

            return (
              <Card key={s.id} hoverable className="flex flex-col justify-between">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/salaries/${s.id}`}
                          className="font-bold text-sm text-[#0F172A] hover:text-[#4F46E5] transition-colors truncate"
                        >
                          {s.nom_prenom}
                        </Link>
                        <span className="text-xs text-[#64748B] truncate">
                          {s.fonction || "Fonction non définie"}
                        </span>
                      </div>
                    </div>
                    <Badge variant={s.actif ? "success" : "neutral"} size="sm" dot={s.actif}>
                      {s.actif ? "Actif" : "Sorti"}
                    </Badge>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Matricule :</span>
                      <span className="font-mono font-bold text-[#4F46E5]">{s.matricule || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Salaire de base :</span>
                      <span className="font-semibold tabular-nums text-[#0F172A]">
                        {formatDA(s.salaire_base_theorique)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
                    <Link
                      href={`/saisie?salarieId=${s.id}`}
                      className="text-xs font-semibold text-[#4F46E5] hover:underline"
                    >
                      Calculer la paie
                    </Link>
                    <Button variant="secondary" size="sm" href={`/salaries/${s.id}`}>
                      Dossier complet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
