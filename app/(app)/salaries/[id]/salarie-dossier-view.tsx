"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  FileText,
  Wallet,
  Calendar,
  FolderOpen,
  TrendingUp,
  History,
  Download,
  Plus,
  Eye,
  Edit3,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  Shield,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDA, formatDateFR } from "@/lib/utils";
import type {
  Salarie,
  ContratRow,
  CongeRow,
  InscriptionRow,
  PromotionRow,
  SanctionRow,
  DocumentSalarieRow,
} from "../actions";

interface SalarieDossierViewProps {
  salarie: Salarie;
  contrats: ContratRow[];
  conges: CongeRow[];
  inscriptions: InscriptionRow[];
  bulletins: any[];
  promotions: PromotionRow[];
  sanctions: SanctionRow[];
  documents: DocumentSalarieRow[];
}

export default function SalarieDossierView({
  salarie,
  contrats,
  conges,
  inscriptions,
  bulletins,
  promotions,
  sanctions,
  documents,
}: SalarieDossierViewProps) {
  const [activeTab, setActiveTab] = useState("identite");

  const initials = salarie.nom_prenom
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "N";

  const contratActif = contrats.find((c) => c.statut === "En cours") || contrats[0] || null;

  // Calcul des congés
  const congesPris = conges
    .filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé")
    .reduce((sum, c) => sum + (c.jours_ouvrables || 0), 0);

  const congesAcquisEstime = 30; // 30 jours annuels loi 90-11
  const reliquatConges = Math.max(0, congesAcquisEstime - congesPris);

  const DOSSIER_TABS: TabItem[] = [
    { id: "identite", label: "1. Identité", icon: <User className="w-3.5 h-3.5" /> },
    { id: "poste", label: "2. Poste & Service", icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: "contrat", label: "3. Contrat", badge: contrats.length, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "remuneration", label: "4. Rémunération", icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: "conges", label: "5. Congés", badge: `${reliquatConges}j`, icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: "documents", label: "6. Documents RH", badge: documents.length, icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: "carriere", label: "7. Carrière", badge: promotions.length + sanctions.length, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "historique", label: "8. Historique Paie", badge: bulletins.length, icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PageHeader conforme §4.2 */}
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/dashboard" },
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom },
        ]}
        title={salarie.nom_prenom}
        subtitle={`Dossier collaborateur unique • Matricule : ${salarie.matricule || "Non renseigné"}`}
        primaryAction={
          <Button
            variant="primary"
            href={`/saisie?salarieId=${salarie.id}`}
            icon={<Wallet className="w-4 h-4 text-white" />}
          >
            Saisir la Paie du Mois
          </Button>
        }
        secondaryActions={
          <>
            <Button variant="secondary" href="/salaries" icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button variant="secondary" href={`/salaries/${salarie.id}/modifier`} icon={<Edit3 className="w-4 h-4" />}>
              Modifier
            </Button>
          </>
        }
      >
        {/* Barre d'identité synthétique */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#0F172A]">{salarie.nom_prenom}</span>
                <Badge variant={salarie.actif ? "success" : "neutral"} size="sm" dot={salarie.actif}>
                  {salarie.actif ? "En poste" : "Inactif"}
                </Badge>
              </div>
              <span className="text-xs text-[#64748B]">
                {salarie.fonction || "Fonction non définie"} • Régime Général CNAS 9%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F1F5F9]">
            <div>
              <span className="text-[#64748B] block text-[11px]">Salaire de base :</span>
              <strong className="text-[#0F172A] tabular-nums font-semibold">
                {formatDA(salarie.salaire_base_theorique)}
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Type de contrat :</span>
              <strong className="text-[#4F46E5] font-semibold">
                {contratActif ? contratActif.type_contrat : "Aucun contrat"}
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Solde congés :</span>
              <strong className="text-[#16A34A] font-semibold tabular-nums">
                {reliquatConges} jours
              </strong>
            </div>
          </div>
        </div>

        {/* 8 Onglets du dossier */}
        <div className="mt-4">
          <Tabs tabs={DOSSIER_TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
        </div>
      </PageHeader>

      {/* CONTENU SELON ONGLET ACTIF */}

      {/* ONGLET 1 : IDENTITÉ */}
      {activeTab === "identite" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>État Civil &amp; Coordonnées</CardTitle>
              <CardDescription>Informations administratives d&apos;état civil.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Nom et Prénom :</span>
                <span className="font-semibold text-[#0F172A]">{salarie.nom_prenom}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Matricule interne :</span>
                <span className="font-mono font-bold text-[#4F46E5]">{salarie.matricule || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Numéro Sécurité Sociale (CNAS) :</span>
                <span className="font-mono text-[#0F172A]">
                  {salarie.numero_securite_sociale || "12 chiffres (Non renseigné)"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Visite médicale d&apos;embauche :</span>
                <span className="font-semibold text-[#0F172A]">
                  {salarie.date_visite_medicale ? formatDateFR(salarie.date_visite_medicale) : "À planifier"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Situation Familiale &amp; Fiscalité</CardTitle>
              <CardDescription>Données prises en compte pour le barème IRG 2024.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Statut matrimonial :</span>
                <span className="font-semibold text-[#0F172A]">Célibataire</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Enfants à charge déclarés :</span>
                <span className="font-bold text-[#0F172A] tabular-nums">0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Abattement IRG applicable :</span>
                <span className="text-[#16A34A] font-semibold">Standard 40% (min 1 000 DA, max 1 500 DA)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ONGLET 2 : POSTE & SERVICE */}
      {activeTab === "poste" && (
        <Card>
          <CardHeader>
            <CardTitle>Affectation Professionnelle</CardTitle>
            <CardDescription>Attribution du poste et rattachement organisationnel.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Intitulé de poste :</span>
                <span className="font-bold text-[#0F172A]">{salarie.fonction || "Non défini"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Département :</span>
                <span className="font-semibold text-[#0F172A]">Direction des Opérations</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Catégorie socio-professionnelle :</span>
                <span className="font-semibold text-[#0F172A]">Cadre / Maîtrise</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Durée hebdomadaire de travail :</span>
                <span className="font-semibold text-[#0F172A] tabular-nums">40h / semaine (173.33h/mois)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ONGLET 3 : CONTRAT */}
      {activeTab === "contrat" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A]">Historique des Contrats</h3>
            <Button
              variant="primary"
              size="sm"
              href={`/contrats?nouveau=true&salarie=${salarie.id}`}
              icon={<Plus className="w-3.5 h-3.5 text-white" />}
            >
              Ajouter un Avenant / Contrat
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Date Début</th>
                  <th className="py-2.5 px-3">Date Fin</th>
                  <th className="py-2.5 px-3">Période Essai</th>
                  <th className="py-2.5 px-3 text-right">Salaire Base</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {contrats.length > 0 ? (
                  contrats.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-bold text-[#4F46E5]">{c.type_contrat}</td>
                      <td className="py-3 px-3">{formatDateFR(c.date_debut)}</td>
                      <td className="py-3 px-3">{c.date_fin ? formatDateFR(c.date_fin) : "Indéterminée"}</td>
                      <td className="py-3 px-3">{c.periode_essai_mois ? `${c.periode_essai_mois} mois` : "—"}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {formatDA(c.salaire_base_contrat)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={c.statut === "En cours" ? "success" : "neutral"} size="sm">
                          {c.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#64748B]">
                      Aucun contrat enregistré pour ce collaborateur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET 4 : RÉMUNÉRATION */}
      {activeTab === "remuneration" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Composantes Fixes de Rémunération</CardTitle>
              <CardDescription>Salaire de base et indemnités contractuelles.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Salaire de base théorique :</span>
                <span className="font-bold text-sm text-[#0F172A] tabular-nums">
                  {formatDA(salarie.salaire_base_theorique)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Indemnité d&apos;Expérience (IEP) :</span>
                <span className="font-semibold text-[#0F172A] tabular-nums">Selon ancienneté</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Primes fixes configurées :</span>
                <Link href={`/salaries/${salarie.id}/rubriques`} className="text-[#4F46E5] font-semibold hover:underline">
                  Gérer les rubriques catalogue →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées Bancaires (Virements)</CardTitle>
              <CardDescription>Pour l&apos;émission automatique de l&apos;ordre de virement.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Compte RIB / CCP :</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {salarie.ccp_rib || "Non renseigné"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Mode de règlement :</span>
                <span className="font-semibold text-[#0F172A]">Virement bancaire</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ONGLET 5 : CONGÉS */}
      {activeTab === "conges" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-[#64748B] block">Droits Acquis (Loi 90-11)</span>
                <strong className="text-xl font-bold text-[#0F172A] tabular-nums">{congesAcquisEstime} jours</strong>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-[#64748B] block">Jours Pris</span>
                <strong className="text-xl font-bold text-[#D97706] tabular-nums">{congesPris} jours</strong>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-[#64748B] block">Reliquat Disponible</span>
                <strong className="text-xl font-bold text-[#16A34A] tabular-nums">{reliquatConges} jours</strong>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Type de Congé</th>
                  <th className="py-2.5 px-3">Date Début</th>
                  <th className="py-2.5 px-3">Date Fin</th>
                  <th className="py-2.5 px-3">Jours Ouvrables</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {conges.length > 0 ? (
                  conges.map((cg) => (
                    <tr key={cg.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-semibold text-[#0F172A]">{cg.type_conge}</td>
                      <td className="py-3 px-3">{formatDateFR(cg.date_debut)}</td>
                      <td className="py-3 px-3">{formatDateFR(cg.date_fin)}</td>
                      <td className="py-3 px-3 tabular-nums font-semibold">{cg.jours_ouvrables} j</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={cg.statut === "Approuvé" ? "success" : "warning"} size="sm">
                          {cg.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#64748B]">
                      Aucune demande de congé enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET 6 : DOCUMENTS RH (§5.4) */}
      {activeTab === "documents" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A]">Génération &amp; Modèles de Documents Officiels</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-1">Attestation de Travail</h4>
                  <p className="text-[11px] text-[#64748B] mb-3">Conforme législation algérienne avec en-tête société.</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
                  <Link href={`/salaries/${salarie.id}/contrat`}>Générer PDF</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-1">Procès-Verbal d&apos;Installation</h4>
                  <p className="text-[11px] text-[#64748B] mb-3">Signature d&apos;embauche et prise effective de fonction.</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
                  <Link href={`/salaries/${salarie.id}/contrat`}>Générer PV</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-1">Contrat de Travail (Modèle CDI/CDD)</h4>
                  <p className="text-[11px] text-[#64748B] mb-3">Modèle pré-rempli avec salaire et période d&apos;essai.</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
                  <Link href={`/salaries/${salarie.id}/contrat`}>Générer Contrat</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ONGLET 7 : CARRIÈRE & DISCIPLINE (§5.7) */}
      {activeTab === "carriere" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promotions */}
            <Card>
              <CardHeader>
                <CardTitle>Évolutions de Poste &amp; Salaires</CardTitle>
                <CardDescription>Historique des avancements et revalorisations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                {promotions.length > 0 ? (
                  promotions.map((p) => (
                    <div key={p.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[#0F172A]">
                        <span>{p.nouveau_poste}</span>
                        <span className="tabular-nums text-[#4F46E5]">{formatDA(p.salaire_base_nouveau)}</span>
                      </div>
                      <span className="text-[#64748B]">Date d&apos;effet : {formatDateFR(p.date_effet)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#64748B]">Aucun changement de poste ou promotion enregistré.</p>
                )}
              </CardContent>
            </Card>

            {/* Discipline */}
            <Card>
              <CardHeader>
                <CardTitle>Suivi Disciplinaire (Loi 90-11)</CardTitle>
                <CardDescription>Avertissements, blâmes et sanctions tracées.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                {sanctions.length > 0 ? (
                  sanctions.map((s) => (
                    <div key={s.id} className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[#DC2626]">
                        <span>{s.type_sanction}</span>
                        <span>{formatDateFR(s.date_sanction)}</span>
                      </div>
                      <p className="text-[#334155]">{s.motif}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-[#16A34A] py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dossier disciplinaire vierge de toute sanction.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ONGLET 8 : HISTORIQUE DE PAIE */}
      {activeTab === "historique" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A]">Bulletins de Paie Émis</h3>
            <span className="text-xs text-[#64748B]">{bulletins.length} bulletin(s) archivé(s)</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Période</th>
                  <th className="py-2.5 px-3 text-right">Salaire Brut</th>
                  <th className="py-2.5 px-3 text-right">Retenue CNAS (9%)</th>
                  <th className="py-2.5 px-3 text-right">Net à Payer</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {bulletins.length > 0 ? (
                  bulletins.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-bold text-[#0F172A]">
                        {b.mois.toString().padStart(2, "0")}/{b.annee}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatDA(b.total_gains || b.salaire_base_theorique)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatDA(b.retenue_ss || b.retenue_cnas || (b.salaire_base_theorique * 0.09))}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-[#4F46E5]">
                        {formatDA(b.net_a_payer || b.total_net)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={b.statut === "Clôturé" ? "success" : "neutral"} size="sm">
                          {b.statut || "Brouillon"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
                          <Link href={`/salaries/${salarie.id}/bulletin/pdf?annee=${b.annee}&mois=${b.mois}`}>
                            PDF
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#64748B]">
                      Aucun bulletin archivé pour ce collaborateur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
