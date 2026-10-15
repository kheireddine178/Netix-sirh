import { listerSalaries, listerCatalogueRubriques } from "../salaries/actions";
import CatalogueViewClient from "./catalogue-view-client";

export const dynamic = "force-dynamic";

export default async function RubriquesPage() {
  const [salaries, catalogue] = await Promise.all([
    listerSalaries(),
    listerCatalogueRubriques(),
  ]);

  return <CatalogueViewClient catalogue={catalogue} salaries={salaries} />;
}
