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
  Trash2,
} from "lucide-react";
import type { Salarie } from "./actions";
import { supprimerSalarieDefinitif } from "./actions";
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
  const [salariesList, setSalariesList] = useState<Salarie[]>(salaries);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  React.useEffect(() => {
    setSalariesList(salaries);
  }, [salaries]);

  const [activeTab, setActiveTab] = useState(initialStatus === "all" ? "all" : initialStatus === "inactive" ? "inactive" : "active");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const handleSupprimer = async (s: Salarie) => {
    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le collaborateur "${s.nom_prenom}" ?\n\nAttention : Cette action est irréversible. Tous ses bulletins de paie, contrats et documents associés seront également supprimés.`
    );
    if (!confirmation) return;

    setDeletingId(s.id);
    try {
      const res = await supprimerSalarieDefinitif(s.id);
      if (res && !res.success) {
        alert("Erreur lors de la suppression : " + (res.error || "Une erreur est survenue"));
      } else {
        setSalariesList((prev) => prev.filter((item) => item.id !== s.id));
        router.refresh();
      }
    } catch (err: any) {
      alert("Erreur : " + (err?.message || "Impossible de supprimer ce collaborateur"));
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrage selon onglet de statut
  const filteredSalaries = useMemo(() => {
    if (activeTab === "active") return salariesList.filter((s) => s.actif);
    if (activeTab === "inactive") return salariesList.filter((s) => !s.actif);
    return salariesList;
  }, [salariesList, activeTab]);

  const countActifs = salariesList.filter((s) => s.actif).length;
  const countInactifs = salariesList.filter((s) => !s.actif).length;

  const tabItems = [
    { id: "active", label: "Collaborateurs Actifs", badge: countActifs },
    { id: "all", label: "Tous les Dossiers", badge: salariesList.length },
    { id: "inactive", label: "Inactifs / Sortis", badge: countInactifs },
  ];

  // Colonnes du tableau de bord d'annuaire
  const columns: Column<Salarie>[] = [
    {
      key: "matricule",
      header: "Matricule",
      width: "120px",
      render: (s) => (
        <span className="font-mono text-xs text-[#0D3B2E] font-bold">
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
            <div className="w-8 h-8 rounded-full bg-[#E6F3EE] border border-[#A7F3D0] text-[#0D3B2E] flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <Link
                href={`/salaries/${s.id}`}
                className="font-bold text-[#111827] hover:text-[#0D3B2E] transition-colors"
              >
                {s.nom_prenom}
              </Link>
              <span className="text-xs text-[#71717A]">
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
        <span className="tabular-nums font-semibold text-[#111827]">
          {formatDA(s.salaire_base_theorique)}
        </span>
      ),
    },
    {
      key: "ccp_rib",
      header: "RIB / CNAS",
      render: (s) => (
        <div className="flex flex-col text-xs text-[#71717A]">
          <span className="tabular-nums">
            {s.ccp_rib ? `RIB: ${s.ccp_rib.slice(0, 10)}...` : "RIB manquant"}
          </span>
          <span className="tabular-nums text-[11px] text-[#A1A1AA]">
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
      header: "Actions",
      align: "right",
      sortable: false,
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm">
            <Link href={`/salaries/${s.id}`} className="flex items-center gap-1.5 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>Consulter</span>
            </Link>
          </Button>
          <Button
            variant="danger-outline"
            size="sm"
            onClick={() => handleSupprimer(s)}
            loading={deletingId === s.id}
            title="Supprimer définitivement ce collaborateur"
            className="px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PageHeader */}
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
          <div className="flex items-center border border-[#F0EFEA] rounded-lg p-0.5 bg-white">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#E6F3EE] text-[#0D3B2E]"
                  : "text-[#71717A] hover:text-[#111827]"
              }`}
              title="Vue Tableau"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#E6F3EE] text-[#0D3B2E]"
                  : "text-[#71717A] hover:text-[#111827]"
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
                      <div className="w-11 h-11 rounded-lg bg-[#E6F3EE] border border-[#A7F3D0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/salaries/${s.id}`}
                          className="font-bold text-sm text-[#111827] hover:text-[#0D3B2E] transition-colors truncate"
                        >
                          {s.nom_prenom}
                        </Link>
                        <span className="text-xs text-[#71717A] truncate">
                          {s.fonction || "Fonction non définie"}
                        </span>
                      </div>
                    </div>
                    <Badge variant={s.actif ? "success" : "neutral"} size="sm" dot={s.actif}>
                      {s.actif ? "Actif" : "Sorti"}
                    </Badge>
                  </div>

                  <div className="p-3 bg-[#FAF9F8] border border-[#F0EFEA] rounded-lg flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#71717A]">Matricule :</span>
                      <span className="font-mono font-bold text-[#0D3B2E]">{s.matricule || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#71717A]">Salaire de base :</span>
                      <span className="font-semibold tabular-nums text-[#111827]">
                        {formatDA(s.salaire_base_theorique)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EFEA] text-xs">
                    <Link
                      href={`/saisie?salarieId=${s.id}`}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline"
                    >
                      Calculer la paie
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="danger-outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSupprimer(s);
                        }}
                        loading={deletingId === s.id}
                        title="Supprimer définitivement ce collaborateur"
                        className="px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="secondary" size="sm" href={`/salaries/${s.id}`}>
                        Dossier complet
                      </Button>
                    </div>
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
