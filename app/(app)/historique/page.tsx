import { listerSalaries, listerTousLesBulletinsGlobal } from "../salaries/actions";
import JournalBulletinsClient from "./journal-bulletins-client";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const [salaries, bulletins] = await Promise.all([
    listerSalaries(),
    listerTousLesBulletinsGlobal(),
  ]);

  return <JournalBulletinsClient bulletins={bulletins} salaries={salaries} />;
}
