import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerMissionsSalarie } from "../../actions";
import MissionsClientPage from "./MissionsClientPage";
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

  const missions = await listerMissionsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Missions & Déplacements — ${salarie.nom_prenom}`}
        subtitle="Ordres de mission, frais professionnels et indemnités kilométriques"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Missions & Déplacements" },
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

      <MissionsClientPage salarie={salarie} missions={missions} />
    </div>
  );
}
