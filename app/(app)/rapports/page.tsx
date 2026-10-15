import React from "react";
import PageClient from "./page-client";
import { listerCatalogueRubriques } from "../salaries/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const catalogue = await listerCatalogueRubriques();
  return <PageClient catalogue={catalogue} />;
}
