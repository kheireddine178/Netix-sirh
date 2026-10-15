import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerPromotionsSalarie, listerSanctionsSalarie, listerObjectifsSalarie } from "../../actions";
import CarriereClientPage from "./CarriereClientPage";
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

  const [promotions, sanctions, objectifs] = await Promise.all([
    listerPromotionsSalarie(salarieId),
    listerSanctionsSalarie(salarieId),
    listerObjectifsSalarie(salarieId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Carrière & Évolution — ${salarie.nom_prenom}`}
        subtitle="Suivi des promotions, sanctions et objectifs professionnels"
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: salarie.nom_prenom, href: `/salaries/${salarie.id}` },
          { label: "Carrière & Discipline" },
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

      <CarriereClientPage
        salarie={salarie}
        promotions={promotions}
        sanctions={sanctions}
        objectifs={objectifs}
      />
    </div>
  );
}
