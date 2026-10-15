"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Briefcase, CreditCard, AlertTriangle, Save, X } from "lucide-react";

interface SalarieFormProps {
  initialData?: {
    id?: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
    salaire_base_theorique: number;
    date_visite_medicale?: string | null;
    ccp_rib?: string | null;
  };
  actionSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
  buttonText: string;
}

export default function SalarieForm({ initialData, actionSubmit, buttonText }: SalarieFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // States for live preview
  const [nomPrenom, setNomPrenom] = useState(initialData?.nom_prenom ?? "");
  const [matricule, setMatricule] = useState(initialData?.matricule ?? "");
  const [fonction, setFonction] = useState(initialData?.fonction ?? "");
  const [salaireBase, setSalaireBase] = useState<number | string>(initialData?.salaire_base_theorique ?? 0);
  const [dateVisiteMedicale, setDateVisiteMedicale] = useState(initialData?.date_visite_medicale ?? "");
  const [ccpRib, setCcpRib] = useState(initialData?.ccp_rib ?? "");
  
  const [activeTab, setActiveTab] = useState("poste");

  // Format Nom & Prénom on blur (capitalize first letters)
  function handleNameBlur() {
    const formatted = nomPrenom
      .trim()
      .split(/\s+/)
      .map((word) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
    setNomPrenom(formatted);
  }

  // Get initials for the live profile card avatar
  const initials = useMemo(() => {
    const parts = nomPrenom.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [nomPrenom]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await actionSubmit(formData);
        if (result && result.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Main Profile Header */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#4F46E5]/10 to-[#4F46E5]/5" />
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-10 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-[#4F46E5] bg-gradient-to-br from-indigo-50 to-indigo-100 flex-shrink-0">
              {initials}
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="w-full max-w-md space-y-1">
                <label htmlFor="nom_prenom" className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Nom et Prénom du collaborateur *
                </label>
                <Input
                  id="nom_prenom"
                  name="nom_prenom"
                  required
                  value={nomPrenom}
                  onChange={(e) => setNomPrenom(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="Ex: Amina Benali"
                  className="text-lg font-semibold h-10 bg-white"
                />
              </div>
              <div className="w-full max-w-md space-y-1">
                <label htmlFor="fonction" className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Intitulé du poste / Fonction
                </label>
                <Input
                  id="fonction"
                  name="fonction"
                  value={fonction}
                  onChange={(e) => setFonction(e.target.value)}
                  placeholder="Ex: Ingénieur Système / Chef de projet"
                  className="h-10 bg-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs 
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "poste", label: "Contrat & Rémunération", icon: <Briefcase className="w-4 h-4" /> },
          { id: "banque", label: "Banque & Paiement", icon: <CreditCard className="w-4 h-4" /> }
        ]}
        className="mb-6"
      />

      {activeTab === "poste" && (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="matricule" className="text-sm font-semibold text-[#0F172A]">Matricule employé</label>
                <Input
                  id="matricule"
                  name="matricule"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="Ex: M100"
                  className="font-mono bg-[#F8FAFC]"
                />
                <p className="text-xs text-[#64748B]">Identifiant unique interne pour la paie</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="salaire_base_theorique" className="text-sm font-semibold text-[#0F172A]">Salaire de base contractuel (DA)</label>
                <Input
                  id="salaire_base_theorique"
                  name="salaire_base_theorique"
                  type="number"
                  step="0.01"
                  value={salaireBase}
                  onChange={(e) => setSalaireBase(e.target.value)}
                  placeholder="0.00"
                  className="font-mono bg-[#F8FAFC]"
                />
                <p className="text-xs text-[#64748B]">Montant de base légal mensuel</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="date_visite_medicale" className="text-sm font-semibold text-[#0F172A]">Dernière visite médicale</label>
                <Input
                  id="date_visite_medicale"
                  name="date_visite_medicale"
                  type="date"
                  value={dateVisiteMedicale}
                  onChange={(e) => setDateVisiteMedicale(e.target.value)}
                  className="bg-[#F8FAFC]"
                />
                <p className="text-xs text-[#64748B]">Suivi obligatoire médecine du travail</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "banque" && (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-6">
            <div className="max-w-md space-y-1.5">
              <label htmlFor="ccp_rib" className="text-sm font-semibold text-[#0F172A]">Coordonnées bancaires (RIB ou CCP 20 chiffres)</label>
              <Input
                id="ccp_rib"
                name="ccp_rib"
                value={ccpRib}
                onChange={(e) => setCcpRib(e.target.value)}
                placeholder="Ex: 00799999000000123456"
                className="font-mono bg-[#F8FAFC]"
              />
              <p className="text-xs text-[#64748B]">Utilisé pour les états de virement bancaire et chèques de paie</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-[#E2E8F0]">
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="gap-2 px-6"
        >
          <Save className="w-4 h-4 text-white" /> {isPending ? "Enregistrement…" : buttonText}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="gap-2"
        >
          <X className="w-4 h-4" /> Annuler
        </Button>
      </div>
    </form>
  );
}
