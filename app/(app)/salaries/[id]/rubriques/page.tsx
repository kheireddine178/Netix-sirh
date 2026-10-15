import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCatalogueRubriques, listerRubriquesSalarie } from "../../actions";
import RubriquesForm from "./RubriquesForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function RubriquesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(parseInt(id, 10));
  if (!salarie) notFound();

  const [catalogue, assignees] = await Promise.all([
    listerCatalogueRubriques(),
    listerRubriquesSalarie(salarie.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Rubriques personnalisées — ${salarie.nom_prenom}`}
        subtitle="Attribution et configuration des primes et retenues spécifiques"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Rubriques du salarié" },
        ]}
        primaryAction={
          <Button variant="primary" href={`/saisie?salarieId=${salarie.id}`}>
            Calculer la paie
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" href={`/salaries/${salarie.id}`}>← Fiche Salarié</Button>
            <Button variant="secondary" href="/rubriques">Catalogue général</Button>
          </div>
        }
      />

      <RubriquesForm salarieId={salarie.id} catalogue={catalogue} assignees={assignees} />
    </div>
  );
}
