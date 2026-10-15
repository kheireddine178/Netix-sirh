import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerContratsSalarie, listerDocumentsSalarie } from "../../actions";
import ContratClientPage from "./contrat-client-page";
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

  const contrats = await listerContratsSalarie(salarieId);
  const documents = await listerDocumentsSalarie(salarieId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Contrats & Documents — ${salarie.nom_prenom}`}
        subtitle="Gestion des contrats, avenants et pièces justificatives"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Contrats & Documents" },
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

      <ContratClientPage salarie={salarie} contrats={contrats} documents={documents} />
    </div>
  );
}
