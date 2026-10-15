import {
  listerSalaries,
  listerCatalogueFormations,
  listerToutesInscriptionsGlobal,
} from "../salaries/actions";
import FormationsViewClient from "./formations-view-client";

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  const [salaries, catalogue, inscriptions] = await Promise.all([
    listerSalaries(),
    listerCatalogueFormations(),
    listerToutesInscriptionsGlobal(),
  ]);

  return (
    <FormationsViewClient
      salaries={salaries}
      catalogue={catalogue}
      inscriptions={inscriptions}
    />
  );
}
