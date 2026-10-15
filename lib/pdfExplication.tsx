import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ExplicationDonnees } from "./paieExplication";
import { fmtDa, fmtPct, fmtH } from "./paieExplication";

const NAVY = "#16293f";
const NAVY_DARK = "#0e1e30";
const GREY_TEXT = "#6b7280";
const GREY_LINE = "#d1d5db";
const GREY_BG = "#f3f4f6";
const GREEN = "#1e5c3a";
const GREEN_BG = "#e7f3ec";

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 56,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    maxWidth: "60%",
  },
  appTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    textAlign: "right",
  },
  hr: {
    borderBottomWidth: 1.4,
    borderBottomColor: NAVY,
    marginTop: 6,
    marginBottom: 8,
  },
  subHr: {
    borderBottomWidth: 0.5,
    borderBottomColor: GREY_LINE,
    marginTop: 4,
    marginBottom: 6,
  },
  infosBox: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: GREY_LINE,
    backgroundColor: GREY_BG,
    marginBottom: 12,
  },
  infosCol: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: GREY_LINE,
  },
  infosLigne: {
    flexDirection: "row",
  },
  infosLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREY_TEXT,
    padding: 4,
    width: 80,
    borderRightWidth: 0.5,
    borderRightColor: GREY_LINE,
    borderBottomWidth: 0.5,
    borderBottomColor: GREY_LINE,
  },
  infosValeur: {
    fontSize: 8.5,
    padding: 4,
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: GREY_LINE,
  },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    marginTop: 10,
    marginBottom: 4,
  },
  table: {
    borderWidth: 0.6,
    borderColor: GREY_LINE,
    marginBottom: 8,
  },
  theadRow: {
    flexDirection: "row",
    backgroundColor: NAVY,
  },
  th: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    padding: 4,
  },
  trow: {
    flexDirection: "row",
    borderTopWidth: 0.4,
    borderTopColor: GREY_LINE,
  },
  cellLibelle: { flexBasis: "50%", padding: 4, fontSize: 8.5 },
  cellFormule: { flexBasis: "30%", padding: 4, fontSize: 8, color: GREY_TEXT, textAlign: "right" },
  cellMontant: { flexBasis: "20%", padding: 4, fontSize: 8.5, textAlign: "right", fontFamily: "Helvetica-Bold" },
  alertBox: {
    borderWidth: 0.5,
    borderColor: GREY_LINE,
    backgroundColor: GREY_BG,
    padding: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  alertTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    marginBottom: 2,
    color: NAVY,
  },
  alertText: {
    fontSize: 8,
    lineHeight: 1.3,
  },
  codeBlock: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    backgroundColor: GREY_BG,
    padding: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: GREY_LINE,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 0.6,
    borderTopColor: GREY_LINE,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: GREY_TEXT,
    textAlign: "center",
  },
});

export interface PdfExplicationProps {
  donnees: ExplicationDonnees;
}

