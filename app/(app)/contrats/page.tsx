import { listerSalaries, listerTousContrats } from "../salaries/actions";
import ContratsViewClient from "./contrats-view-client";

export const dynamic = "force-dynamic";

export default async function ContratsPage() {
  const [salaries, contrats] = await Promise.all([
    listerSalaries(),
    listerTousContrats(),
  ]);

  return <ContratsViewClient contrats={contrats} salaries={salaries} />;
}
