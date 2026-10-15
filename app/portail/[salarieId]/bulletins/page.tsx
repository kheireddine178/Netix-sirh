import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerBulletinsSalarie } from "../../../(app)/salaries/actions";

import { checkPortalAccess } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ salarieId: string }>;
}

const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default async function Page({ params }: Props) {
  const { salarieId } = await params;
  const id = parseInt(salarieId, 10);
  if (isNaN(id)) notFound();

  // Contrôle d'accès strict
  await checkPortalAccess(id);

  const salarie = await getSalarie(id);
  if (!salarie) notFound();

  const bulletins = await listerBulletinsSalarie(id);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 var(--s4)" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s5)", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
        <div>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--accent)", fontWeight: "bold", textTransform: "uppercase" }}>Mes Bulletins de Paie</span>
          <h1 style={{ fontSize: "var(--txl)", margin: "4px 0" }}>{salarie.nom_prenom}</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/portail/${salarie.id}`} className="btn btn-secondary btn-sm">
            ← Mon Espace
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "var(--s3)" }}>Historique des fiches de paie</h3>
        {bulletins.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun bulletin de paie disponible pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", fontSize: "var(--txs)" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  <th>Période</th>
                  <th>Année</th>
                  <th>Net à payer (DA)</th>
                  <th>Date d'édition</th>
                  <th>Téléchargement</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={{ fontWeight: "bold" }}>{MOIS_NOMS[b.mois - 1]}</td>
                    <td>{b.annee}</td>
                    <td style={{ fontWeight: "bold" }}>
                      {b.net_a_payer.toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ')} DA
                    </td>
                    <td>{b.modifie_le ? new Date(b.modifie_le).toLocaleDateString("fr-FR") : "—"}</td>
                    <td>
                      <a
                        href={`/salaries/${salarie.id}/bulletin/pdf?annee=${b.annee}&mois=${b.mois}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                      >
                        Télécharger le Bulletin (PDF)
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