export function PdfExplicationDocument({ donnees }: PdfExplicationProps) {
  return (
    <Document title={`Rapport pédagogique de paie — ${donnees.nom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <Text style={styles.appTitle}>NETIX PAIE</Text>
            <Text style={{ fontSize: 7.5, color: GREY_TEXT }}>
              Réglementation Algérienne (CIDTA / Loi n°90-11 / LF 2024)
            </Text>
          </View>
          <Text style={styles.pageTitle}>
            RAPPORT PÉDAGOGIQUE{"\n"}
            {donnees.moisNom.toUpperCase()} {donnees.annee}
          </Text>
        </View>
        <View style={styles.hr} />

        {/* Employee Info */}
        <View style={styles.infosBox}>
          <View style={styles.infosCol}>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Salarié</Text>
              <Text style={styles.infosValeur}>{donnees.nom}</Text>
            </View>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Matricule</Text>
              <Text style={styles.infosValeur}>{donnees.matricule || "—"}</Text>
            </View>
          </View>
          <View style={[styles.infosCol, { borderRightWidth: 0 }]}>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Fonction</Text>
              <Text style={styles.infosValeur}>{donnees.fonction || "—"}</Text>
            </View>
            <View style={styles.infosLigne}>
              <Text style={styles.infosLabel}>Période</Text>
              <Text style={styles.infosValeur}>
                {donnees.moisNom} {donnees.annee}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Salaire de base réel */}
        <Text style={styles.h2}>1. SALAIRE DE BASE RÉEL ET ABSENCES</Text>
        <Text style={{ fontSize: 8.5, marginBottom: 4, lineHeight: 1.3 }}>
          Salaire de base théorique de {fmtDa(donnees.salaireBaseTheorique)} pour une durée mensuelle de {fmtH(donnees.dureeLegaleMensuelle)}.
        </Text>
        
        {donnees.absences.length > 0 && (
          <View style={{ marginBottom: 6 }}>
            <View style={styles.table}>
              <View style={styles.theadRow}>
                <Text style={[styles.th, { flexBasis: "70%" }]}>Type d'absence</Text>
                <Text style={[styles.th, { flexBasis: "30%", textAlign: "right" }]}>Heures</Text>
              </View>
              {donnees.absences.map((ab, i) => (
                <View key={i} style={styles.trow}>
                  <Text style={{ flexBasis: "70%", padding: 4, fontSize: 8 }}>{ab.libelle}</Text>
                  <Text style={{ flexBasis: "30%", padding: 4, fontSize: 8, textAlign: "right" }}>{fmtH(ab.heures)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.codeBlock}>
          <Text>Taux horaire = {fmtDa(donnees.salaireBaseTheorique)} / {fmtH(donnees.dureeLegaleMensuelle)} = {fmtDa(donnees.tauxHoraire)}/h</Text>
          <Text>Salaire base réel = {fmtDa(donnees.tauxHoraire)}/h x {fmtH(donnees.heuresTravaillees)} travaillées = {fmtDa(donnees.salaireBaseReel)}</Text>
        </View>

        {/* Section 2: Gains */}
        <Text style={styles.h2}>2. TOTAL DES GAINS BRUTS</Text>
        <View style={styles.table}>
          <View style={styles.theadRow}>
            <Text style={[styles.th, { flexBasis: "50%" }]}>Rubrique</Text>
            <Text style={[styles.th, { flexBasis: "30%", textAlign: "right" }]}>Base / Formule</Text>
            <Text style={[styles.th, { flexBasis: "20%", textAlign: "right" }]}>Montant</Text>
          </View>
          {donnees.gains.map((g, i) => (
            <View key={i} style={styles.trow}>
              <Text style={styles.cellLibelle}>{g.libelle}</Text>
              <Text style={styles.cellFormule}>{g.formule}</Text>
              <Text style={styles.cellMontant}>{fmtDa(g.montant)}</Text>
            </View>
          ))}
          <View style={[styles.trow, { backgroundColor: GREY_BG }]}>
            <Text style={[styles.cellLibelle, { fontFamily: "Helvetica-Bold" }]}>TOTAL GAINS BRUTS</Text>
            <Text style={styles.cellFormule}></Text>
            <Text style={styles.cellMontant}>{fmtDa(donnees.totalGains)}</Text>
          </View>
        </View>

        {/* Section 3: CNAS */}
        <Text style={styles.h2}>3. SÉCURITÉ SOCIALE — CNAS SALARIALE (9%)</Text>
        <View style={styles.codeBlock}>
          <Text>Base CNAS (Total Brut - Éléments non cotisables) = {fmtDa(donnees.baseCnas)}</Text>
          <Text>Retenue CNAS (9%) = {fmtDa(donnees.baseCnas)} x 0.09 = {fmtDa(donnees.retenueCnas)}</Text>
          <Text>Charge patronale employeur ({fmtPct(donnees.tauxCnasEmployeur)}) = {fmtDa(donnees.chargePatronaleCnas)}</Text>
        </View>

        {/* Section 4: IRG */}
        <Text style={styles.h2}>4. IMPÔT SUR LE REVENU GLOBAL (IRG)</Text>
        <View style={styles.codeBlock}>
          <Text>Assiette imposable IRG = Total Brut - CNAS = {fmtDa(donnees.baseImposableIrg)}</Text>
        </View>

        {donnees.estExonereIrg ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Exonération totale IRG</Text>
            <Text style={styles.alertText}>
              Le revenu imposable est inférieur au seuil légal de {fmtDa(donnees.seuilExonerationIrg)}/mois (Art. 104 CIDTA). Aucun impôt n'est dû.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.table}>
              <View style={styles.theadRow}>
                <Text style={[styles.th, { flexBasis: "40%" }]}>Tranche</Text>
                <Text style={[styles.th, { flexBasis: "15%", textAlign: "right" }]}>Taux</Text>
                <Text style={[styles.th, { flexBasis: "45%", textAlign: "right" }]}>Calcul partiel</Text>
              </View>
              {donnees.tranchesIrg.map((tr, i) => (
                <View key={i} style={styles.trow}>
                  <Text style={{ flexBasis: "40%", padding: 4, fontSize: 8 }}>{tr.tranche}</Text>
                  <Text style={{ flexBasis: "15%", padding: 4, fontSize: 8, textAlign: "right" }}>{tr.taux}</Text>
                  <Text style={{ flexBasis: "45%", padding: 4, fontSize: 8, textAlign: "right", fontFamily: "Helvetica" }}>{tr.detail}</Text>
                </View>
              ))}
              <View style={[styles.trow, { backgroundColor: GREY_BG }]}>
                <Text style={{ flexBasis: "40%", padding: 4, fontSize: 8, fontFamily: "Helvetica-Bold" }}>IRG Brut</Text>
                <Text style={{ flexBasis: "15%" }}></Text>
                <Text style={{ flexBasis: "45%", padding: 4, fontSize: 8, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{fmtDa(donnees.irgBrut)}</Text>
              </View>
            </View>

            <View style={styles.codeBlock}>
              <Text>Abattement 40% théorique = {fmtDa(donnees.abattementTheorique)}</Text>
              <Text>Limites légales d'abattement : Min {fmtDa(donnees.abattementMin)} / Max {fmtDa(donnees.abattementMax)}</Text>
              <Text>Abattement appliqué = {fmtDa(donnees.abattementRetenu)} ({donnees.abattementStatus === "plafond" ? "Plafonné au Max" : donnees.abattementStatus === "plancher" ? "Planché au Min" : "Normal"})</Text>
              <Text>IRG Net (Brut - Abattement) = {fmtDa(donnees.retenueIrgNette)}</Text>
            </View>
          </View>
        )}

        {donnees.baseImposable10pct > 0 && (
          <View style={styles.codeBlock}>
            <Text>IRG Forfaitaire 10% sur primes : Base {fmtDa(donnees.baseImposable10pct)} x 10% = {fmtDa(donnees.retenue10pct)}</Text>
          </View>
        )}

        {/* Section 5: Synthèse */}
        <Text style={styles.h2}>5. SYNTHÈSE FINALE</Text>
        <View style={styles.alertBox}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 2 }}>
            NET À PAYER : {fmtDa(donnees.netAPayer)}
          </Text>
          <Text style={{ fontSize: 8 }}>
            Total gains : {fmtDa(donnees.totalGains)} | Total retenues : {fmtDa(donnees.totalRetenues)}
          </Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>
            Coût total employeur : {fmtDa(donnees.coutTotalEmployeur)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré automatiquement à titre pédagogique et indicatif. Confidentiel.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
