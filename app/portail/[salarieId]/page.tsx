import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSalarie,
  listerContratsSalarie,
  listerCongesSalarie,
  listerInscriptionsSalarie,
  listerBulletinsSalarie,
} from "../../(app)/salaries/actions";

import { checkPortalAccess } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ salarieId: string }>;
}

export default async function PortailDashboard({ params }: Props) {
  const { salarieId } = await params;
  const id = parseInt(salarieId, 10);
  if (isNaN(id)) notFound();

  // Contrôle d'accès strict (bloque les salariés tentant de consulter un autre matricule)
  const { profile } = await checkPortalAccess(id);

  const salarie = await getSalarie(id);
  if (!salarie) notFound();

  const [contrats, conges, inscriptions, bulletins] = await Promise.all([
    listerContratsSalarie(id),
    listerCongesSalarie(id),
    listerInscriptionsSalarie(id),
    listerBulletinsSalarie(id),
  ]);

  const contratActif = contrats.find((c) => c.statut === "En cours") || contrats[0] || null;
  const dernierBulletin = bulletins[0] || null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* En-tête Espace Salarié */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-[#E2E8F0]">
        <div>
          <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider block mb-1">
            Espace Collaborateur
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Bonjour, {salarie.nom_prenom}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {salarie.fonction || "Collaborateur"} · Matricule <span className="font-mono font-medium text-[#0F172A]">{salarie.matricule || "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.role !== "Salarie" && (
            <Link
              href="/portail"
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#334155] shadow-2xs transition-colors"
            >
              Changer de Salarié
            </Link>
          )}
          {["Directeur", "Responsable RH", "Gestionnaire RH"].includes(profile.role) && (
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-bold text-white shadow-xs transition-colors"
            >
              Panneau RH Admin →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Gauche : Actions rapides & Contrat */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs text-center">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 text-left uppercase tracking-wider">
              Actions Rapides
            </h3>
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/portail/${salarie.id}/conges`}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold transition-colors shadow-2xs"
              >
                Mes Congés &amp; Absences
              </Link>
              <Link
                href={`/portail/${salarie.id}/bulletins`}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#4F46E5] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition-colors"
              >
                Mes Bulletins de Paie
              </Link>
              <Link
                href={`/portail/${salarie.id}/avances`}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#4F46E5] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition-colors"
              >
                Mes Avances sur Salaire
              </Link>
            </div>
          </div>

          {/* Fiche contrat */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 uppercase tracking-wider">
              Mon Contrat
            </h3>
            {contratActif ? (
              <div className="text-sm flex flex-col gap-2.5 text-[#334155]">
                <div className="flex justify-between items-center py-1 border-b border-[#F1F5F9]">
                  <span className="text-xs text-[#64748B]">Type de contrat</span>
                  <span className="font-semibold text-[#0F172A]">{contratActif.type_contrat}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#F1F5F9]">
                  <span className="text-xs text-[#64748B]">Date de début</span>
                  <span className="font-mono text-xs text-[#0F172A]">{contratActif.date_debut.split("-").reverse().join("/")}</span>
                </div>
                {contratActif.date_fin && (
                  <div className="flex justify-between items-center py-1 border-b border-[#F1F5F9]">
                    <span className="text-xs text-[#64748B]">Date de fin</span>
                    <span className="font-mono text-xs text-[#0F172A]">{contratActif.date_fin.split("-").reverse().join("/")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-[#F1F5F9]">
                  <span className="text-xs text-[#64748B]">Statut</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    {contratActif.statut}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-[#64748B]">Salaire de base</span>
                  <span className="font-mono font-bold text-sm text-[#0F172A]">
                    {contratActif.salaire_base_contrat.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} DA
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">Aucun contrat actif enregistré.</p>
            )}
          </div>
        </div>

        {/* Colonne Droite : Formations & Congés récents */}
        <div className="md:col-span-2 space-y-6">
          {/* Dernières formations */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 uppercase tracking-wider">
              Mes Formations
            </h3>
            {inscriptions.length === 0 ? (
              <p className="text-xs text-[#64748B]">Aucune formation programmée pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {inscriptions.slice(0, 3).map((i) => (
                  <div
                    key={i.id}
                    className="flex justify-between items-center bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg"
                  >
                    <div>
                      <strong className="text-sm font-semibold text-[#0F172A] block">{i.formations?.titre}</strong>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        {i.formations?.organisme} · Début : {i.date_debut.split("-").reverse().join("/")}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                      {i.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Derniers congés */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 uppercase tracking-wider">
              Mes Derniers Congés
            </h3>
            {conges.length === 0 ? (
              <p className="text-xs text-[#64748B]">Aucune demande de congé enregistrée.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {conges.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg"
                  >
                    <div>
                      <strong className="text-sm font-semibold text-[#0F172A] block">Congé {c.type_conge}</strong>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        Du {c.date_debut.split("-").reverse().join("/")} au {c.date_fin.split("-").reverse().join("/")} ({c.jours_ouvrables} jours)
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        c.statut === "Approuvé"
                          ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                          : c.statut === "Rejeté"
                          ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                          : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                      }`}
                    >
                      {c.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
