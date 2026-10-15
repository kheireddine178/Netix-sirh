import { listerSalaries, listerToutesMissions } from "../salaries/actions";
import MissionsViewClient from "./missions-view-client";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const [salaries, missions] = await Promise.all([
    listerSalaries(),
    listerToutesMissions(),
  ]);

  return <MissionsViewClient missions={missions} salaries={salaries} />;
}
