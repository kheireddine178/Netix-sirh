"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stepper, type StepItem } from "@/components/ui/Stepper";
import { setPeriodeStatut, type StatutPeriode } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { FileText, CheckCircle2, AlertTriangle, Printer, Settings } from "lucide-react";
import Link from "next/link";

interface ClotureWizardProps {
  annee: number;
  mois: number;
  salaries: any[];
  statutPeriode: StatutPeriode;
}

export default function ClotureWizard({
  annee,
  mois,
  salaries,
  statutPeriode,
}: ClotureWizardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  
  // Convertir le statut en étape active
  // Brouillon = 0 (Préparer) ou 1 (Saisir)
  // En contrôle = 2 (Contrôler)
  // Validée = 3 (Valider)
  // Clôturée = 4 (Éditer)
  const getInitialStep = () => {
    if (statutPeriode === "Clôturée") return 4;
    if (statutPeriode === "Validée") return 3;
    if (statutPeriode === "En contrôle") return 2;
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);

  const stepsList: StepItem[] = [
    { id: "prep", title: "Préparer" },
    { id: "sais", title: "Saisir" },
    { id: "ctrl", title: "Contrôler" },
    { id: "valid", title: "Valider" },
    { id: "edit", title: "Éditer" }
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateStatut = async (nouveauStatut: StatutPeriode) => {
    setLoading(true);
    try {
      await setPeriodeStatut(annee, mois, nouveauStatut);
      addToast({ title: "Statut mis à jour", message: `Période passée en "${nouveauStatut}"`, type: "success" });
      router.refresh();
    } catch (e: any) {
      addToast({ title: "Erreur", message: e.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = statutPeriode === "Clôturée";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Clôture de Paie - ${mois.toString().padStart(2, "0")}/${annee}`}
        description="Assistant de traitement de la paie en 5 étapes"
      >
        <div className="flex gap-2 items-center">
          <Badge 
            variant={statutPeriode === "Clôturée" ? "neutral" : statutPeriode === "Validée" ? "success" : statutPeriode === "En contrôle" ? "warning" : "brand"}
          >
            {statutPeriode}
          </Badge>
          
          {statutPeriode === "Clôturée" && (
            <Button variant="ghost" size="sm" onClick={() => updateStatut("Brouillon")} disabled={loading}>
              Rouvrir la période
            </Button>
          )}
        </div>
      </PageHeader>

      <Stepper steps={stepsList} currentStep={currentStep} />

      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-[#0F172A]">1. Préparer la période</h3>
              <p className="text-sm text-[#64748B]">
                Vérification des données de base. <strong>{salaries.length}</strong> salariés actifs trouvés.
              </p>
              
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Salariés sans contrat :</span>
                  <span className="font-medium text-green-600">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Congés validés à importer :</span>
                  <span className="font-medium text-indigo-600">Aucun</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={handleNext} disabled={isReadOnly}>Continuer vers Saisie</Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-[#0F172A]">2. Saisir les variables</h3>
              <p className="text-sm text-[#64748B]">
                Saisissez les primes, absences et heures supplémentaires pour le mois en cours.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href={`/saisie?annee=${annee}&mois=${mois}`} passHref>
                  <Card className="hover:border-[#4F46E5] cursor-pointer transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="text-base">Saisie individuelle</CardTitle>
                      <CardDescription>Saisir salarié par salarié via le bulletin détaillé</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <Link href={`/saisie/collective?annee=${annee}&mois=${mois}`} passHref>
                  <Card className="hover:border-[#4F46E5] cursor-pointer transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="text-base">Saisie collective</CardTitle>
                      <CardDescription>Grille globale pour saisir rapidement un type de prime pour tous</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>

              <div className="flex justify-between gap-2 mt-4">
                <Button variant="ghost" onClick={handlePrev}>Retour</Button>
                <Button onClick={() => {
                  updateStatut("En contrôle");
                  handleNext();
                }} disabled={isReadOnly || loading}>
                  Terminer la saisie
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-[#0F172A]">3. Contrôler les écarts</h3>
              <p className="text-sm text-[#64748B]">
                Le statut de la période est actuellement "En contrôle". Vérifiez les montants calculés.
              </p>

              <div className="bg-[#EEF2FF] border border-[#C7D2FE] p-4 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#4F46E5] shrink-0" />
                <div className="text-sm text-[#4F46E5]">
                  <span className="font-semibold">Bientôt disponible :</span> Le tableau comparatif détaillé avec le mois précédent sera affiché ici pour détecter les variations anormales de Net à Payer (&gt; 15%).
                </div>
              </div>

              <div className="flex justify-between gap-2 mt-4">
                <Button variant="ghost" onClick={() => {
                  updateStatut("Brouillon");
                  handlePrev();
                }} disabled={loading}>
                  Retour à la saisie
                </Button>
                <Button onClick={() => {
                  updateStatut("Validée");
                  handleNext();
                }} disabled={isReadOnly || loading}>
                  Valider les calculs
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-[#0F172A]">4. Valider la période</h3>
              <p className="text-sm text-[#64748B]">
                Le mois est "Validé". Pour éditer les documents officiels, vous devez verrouiller la période.
                Après verrouillage, les bulletins seront en lecture seule.
              </p>

              <div className="flex justify-between gap-2 mt-4">
                <Button variant="ghost" onClick={() => {
                  updateStatut("En contrôle");
                  handlePrev();
                }} disabled={loading}>
                  Retour au contrôle
                </Button>
                <Button variant="brand" onClick={() => {
                  updateStatut("Clôturée");
                  handleNext();
                }} disabled={isReadOnly || loading}>
                  Verrouiller et Clôturer
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-[#0F172A]">5. Éditer les documents</h3>
              <p className="text-sm text-[#64748B]">
                La période est clôturée. Vous pouvez générer et télécharger les documents de paie.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bulletins de paie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" size="sm" className="w-full">
                      <Printer className="w-4 h-4 mr-2" /> Tout imprimer
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bordereau CNAS &amp; IRG</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/rapports`} passHref>
                      <Button variant="secondary" size="sm" className="w-full">
                        <FileText className="w-4 h-4 mr-2" /> Aller aux déclarations
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-start mt-4">
                <Button variant="ghost" onClick={handlePrev} disabled={loading}>
                  Voir l'étape précédente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
