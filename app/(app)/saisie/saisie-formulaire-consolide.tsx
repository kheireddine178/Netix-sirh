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

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Save, CheckCircle2, AlertCircle, FileText, Upload, Download, Copy, Users, User, ArrowLeft, ArrowRight, Activity, X, Plus, Search, Trash2, Calculator, Wallet, Clock, Info } from "lucide-react";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "%",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "DA",
  regularisation: "DA",
};

const CHAMPS_ABSENCES = [
  { name: "maladie_h", label: "Maladie (h)" },
  { name: "mise_a_pied_h", label: "Mise à pied (h)" },
  { name: "accident_travail_h", label: "Accident travail (h)" },
  { name: "retard_h", label: "Retard (h)" },
  { name: "absence_irreguliere_h", label: "Abs. irrégulière (h)" },
];

const CHAMPS_HEURES_SUP = [
  { name: "heures_sup_1", label: "Palier 1 (+50%)" },
  { name: "heures_sup_2", label: "Palier 2 (+75%)" },
  { name: "heures_sup_3", label: "Palier 3 (+100%)" },
];

const CHAMPS_PRIMES_MONTANT = [
  { name: "icr", label: "I.C.R (DA)" },
  { name: "panier_jours", label: "Panier — jours" },
  { name: "panier_forfait_jour", label: "Panier — forfait/jour (DA)" },
  { name: "autre_prime_fixe", label: "Autre prime fixe (DA)" },
];

const CHAMPS_PRIMES_POURCENTAGE = [
  { name: "taux_iep", label: "Taux I.E.P (%)" },
  { name: "taux_nuisance", label: "Taux nuisance (%)" },
  { name: "taux_responsabilite", label: "Taux responsabilité (%)" },
  { name: "taux_disponibilite", label: "Taux disponibilité (%)" },
  { name: "taux_pri", label: "Taux P.R.I (%)" },
  { name: "taux_prc", label: "Taux P.R.C (%)" },
];

const CHAMPS_RETENUES = [
  { name: "cotis_mutuelle", label: "Cotisation mutuelle (DA)" },
  { name: "autres_retenues", label: "Autres retenues (DA)" },
];

const CHAMPS_TAUX_POURCENTAGE = new Set(CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name));
const CHAMPS_TAUX_NOMS = CHAMPS_PRIMES_POURCENTAGE.map((c) => c.name);

function formatDA(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
}

