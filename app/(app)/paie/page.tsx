import React from "react";
import SpreadsheetClient from "./spreadsheet-client";
import { chargerDonneesSpreadsheet } from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    annee?: string;
    mois?: string;
  }>;
}

export default async function PaieSpreadsheetPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const annee = params.annee ? parseInt(params.annee, 10) : now.getFullYear();
  const mois = params.mois ? parseInt(params.mois, 10) : now.getMonth() + 1;

  const { rows } = await chargerDonneesSpreadsheet(annee, mois);

  return (
    <div className="w-full">
      <SpreadsheetClient initialRows={rows} annee={annee} mois={mois} />
    </div>
  );
}
