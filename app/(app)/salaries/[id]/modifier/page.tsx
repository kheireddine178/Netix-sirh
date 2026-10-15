import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, modifierSalarie } from "../../actions";
import SalarieForm from "../../salarie-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ModifierSalariePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salarie = await getSalarie(Number(id));

  if (!salarie) notFound();

  const modifierAvecId = modifierSalarie.bind(null, salarie.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Modifier le collaborateur — ${salarie.nom_prenom}`}
        subtitle="Mise à jour des coordonnées et paramètres contractuels"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Modifier la fiche" },
        ]}
        secondaryActions={
          <Button variant="secondary" href={`/salaries/${salarie.id}`}>
            Annuler et voir la fiche
          </Button>
        }
      />

      <SalarieForm
        initialData={{
          id: salarie.id,
          nom_prenom: salarie.nom_prenom,
          matricule: salarie.matricule,
          fonction: salarie.fonction,
          salaire_base_theorique: salarie.salaire_base_theorique,
          date_visite_medicale: salarie.date_visite_medicale,
          ccp_rib: salarie.ccp_rib,
        }}
        actionSubmit={modifierAvecId}
        buttonText="Enregistrer les modifications"
      />
    </div>
  );
}
