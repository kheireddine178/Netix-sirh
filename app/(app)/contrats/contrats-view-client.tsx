"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  Trash2,
  ExternalLink,
  Printer,
  Shield,
  FileCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { Salarie, ContratGlobalRow } from "../salaries/actions";
import {
  changerStatutContratGlobal,
  supprimerContratGlobal,
  creerContratSalarie,
} from "../salaries/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { formatDA, formatDateFR } from "@/lib/utils";

export interface ContratsViewClientProps {
  contrats: ContratGlobalRow[];
  salaries: Salarie[];
}

export default function ContratsViewClient({
  contrats,
  salaries,
}: ContratsViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Formulaire nouveau contrat
  const [formSalarieId, setFormSalarieId] = useState<string>(salaries[0]?.id ? String(salaries[0].id) : "");
  const [formType, setFormType] = useState("CDI");
  const [formDebut, setFormDebut] = useState("");
  const [formFin, setFormFin] = useState("");
  const [formEssai, setFormEssai] = useState(0);
  const [formSalaire, setFormSalaire] = useState(salaries[0]?.salaire_base_theorique || 45000);
  const [formStatut, setFormStatut] = useState("En cours");

  // Détection des CDD expirant sous 30 jours
  const today = new Date();
  const alert30Days = new Date();
  alert30Days.setDate(today.getDate() + 30);

  const cddExpirants = contrats.filter((c) => {
    if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
    const fin = new Date(c.date_fin);
    return fin >= today && fin <= alert30Days;
  });

  const totalActifs = contrats.filter((c) => c.statut === "En cours").length;
  const totalEssai = contrats.filter((c) => c.statut === "Période d'essai").length;
  const totalCDI = contrats.filter((c) => c.type_contrat === "CDI").length;

  const handleChangerStatut = (id: number, statut: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await changerStatutContratGlobal(id, statut);
        setMessage({ type: "success", text: `Statut du contrat mis à jour : ${statut}.` });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    });
  };

  const handleSupprimer = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contrat ?")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await supprimerContratGlobal(id);
        setMessage({ type: "success", text: "Contrat supprimé." });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    });
  };

  const handleCreerContrat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalarieId || !formDebut || formSalaire <= 0) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("type_contrat", formType);
    formData.append("date_debut", formDebut);
    formData.append("date_fin", formFin);
    formData.append("periode_essai_mois", String(formEssai));
    formData.append("salaire_base_contrat", String(formSalaire));
    formData.append("statut", formStatut);

    startTransition(async () => {
      try {
        await creerContratSalarie(parseInt(formSalarieId, 10), formData);
        setIsModalOpen(false);
        setMessage({ type: "success", text: "Contrat enregistré avec succès." });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "Erreur lors de la création du contrat." });
      }
    });
  };

  const filteredContrats = contrats.filter((c) => {
    if (filterType === "expirant") {
      if (c.type_contrat !== "CDD" || c.statut !== "En cours" || !c.date_fin) return false;
      const fin = new Date(c.date_fin);
      if (!(fin >= today && fin <= alert30Days)) return false;
    } else if (filterType === "en_cours") {
      if (c.statut !== "En cours") return false;
    } else if (filterType === "essai") {
      if (c.statut !== "Période d'essai") return false;
    } else if (filterType === "cdi") {
      if (c.type_contrat !== "CDI") return false;
    } else if (filterType === "cdd") {
      if (c.type_contrat !== "CDD") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const nom = (c.salaries?.nom_prenom || "").toLowerCase();
      const matricule = (c.salaries?.matricule || "").toLowerCase();
      const typeC = c.type_contrat.toLowerCase();
      if (!nom.includes(q) && !matricule.includes(q) && !typeC.includes(q)) return false;
    }

    return true;
  });

  const FILTER_TABS: TabItem[] = [
    { id: "all", label: "Tous", badge: contrats.length },
    { id: "en_cours", label: "En cours", badge: totalActifs },
    {
      id: "expirant",
      label: "CDD à échéance (<30j)",
      badge: cddExpirants.length > 0 ? cddExpirants.length : undefined,
    },
    { id: "essai", label: "Période d'essai", badge: totalEssai },
    { id: "cdi", label: "CDI", badge: totalCDI },
    { id: "cdd", label: "CDD" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. PageHeader conforme §4.2 */}
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/dashboard" },
          { label: "Équipe", href: "/salaries" },
          { label: "Contrats & Documents RH" },
        ]}
        title="Contrats & Documents RH"
        subtitle="Gestion du cycle de vie des contrats, suivi des échéances CDD et édition des pièces réglementaires"
        primaryAction={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nouveau Contrat
          </Button>
        }
      />

      {/* 2. STATS KPI (StatCard de l'architecture §3.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Contrats en cours"
          value={totalActifs}
          subtext="Contrats actifs dans l'effectif"
          icon={<CheckCircle className="w-5 h-5 text-[#16A34A]" />}
        />
        <StatCard
          label="CDD à échéance (< 30j)"
          value={cddExpirants.length}
          subtext={cddExpirants.length > 0 ? "Action RH requise (renouvellement)" : "Aucune échéance critique"}
          icon={<AlertTriangle className={`w-5 h-5 ${cddExpirants.length > 0 ? "text-[#DC2626]" : "text-[#D97706]"}`} />}
          trend={cddExpirants.length > 0 ? { value: `${cddExpirants.length} alertes`, direction: "up" } : undefined}
        />
        <StatCard
          label="Effectif CDI"
          value={totalCDI}
          subtext="Contrats à durée indéterminée"
          icon={<Briefcase className="w-5 h-5 text-[#4F46E5]" />}
        />
        <StatCard
          label="Période d'essai"
          value={totalEssai}
          subtext="Évaluation en cours"
          icon={<Clock className="w-5 h-5 text-[#64748B]" />}
        />
      </div>

      {/* 3. Bandeau d'alerte CDD (§5.4) */}
      {cddExpirants.length > 0 && filterType !== "expirant" && (
        <div className="p-4 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#92400E]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span className="font-semibold">
              {cddExpirants.length} contrat(s) CDD arrivent à terme dans les 30 prochains jours.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilterType("expirant")}
          >
            Filtrer les échéances urgentes →
          </Button>
        </div>
      )}

      {/* Message de notification */}
      {message && (
        <div
          className={`p-3.5 text-xs font-semibold rounded-lg border ${
            message.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 4. Barre de contrôle (Onglets de filtre + Recherche) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E2E8F0] pb-2">
        <Tabs tabs={FILTER_TABS} activeTab={filterType} onChange={(id) => setFilterType(id)} />

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher salarié, type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
          />
        </div>
      </div>

      {/* 5. TABLEAU DES CONTRATS */}
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase">
            <tr>
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Date Début</th>
              <th className="py-3 px-3">Date Fin / Échéance</th>
              <th className="py-3 px-4 text-right">Salaire Base</th>
              <th className="py-3 px-3 text-center">Statut</th>
              <th className="py-3 px-4 text-right">Actions RH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredContrats.length > 0 ? (
              filteredContrats.map((c) => {
                const isCddExpirant =
                  c.type_contrat === "CDD" &&
                  c.statut === "En cours" &&
                  c.date_fin &&
                  new Date(c.date_fin) >= today &&
                  new Date(c.date_fin) <= alert30Days;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      isCddExpirant ? "bg-[#FFFBEB]/40" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/salaries/${c.salarie_id}`}
                        className="font-bold text-[#0F172A] hover:text-[#4F46E5] flex items-center gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E0E7FF]">
                          {(c.salaries?.nom_prenom || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{c.salaries?.nom_prenom || `Salarié #${c.salarie_id}`}</div>
                          {c.salaries?.fonction && (
                            <span className="text-[11px] font-normal text-[#64748B]">
                              {c.salaries.fonction}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                        {c.type_contrat}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#334155]">{formatDateFR(c.date_debut)}</td>

                    <td className="py-3 px-3">
                      {c.date_fin ? (
                        <div className="flex items-center gap-1.5">
                          <span className={isCddExpirant ? "font-bold text-[#DC2626]" : "text-[#334155]"}>
                            {formatDateFR(c.date_fin)}
                          </span>
                          {isCddExpirant && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                              Échéance
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] italic">Durée indéterminée</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#0F172A]">
                      {formatDA(c.salaire_base_contrat)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          c.statut === "En cours"
                            ? "success"
                            : c.statut === "Période d'essai"
                            ? "info"
                            : "neutral"
                        }
                        size="sm"
                        dot={c.statut === "En cours"}
                      >
                        {c.statut}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button variant="secondary" size="sm">
                          <Link href={`/salaries/${c.salarie_id}`}>Dossier</Link>
                        </Button>

                        {c.statut === "En cours" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleChangerStatut(c.id, "Terminé")}
                          >
                            Clôturer
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleChangerStatut(c.id, "En cours")}
                          >
                            Activer
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleSupprimer(c.id)}
                          className="text-[#94A3B8] hover:text-[#DC2626]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#64748B]">
                  Aucun contrat ne correspond à vos critères de recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. MODÈLES & DOCUMENTS RÉGLEMENTAIRES (§5.4) */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles &amp; Pièces Réglementaires Conformes (Loi 90-11)</CardTitle>
          <CardDescription>
            Édition et génération directe avec en-tête d&apos;entreprise pour chaque collaborateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-1">Attestation de Travail</h4>
                <p className="text-[11px] text-[#64748B] mb-3">
                  Document obligatoire attestant la période d&apos;activité et la qualification.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#4F46E5]">
                Accessible depuis l&apos;onglet « Documents » de chaque fiche →
              </span>
            </div>

            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-1">PV d&apos;Installation</h4>
                <p className="text-[11px] text-[#64748B] mb-3">
                  Acte officiel validant la prise de fonction effective à la date d&apos;embauche.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#4F46E5]">
                Génération en 1 clic dans le dossier du collaborateur →
              </span>
            </div>

            <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-1">Contrat CDI / CDD Type</h4>
                <p className="text-[11px] text-[#64748B] mb-3">
                  Modèle contractuel complet conforme à la convention collective.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#4F46E5]">
                Génération avec clauses d&apos;essai et rémunération →
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. MODAL NOUVEAU CONTRAT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Établir un Nouveau Contrat de Travail"
        description="Enregistrez un contrat initial ou un avenant contractuel pour un collaborateur."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              disabled={isPending}
              onClick={(e) => handleCreerContrat(e as any)}
            >
              {isPending ? "Enregistrement…" : "Enregistrer le contrat"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreerContrat} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold block mb-1 text-[#0F172A]">Collaborateur concerné :</label>
            <select
              value={formSalarieId}
              onChange={(e) => {
                setFormSalarieId(e.target.value);
                const sel = salaries.find((s) => s.id === parseInt(e.target.value, 10));
                if (sel) setFormSalaire(sel.salaire_base_theorique);
              }}
              required
              className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">Type de contrat :</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="CDI">CDI (Durée indéterminée)</option>
                <option value="CDD">CDD (Durée déterminée)</option>
                <option value="CTA">CTA (Insertion)</option>
                <option value="Stage">Convention de Stage</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">Salaire de base (DA) :</label>
              <input
                type="number"
                min={20000}
                value={formSalaire}
                onChange={(e) => setFormSalaire(parseFloat(e.target.value) || 0)}
                required
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">Date de début :</label>
              <input
                type="date"
                value={formDebut}
                onChange={(e) => setFormDebut(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">
                Date de fin {formType === "CDI" ? "(Optionnelle)" : "(Requise)"} :
              </label>
              <input
                type="date"
                value={formFin}
                onChange={(e) => setFormFin(e.target.value)}
                required={formType === "CDD"}
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">Période d&apos;essai (mois) :</label>
              <input
                type="number"
                min="0"
                max="12"
                value={formEssai}
                onChange={(e) => setFormEssai(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#0F172A]">Statut contractuel :</label>
              <select
                value={formStatut}
                onChange={(e) => setFormStatut(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="En cours">En cours</option>
                <option value="Période d'essai">Période d&apos;essai</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

