/**
 * Génération du PDF du bulletin de paie — portage de pdf_bulletin.py (ReportLab, Python)
 * vers @react-pdf/renderer (React, TypeScript).
 *
 * Deux variantes, comme dans la version Python d'origine :
 *   - "salarie"   : document classique remis au salarié (gains, retenues, net à payer).
 *   - "employeur" : le même bulletin + un bloc "charges patronales" (CNAS employeur,
 *     coût total employeur), réservé à un usage interne.
 *
 * Reprend fidèlement : mise en page générale, couleurs, structure du tableau
 * Libellé / Base / Gain / Retenue, bloc net à payer, mentions légales en pied de page.
 */

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Parametres, ResultatPaie, SaisieMensuelle } from "./paieCalcul";

export const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Palette reprise de pdf_bulletin.py
const NAVY = "#16293f";
const NAVY_DARK = "#0e1e30";
const GREEN = "#1e5c3a";
const GREEN_BG = "#e7f3ec";
const GREY_TEXT = "#6b7280";
const GREY_LINE = "#d1d5db";
const GREY_BG = "#f3f4f6";
const AMBER = "#8a5b12";
const AMBER_BG = "#fbf1de";

/**
 * `toLocaleString("fr-FR")` insère un espace fine insécable (U+202F) comme séparateur
 * de milliers. La police intégrée au PDF (Helvetica de base, @react-pdf/renderer) ne
 * possède pas ce glyphe et affiche un caractère de repli ("/") à la place. On le
 * remplace donc par un espace normal, purement pour l'affichage — aucun impact sur les
 * valeurs numériques ni sur le calcul.
 */
function normaliserEspaces(s: string): string {
  // Remplacer l'espace fine insécable (U+202F) et l'espace insécable standard (U+00A0) par un espace standard
  return s.replace(/[\u202F\u00A0]/g, " ");
}

