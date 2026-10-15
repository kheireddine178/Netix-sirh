import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { creerSalarie } from "../actions";
import SalarieWizardForm from "../salarie-wizard-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function NouveauSalariePage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/dashboard" },
          { label: "Collaborateurs", href: "/salaries" },
          { label: "Nouveau collaborateur" },
        ]}
        title="Assistant de Création de Collaborateur"
        subtitle="Enregistrement d'un nouveau salarié avec validation des pièces administratives et conformité au SNMG (Loi 90-11)."
        secondaryActions={
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            <Link href="/salaries">Retour à l&apos;annuaire</Link>
          </Button>
        }
      />

      <SalarieWizardForm actionSubmit={creerSalarie} />
    </div>
  );
}
