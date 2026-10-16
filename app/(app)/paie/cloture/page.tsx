import React from "react";
import ClotureWizard from "./cloture-wizard";
import { listerSalaries } from "../../salaries/actions";
import { getPeriodeStatut } from "./actions";
import { chargerDonneesSpreadsheet } from "../actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ annee?: string; mois?: string }>;
}

export default async function CloturePage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();

  const defaultMois =
    now.getDate() < 15
      ? now.getMonth() === 0
        ? 12
        : now.getMonth()
      : now.getMonth() + 1;
  const defaultAnnee =
    now.getDate() < 15 && now.getMonth() === 0
      ? now.getFullYear() - 1
      : now.getFullYear();

  const selectedAnnee = params.annee ? parseInt(params.annee, 10) : defaultAnnee;
  const selectedMois = params.mois ? parseInt(params.mois, 10) : defaultMois;

  const [salaries, { rows: spreadsheetRows }, statutPeriode] = await Promise.all([
    listerSalaries(),
    chargerDonneesSpreadsheet(selectedAnnee, selectedMois),
    getPeriodeStatut(selectedAnnee, selectedMois),
  ]);

  const activeSalaries = salaries.filter((s) => s.actif !== false);

  return (
    <div className="w-full">
      <ClotureWizard
        annee={selectedAnnee}
        mois={selectedMois}
        salaries={activeSalaries}
        initialRows={spreadsheetRows}
        statutPeriode={statutPeriode}
      />
    </div>
  );
}