function fmtDa(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const s = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${normaliserEspaces(s)} DA`;
}

function fmtNombre(n: number, decimales = 2): string {
  const s = n.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return normaliserEspaces(s);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 56, // ~20mm
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  employeurBloc: { maxWidth: "50%" },
  employeurNom: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  petitTexte: { fontSize: 8, color: GREY_TEXT, lineHeight: 1.4 },
  titrePeriode: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    textAlign: "right",
  },
  hr: { borderBottomWidth: 1.4, borderBottomColor: NAVY, marginTop: 6, marginBottom: 8 },
  infosSalarieBox: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: GREY_LINE,
    backgroundColor: GREY_BG,
  },
  infosCol: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: GREY_LINE,
  },
  infosLigne: { flexDirection: "row" },
  infosLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREY_TEXT,
    padding: 5,
    width: 70,
    borderRightWidth: 0.5,
    borderRightColor: GREY_LINE,
    borderBottomWidth: 0.5,
    borderBottomColor: GREY_LINE,
  },
  infosValeur: {
    fontSize: 9,
    padding: 5,
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: GREY_LINE,
  },
  h2: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    marginTop: 14,
    marginBottom: 5,
  },
  table: { borderWidth: 0.6, borderColor: GREY_LINE },
  theadRow: { flexDirection: "row", backgroundColor: NAVY },
  th: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    padding: 5,
  },
  trow: {
    flexDirection: "row",
    borderTopWidth: 0.4,
    borderTopColor: GREY_LINE,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: NAVY,
    backgroundColor: GREY_BG,
  },
  cellLibelle: { flexBasis: "44%", padding: 5, fontSize: 9 },
  cellBase: { flexBasis: "18%", padding: 5, fontSize: 8.5, color: GREY_TEXT, textAlign: "right" },
  cellGain: { flexBasis: "19%", padding: 5, fontSize: 8.5, textAlign: "right" },
  cellRetenue: { flexBasis: "19%", padding: 5, fontSize: 8.5, textAlign: "right" },
  gras: { fontFamily: "Helvetica-Bold" },
  netBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GREEN_BG,
    borderWidth: 0.6,
    borderColor: GREEN,
    padding: 10,
    marginTop: 10,
  },
  netLabel: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  netValeur: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GREEN },
  chargesTable: { borderWidth: 0.6, borderColor: GREY_LINE, marginTop: 4 },
  chargesHeadRow: { flexDirection: "row", backgroundColor: AMBER },
  chargesRow: {
    flexDirection: "row",
    borderTopWidth: 0.4,
    borderTopColor: GREY_LINE,
  },
  chargesTotalRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: AMBER,
    backgroundColor: AMBER_BG,
  },
  chargesLibelle: { flexBasis: "66%", padding: 6, fontSize: 9 },
  chargesMontant: { flexBasis: "34%", padding: 6, fontSize: 9, textAlign: "right" },
  footer: {
    marginTop: 18,
    borderTopWidth: 0.6,
    borderTopColor: GREY_LINE,
    paddingTop: 6,
  },
  footerTexte: { fontSize: 7.5, color: GREY_TEXT },
});

interface LigneAffichage {
  libelle: string;
  base?: string;
  gain?: number;
  retenue?: number;
}

export interface BulletinPdfProps {
  variante: "salarie" | "employeur";
  employeur: Pick<
    Parametres,
    "employeur_nom" | "employeur_adresse" | "employeur_nif" | "employeur_nis" | "employeur_affiliation_cnas"
  >;
  salarie: { matricule: string | null; nom_prenom: string; fonction: string | null };
  annee: number;
  mois: number;
  saisie: SaisieMensuelle;
  resultat: ResultatPaie;
  params: Parametres;
}

function construireLignes(saisie: SaisieMensuelle, resultat: ResultatPaie): LigneAffichage[] {
  const lignes: LigneAffichage[] = [];

  lignes.push({
    libelle: "R030 - Salaire de base",
    base: `${fmtNombre(resultat.heures_travaillees)} h`,
    gain: resultat.salaire_base_reel,
  });

  if (resultat.total_heures_sup_da) {
    lignes.push({ libelle: "R120 - Heures supplémentaires", gain: resultat.total_heures_sup_da });
  }
  if (saisie.icr) lignes.push({ libelle: "R100 - I.C.R", gain: saisie.icr });
  if (saisie.taux_iep) {
    lignes.push({
      libelle: "R110 - I.E.P",
      base: `${fmtNombre(saisie.taux_iep * 100)} %`,
      gain: resultat.prime_iep,
    });
  }
  if (saisie.taux_nuisance) {
    lignes.push({
      libelle: "R200 - Indemnité de nuisance",
      base: `${fmtNombre(saisie.taux_nuisance * 100)} %`,
      gain: resultat.prime_nuisance,
    });
  }
  if (saisie.taux_responsabilite) {
    lignes.push({
      libelle: "R201 - Prime de responsabilité",
      base: `${fmtNombre(saisie.taux_responsabilite * 100)} %`,
      gain: resultat.prime_responsabilite,
    });
  }
  if (saisie.taux_disponibilite) {
    lignes.push({
      libelle: "R202 - Prime de disponibilité",
      base: `${fmtNombre(saisie.taux_disponibilite * 100)} %`,
      gain: resultat.prime_disponibilite,
    });
  }
  if (saisie.taux_pri) {
    lignes.push({
      libelle: "R203 - P.R.I",
      base: `${fmtNombre(saisie.taux_pri * 100)} %`,
      gain: resultat.prime_pri,
    });
  }
  if (saisie.taux_prc) {
    lignes.push({
      libelle: "R204 - P.R.C",
      base: `${fmtNombre(saisie.taux_prc * 100)} %`,
      gain: resultat.prime_prc,
    });
  }
  if (saisie.panier_jours) {
    lignes.push({
      libelle: "R250 - Panier",
      base: `${fmtNombre(saisie.panier_jours, 0)} j`,
      gain: saisie.panier_jours * saisie.panier_forfait_jour,
    });
  }
  if (saisie.autre_prime_fixe) {
    lignes.push({ libelle: "R260 - Autre prime", gain: saisie.autre_prime_fixe });
  }

  for (const d of resultat.detail_rubriques) {
    if (d.sens === "gain") {
      lignes.push({ libelle: `${d.code} - ${d.libelle}`, base: "", gain: d.montant });
    }
  }

  if (resultat.total_heures_absence) {
    lignes.push({
      libelle: "dont absences déduites du salaire de base",
      base: `${fmtNombre(resultat.total_heures_absence)} h`,
    });
  }

  lignes.push({
    libelle: "R950 - Retenue sécurité sociale (CNAS)",
    base: fmtDa(resultat.base_cnas),
    retenue: resultat.retenue_cnas,
  });
  if (resultat.retenue_irg_nette) {
    lignes.push({
      libelle: "R980 - Retenue IRG",
      base: fmtDa(resultat.base_imposable_irg),
      retenue: resultat.retenue_irg_nette,
    });
  }
  if (resultat.retenue_10pct) {
    lignes.push({
      libelle: "R985 - Retenue forfaitaire 10%",
      base: fmtDa(resultat.base_imposable_10pct),
      retenue: resultat.retenue_10pct,
    });
  }
  if (saisie.cotis_mutuelle) {
    lignes.push({ libelle: "R995 - Cotisation mutuelle", retenue: saisie.cotis_mutuelle });
  }
  if (saisie.autres_retenues) {
    lignes.push({ libelle: "R999 - Autres retenues", retenue: saisie.autres_retenues });
  }

  for (const d of resultat.detail_rubriques) {
    if (d.sens === "retenue") {
      lignes.push({ libelle: `${d.code} - ${d.libelle}`, base: "", retenue: d.montant });
    }
  }

  return lignes;
}

export function BulletinPdfDocument({
  variante,
  employeur,
  salarie,
  annee,
  mois,
  saisie,
  resultat,
  params,
}: BulletinPdfProps) {
  const lignes = construireLignes(saisie, resultat);
  const nomEmp = employeur.employeur_nom || "Nom de l'entreprise non renseigné";
  const idsEmp = [
    employeur.employeur_nif ? `NIF : ${employeur.employeur_nif}` : null,
    employeur.employeur_nis ? `NIS : ${employeur.employeur_nis}` : null,
    employeur.employeur_affiliation_cnas ? `Affiliation CNAS : ${employeur.employeur_affiliation_cnas}` : null,
  ].filter(Boolean);

  return (
    <Document title={`Bulletin de paie ${MOIS_NOMS[mois - 1]} ${annee} — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.headerRow}>
          <View style={styles.employeurBloc}>
            <Text style={styles.employeurNom}>{nomEmp}</Text>
            {employeur.employeur_adresse ? (
              <Text style={styles.petitTexte}>{employeur.employeur_adresse}</Text>
            ) : null}
            {idsEmp.length > 0 ? (
              <Text style={styles.petitTexte}>{idsEmp.join(" — ")}</Text>
            ) : null}
          </View>
          <Text style={styles.titrePeriode}>
            BULLETIN DE PAIE{"\n"}
            {MOIS_NOMS[mois - 1].toUpperCase()} {annee}
          </Text>
        </View>
        <View style={styles.hr} />

        {/* Infos salarié */}
        <View style={styles.infosSalarieBox}>
          <View style={styles.infosCol}>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Matricule</Text>
              <Text style={styles.infosValeur}>{salarie.matricule || "—"}</Text>
            </View>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Fonction</Text>
              <Text style={[styles.infosValeur, { borderBottomWidth: 0 }]}>{salarie.fonction || "—"}</Text>
            </View>
          </View>
          <View style={[styles.infosCol, { borderRightWidth: 0 }]}>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Nom et prénom</Text>
              <Text style={styles.infosValeur}>{salarie.nom_prenom}</Text>
            </View>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Période</Text>
              <Text style={[styles.infosValeur, { borderBottomWidth: 0 }]}>
                {MOIS_NOMS[mois - 1]} {annee}
              </Text>
            </View>
          </View>
        </View>

        {/* Détail de la paie */}
        <Text style={styles.h2}>DÉTAIL DE LA PAIE</Text>
        <View style={styles.table}>
          <View style={styles.theadRow}>
            <Text style={[styles.th, { flexBasis: "44%" }]}>Libellé</Text>
            <Text style={[styles.th, { flexBasis: "18%", textAlign: "right" }]}>Base</Text>
            <Text style={[styles.th, { flexBasis: "19%", textAlign: "right" }]}>Gain</Text>
            <Text style={[styles.th, { flexBasis: "19%", textAlign: "right" }]}>Retenue</Text>
          </View>

          {lignes.map((l, i) => (
            <View key={i} style={styles.trow}>
              <Text style={styles.cellLibelle}>{l.libelle}</Text>
              <Text style={styles.cellBase}>{l.base ?? ""}</Text>
              <Text style={styles.cellGain}>{l.gain !== undefined ? fmtDa(l.gain) : ""}</Text>
              <Text style={styles.cellRetenue}>{l.retenue !== undefined ? fmtDa(l.retenue) : ""}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={[styles.cellLibelle, styles.gras]}>TOTAL</Text>
            <Text style={styles.cellBase}></Text>
            <Text style={[styles.cellGain, styles.gras]}>{fmtDa(resultat.total_gains)}</Text>
            <Text style={[styles.cellRetenue, styles.gras]}>{fmtDa(resultat.total_retenues)}</Text>
          </View>
        </View>

        {/* Net à payer */}
        <View style={styles.netBox}>
          <Text style={styles.netLabel}>NET À PAYER</Text>
          <Text style={styles.netValeur}>{fmtDa(resultat.net_a_payer)}</Text>
        </View>

        {/* Bloc charges employeur (variante interne uniquement) */}
        {variante === "employeur" && (
          <View>
            <Text style={styles.h2}>CHARGES PATRONALES — USAGE INTERNE EMPLOYEUR</Text>
            <View style={styles.chargesTable}>
              <View style={styles.chargesHeadRow}>
                <Text style={[styles.th, { flexBasis: "66%" }]}>Détail</Text>
                <Text style={[styles.th, { flexBasis: "34%", textAlign: "right" }]}>Montant</Text>
              </View>
              <View style={styles.chargesRow}>
                <Text style={styles.chargesLibelle}>Total des gains versés au salarié</Text>
                <Text style={styles.chargesMontant}>{fmtDa(resultat.total_gains)}</Text>
              </View>
              <View style={styles.chargesRow}>
                <Text style={styles.chargesLibelle}>Base de cotisation CNAS (panier exclu)</Text>
                <Text style={styles.chargesMontant}>{fmtDa(resultat.base_cnas)}</Text>
              </View>
              <View style={styles.chargesRow}>
                <Text style={styles.chargesLibelle}>
                  Charge patronale CNAS ({fmtNombre(params.taux_cnas_employeur * 100, 0)} % de la base CNAS)
                </Text>
                <Text style={styles.chargesMontant}>{fmtDa(resultat.base_cnas * params.taux_cnas_employeur)}</Text>
              </View>
              <View style={styles.chargesTotalRow}>
                <Text style={[styles.chargesLibelle, styles.gras]}>COÛT TOTAL EMPLOYEUR</Text>
                <Text style={[styles.chargesMontant, styles.gras]}>{fmtDa(resultat.cout_total_employeur)}</Text>
              </View>
            </View>
            <Text style={[styles.petitTexte, { marginTop: 6 }]}>
              Ce bloc complémentaire n&apos;est pas destiné au salarié : il détaille la charge patronale CNAS
              (taux modifiable dans l&apos;écran Paramètres) et le coût total employeur, utiles pour le suivi
              de la masse salariale et des charges sociales.
            </Text>
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerTexte}>
            Document généré automatiquement, à titre informatif. Vérifiez les taux légaux en vigueur auprès de
            la DGI et de la CNAS. Édité le{" "}
            {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR").slice(0, 5)}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