interface LigneEtat {
  code: string;
  libelle: string | null;
  categorie: RubriqueCatalogue["categorie"];
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

function ligneVide(r: RubriqueCatalogue): LigneEtat {
  return {
    code: r.code,
    libelle: r.libelle,
    categorie: r.categorie,
    type_valeur: r.type_valeur,
    valeur_1: 0,
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const [recherche, setRecherche] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [estEnregistre, setEstEnregistre] = useState(false);

  // Nouveaux états UX
  const [saveStatus, setSaveStatus] = useState<"idle" | "modified" | "saving" | "saved" | "error">("idle");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prevMonthValues, setPrevMonthValues] = useState<Record<string, number>>({});
  const [prevMonthLignes, setPrevMonthLignes] = useState<{ code: string; valeur_1: number; valeur_2: number }[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Sync state during render when salarieActive or initialBulletin changes
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${salarieActive?.id || ""}_${anneeActive}_${moisActive}_${initialBulletin?.bulletin_id || 0}`;

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (salarieActive) {
      const isExistingSavedBulletin = Boolean(initialBulletin && initialBulletin.bulletin_id > 0);

      const champs = { ...(initialBulletin?.champs || {}) };
      for (const nom of CHAMPS_TAUX_NOMS) {
        champs[nom] = (champs[nom] ?? 0) * 100;
      }

      if (isExistingSavedBulletin) {
        const savedMap = new Map((initialBulletin?.rubriques || []).map((r) => [r.code, r]));
        const allCodes = new Set([
          ...rubriquesAssignees.map((r) => r.code),
          ...(initialBulletin?.rubriques || []).map((r) => r.code),
        ]);

        const mergedLignes: LigneEtat[] = Array.from(allCodes).map((code) => {
          const saved = savedMap.get(code);
          const assigned = rubriquesAssignees.find((r) => r.code === code);
          const cat = catalogueRubriques.find((cr) => cr.code === code);
          const categorie = saved?.categorie || assigned?.categorie || (cat ? categorieRubrique(code) : "montant_fixe");

          let v1 = 0;
          let v2 = 0;
          if (saved) {
            v1 = categorie === "pourcentage" ? (saved.valeur_1 <= 1 && saved.valeur_1 > 0 ? saved.valeur_1 * 100 : saved.valeur_1) : saved.valeur_1;
            v2 = saved.valeur_2;
          } else if (assigned) {
            const rawDef = assigned.valeur_defaut || 0;
            v1 = categorie === "pourcentage" ? (rawDef <= 1 && rawDef > 0 ? rawDef * 100 : rawDef) : rawDef;
            v2 = 0;
          }

          return {
            code,
            libelle: saved?.libelle || assigned?.libelle || cat?.libelle || code,
            categorie,
            type_valeur: cat?.type_valeur || assigned?.type_valeur || null,
            valeur_1: v1,
            valeur_2: v2,
          };
        }).sort((a: LigneEtat, b: LigneEtat) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(mergedLignes);
        setEstEnregistre(true);
        setSaveStatus("idle");
      } else {
        setInitialValues(champs);
        setLignes(rubriquesAssignees.map(ligneDepuisAssignee).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
        setEstEnregistre(false);
        setSaveStatus("idle");
      }
      setFormKey((k) => k + 1);
    } else {
      setInitialValues({});
      setLignes([]);
      setResultat(null);
      setEstEnregistre(false);
      setSaveStatus("idle");
    }
  }

  // Charger le mois précédent pour comparaison inline
  useEffect(() => {
    if (!salarieActive) {
      setPrevMonthValues({});
      setPrevMonthLignes([]);
      return;
    }
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;
    
    chargerBulletinPourSaisie(salarieActive.id, prevAnnee, prevMois).then((donnees) => {
      if (donnees) {
        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }
        setPrevMonthValues({
          ...champs,
          salaire_base_theorique: donnees.champs.salaire_base_theorique,
        });
        setPrevMonthLignes(donnees.rubriques.map((r) => ({
          code: r.code,
          valeur_1: r.categorie === "pourcentage" ? (r.valeur_1 <= 1 && r.valeur_1 > 0 ? r.valeur_1 * 100 : r.valeur_1) : r.valeur_1,
          valeur_2: r.valeur_2,
        })));
      } else {
        setPrevMonthValues({});
        setPrevMonthLignes([]);
      }
    });
  }, [salarieActive?.id, mois, annee]);

  const codesDejaAjoutes = useMemo(() => new Set(lignes.map((l) => l.code)), [lignes]);

  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return catalogueRubriques.filter((r) => !codesDejaAjoutes.has(r.code)).slice(0, 10);
    return catalogueRubriques
      .filter((r) => !codesDejaAjoutes.has(r.code))
      .filter((r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q))
      .slice(0, 10);
  }, [recherche, catalogueRubriques, codesDejaAjoutes]);

  // Execute live calculation from DOM form values & Trigger auto-save
  const executerCalculLive = () => {
    if (!formRef.current || !salarieActive) return;
    const formData = new FormData(formRef.current);
    const num = (name: string) => {
      const val = formData.get(name);
      return val ? parseFloat(val.toString()) || 0 : 0;
    };

    const champsAbsences = {
      salaire_base_theorique: num("salaire_base_theorique") || salarieActive.salaire_base_theorique,
      maladie_h: num("maladie_h"),
      mise_a_pied_h: num("mise_a_pied_h"),
      accident_travail_h: num("accident_travail_h"),
      retard_h: num("retard_h"),
      absence_irreguliere_h: num("absence_irreguliere_h"),
    };

    // Smart Guardrails / Warnings
    const warnings: string[] = [];
    if (champsAbsences.salaire_base_theorique < 24000) {
      warnings.push("Salaire théorique inférieur au SNMG légal (24 000 DA).");
    }
    const totAbs = champsAbsences.maladie_h + champsAbsences.mise_a_pied_h + champsAbsences.accident_travail_h + champsAbsences.retard_h + champsAbsences.absence_irreguliere_h;
    if (totAbs > 173.33) {
      warnings.push("Le total des absences dépasse la durée légale mensuelle (173.33 h).");
    }
    const hs1 = num("heures_sup_1");
    const hs2 = num("heures_sup_2");
    const hs3 = num("heures_sup_3");
    if (hs1 + hs2 + hs3 > 80) {
      warnings.push("Attention : cumul d'heures supplémentaires très élevé (> 80 h).");
    }
    setValidationWarnings(warnings);

    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, parametres);

    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const ligne of lignes) {
      const catRow = catalogueRubriques.find((cr) => cr.code === ligne.code);
      if (!catRow) continue;
      const rawV1 = ligne.valeur_1;
      const v1 = ligne.categorie === "pourcentage" ? (rawV1 > 1 ? rawV1 / 100 : rawV1) : rawV1;
      const v2 = ligne.categorie === "nombre_x_taux" ? ligne.valeur_2 : 0;

      const res = resoudreLigneRubrique(catRow, v1, v2, salaire_base_reel);
      if (res) {
        rubriques_dynamiques.push(res);
      }
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: hs1,
      heures_sup_2: hs2,
      heures_sup_3: hs3,
      icr: num("icr"),
      taux_iep: num("taux_iep") / 100,
      taux_nuisance: num("taux_nuisance") / 100,
      taux_responsabilite: num("taux_responsabilite") / 100,
      taux_disponibilite: num("taux_disponibilite") / 100,
      taux_pri: num("taux_pri") / 100,
      taux_prc: num("taux_prc") / 100,
      panier_jours: num("panier_jours"),
      panier_forfait_jour: num("panier_forfait_jour"),
      autre_prime_fixe: num("autre_prime_fixe"),
      cotis_mutuelle: num("cotis_mutuelle"),
      autres_retenues: num("autres_retenues"),
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, parametres);
    setResultat({
      ...res,
      nom_prenom: salarieActive.nom_prenom,
      matricule: salarieActive.matricule,
      fonction: salarieActive.fonction,
      mois,
      annee,
    });
  };

  const debouncedCalcul = () => {
    if (calculTimeoutRef.current) clearTimeout(calculTimeoutRef.current);
    calculTimeoutRef.current = setTimeout(() => {
      executerCalculLive();
      setSaveStatus("modified");
    }, 150);
  };
  const debounceCalcul = debouncedCalcul;

  useEffect(() => {
    if (salarieActive) {
      executerCalculLive();
    }
  }, [formKey, lignes, salarieActive?.id, parametres]);

  function handleChangerSalarie(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSalarieId(id);
    if (id) {
      router.push(`/saisie?salarieId=${id}&annee=${annee}&mois=${mois}`);
    } else {
      router.push(`/saisie?annee=${annee}&mois=${mois}`);
    }
  }

  function handleChangerMois(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = parseInt(e.target.value, 10);
    setMois(m);
    if (salarieId) {
      router.push(`/saisie?salarieId=${salarieId}&annee=${annee}&mois=${m}`);
    } else {
      router.push(`/saisie?annee=${annee}&mois=${m}`);
    }
  }

  function handleChangerAnnee(e: React.ChangeEvent<HTMLInputElement>) {
    const a = parseInt(e.target.value, 10) || new Date().getFullYear();
    setAnnee(a);
    if (salarieId) {
      router.push(`/saisie?salarieId=${salarieId}&annee=${a}&mois=${mois}`);
    } else {
      router.push(`/saisie?annee=${a}&mois=${mois}`);
    }
  }

  function handleCopierMoisPrecedent() {
    if (!salarieActive) return;
    const prevMois = mois === 1 ? 12 : mois - 1;
    const prevAnnee = mois === 1 ? annee - 1 : annee;

    startTransition(async () => {
      try {
        const donnees = await chargerBulletinPourSaisie(salarieActive.id, prevAnnee, prevMois);
        if (!donnees) {
          setErreur(`Aucun bulletin trouvé pour ${MOIS[prevMois - 1]} ${prevAnnee}.`);
          return;
        }

        const champs = { ...donnees.champs };
        for (const nom of CHAMPS_TAUX_NOMS) {
          champs[nom] = (champs[nom] ?? 0) * 100;
        }

        const savedMap = new Map(donnees.rubriques.map((r) => [r.code, r]));
        const allCodes = new Set([
          ...rubriquesAssignees.map((r) => r.code),
          ...donnees.rubriques.map((r) => r.code),
        ]);

        const lignesChargees: LigneEtat[] = Array.from(allCodes).map((code) => {
          const saved = savedMap.get(code);
          const assigned = rubriquesAssignees.find((r) => r.code === code);
          const cat = catalogueRubriques.find((cr) => cr.code === code);
          const categorie = saved?.categorie || assigned?.categorie || (cat ? categorieRubrique(code) : "montant_fixe");

          let v1 = 0;
          let v2 = 0;
          if (saved) {
            v1 = categorie === "pourcentage" ? (saved.valeur_1 <= 1 && saved.valeur_1 > 0 ? saved.valeur_1 * 100 : saved.valeur_1) : saved.valeur_1;
            v2 = saved.valeur_2;
          } else if (assigned) {
            const rawDef = assigned.valeur_defaut || 0;
            v1 = categorie === "pourcentage" ? (rawDef <= 1 && rawDef > 0 ? rawDef * 100 : rawDef) : rawDef;
            v2 = 0;
          }

          return {
            code,
            libelle: saved?.libelle || assigned?.libelle || cat?.libelle || code,
            categorie,
            type_valeur: cat?.type_valeur || assigned?.type_valeur || null,
            valeur_1: v1,
            valeur_2: v2,
          };
        }).sort((a: LigneEtat, b: LigneEtat) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        setInitialValues(champs);
        setLignes(lignesChargees);
        setFormKey((k) => k + 1);
        setMessageCharge(`Données copiées depuis ${MOIS[prevMois - 1]} ${prevAnnee}.`);
        setErreur(null);
        setEstEnregistre(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de copie");
      }
    });
  }

  async function handleCopierMasse() {
    if (!confirm(`Voulez-vous copier les bulletins de TOUS les salariés du mois précédent vers ${MOIS[mois - 1]} ${annee} ?`)) return;
    startTransition(async () => {
      try {
        const res = await copierMoisPrecedentMasse(annee, mois);
        setMessageCharge(`${res.nbCopies} bulletins ont été copiés en masse avec succès.`);
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur lors de la copie de masse");
      }
    });
  }

  function ajouterRubrique(r: RubriqueCatalogue) {
    if (codesDejaAjoutes.has(r.code)) return;
    const nouvelleLigne = ligneVide(r);
    setLignes((prev) => [...prev, nouvelleLigne].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
    setRecherche("");
    setIsAddMenuOpen(false);

    if (salarieActive) {
      startTransition(async () => {
        try {
          await ajouterRubriqueSalarie(salarieActive.id, r.code);
        } catch {
          // Échec silencieux
        }
      });
    }
  }

  function retirerRubrique(code: string) {
    setLignes((prev) => prev.filter((l) => l.code !== code));
    if (salarieActive) {
      startTransition(async () => {
        try {
          await retirerRubriqueSalarie(salarieActive.id, code);
        } catch {
          // Échec silencieux
        }
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;
      const inputs = Array.from(
        form.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]):not([disabled])')
      );
      const idx = inputs.indexOf(e.target as HTMLInputElement);
      if (idx > -1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      } else {
        inputs[0]?.focus();
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!salarieActive) return;

    setErreur(null);
    setMessageCharge(null);
    setSaveStatus("saving");

    const formData = new FormData(e.currentTarget);
    for (const champ of CHAMPS_TAUX_POURCENTAGE) {
      const brut = formData.get(champ);
      if (brut !== null) {
        const valeur = parseFloat(brut.toString().replace(",", "."));
        formData.set(champ, isNaN(valeur) ? "0" : String(valeur / 100));
      }
    }

    // Injection explicite garantie de toutes les rubriques dynamiques
    for (const l of lignes) {
      const v1Val = l.categorie === "pourcentage" ? (l.valeur_1 > 1 ? l.valeur_1 / 100 : l.valeur_1) : l.valeur_1;
      formData.set(`dyn_${l.code}_v1`, String(v1Val));
      if (l.categorie === "nombre_x_taux") {
        formData.set(`dyn_${l.code}_v2`, String(l.valeur_2));
      }
    }

    startTransition(async () => {
      try {
        const r = await creerBulletin(salarieActive.id, formData);
        setResultat(r);
        setEstEnregistre(true);
        setSaveStatus("saved");
        setMessageCharge("Le bulletin a été validé et enregistré avec succès en base de données.");
        router.refresh();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
        setSaveStatus("error");
      }
    });
  }

  async function handleSupprimer() {
    if (!salarieActive || !initialBulletin?.bulletin_id) return;
    if (!confirm("Voulez-vous vraiment supprimer ce bulletin ?")) return;

    startTransition(async () => {
      try {
        await supprimerBulletin(salarieActive.id, initialBulletin.bulletin_id);
        router.refresh();
        setMessageCharge("Le bulletin a été supprimé.");
        setResultat(null);
        setLignes([]);
        setFormKey((k) => k + 1);
        setEstEnregistre(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de suppression");
      }
    });
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!salarieActive) return;
    const rows = [
      ["Propriete", "Valeur"],
      ["matricule", salarieActive.matricule || ""],
      ["nom_prenom", salarieActive.nom_prenom],
      ["salaire_base_theorique", String(initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique)],
      ...CHAMPS_ABSENCES.map((c) => [c.name, String(initialValues[c.name] ?? 0)]),
      ...CHAMPS_HEURES_SUP.map((c) => [c.name, String(initialValues[c.name] ?? 0)]),
      ...lignes.map((l) => [`dyn_${l.code}_v1`, String(l.valeur_1)]),
      ...lignes.filter(l => l.categorie === "nombre_x_taux").map((l) => [`dyn_${l.code}_v2`, String(l.valeur_2)]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Variables_${salarieActive.matricule || "Salarie"}_${mois}_${annee}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const parsedValues: Record<string, number> = {};
      const linesArr = text.split("\n");
      const nextLignes = [...lignes];

      for (const line of linesArr) {
        const parts = line.split(",");
        if (parts.length < 2) continue;
        const key = parts[0].trim();
        const val = parseFloat(parts[1].trim()) || 0;
        
        if (key.startsWith("dyn_")) {
          const m = key.match(/dyn_([^_]+)_(v1|v2)/);
          if (m) {
            const code = m[1];
            const field = m[2];
            const idx = nextLignes.findIndex(l => l.code === code);
            if (idx > -1) {
              if (field === "v1") nextLignes[idx].valeur_1 = val;
              if (field === "v2") nextLignes[idx].valeur_2 = val;
            }
          }
        } else {
          parsedValues[key] = val;
        }
      }

      setInitialValues((prev) => ({ ...prev, ...parsedValues }));
      setLignes(nextLignes);
      setFormKey((k) => k + 1);
      setMessageCharge("Variables CSV importées avec succès.");
      setSaveStatus("modified");
    };
    reader.readAsText(file);
  };

  // Handlers pour le Pager Odoo
  const handlePrevEmployee = () => {
    if (pagerInfo?.prevId) {
      router.push(`/saisie?salarieId=${pagerInfo.prevId}&annee=${annee}&mois=${mois}`);
    }
  };

  const handleNextEmployee = () => {
    if (pagerInfo?.nextId) {
      router.push(`/saisie?salarieId=${pagerInfo.nextId}&annee=${annee}&mois=${mois}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4">
        {/* Navigation & Secondary Actions */}
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Link href="/saisie" className="flex items-center gap-2 hover:text-[#4F46E5] transition-colors bg-[#F8FAFC] px-3 py-1.5 rounded-md font-medium text-[#4F46E5]">
            <User className="w-4 h-4" /> Saisie individuelle
          </Link>
          <Link href="/saisie/collective" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <Users className="w-4 h-4" /> Grille collective
          </Link>
          <Link href="/saisie/avances" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <Wallet className="w-4 h-4" /> Acomptes & Avances
          </Link>
        </div>

        <PageHeader
          title={salarieActive ? `Bulletin: ${salarieActive.nom_prenom}` : "Saisie Mensuelle"}
          subtitle={`Période: ${MOIS[mois - 1]} ${annee}`}
          primaryAction={
            <Button
              variant="primary"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isPending || !salarieActive}
              className="gap-2"
            >
              <Save className="w-4 h-4 text-white" /> {isPending ? "Enregistrement…" : "Enregistrer le bulletin"}
            </Button>
          }
          secondaryActions={
            <>
              {salarieActive && (
                <Button variant="secondary" onClick={handleCopierMoisPrecedent} disabled={isPending} className="gap-2">
                  <Copy className="w-4 h-4" /> Copier mois précédent
                </Button>
              )}
              {salarieActive && resultat && (
                <Button variant="secondary" onClick={() => setIsDrawerOpen(true)} className="gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Inspecter le calcul
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Messages */}
      {erreur && (
        <div className="p-4 rounded-lg flex items-center gap-3 text-sm font-medium border bg-red-50 text-red-800 border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {erreur}
        </div>
      )}
      {messageCharge && (
        <div className="p-4 rounded-lg flex items-center gap-3 text-sm font-medium border bg-teal-50 text-teal-800 border-teal-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {messageCharge}
        </div>
      )}

      {/* Selector & Pager */}
      <Card className="bg-[#F8FAFC] border-[#E2E8F0]">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Collaborateur</label>
              <select
                value={salarieId}
                onChange={handleChangerSalarie}
                className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm font-medium focus:ring-2 focus:ring-[#4F46E5] focus:outline-none min-w-[220px]"
              >
                <option value="">Choisir un salarié…</option>
                {salaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom_prenom} {s.matricule ? `(${s.matricule})` : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Période</label>
              <div className="flex items-center gap-2">
                <select
                  value={mois}
                  onChange={handleChangerMois}
                  className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm font-medium focus:ring-2 focus:ring-[#4F46E5] focus:outline-none w-32"
                >
                  {MOIS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={annee}
                  onChange={handleChangerAnnee}
                  className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm font-medium focus:ring-2 focus:ring-[#4F46E5] focus:outline-none w-24"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saveStatus === "saving" && <span className="text-xs font-medium text-amber-600 animate-pulse flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Enregistrement…</span>}
            {saveStatus === "saved" && <span className="text-xs font-medium text-teal-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Enregistré</span>}
            {saveStatus === "modified" && <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Modifié (non validé)</span>}
            
            <div className="h-6 w-px bg-[#E2E8F0]" />
            
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={!salarieActive} className="gap-1.5 h-8 text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <Button variant="secondary" size="sm" className="gap-1.5 h-8 text-xs font-medium" disabled={!salarieActive}>
                  <Upload className="w-3.5 h-3.5" /> Import
                </Button>
              </div>
            </div>

            {pagerInfo && (
              <>
                <div className="h-6 w-px bg-[#E2E8F0]" />
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="icon" className="h-8 w-8" disabled={!pagerInfo.prevId} onClick={handlePrevEmployee}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium text-[#64748B] w-12 text-center">
                    {pagerInfo.current} / {pagerInfo.total}
                  </span>
                  <Button variant="secondary" size="icon" className="h-8 w-8" disabled={!pagerInfo.nextId} onClick={handleNextEmployee}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {validationWarnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {validationWarnings.map((w, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {salarieActive ? (
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
          <input type="hidden" name="annee" value={annee} />
          <input type="hidden" name="mois" value={mois} />
          
          {/* Status Bar & Synthèse Live Instantanée */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${estEnregistre ? 'bg-teal-100 text-teal-800' : (resultat ? 'bg-indigo-100 text-[#4F46E5]' : 'bg-slate-100 text-[#64748B]')}`}>
                {estEnregistre ? '3. Validé & Enregistré' : (resultat ? '2. Calculé en direct' : '1. Brouillon')}
              </span>
              {saveStatus === "saving" && <span className="text-xs text-[#64748B] animate-pulse">Enregistrement en cours…</span>}
              {saveStatus === "saved" && <span className="text-xs text-teal-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Enregistré</span>}
              {saveStatus === "modified" && <span className="text-xs text-amber-700 font-semibold">• Non enregistré</span>}
            </div>

            {/* Quick KPI Live Preview */}
            {resultat && (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748B]">Brut :</span>
                  <span className="font-bold text-[#0F172A] font-mono">{formatDA(resultat.total_gains)}</span>
                </div>
                <div className="h-3.5 w-px bg-[#E2E8F0] hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748B]">CNAS (9%) :</span>
                  <span className="font-bold text-red-600 font-mono">-{formatDA(resultat.retenue_cnas)}</span>
                </div>
                <div className="h-3.5 w-px bg-[#E2E8F0] hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748B]">IRG :</span>
                  <span className="font-bold text-red-600 font-mono">-{formatDA(resultat.retenue_irg_nette)}</span>
                </div>
                <div className="h-3.5 w-px bg-[#E2E8F0] hidden sm:block" />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEF2FF] border border-[#E0E7FF]">
                  <span className="font-bold text-[#4F46E5]">NET À PAYER :</span>
                  <span className="font-extrabold text-[#4F46E5] font-mono text-sm">{formatDA(resultat.net_a_payer)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !salarieActive}
                className="gap-2 h-9 text-xs"
              >
                <Save className="w-4 h-4 text-white" /> {isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
              {initialBulletin?.bulletin_id && (
                <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 h-9 text-xs" onClick={handleSupprimer}>
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="base" className="w-full">
            <TabsList className="bg-[#F8FAFC] border border-[#E2E8F0] p-1 w-full justify-start rounded-lg h-auto flex-wrap gap-1">
              <TabsTrigger value="base" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-sm rounded-md py-2 px-4">
                <FileText className="w-4 h-4" /> Données de Base
              </TabsTrigger>
              <TabsTrigger value="variables" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-sm rounded-md py-2 px-4">
                <Activity className="w-4 h-4" /> Variables du Mois
              </TabsTrigger>
              <TabsTrigger value="cotisations" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-sm rounded-md py-2 px-4">
                <Calculator className="w-4 h-4" /> Cotisations & Synthèse
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* TAB 1 : Données de Base */}
              <TabsContent value="base" className="m-0 focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Profil et Contrat */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-[#0F172A]"><User className="w-4 h-4 text-[#4F46E5]" /> Profil & Contrat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 text-sm">
                      <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Matricule</span>
                        <span className="font-semibold text-[#0F172A]">{salarieActive.matricule || "-"}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Type de contrat</span>
                        <span className="font-semibold text-[#0F172A]">{salarieActive.type_contrat}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Fonction</span>
                        <span className="font-semibold text-[#0F172A]">{salarieActive.fonction || "-"}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Date de naissance</span>
                        <span className="font-semibold text-[#0F172A]">
                          {salarieActive.date_naissance ? new Date(salarieActive.date_naissance).toLocaleDateString('fr-FR') : "-"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paramètres Salariaux */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-[#0F172A]"><Wallet className="w-4 h-4 text-emerald-600" /> Paramètres Salariaux</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">Salaire de base (DA)</label>
                        <Input
                          name="salaire_base_theorique"
                          type="number"
                          step="0.01"
                          defaultValue={initialValues["salaire_base_theorique"] ?? salarieActive.salaire_base_theorique}
                          onChange={debounceCalcul}
                          className="font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] mt-2 text-sm">
                        <span className="text-[#64748B]">Situation familiale</span>
                        <Badge variant="neutral" className="font-medium bg-[#F8FAFC]">
                          {salarieActive.situation_familiale} {salarieActive.nombre_enfants > 0 ? `(${salarieActive.nombre_enfants})` : ""}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] text-sm">
                        <span className="text-[#64748B]">Travailleur handicapé</span>
                        <span className="font-semibold">{salarieActive.est_handicape ? "Oui" : "Non"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* TAB 2 : Variables du Mois */}
              <TabsContent value="variables" className="m-0 focus:outline-none flex flex-col gap-8">
                
                {/* 2.1 Absences & HS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Absences */}
                  <Card className="border-red-100">
                    <CardHeader className="pb-4 bg-red-50/50 border-b border-red-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <CardTitle className="text-sm text-red-900">Absences & Retards</CardTitle>
                        <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700 hover:bg-red-100 border-none">Déduit du base</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {CHAMPS_ABSENCES.map((c) => (
                        <div key={c.name} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-[#64748B]">{c.label}</label>
                          <Input
                            name={c.name}
                            type="number"
                            step="0.01"
                            defaultValue={initialValues[c.name] ?? 0}
                            onChange={debounceCalcul}
                            onFocus={(e) => e.target.select()}
                            className="text-center font-mono"
                          />
                          {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                            <span className="text-[10px] text-center text-[#64748B]">Mois préc: {prevMonthValues[c.name]}h</span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Heures Sup */}
                  <Card className="border-teal-100">
                    <CardHeader className="pb-4 bg-teal-50/50 border-b border-teal-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <CardTitle className="text-sm text-teal-900">Heures Supplémentaires</CardTitle>
                        <Badge variant="secondary" className="ml-auto bg-teal-100 text-teal-800 hover:bg-teal-100 border-none">Majorations</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-3 gap-4">
                      {CHAMPS_HEURES_SUP.map((c) => (
                        <div key={c.name} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-[#64748B]">{c.label}</label>
                          <Input
                            name={c.name}
                            type="number"
                            step="0.01"
                            defaultValue={initialValues[c.name] ?? 0}
                            onChange={debounceCalcul}
                            onFocus={(e) => e.target.select()}
                            className="text-center font-mono"
                          />
                          {prevMonthValues[c.name] !== undefined && prevMonthValues[c.name] > 0 && (
                            <span className="text-[10px] text-center text-[#64748B]">Mois préc: {prevMonthValues[c.name]}h</span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* 2.2 Primes & Rubriques Dynamiques */}
                <Card>
                  <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-[#4F46E5]" />
                      <CardTitle className="text-sm">Primes, Indemnités & Retenues (Rubriques)</CardTitle>
                    </div>
                    <div className="relative">
                      {isAddMenuOpen ? (
                        <div className="absolute right-0 top-0 z-10 w-72 bg-white rounded-lg shadow-xl border border-[#E2E8F0] flex flex-col">
                          <div className="p-2 border-b border-[#E2E8F0] flex items-center gap-2">
                            <Search className="w-4 h-4 text-[#64748B]" />
                            <input
                              autoFocus
                              type="text"
                              value={recherche}
                              onChange={(e) => setRecherche(e.target.value)}
                              placeholder="Rechercher une rubrique..."
                              className="text-sm flex-1 outline-none"
                            />
                            <button type="button" onClick={() => setIsAddMenuOpen(false)} className="text-[#64748B] hover:text-[#0F172A]"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {resultatsRecherche.length === 0 ? (
                              <div className="p-3 text-sm text-[#64748B] text-center">Aucune rubrique disponible</div>
                            ) : (
                              resultatsRecherche.map((r) => (
                                <button
                                  key={r.code}
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-0"
                                  onClick={() => ajouterRubrique(r)}
                                >
                                  <div className="font-semibold text-[#0F172A]">{r.code} - {r.libelle}</div>
                                  <div className="text-[10px] text-[#64748B] uppercase">{r.categorie}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddMenuOpen(true)} className="gap-2 h-8">
                          <Plus className="w-4 h-4" /> Ajouter une rubrique
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <th className="p-3 font-semibold text-[#64748B] w-24">Code</th>
                            <th className="p-3 font-semibold text-[#64748B]">Rubrique</th>
                            <th className="p-3 font-semibold text-[#64748B] w-44 text-right">Taux (%) / Montant / Nbre</th>
                            <th className="p-3 font-semibold text-[#64748B] w-36 text-right">Taux unit. (DA)</th>
                            <th className="p-3 font-semibold text-[#64748B] w-36 text-right">Montant calculé</th>
                            <th className="p-3 font-semibold text-[#64748B] w-12 text-center">Act.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {lignes.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-[#64748B]">Aucune rubrique assignée.</td>
                            </tr>
                          )}
                          {lignes.map((l, idx) => {
                            const detail = resultat?.detail_rubriques?.find((d) => d.code === l.code);
                            let montantLigne = 0;
                            let isRetenue = l.libelle?.includes("R-") || (!l.libelle?.includes("R+") && l.type_valeur === "Retenue (-)");

                            if (detail) {
                              montantLigne = detail.montant;
                              isRetenue = detail.sens === "retenue";
                            } else {
                              const baseRef = resultat?.salaire_base_reel ?? salarieActive?.salaire_base_theorique ?? 0;
                              if (l.categorie === "pourcentage") {
                                montantLigne = baseRef * (l.valeur_1 / 100);
                              } else if (l.categorie === "nombre_x_taux") {
                                montantLigne = l.valeur_1 * l.valeur_2;
                              } else {
                                montantLigne = l.valeur_1;
                              }
                            }

                            return (
                              <tr key={l.code} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                <td className="p-3 font-mono font-medium text-[#0F172A]">{l.code}</td>
                                <td className="p-3">
                                  <div className="font-medium text-[#0F172A]">{l.libelle}</div>
                                  <div className="text-[10px] text-[#64748B] uppercase">{LABELS_CATEGORIE[l.categorie]}</div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Input
                                      name={`dyn_${l.code}_v1`}
                                      type="number"
                                      step="0.01"
                                      placeholder="0"
                                      value={l.valeur_1 === 0 ? "" : l.valeur_1}
                                      onChange={(e) => {
                                        const nl = [...lignes];
                                        const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                        nl[idx] = { ...nl[idx], valeur_1: val };
                                        setLignes(nl);
                                        debounceCalcul();
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="w-28 text-right font-mono"
                                    />
                                    <span className="text-xs text-[#64748B] w-6 text-left font-medium">
                                      {l.categorie === "pourcentage" ? "%" : (l.categorie === "nombre_x_taux" ? "j/h" : "DA")}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  {l.categorie === "nombre_x_taux" ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Input
                                        name={`dyn_${l.code}_v2`}
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        value={l.valeur_2 === 0 ? "" : l.valeur_2}
                                        onChange={(e) => {
                                          const nl = [...lignes];
                                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                          nl[idx] = { ...nl[idx], valeur_2: val };
                                          setLignes(nl);
                                          debounceCalcul();
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-28 text-right font-mono"
                                      />
                                      <span className="text-xs text-[#64748B] w-6 text-left font-medium">DA</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-[#94A3B8]">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-semibold text-xs">
                                  {montantLigne !== 0 ? (
                                    <span className={isRetenue ? "text-red-600" : "text-emerald-700"}>
                                      {isRetenue ? "-" : "+"}{formatDA(Math.abs(montantLigne))}
                                    </span>
                                  ) : (
                                    <span className="text-[#94A3B8]">0.00 DA</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => retirerRubrique(l.code)} className="h-8 w-8 text-[#64748B] hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3 : Cotisations & Synthèse */}
              <TabsContent value="cotisations" className="m-0 focus:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Synthèse Retenues */}
                  <Card>
                    <CardHeader className="pb-4 border-b border-[#E2E8F0]">
                      <CardTitle className="text-sm">Retenues Salariales & Fiscales</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Assiette CNAS cotisable</span>
                        <span className="font-semibold font-mono">{formatDA(resultat ? resultat.base_cnas : 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Retenue CNAS Salarié (9%)</span>
                        <span className="font-bold text-red-600 font-mono">{formatDA(resultat ? resultat.retenue_cnas : 0)}</span>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[#64748B]">Base Imposable IRG</span>
                        <span className="font-semibold font-mono">{formatDA(resultat ? resultat.base_imposable_irg : 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">IRG Net prélevé</span>
                        <span className="font-bold text-red-600 font-mono">{formatDA(resultat ? resultat.retenue_irg_nette : 0)}</span>
                      </div>
                      <div className="flex justify-between pt-3 mt-1 border-t border-[#E2E8F0] font-bold">
                        <span>Total Retenues Salarié</span>
                        <span className="text-red-700 font-mono">{formatDA(resultat ? resultat.total_retenues : 0)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charges Patronales */}
                  <Card>
                    <CardHeader className="pb-4 border-b border-[#E2E8F0]">
                      <CardTitle className="text-sm">Charges & Coût Total Employeur</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Salaire Brut (Total gains)</span>
                        <span className="font-semibold font-mono">{formatDA(resultat ? resultat.total_gains : 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Cotisation CNAS Employeur (26%)</span>
                        <span className="font-bold text-amber-700 font-mono">{formatDA(resultat ? resultat.base_cnas * 0.26 : 0)}</span>
                      </div>
                      <div className="flex justify-between pt-3 mt-1 border-t border-[#E2E8F0] font-bold">
                        <span>Coût Global Employeur</span>
                        <span className="text-base text-[#4F46E5] font-mono">{formatDA(resultat ? resultat.cout_total_employeur : 0)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-[#64748B]">
            <Users className="w-12 h-12 mx-auto text-[#CBD5E1] mb-4" />
            <p>Sélectionnez un salarié dans la barre supérieure pour afficher sa fiche de paie.</p>
          </CardContent>
        </Card>
      )}

      {/* DRAWER INSPECTEUR */}
      {isDrawerOpen && salarieActive && resultat && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}>
          <div className="w-full max-w-lg h-full overflow-y-auto bg-white p-6 flex flex-col gap-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" /> Détails du calcul
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="flex flex-col gap-4 text-sm font-mono">
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">1. Base & Absences</div>
                <div className="flex justify-between text-[#64748B]"><span>Base théorique</span><span>{formatDA(resultat.salaire_base_reel + (resultat.total_heures_absence * (resultat.salaire_base_reel / 173.33)))}</span></div>
                <div className="flex justify-between text-[#64748B]"><span>Heures déduites</span><span>{resultat.total_heures_absence} h</span></div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]"><span>Base réelle</span><span>{formatDA(resultat.salaire_base_reel)}</span></div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">2. Primes & Heures Sup</div>
                <div className="flex justify-between text-[#64748B]"><span>Heures supplémentaires</span><span>{formatDA(resultat.total_heures_sup_da)}</span></div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]"><span>Total Brut</span><span>{formatDA(resultat.total_gains)}</span></div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">3. Cotisations CNAS</div>
                <div className="flex justify-between text-[#64748B]"><span>Assiette CNAS</span><span>{formatDA(resultat.base_cnas)}</span></div>
                <div className="flex justify-between text-[#64748B]"><span>Part salariale 9%</span><span>{formatDA(resultat.retenue_cnas)}</span></div>
                <div className="flex justify-between text-[#64748B]"><span>Part patronale 26%</span><span>{formatDA(resultat.base_cnas * 0.26)}</span></div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
                <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">4. Barème IRG 2022/2026</div>
                <div className="flex justify-between text-[#64748B]"><span>Base IRG</span><span>{formatDA(resultat.base_imposable_irg)}</span></div>
                <div className="flex justify-between text-[#64748B]"><span>IRG Brut</span><span>{formatDA(resultat.irg_brut)}</span></div>
                <div className="flex justify-between text-[#64748B]"><span>Abattement 40%</span><span>{formatDA(resultat.abattement_irg)}</span></div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]"><span>IRG Net</span><span>{formatDA(resultat.retenue_irg_nette)}</span></div>
              </div>

              <div className="p-5 rounded-lg bg-purple-50 border border-purple-200 text-[#0F172A] flex justify-between items-center text-base font-bold">
                <span>NET À PAYER</span>
                <span className="text-purple-700 text-lg">{formatDA(resultat.net_a_payer)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
