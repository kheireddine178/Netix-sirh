import {
  listerSalaries,
  listerCongesSalarie,
  listerTousLesConges,
  listerContratsSalarie,
} from "../salaries/actions";
import CongesViewClient from "./conges-view-client";

export const dynamic = "force-dynamic";

export default async function CongesPage() {
  const [salaries, allConges] = await Promise.all([
    listerSalaries(),
    listerTousLesConges(),
  ]);

  // Compute leave stats per employee
  const stats = await Promise.all(
    salaries.map(async (s) => {
      const [conges, contrats] = await Promise.all([
        listerCongesSalarie(s.id),
        listerContratsSalarie(s.id),
      ]);

      const pris = conges
        .filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé")
        .reduce((sum, c) => sum + c.jours_ouvrables, 0);

      const enAttente = conges.filter(
        (c) => c.statut === "En attente" || c.statut === "En attente validation RH"
      ).length;

      // Calcul des congés acquis (2.5 jours par mois)
      const dateDebut =
        contrats.length > 0
          ? new Date(Math.min(...contrats.map((c) => new Date(c.date_debut).getTime())))
          : new Date();
      const diffMonths = (new Date().getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const acquis = Math.max(0, Math.floor(diffMonths * 2.5 * 2) / 2);
      const reliquat = Math.max(0, acquis - pris);

      return { salarieId: s.id, pris, enAttente, reliquat };
    })
  );

  const statsSalarie = Object.fromEntries(stats.map((s) => [s.salarieId, s]));

  return (
    <CongesViewClient
      conges={allConges}
      salaries={salaries}
      statsSalarie={statsSalarie}
    />
  );
}
