import {
  listerSalaries,
  listerToutesPromotions,
  listerToutesSanctions,
} from "../salaries/actions";
import CarriereViewClient from "./carriere-view-client";

export const dynamic = "force-dynamic";

export default async function CarrierePage() {
  const [salaries, promotions, sanctions] = await Promise.all([
    listerSalaries(),
    listerToutesPromotions(),
    listerToutesSanctions(),
  ]);

  return (
    <CarriereViewClient
      salaries={salaries}
      promotions={promotions}
      sanctions={sanctions}
    />
  );
}
