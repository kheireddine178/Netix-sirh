"use client";

import React, { useMemo, useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Salarie, BulletinPourSaisie } from "../salaries/actions";
import {
  creerBulletin,
  ajouterRubriqueSalarie,
  retirerRubriqueSalarie,
  supprimerBulletin,
  chargerBulletinPourSaisie,
  copierMoisPrecedentMasse,
} from "../salaries/actions";
import type {
  ResultatBulletin,
  RubriqueAssignee,
  RubriqueCatalogue,
} from "../salaries/actions";
import type { Parametres, LigneRubriqueDynamique } from "@/lib/paieCalcul";
import { calculerPaie, calculerBaseAvantRubriques, SAISIE_VIDE } from "@/lib/paieCalcul";
import { resoudreLigneRubrique } from "@/lib/rubriquesDynamiques";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Drawer";
import { formatDA } from "@/lib/utils";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Copy,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
  Plus,
  Search,
  Trash2,
  Calculator,
  Wallet,
  Clock,
  Info,
  ShieldCheck,
  Scale,
  Sparkles,
  Printer,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const CHAMPS_ABSENCES = [
  { name: "maladie_h", label: "Maladie", hint: "Déduction horaire légale" },
  { name: "retard_h", label: "Retards", hint: "Cumul mensuel" },
  { name: "absence_irreguliere_h", label: "Absence injustifiée", hint: "Non rémunérée" },
  { name: "mise_a_pied_h", label: "Mise à pied", hint: "Sanction disciplinaire" },
  { name: "accident_travail_h", label: "Accident travail", hint: "Pris en charge CNAS" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "Palier 1 (+50%)", hint: "1ères 8h sup." },
  { name: "heures_sup_2", label: "Palier 2 (+75%)", hint: "Heures suivantes" },
  { name: "heures_sup_3", label: "Palier 3 (+100%)", hint: "Nuit / Repos légal" },
];

interface LigneEtat {
  code: string;
  libelle: string | null;
  categorie: string;
  type_valeur: string | null;
  valeur_1: number;
  valeur_2: number;
}

function ligneDepuisAssignee(r: RubriqueAssignee): LigneEtat {
  const rawDef = r.valeur_defaut || 0;
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: r.categorie === "pourcentage" ? (rawDef <= 1 && rawDef > 0 ? rawDef * 100 : rawDef) : rawDef,
    valeur_2: 0,
  };
}

export interface SaisieFormulaireConsolideProps {
  salaries: Salarie[];
  salarieActive?: Salarie | null;
  anneeActive: number;
  moisActive: number;
  rubriquesAssignees: RubriqueAssignee[];
  catalogueRubriques: RubriqueCatalogue[];
  parametres: Parametres;
  initialBulletin: BulletinPourSaisie | null;
  pagerInfo?: {
    current: number;
    total: number;
    prevId: number | null;
    nextId: number | null;
  };
}

