import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerBulletinsSalarie } from "../../actions";
import BulletinRowActions from "./BulletinRowActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default async function HistoriquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  const salarie = await getSalarie(salarieId);

  if (!salarie) notFound();

  const bulletins = await listerBulletinsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Historique des bulletins — ${salarie.nom_prenom}`}
        subtitle="Consultation et réédition des bulletins de paie calculés"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Historique des bulletins" },
        ]}
        primaryAction={
          <Button variant="primary" href={`/saisie?salarieId=${salarie.id}`}>
            Calculer la paie
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" href={`/salaries/${salarie.id}`}>← Fiche Salarié</Button>
            <Button variant="secondary" href="/historique">Journal global</Button>
          </div>
        }
      />

      {bulletins.length === 0 ? (
        <div
          className="p-12 text-center rounded-lg border border-dashed text-muted-foreground"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          Aucun bulletin enregistré pour l&apos;instant.{" "}
          <Link href={`/saisie?salarieId=${salarie.id}`} className="font-semibold text-indigo-600 hover:underline">
            Calculer un premier bulletin
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Période</th>
                <th>Net à payer</th>
                <th>Dernière modification</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>
                      {NOMS_MOIS[b.mois - 1]} {b.annee}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {b.net_a_payer.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
                    {new Date(b.modifie_le).toLocaleString("fr-FR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <BulletinRowActions bulletinId={b.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
