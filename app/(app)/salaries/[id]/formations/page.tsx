import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCatalogueFormations, listerInscriptionsSalarie } from "../../actions";
import FormationsClientPage from "./FormationsClientPage";
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

  const catalogue = await listerCatalogueFormations();
  const inscriptions = await listerInscriptionsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Formations & Compétences — ${salarie.nom_prenom}`}
        subtitle="Inscriptions aux formations et développement des compétences"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Formations & Talent" },
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

      <FormationsClientPage
        salarie={salarie}
        catalogue={catalogue}
        inscriptions={inscriptions}
      />
    </div>
  );
}