export default function SaisieFormulaireConsolide({
  salaries,
  salarieActive,
  anneeActive,
  moisActive,
  rubriquesAssignees,
  catalogueRubriques,
  parametres,
  initialBulletin,
  pagerInfo,
}: SaisieFormulaireConsolideProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const calculTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [resultat, setResultat] = useState<ResultatBulletin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageCharge, setMessageCharge] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [salarieId, setSalarieId] = useState<number | string>(salarieActive?.id || "");
  const [annee, setAnnee] = useState(anneeActive);
  const [mois, setMois] = useState(moisActive);

  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  const [lignes, setLignes] = useState<LigneEtat[]>([]);
  const [rechercheOmnibar, setRechercheOmnibar] = useState("");
  const [isOmnibarOpen, setIsOmnibarOpen] = useState(false);
  const [estEnregistre, setEstEnregistre] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "modified" | "saving" | "saved" | "error">("idle");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync state when salarieActive or initialBulletin changes
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${salarieActive?.id || ""}_${anneeActive}_${moisActive}_${initialBulletin?.bulletin_id || 0}`;

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (salarieActive) {
      setSalarieId(salarieActive.id);
      setAnnee(anneeActive);
      setMois(moisActive);

      if (initialBulletin) {
        setInitialValues(initialBulletin.valeurs_saisies || {});
        setEstEnregistre(true);
        setSaveStatus("saved");

        const catalogMap = new Map(catalogueRubriques.map((c) => [c.code, c]));
        const lignesInitiales: LigneEtat[] = (initialBulletin.lignes_rubriques || []).map((lr) => {
          const cat = catalogMap.get(lr.code);
          return {
            code: lr.code,
            libelle: lr.libelle || cat?.libelle || lr.code,
            categorie: cat?.categorie || "montant_fixe",
            type_valeur: cat?.type_valeur || "Gain (+)",
            valeur_1: lr.valeur_1,
            valeur_2: lr.valeur_2,
          };
        });
        setLignes(lignesInitiales);
      } else {
        setInitialValues({});
        setEstEnregistre(false);
        setSaveStatus("idle");
        setLignes(rubriquesAssignees.map(ligneDepuisAssignee));
      }
      setFormKey((k) => k + 1);
    }
  }

  // Live Payroll Calculation from Form State
  const recalculer = () => {
    if (!formRef.current || !salarieActive) return;
    const formData = new FormData(formRef.current);

    const sbTheorique = parseFloat((formData.get("salaire_base_theorique") as string) || "0") ||
      salarieActive.salaire_base_theorique ||
      20000;

    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: sbTheorique,
      maladie_h: parseFloat((formData.get("maladie_h") as string) || "0") || 0,
      mise_a_pied_h: parseFloat((formData.get("mise_a_pied_h") as string) || "0") || 0,
      accident_travail_h: parseFloat((formData.get("accident_travail_h") as string) || "0") || 0,
      retard_h: parseFloat((formData.get("retard_h") as string) || "0") || 0,
      absence_irreguliere_h: parseFloat((formData.get("absence_irreguliere_h") as string) || "0") || 0,
      heures_sup_1: parseFloat((formData.get("heures_sup_1") as string) || "0") || 0,
      heures_sup_2: parseFloat((formData.get("heures_sup_2") as string) || "0") || 0,
      heures_sup_3: parseFloat((formData.get("heures_sup_3") as string) || "0") || 0,
      prime_nuisance_pct: parseFloat((formData.get("prime_nuisance_pct") as string) || "0") || 0,
      prime_responsabilite_pct: parseFloat((formData.get("prime_responsabilite_pct") as string) || "0") || 0,
      autres_primes_pct: parseFloat((formData.get("autres_primes_pct") as string) || "0") || 0,
      icr: parseFloat((formData.get("icr") as string) || "0") || 0,
      panier_jours: parseFloat((formData.get("panier_jours") as string) || "0") || 0,
      prime_transport: parseFloat((formData.get("prime_transport") as string) || "0") || 0,
      prime_rendement_individuel_pct: parseFloat((formData.get("prime_rendement_individuel_pct") as string) || "0") || 0,
      prime_rendement_collectif_pct: parseFloat((formData.get("prime_rendement_collectif_pct") as string) || "0") || 0,
      prime_anciennete_pourcentage: parseFloat((formData.get("prime_anciennete_pourcentage") as string) || "0") || 0,
      prime_caisse: parseFloat((formData.get("prime_caisse") as string) || "0") || 0,
      cotisation_mutuelle: parseFloat((formData.get("cotisation_mutuelle") as string) || "0") || 0,
      avance_salaire: parseFloat((formData.get("avance_salaire") as string) || "0") || 0,
      retenue_sur_salaire: parseFloat((formData.get("retenue_sur_salaire") as string) || "0") || 0,
    };

    const baseRef = calculerBaseAvantRubriques(saisie, parametres);
    const catalogMap = new Map(catalogueRubriques.map((c) => [c.code, c]));
    const rubriquesDyn: LigneRubriqueDynamique[] = [];

    for (const l of lignes) {
      const cat = catalogMap.get(l.code);
      if (!cat) continue;

      const v1 = l.categorie === "pourcentage" ? l.valeur_1 / 100 : l.valeur_1;
      const v2 = l.valeur_2;

      const ligneRes = resoudreLigneRubrique(
        {
          code: cat.code,
          libelle: cat.libelle,
          type_valeur: cat.type_valeur,
          cotisable: cat.cotisable,
          imposable: cat.imposable,
        },
        v1,
        v2,
        baseRef,
      );

      if (ligneRes) rubriquesDyn.push(ligneRes);
    }

    try {
      const res = calculerPaie(saisie, parametres, rubriquesDyn);
      setResultat(res);
    } catch (err: any) {
      console.error("Erreur calcul en direct :", err);
    }
  };

  const debounceCalcul = () => {
    setSaveStatus("modified");
    if (calculTimeoutRef.current) clearTimeout(calculTimeoutRef.current);
    calculTimeoutRef.current = setTimeout(() => {
      recalculer();
    }, 60);
  };

  useEffect(() => {
    recalculer();
  }, [formKey, lignes, salarieActive]);

  // OmniBar Catalog search results
  const catalogueFiltered = useMemo(() => {
    const q = rechercheOmnibar.trim().toLowerCase();
    if (!q) return [];
    const activeCodes = new Set(lignes.map((l) => l.code));

    return catalogueRubriques
      .filter((r) => !activeCodes.has(r.code))
      .filter((r) => {
        const h = `${r.code} ${r.libelle || ""} ${r.categorie || ""} ${r.cotisable || ""} ${r.imposable || ""}`.toLowerCase();
        return h.includes(q);
      })
      .slice(0, 8);
  }, [rechercheOmnibar, catalogueRubriques, lignes]);

  const handleAjouterRubrique = (r: RubriqueCatalogue) => {
    const n = {
      code: r.code,
      libelle: r.libelle,
      categorie: r.categorie,
      type_valeur: r.type_valeur,
      valeur_1: 0,
      valeur_2: 0,
    };
    setLignes((prev) => [...prev, n]);
    setRechercheOmnibar("");
    setIsOmnibarOpen(false);
    setSaveStatus("modified");
  };

  const handleSupprimerLigne = (code: string) => {
    setLignes((prev) => prev.filter((l) => l.code !== code));
    setSaveStatus("modified");
  };

  const handleModifierLigne = (code: string, champ: "valeur_1" | "valeur_2", val: number) => {
    setLignes((prev) =>
      prev.map((l) => (l.code === code ? { ...l, [champ]: val } : l))
    );
    debounceCalcul();
  };

  // Submission handler
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!salarieActive) return;

    setErreur(null);
    setMessageCharge(null);
    setSaveStatus("saving");

    const formData = new FormData(e.currentTarget);
    const rubriquesPayload = lignes.map((l) => ({
      code: l.code,
      valeur_1: l.valeur_1,
      valeur_2: l.valeur_2,
    }));
    formData.set("rubriques_json", JSON.stringify(rubriquesPayload));

    startTransition(async () => {
      try {
        const res = await creerBulletin(salarieActive.id, formData);
        if (res.success) {
          setEstEnregistre(true);
          setSaveStatus("saved");
          setMessageCharge("Bulletin enregistré et certifié conforme.");
          router.refresh();
        } else {
          setErreur(res.error || "Erreur lors de l'enregistrement");
          setSaveStatus("error");
        }
      } catch (err: any) {
        setErreur(err.message || "Erreur inattendue");
        setSaveStatus("error");
      }
    });
  };

  const handleCopierMoisPrecedent = async () => {
    if (!salarieActive) return;
    setSaveStatus("saving");
    const res = await copierMoisPrecedentMasse(annee, mois, [salarieActive.id]);
    if (res.success) {
      setMessageCharge("Variables du mois précédent importées.");
      router.refresh();
    } else {
      setErreur(res.error || "Aucun bulletin antérieur trouvé.");
      setSaveStatus("error");
    }
  };

  const handleChangerSalarie = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) router.push(`/saisie?salarieId=${id}&annee=${annee}&mois=${mois}`);
  };

  const handleChangerMois = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    setMois(m);
    router.push(`/saisie?salarieId=${salarieId}&annee=${annee}&mois=${m}`);
  };

  const handleChangerAnnee = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = parseInt(e.target.value, 10);
    setAnnee(a);
    router.push(`/saisie?salarieId=${salarieId}&annee=${a}&mois=${mois}`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1520px] mx-auto pb-16">
      {/* ── COMMAND DECK : SÉLECTEUR & ACTIONS RAPIDES ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Collaborateur & Period Switchers */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Employee Avatar Pill */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
              {salarieActive?.nom_prenom ? salarieActive.nom_prenom.charAt(0).toUpperCase() : <User className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collaborateur</span>
              <select
                value={salarieId}
                onChange={handleChangerSalarie}
                className="font-bold text-slate-900 bg-transparent text-sm hover:text-indigo-600 cursor-pointer focus:outline-none"
              >
                <option value="">Sélectionner un collaborateur…</option>
                {salaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 pl-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={mois}
              onChange={handleChangerMois}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={annee}
              onChange={handleChangerAnnee}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 w-18 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Pager Buttons */}
          {pagerInfo && (
            <div className="flex items-center gap-1 bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/60 ml-auto sm:ml-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500"
                disabled={!pagerInfo.prevId}
                onClick={() => pagerInfo.prevId && router.push(`/saisie?salarieId=${pagerInfo.prevId}&annee=${annee}&mois=${mois}`)}
                title="Collaborateur précédent (Flèche gauche)"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[11px] font-semibold text-slate-500 px-1 font-mono">
                {pagerInfo.current}/{pagerInfo.total}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500"
                disabled={!pagerInfo.nextId}
                onClick={() => pagerInfo.nextId && router.push(`/saisie?salarieId=${pagerInfo.nextId}&annee=${annee}&mois=${mois}`)}
                title="Collaborateur suivant (Flèche droite)"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Status Pill & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Activity className="w-3.5 h-3.5 animate-spin" /> Enregistrement…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bulletin Certifié
            </span>
          )}
          {saveStatus === "modified" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Modifié
            </span>
          )}

          {salarieActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopierMoisPrecedent}
              disabled={isPending}
              className="gap-1.5 text-xs h-9"
              title="Copier les variables du mois précédent"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" /> Copier M-1
            </Button>
          )}

          {salarieActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="gap-1.5 text-xs h-9 text-indigo-700 hover:text-indigo-800 bg-indigo-50/70 border-indigo-200/80 hover:bg-indigo-100/70"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" /> Inspection Fiscale
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending || !salarieActive}
            className="gap-1.5 text-xs h-9 px-4 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer le bulletin
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {erreur && (
        <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border bg-red-50 text-red-800 border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          {erreur}
        </div>
      )}
      {messageCharge && (
        <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          {messageCharge}
        </div>
      )}

      {/* ── MAIN SPLIT-SCREEN 2026 (Gauche: Saisie / Droite: Live Cascade) ── */}
      {salarieActive ? (
        <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <input type="hidden" name="annee" value={annee} />
          <input type="hidden" name="mois" value={mois} />

          {/* ══════════════════════════════════════════════════════════════
              COLONNE GAUCHE (7 cols) : SAISIE ULTRA-RAPIDE AU CLAVIER
             ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* 1. Carte Salaire de Base & Contrat */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Salaire de Base & Profil Contractuel</h3>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                  {salarieActive.type_contrat || "CDI"} · {salarieActive.fonction || "Poste standard"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Salaire de Base Théorique (DA)
                  </label>
                  <Input
                    name="salaire_base_theorique"
                    type="number"
                    step="0.01"
                    defaultValue={initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique}
                    onChange={debounceCalcul}
                    className="font-mono font-bold text-base text-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">
                    Durée légale : {parametres.duree_legale_mensuelle}h/mois (Loi 90-11)
                  </span>
                </div>

                <div className="flex flex-col justify-center p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-medium">Taux horaire calculé :</span>
                  <span className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5">
                    {resultat ? formatDA(resultat.taux_horaire) : "—"} / heure
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Base réelle : {resultat ? formatDA(resultat.salaire_base_reel) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Carte Absences & Déductions (Loi 90-11) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Absences Déductibles (Heures)</h3>
                </div>
                {resultat && resultat.total_heures_absence > 0 ? (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                    -{resultat.total_heures_absence}h ({formatDA(resultat.retenue_absences)})
                  </span>
                ) : (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Plein temps (173.33h)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CHAMPS_ABSENCES.map((champ) => (
                  <div key={champ.name} className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                    <label className="text-xs font-semibold text-slate-700">{champ.label}</label>
                    <Input
                      name={champ.name}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      defaultValue={initialValues[champ.name] || ""}
                      onChange={debounceCalcul}
                      className="h-8 font-mono text-xs font-bold bg-white text-right"
                    />
                    <span className="text-[10px] text-slate-400 truncate">{champ.hint}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Carte Heures Supplémentaires (Paliers Loi 90-11 Art. 31) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Heures Supplémentaires (Loi 90-11)</h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">Majorations 50% / 75% / 100%</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CHAMPS_HEURES_SUP.map((hs) => (
                  <div key={hs.name} className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                    <label className="text-xs font-semibold text-slate-700">{hs.label}</label>
                    <Input
                      name={hs.name}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      defaultValue={initialValues[hs.name] || ""}
                      onChange={debounceCalcul}
                      className="h-8 font-mono text-xs font-bold bg-white text-right"
                    />
                    <span className="text-[10px] text-slate-400">{hs.hint}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Carte Primes Standard Courantes */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Primes Mensuelles Régulières</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Panier · Transport · IEP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Panier */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Prime de Panier (Jours)</label>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Non cotisable CNAS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      name="panier_jours"
                      type="number"
                      step="1"
                      min="0"
                      max="31"
                      defaultValue={initialValues["panier_jours"] ?? 22}
                      onChange={debounceCalcul}
                      className="font-mono text-sm font-bold bg-white w-24 text-right"
                    />
                    <span className="text-xs text-slate-500">× 500 DA =</span>
                    <span className="text-xs font-bold text-slate-900 font-mono ml-auto">
                      {resultat ? formatDA(resultat.prime_panier) : "—"}
                    </span>
                  </div>
                </div>

                {/* Transport */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Indemnité de Transport (DA)</label>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Non cotisable CNAS
                    </span>
                  </div>
                  <Input
                    name="prime_transport"
                    type="number"
                    step="100"
                    min="0"
                    placeholder="0.00 DA"
                    defaultValue={initialValues["prime_transport"] || ""}
                    onChange={debounceCalcul}
                    className="font-mono text-sm font-bold bg-white text-right"
                  />
                </div>

                {/* I.E.P */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">I.E.P (Ancienneté %)</label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Cotisable / Imposable
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      name="prime_anciennete_pourcentage"
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      placeholder="0%"
                      defaultValue={initialValues["prime_anciennete_pourcentage"] || ""}
                      onChange={debounceCalcul}
                      className="font-mono text-sm font-bold bg-white w-24 text-right"
                    />
                    <span className="text-xs text-slate-500">% du SB =</span>
                    <span className="text-xs font-bold text-slate-900 font-mono ml-auto">
                      {resultat ? formatDA(resultat.prime_anciennete) : "—"}
                    </span>
                  </div>
                </div>

                {/* I.C.R / Primes fixes */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">I.C.R / Primes Fixes (DA)</label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Cotisable / Imposable
                    </span>
                  </div>
                  <Input
                    name="icr"
                    type="number"
                    step="100"
                    min="0"
                    placeholder="0.00 DA"
                    defaultValue={initialValues["icr"] || ""}
                    onChange={debounceCalcul}
                    className="font-mono text-sm font-bold bg-white text-right"
                  />
                </div>
              </div>
            </div>

            {/* 5. OmniBar du Catalogue des 402 Rubriques (Fuzzy Search & Fast Add) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Catalogue des 402 Rubriques Spécifiques</h3>
                    <p className="text-[11px] text-slate-400">Ajout instantané de primes ou retenues sans défilement</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {lignes.length} active(s)
                </span>
              </div>

              {/* OmniBar Input */}
              <div className="relative mb-4">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-purple-600 absolute left-3 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Rechercher une rubrique par nom ou code (ex: Nuisance, PRI, R280, Caisse, Astreinte)..."
                    value={rechercheOmnibar}
                    onChange={(e) => {
                      setRechercheOmnibar(e.target.value);
                      setIsOmnibarOpen(true);
                    }}
                    onFocus={() => setIsOmnibarOpen(true)}
                    className="pl-9 pr-12 text-xs font-medium border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                  {rechercheOmnibar && (
                    <button
                      type="button"
                      onClick={() => setRechercheOmnibar("")}
                      className="absolute right-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* OmniBar Autocomplete Dropdown */}
                {isOmnibarOpen && catalogueFiltered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {catalogueFiltered.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => handleAjouterRubrique(r)}
                        className="w-full p-3 text-left hover:bg-purple-50/60 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-purple-100 text-purple-800">
                            {r.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                            {r.libelle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${r.cotisable?.toUpperCase() === 'OUI' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                            {r.cotisable?.toUpperCase() === 'OUI' ? 'CNAS OUI' : 'CNAS NON'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {r.imposable || 'IRG'}
                          </span>
                          <Plus className="w-4 h-4 text-purple-600 ml-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Rubriques List */}
              {lignes.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Aucune rubrique spécifique ajoutée. Utilisez la barre ci-dessus pour insérer des primes exceptionnelles ou retenues.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {lignes.map((l) => (
                    <div
                      key={l.code}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                          {l.code}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{l.libelle}</span>
                          <span className="text-[10px] text-slate-400">
                            {l.type_valeur === "Retenue (-)" ? "Retenue sur salaire" : "Gain brut"} · {l.categorie === "pourcentage" ? "En % du salaire" : "Montant DA direct"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          step={l.categorie === "pourcentage" ? "0.5" : "100"}
                          value={l.valeur_1 || ""}
                          onChange={(e) => handleModifierLigne(l.code, "valeur_1", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-28 h-8 font-mono text-xs font-bold bg-white text-right"
                        />
                        <span className="text-xs font-semibold text-slate-500 w-6">
                          {l.categorie === "pourcentage" ? "%" : "DA"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSupprimerLigne(l.code)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Retenues diverses (Avances, Mutuelle) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Avances & Retenues Personnalisées</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Déductions après IRG</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Cotisation Mutuelle (DA)</label>
                  <Input
                    name="cotisation_mutuelle"
                    type="number"
                    step="50"
                    placeholder="0.00 DA"
                    defaultValue={initialValues["cotisation_mutuelle"] || ""}
                    onChange={debounceCalcul}
                    className="h-8 font-mono text-xs font-bold bg-white text-right"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Avance / Acompte (DA)</label>
                  <Input
                    name="avance_salaire"
                    type="number"
                    step="100"
                    placeholder="0.00 DA"
                    defaultValue={initialValues["avance_salaire"] || ""}
                    onChange={debounceCalcul}
                    className="h-8 font-mono text-xs font-bold bg-white text-right"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Autre Retenue / Saisie (DA)</label>
                  <Input
                    name="retenue_sur_salaire"
                    type="number"
                    step="100"
                    placeholder="0.00 DA"
                    defaultValue={initialValues["retenue_sur_salaire"] || ""}
                    onChange={debounceCalcul}
                    className="h-8 font-mono text-xs font-bold bg-white text-right"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLONNE DROITE (5 cols) : STICKY LIVE CASCADE (LE BULLETIN VIVANT)
             ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 sticky top-6 flex flex-col gap-5">
            
            {/* Live Bulletin Card */}
            <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-6 shadow-sm">
              {/* Bulletin Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    BULLETIN EN TEMPS RÉEL (0 ms)
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{salarieActive.nom_prenom}</h3>
                  <p className="text-xs text-slate-400">Période : {MOIS[mois - 1]} {annee}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statut</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estEnregistre ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {estEnregistre ? 'Enregistré' : 'Brouillon actif'}
                  </span>
                </div>
              </div>

              {/* Big Hero Net to Pay */}
              <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 border border-indigo-100 text-center">
                <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider block">
                  Net à Payer (Virement / CCP)
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono tracking-tight block mt-1">
                  {resultat ? formatDA(resultat.net_a_payer) : "—"}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Arrondi réglementaire au Dinar (Loi de Finances)
                </span>
              </div>

              {/* Detailed Live Cascade */}
              {resultat ? (
                <div className="flex flex-col gap-2.5 text-xs font-medium border-t border-slate-100 pt-4">
                  {/* Total Brut */}
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">1</span>
                      <span className="font-bold text-slate-800">Total Gains Bruts</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900">{formatDA(resultat.total_gains)}</span>
                  </div>

                  {/* Assiette CNAS */}
                  <div className="flex items-center justify-between py-1 px-2.5 text-slate-500">
                    <span className="pl-7 text-[11px]">Assiette Cotisable CNAS (panier exclu) :</span>
                    <span className="font-mono">{formatDA(resultat.base_cnas)}</span>
                  </div>

                  {/* Retenue CNAS 9% */}
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px]">2</span>
                      <span className="font-bold text-rose-900">Cotisation CNAS Salariale (9%)</span>
                    </div>
                    <span className="font-mono font-extrabold text-rose-600">-{formatDA(resultat.retenue_cnas)}</span>
                  </div>

                  {/* Base IRG */}
                  <div className="flex items-center justify-between py-1 px-2.5 text-slate-500">
                    <span className="pl-7 text-[11px]">Base Imposable IRG (panier inclus) :</span>
                    <span className="font-mono">{formatDA(resultat.base_imposable_irg)}</span>
                  </div>

                  {/* Retenue IRG */}
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px]">3</span>
                      <div>
                        <span className="font-bold text-rose-900 block">Retenue IRG Nette (Art. 104)</span>
                        <span className="text-[10px] text-slate-500">Abattement 40% : -{formatDA(resultat.abattement_irg)}</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-rose-600">-{formatDA(resultat.retenue_irg_nette)}</span>
                  </div>

                  {/* Autres Retenues */}
                  {resultat.avance_salaire > 0 || resultat.cotisation_mutuelle > 0 || resultat.retenue_sur_salaire > 0 ? (
                    <div className="flex items-center justify-between py-1 px-2.5 text-slate-600">
                      <span className="pl-7 text-[11px]">Avances, Mutuelle & Saisies :</span>
                      <span className="font-mono font-semibold text-rose-600">
                        -{formatDA((resultat.avance_salaire || 0) + (resultat.cotisation_mutuelle || 0) + (resultat.retenue_sur_salaire || 0))}
                      </span>
                    </div>
                  ) : null}

                  {/* Coût Employeur Box */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-100/70 border border-slate-200/70 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>CNAS Patronale (26%) :</span>
                      <span className="font-mono font-bold">{formatDA(resultat.charge_patronale_cnas)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200">
                      <span>Coût Total Entreprise :</span>
                      <span className="font-mono text-indigo-700">{formatDA(resultat.cout_total_employeur)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-5">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isPending}
                  className="w-full gap-2 shadow-sm font-bold text-xs h-10"
                >
                  <Save className="w-4 h-4" /> Enregistrer ce bulletin
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsDrawerOpen(true)}
                    className="gap-1.5 text-xs h-9 font-semibold"
                  >
                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Explication
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    asChild
                    className="gap-1.5 text-xs h-9 font-semibold"
                  >
                    <Link
                      href={`/salaries/${salarieActive.id}/bulletin/pdf?annee=${annee}&mois=${mois}`}
                      target="_blank"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" /> Bulletin PDF
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </form>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Aucun salarié sélectionné</h3>
          <p className="text-xs text-slate-500 mt-1">Sélectionnez un collaborateur ci-dessus pour ouvrir le split-screen de paie.</p>
        </div>
      )}

      {/* ── VOLET LATÉRAL D'INSPECTION LÉGALE & FISCALE (DRAWER) ── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Inspection du Calcul & Conformité Fiscale"
        description={`Salarié : ${salarieActive?.nom_prenom} · Période : ${MOIS[mois - 1]} ${annee}`}
        size="lg"
      >
        {resultat && (
          <div className="flex flex-col gap-5 text-xs">
            {/* Box 1 : Loi 90-11 & Temps de travail */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Loi n°90-11 · Temps de Travail & Proratisation
              </span>
              <p className="text-slate-600">
                Durée légale mensuelle : <strong>{parametres.duree_legale_mensuelle}h</strong>.<br />
                Heures d'absence déduites : <strong>{resultat.total_heures_absence}h</strong>.<br />
                Heures travaillées effectives : <strong>{resultat.heures_travaillees}h</strong>.<br />
                Taux horaire = {formatDA(resultat.salaire_base_theorique)} ÷ {parametres.duree_legale_mensuelle}h = <strong>{formatDA(resultat.taux_horaire)}/h</strong>.
              </p>
            </div>

            {/* Box 2 : CNAS (Ord. 95-01 & Loi 83-11) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Sécurité Sociale · Décret n°06-373 & Ord. n°95-01
              </span>
              <p className="text-slate-600">
                Assiette cotisable : <strong>{formatDA(resultat.base_cnas)}</strong> (le panier de {formatDA(resultat.prime_panier)} et le transport sont exclus de l'assiette selon l'Art. 1 de l'Ord. n°95-01).<br />
                CNAS Salariale (9%) : <strong>{formatDA(resultat.retenue_cnas)}</strong>.<br />
                CNAS Patronale (26%) : <strong>{formatDA(resultat.charge_patronale_cnas)}</strong> (versée à la CNAS avant le 15 du mois suivant).
              </p>
            </div>

            {/* Box 3 : IRG (Art. 104 CIDTA) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-rose-700 uppercase tracking-wider block mb-1">
                Fiscalité Sociale · Art. 104 CIDTA & LF 2024–2025
              </span>
              <p className="text-slate-600">
                Base imposable : <strong>{formatDA(resultat.base_imposable_irg)}</strong>.<br />
                IRG brut barème : <strong>{formatDA(resultat.irg_brut)}</strong>.<br />
                Abattement légal 40% : <strong>{formatDA(resultat.abattement_irg)}</strong> (plafonné à 1 500 DA / min 1 000 DA).<br />
                IRG Net à retenir : <strong>{formatDA(resultat.retenue_irg_nette)}</strong>.
              </p>
            </div>

            {/* Link to Guide RH */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-indigo-950 block">Consulter l'encyclopédie juridique complète</span>
                <span className="text-[11px] text-indigo-700">Guide RH interactif, simulateur et textes officiels JORADP</span>
              </div>
              <Button variant="primary" size="sm" asChild className="shrink-0 gap-1.5 text-xs">
                <Link href="/guide" target="_blank">
                  Ouvrir le Guide <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
