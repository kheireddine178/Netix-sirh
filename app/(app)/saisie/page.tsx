import {
  listerSalaries,
  getSalarie,
  listerRubriquesSalarie,
  listerCatalogueRubriques,
  getParametres,
  chargerBulletinPourSaisie,
} from "../salaries/actions";
import SaisieFormulaireConsolide from "./saisie-formulaire-consolide";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    salarieId?: string;
    annee?: string;
    mois?: string;
  }>;
};

export default async function SaisiePage({ searchParams }: Props) {
  const params = await searchParams;
  const salaries = await listerSalaries();
  
  // Filter only active salariés for entering payroll data
  const activeSalaries = salaries.filter((s) => s.actif !== false);

  const now = new Date();
  const selectedAnnee = params.annee ? parseInt(params.annee, 10) : now.getFullYear();
  const selectedMois = params.mois ? parseInt(params.mois, 10) : now.getMonth() + 1;

  let salarieActive = null;
  let rubriquesAssignees: any[] = [];
  let catalogueRubriques: any[] = [];
  let parametres = null;
  let initialBulletin = null;

  // Determine target salary id: use query param, or fallback to first employee if available
  const targetId = params.salarieId
    ? parseInt(params.salarieId, 10)
    : activeSalaries[0]?.id;

  if (targetId) {
    salarieActive = await getSalarie(targetId);

    if (salarieActive) {
      [rubriquesAssignees, catalogueRubriques, parametres, initialBulletin] = await Promise.all([
        listerRubriquesSalarie(salarieActive.id),
        listerCatalogueRubriques(),
        getParametres(),
        chargerBulletinPourSaisie(salarieActive.id, selectedAnnee, selectedMois),
      ]);
    }
  }

  // Calculate pager indices
  const currentIdx = salarieActive
    ? activeSalaries.findIndex((s) => s.id === salarieActive?.id)
    : -1;

  const prevSalarie = currentIdx > 0 ? activeSalaries[currentIdx - 1] : null;
  const nextSalarie = currentIdx >= 0 && currentIdx < activeSalaries.length - 1
    ? activeSalaries[currentIdx + 1]
    : null;

  return (
    <SaisieFormulaireConsolide
      salaries={activeSalaries}
      salarieActive={salarieActive}
      anneeActive={selectedAnnee}
      moisActive={selectedMois}
      rubriquesAssignees={rubriquesAssignees}
      catalogueRubriques={catalogueRubriques}
      parametres={parametres || {
        snmg: 20000,
        duree_legale_mensuelle: 173.33,
        taux_cnas_salarie: 0.09,
        taux_cnas_employeur: 0.26,
        majoration_hs_1: 0.5,
        majoration_hs_2: 0.75,
        majoration_hs_3: 1.0,
        bareme_irg: [],
        seuil_exoneration_irg: 30000,
        taux_abattement_irg: 0.4,
        abattement_irg_min: 1000,
        abattement_irg_max: 1500,
      }}
      initialBulletin={initialBulletin}
      pagerInfo={{
        current: currentIdx + 1,
        total: activeSalaries.length,
        prevId: prevSalarie ? prevSalarie.id : null,
        nextId: nextSalarie ? nextSalarie.id : null,
      }}
    />
  );
}
