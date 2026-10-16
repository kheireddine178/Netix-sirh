import React from "react";
import { chargerDonneesCockpit } from "../(app)/paie/actions";
import DocumentViewerClient from "./document-viewer-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    id?: string;
    annee?: string;
    mois?: string;
    type?: string;
  }>;
}

export default async function DocumentPaiePage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const annee = params.annee ? parseInt(params.annee, 10) : now.getFullYear();
  const mois = params.mois ? parseInt(params.mois, 10) : now.getMonth() + 1;
  const salarieId = params.id ? parseInt(params.id, 10) : 1;
  const initialType = (params.type as any) || "bulletin";

  const data = await chargerDonneesCockpit(annee, mois);

  return (
    <DocumentViewerClient
      initialSalaries={data.salaries}
      initialVariables={data.initialVariables}
      annee={annee}
      mois={mois}
      initialSalarieId={salarieId}
      initialType={initialType}
    />
  );
}
