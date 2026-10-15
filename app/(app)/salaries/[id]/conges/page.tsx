import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCongesSalarie, listerContratsSalarie } from "../../actions";
import CongesClientPage from "./CongesClientPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  if (isNaN(salarieId)) notFound();

  const salarie = await getSalarie(salarieId);
  if (!salarie) notFound();

  const conges = await listerCongesSalarie(salarieId);
  const contrats = await listerContratsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Congés & Absences — ${salarie.nom_prenom}`}
        subtitle="Solde de congés, historique des absences et demandes"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Congés & Absences" },
        ]}
        primaryAction={
          <Button variant="primary" href={`/saisie?salarieId=${salarie.id}`}>
            Calculer la paie
          </Button>
        }
        secondaryActions={
          <Button variant="secondary" href={`/salaries/${salarie.id}`}>
            ← Fiche Salarié
          </Button>
        }
      />

      <CongesClientPage salarie={salarie} conges={conges} contrats={contrats} />
    </div>
  );
}
