"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  HelpCircle,
} from "lucide-react";
import { Stepper, StepItem } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDA } from "@/lib/utils";

interface SalarieWizardFormProps {
  actionSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
}

export default function SalarieWizardForm({ actionSubmit }: SalarieWizardFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Étape 1 : Identité
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("1992-05-14");
  const [lieuNaissance, setLieuNaissance] = useState("Alger");
  const [numeroCnas, setNumeroCnas] = useState("");
  const [situationFamiliale, setSituationFamiliale] = useState("celibataire");
  const [enfantsACharge, setEnfantsACharge] = useState(0);

  // Étape 2 : Poste & Organisation
  const [matricule, setMatricule] = useState(`EMP-${Math.floor(100 + Math.random() * 900)}`);
  const [departement, setDepartement] = useState("Direction Technique");
  const [fonction, setFonction] = useState("");
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().slice(0, 10));
  const [dateVisiteMedicale, setDateVisiteMedicale] = useState(new Date().toISOString().slice(0, 10));

  // Étape 3 : Rémunération & Contrat
  const [typeContrat, setTypeContrat] = useState("CDI");
  const [dateFinContrat, setDateFinContrat] = useState("");
  const [periodeEssaiMois, setPeriodeEssaiMois] = useState(3);
  const [salaireBase, setSalaireBase] = useState<number>(45000);
  const [ccpRib, setCcpRib] = useState("");
  const [modePaiement, setModePaiement] = useState("Virement bancaire");

  // Erreurs de validation par champ
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const STEPS: StepItem[] = [
    { id: 0, title: "1. Identité & État Civil", description: "Nom, prénom, N° CNAS, naissance" },
    { id: 1, title: "2. Poste & Organisation", description: "Matricule, service, fonction" },
    { id: 2, title: "3. Rémunération & Contrat", description: "Salaire, SNMG, RIB bancaire" },
  ];

  // Validation Étape 1
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!nom.trim()) errors.nom = "Le nom de famille est obligatoire.";
    if (!prenom.trim()) errors.prenom = "Le prénom est obligatoire.";
    if (!dateNaissance) errors.dateNaissance = "La date de naissance est obligatoire.";
    if (numeroCnas && !/^\d{12}$/.test(numeroCnas.replace(/\s+/g, ""))) {
      errors.numeroCnas = "Le numéro de sécurité sociale CNAS doit comporter 12 chiffres.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation Étape 2
  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!fonction.trim()) errors.fonction = "L'intitulé de fonction est obligatoire.";
    if (!dateEntree) errors.dateEntree = "La date d'entrée est obligatoire.";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation Étape 3 (Loi 90-11 SNMG ≥ 20 000 DA)
  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (salaireBase < 20000) {
      errors.salaireBase = "Règle absolue Loi 90-11 : Le salaire de base ne peut être inférieur au SNMG légal de 20 000 DA.";
    }
    if (typeContrat === "CDD" && !dateFinContrat) {
      errors.dateFinContrat = "La date de fin est obligatoire pour un contrat à durée déterminée (CDD).";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 0 && validateStep1()) setCurrentStep(1);
    else if (currentStep === 1 && validateStep2()) setCurrentStep(2);
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmitFinal = () => {
    if (!validateStep3()) return;

    setErrorMsg(null);
    const formData = new FormData();
    const nomComplet = `${nom.trim().toUpperCase()} ${prenom.trim().charAt(0).toUpperCase() + prenom.trim().slice(1).toLowerCase()}`;
    formData.append("nom_prenom", nomComplet);
    formData.append("matricule", matricule.trim());
    formData.append("fonction", fonction.trim());
    formData.append("salaire_base_theorique", String(salaireBase));
    formData.append("date_visite_medicale", dateVisiteMedicale || "");
    formData.append("ccp_rib", ccpRib.trim());

    startTransition(async () => {
      try {
        const res = await actionSubmit(formData);
        if (res && res.error) {
          setErrorMsg(res.error);
        } else {
          router.push("/salaries");
          router.refresh();
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Stepper de progression */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-[#DC2626]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ÉTAPE 1 : IDENTITÉ & ÉTAT CIVIL */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>1. Identité &amp; État Civil du Collaborateur</CardTitle>
                <CardDescription>
                  Données personnelles certifiées conformes aux pièces d&apos;identité et au dossier CNAS.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom de famille"
                placeholder="ex: BELKACEM"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                error={validationErrors.nom}
                required
              />
              <Input
                label="Prénom(s)"
                placeholder="ex: Amine"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                error={validationErrors.prenom}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                label="Date de naissance"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                error={validationErrors.dateNaissance}
                required
              />
              <Input
                label="Lieu de naissance / Wilaya"
                placeholder="ex: Alger Centre (Wilaya 16)"
                value={lieuNaissance}
                onChange={(e) => setLieuNaissance(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#F1F5F9]">
              <Input
                label="N° Sécurité Sociale (CNAS)"
                placeholder="12 chiffres"
                value={numeroCnas}
                onChange={(e) => setNumeroCnas(e.target.value)}
                error={validationErrors.numeroCnas}
                helperText="12 chiffres figurant sur la carte Chifa."
              />
              <Select
                label="Situation Familiale"
                value={situationFamiliale}
                onChange={(e) => setSituationFamiliale(e.target.value)}
                options={[
                  { value: "celibataire", label: "Célibataire" },
                  { value: "marie", label: "Marié(e)" },
                  { value: "divorce", label: "Divorcé(e)" },
                  { value: "veuf", label: "Veuf / Veuve" },
                ]}
              />
              <Input
                label="Enfants à charge"
                type="number"
                min="0"
                value={enfantsACharge}
                onChange={(e) => setEnfantsACharge(parseInt(e.target.value, 10) || 0)}
                helperText="Impact direct sur l'abattement IRG."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right" onClick={handleNext}>
              Continuer vers Poste &amp; Organisation
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ÉTAPE 2 : POSTE & ORGANISATION */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>2. Affectation, Poste &amp; Organisation</CardTitle>
                <CardDescription>
                  Rattachement au service, date d&apos;entrée pour l&apos;ancienneté et suivi médical légal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Matricule Collaborateur"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                helperText="Identifiant unique dans le registre du personnel."
                required
              />
              <Select
                label="Département / Service"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                options={[
                  { value: "Direction Générale", label: "Direction Générale" },
                  { value: "Ressources Humaines", label: "Ressources Humaines" },
                  { value: "Finance & Comptabilité", label: "Finance & Comptabilité" },
                  { value: "Direction Technique", label: "Direction Technique" },
                  { value: "Exploitation & Logistique", label: "Exploitation & Logistique" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Fonction / Intitulé du Poste"
                placeholder="ex: Ingénieur d'Études Réseau"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                error={validationErrors.fonction}
                required
              />
              <DatePicker
                label="Date d'embauche (Entrée)"
                value={dateEntree}
                onChange={(e) => setDateEntree(e.target.value)}
                error={validationErrors.dateEntree}
                helperText="Point de départ du calcul de l'ancienneté (IEP)."
                required
              />
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <DatePicker
                label="Date de la Visite Médicale d'Embauche (Loi 90-11)"
                value={dateVisiteMedicale}
                onChange={(e) => setDateVisiteMedicale(e.target.value)}
                helperText="Obligatoire selon la législation algérienne du travail."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={handlePrev}>
              Étape précédente
            </Button>
            <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right" onClick={handleNext}>
              Continuer vers Rémunération
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ÉTAPE 3 : RÉMUNÉRATION & CONTRAT INITIAL */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>3. Rémunération de Base &amp; Contrat Initial</CardTitle>
                <CardDescription>
                  Validation obligatoire du respect du SNMG (≥ 20 000 DA) et coordonnées de paiement.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Type de Contrat Initial"
                value={typeContrat}
                onChange={(e) => setTypeContrat(e.target.value)}
                options={[
                  { value: "CDI", label: "CDI (Durée indéterminée)" },
                  { value: "CDD", label: "CDD (Durée déterminée)" },
                  { value: "CTA", label: "Contrat CTA / Aidé" },
                ]}
              />

              {typeContrat === "CDD" ? (
                <DatePicker
                  label="Date de fin de contrat"
                  value={dateFinContrat}
                  onChange={(e) => setDateFinContrat(e.target.value)}
                  error={validationErrors.dateFinContrat}
                  required
                />
              ) : (
                <Select
                  label="Période d'essai"
                  value={String(periodeEssaiMois)}
                  onChange={(e) => setPeriodeEssaiMois(parseInt(e.target.value, 10))}
                  options={[
                    { value: "0", label: "Sans période d'essai" },
                    { value: "3", label: "3 mois" },
                    { value: "6", label: "6 mois (Cadres)" },
                  ]}
                />
              )}

              <Input
                label="Salaire de Base Mensuel"
                type="number"
                min="20000"
                step="500"
                value={salaireBase}
                onChange={(e) => setSalaireBase(parseFloat(e.target.value) || 0)}
                suffix="DA"
                error={validationErrors.salaireBase}
                helperText="SNMG légal : 20 000 DA minimum."
                required
              />
            </div>

            {/* Avertissement SNMG */}
            {salaireBase < 20000 && (
              <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs flex items-center gap-2.5 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
                <span>Attention : En Algérie, le salaire de base ne peut être inférieur au SNMG légal de 20 000 DA.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
              <Input
                label="Compte Bancaire (RIB) ou CCP"
                placeholder="ex: 007 99999 0000000000 00"
                value={ccpRib}
                onChange={(e) => setCcpRib(e.target.value)}
                helperText="Coordonnées de virement pour l'ordre bancaire mensuel."
              />
              <Select
                label="Mode de Règlement"
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                options={[
                  { value: "Virement bancaire", label: "Virement bancaire" },
                  { value: "Virement CCP", label: "Virement CCP" },
                  { value: "Chèque", label: "Chèque bancaire" },
                  { value: "Espèces", label: "Espèces" },
                ]}
              />
            </div>

            {/* Aperçu synthétique avant création */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col gap-2 mt-2">
              <span className="text-xs uppercase font-bold text-[#64748B]">Récapitulatif du Collaborateur</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[#64748B] block">Collaborateur :</span>
                  <strong className="text-[#0F172A]">{nom || "—"} {prenom}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Poste :</span>
                  <strong className="text-[#0F172A]">{fonction || "—"}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Contrat :</span>
                  <strong className="text-[#4F46E5]">{typeContrat}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Base contractuelle :</span>
                  <strong className="text-[#0F172A] tabular-nums">{formatDA(salaireBase)}</strong>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={handlePrev}>
              Étape précédente
            </Button>
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={isPending}
              onClick={handleSubmitFinal}
            >
              Créer le Collaborateur &amp; Initialiser le Dossier
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
