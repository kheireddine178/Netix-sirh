import {
  Users,
  Wallet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { listerSalaries, listerTousContrats } from "../salaries/actions";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDA, formatDateFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [salaries, contrats] = await Promise.all([
    listerSalaries(),
    listerTousContrats(),
  ]);

  const totalCollaborateurs = salaries.length;
  const actifs = salaries.filter((s) => s.actif).length;
  const inactifs = totalCollaborateurs - actifs;

  // Masse salariale : somme des salaires de base des collaborateurs actifs
  const masseSalarialeBrute = salaries
    .filter((s) => s.actif)
    .reduce((acc, s) => acc + (s.salaire_base_theorique || 0), 0);

  // Estimation du net à payer (brut après retenues)
  const netAPayerTotal = Math.round(masseSalarialeBrute * 0.78);

  const contratsEnCours = contrats.filter((c) => c.statut === "En cours");

  // --- DÉTECTION DES ALERTES RH ---
  interface AlerteItem {
    id: string;
    titre: string;
    salarieNom: string;
    salarieId: number;
    echeanceOuStatut: string;
    urgence: "danger" | "warning" | "neutral";
    actionLabel: string;
    actionHref: string;
  }

  const alertes: AlerteItem[] = [];
  const now = new Date();
  const dans30Jours = new Date();
  dans30Jours.setDate(now.getDate() + 30);

  // 1. Collaborateurs actifs sans contrat
  salaries.forEach((s) => {
    if (s.actif) {
      const aContrat = contrats.some(
        (c) => c.salarie_id === s.id && c.statut === "En cours"
      );
      if (!aContrat) {
        alertes.push({
          id: `no-contract-${s.id}`,
          titre: "Collaborateur sans contrat",
          salarieNom: s.nom_prenom,
          salarieId: s.id,
          echeanceOuStatut: "À régulariser",
          urgence: "danger",
          actionLabel: "Créer un contrat",
          actionHref: `/contrats?nouveau=true&salarie=${s.id}`,
        });
      }
    }
  });

  // 2. Fins de CDD sous 30 jours
  contrats.forEach((c) => {
    if (c.type_contrat === "CDD" && c.statut === "En cours" && c.date_fin) {
      const dFin = new Date(c.date_fin);
      if (dFin >= now && dFin <= dans30Jours) {
        const joursRestants = Math.ceil(
          (dFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const urgence =
          joursRestants <= 7 ? "danger" : joursRestants <= 15 ? "warning" : "neutral";
        alertes.push({
          id: `cdd-${c.id}`,
          titre: `Fin de CDD dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}`,
          salarieNom: c.salaries?.nom_prenom || `Salarié #${c.salarie_id}`,
          salarieId: c.salarie_id,
          echeanceOuStatut: formatDateFR(c.date_fin),
          urgence,
          actionLabel: "Renouveler / Clôturer",
          actionHref: `/contrats?focus=${c.id}`,
        });
      }
    }
  });

  // 3. Dossiers incomplets (CCP / RIB manquant)
  salaries.forEach((s) => {
    if (s.actif && !s.ccp_rib) {
      alertes.push({
        id: `dossier-${s.id}`,
        titre: "Dossier incomplet (CCP / RIB manquant)",
        salarieNom: s.nom_prenom,
        salarieId: s.id,
        echeanceOuStatut: "À compléter",
        urgence: "warning",
        actionLabel: "Compléter le dossier",
        actionHref: `/salaries/${s.id}/modifier`,
      });
    }
  });

  const aDanger = alertes.some((a) => a.urgence === "danger");

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeader
        breadcrumbs={[{ label: "Accueil", href: "/dashboard" }]}
        title="Tableau de bord"
        subtitle="Vue d'ensemble de vos effectifs, de la masse salariale et des échéances à venir."
        primaryAction={
          <Button
            variant="primary"
            href="/saisie"
            icon={<Wallet className="w-4 h-4 text-white" />}
          >
            Saisie de paie
          </Button>
        }
        secondaryActions={
          <Button
            variant="secondary"
            href="/salaries/nouveau"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Nouveau salarié
          </Button>
        }
      />

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Effectif actif"
          value={actifs}
          subtext={`Sur ${totalCollaborateurs} enregistrés`}
          icon={<Users className="w-4 h-4" />}
          badge={{
            text:
              inactifs > 0
                ? `${inactifs} inactif${inactifs > 1 ? "s" : ""}`
                : "À jour",
            variant: inactifs > 0 ? "warning" : "success",
          }}
        />

        <StatCard
          label="Masse salariale brute"
          value={formatDA(masseSalarialeBrute)}
          subtext="Base mensuelle"
          icon={<Wallet className="w-4 h-4" />}
        />

        <StatCard
          label="Net à payer estimé"
          value={formatDA(netAPayerTotal)}
          subtext="Estimation"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />

        <StatCard
          label="Contrats en cours"
          value={contratsEnCours.length}
          subtext="Collaborateurs sous contrat"
          icon={<FileText className="w-4 h-4" />}
        />
      </div>

      {/* Alertes & échéances */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Alertes &amp; échéances ({alertes.length})
            </h2>
            {alertes.length > 0 && (
              <Badge variant={aDanger ? "danger" : "warning"} size="sm" dot>
                {aDanger ? "Action requise" : "À surveiller"}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400">Classé par criticité</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {alertes.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {alertes.map((alerte) => (
                <div
                  key={alerte.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        alerte.urgence === "danger"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {alerte.titre}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {alerte.salarieNom}
                        </span>
                        <span>•</span>
                        <span>{alerte.echeanceOuStatut}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <Button variant="secondary" size="sm" href={alerte.actionHref}>
                      {alerte.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <span className="text-sm font-bold text-slate-900">
                Aucune alerte en attente
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Tout est à jour.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
