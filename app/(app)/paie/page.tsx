import React from "react";
import CockpitClient from "./cockpit-client";
import { chargerDonneesCockpit } from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    annee?: string;
    mois?: string;
  }>;
}

export default async function PaieCockpitPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const annee = params.annee ? parseInt(params.annee, 10) : now.getFullYear();
  const mois = params.mois ? parseInt(params.mois, 10) : now.getMonth() + 1;

  const data = await chargerDonneesCockpit(annee, mois);

  return (
    <div className="w-full">
      <CockpitClient
        initialSalaries={data.salaries}
        initialVariables={data.initialVariables}
        catalogue={data.catalogue}
        annee={data.annee}
        mois={data.mois}
      />
    </div>
  );
}
