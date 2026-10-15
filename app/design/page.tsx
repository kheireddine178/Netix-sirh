"use client";

import React, { useState } from "react";
import {
  Users,
  Wallet,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Building2,
  Trash2,
  Eye,
  Info,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  DatePicker,
  StatCard,
  PageHeader,
  DataTable,
  Modal,
  Drawer,
  Tabs,
  EmptyState,
  ToastProvider,
  useToast,
  Stepper,
  ConfirmDialog,
  Column,
} from "@/components/ui";
import { formatDA, formatDateFR } from "@/lib/utils";

// Données d'exemple réalistes conformes au barème et aux profils de paie algérienne
interface SalarieDemo {
  id: string;
  matricule: string;
  nom: string;
  poste: string;
  departement: string;
  base: number;
  brut: number;
  net: number;
  statut: "actif" | "conge" | "periode_essai" | "parti";
}

const DEMO_SALARIES: SalarieDemo[] = [
  {
    id: "1",
    matricule: "EMP-001",
    nom: "Amine Belkacem",
    poste: "Directeur des Opérations",
    departement: "Direction",
    base: 180000,
    brut: 250000,
    net: 167325,
    statut: "actif",
  },
  {
    id: "2",
    matricule: "EMP-002",
    nom: "Yasmine Mansouri",
    poste: "Ingénieur d'Études",
    departement: "Technique",
    base: 70000,
    brut: 90500,
    net: 67750,
    statut: "actif",
  },
  {
    id: "3",
    matricule: "EMP-003",
    nom: "Karim Brahimi",
    poste: "Comptable Principal",
    departement: "Finance",
    base: 60000,
    brut: 60000,
    net: 40560.7,
    statut: "actif",
  },
  {
    id: "4",
    matricule: "EMP-004",
    nom: "Nadia Cherifi",
    poste: "Chargée de Recrutement",
    departement: "Ressources Humaines",
    base: 45000,
    brut: 51750,
    net: 42078.2,
    statut: "conge",
  },
  {
    id: "5",
    matricule: "EMP-005",
    nom: "Sofiane Khelil",
    poste: "Technicien Réseau",
    departement: "Informatique",
    base: 40000,
    brut: 51000,
    net: 42302,
    statut: "actif",
  },
  {
    id: "6",
    matricule: "EMP-006",
    nom: "Rachid Zeroual",
    poste: "Agent Logistique",
    departement: "Exploitation",
    base: 34666,
    brut: 38066,
    net: 32703.56,
    statut: "periode_essai",
  },
  {
    id: "7",
    matricule: "EMP-007",
    nom: "Farida Bouzid",
    poste: "Assistante Administrative",
    departement: "Administration",
    base: 35164.84,
    brut: 35164.84,
    net: 31042.2,
    statut: "actif",
  },
  {
    id: "8",
    matricule: "EMP-008",
    nom: "Tarek Medjani",
    poste: "Opérateur de Saisie",
    departement: "Exploitation",
    base: 20000,
    brut: 20000,
    net: 18200,
    statut: "actif",
  },
];

function DesignSystemContent() {
  const toast = useToast();

  // États pour les interactions
  const [activeTab, setActiveTab] = useState("all");
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSalarie, setSelectedSalarie] = useState<SalarieDemo | null>(null);

  // Colonnes DataTable
  const columns: Column<SalarieDemo>[] = [
    {
      key: "matricule",
      header: "Matricule",
      width: "110px",
      render: (item) => (
        <span className="font-mono text-xs text-[#4F46E5] font-semibold">
          {item.matricule}
        </span>
      ),
    },
    {
      key: "nom",
      header: "Collaborateur",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#0F172A]">{item.nom}</span>
          <span className="text-xs text-[#64748B]">{item.poste}</span>
        </div>
      ),
    },
    {
      key: "departement",
      header: "Département",
    },
    {
      key: "brut",
      header: "Salaire Brut",
      isCurrency: true,
    },
    {
      key: "net",
      header: "Net à Payer",
      isCurrency: true,
      render: (item) => (
        <span className="font-bold text-[#0F172A] tabular-nums">
          {formatDA(item.net)}
        </span>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      align: "center",
      render: (item) => {
        const mapping = {
          actif: { label: "Actif", variant: "success" as const, dot: true },
          conge: { label: "En congé", variant: "warning" as const, dot: true },
          periode_essai: { label: "Essai", variant: "brand" as const, dot: true },
          parti: { label: "Sorti", variant: "neutral" as const, dot: false },
        };
        const conf = mapping[item.statut];
        return (
          <Badge variant={conf.variant} size="sm" dot={conf.dot}>
            {conf.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSalarie(item);
            setIsDrawerOpen(true);
          }}
        >
          Voir
        </Button>
      ),
    },
  ];

  const stepperSteps = [
    { id: 1, title: "Variables du mois", description: "Heures sup, primes, absences" },
    { id: 2, title: "Calcul & Contrôles", description: "Vérification CNAS & IRG" },
    { id: 3, title: "Validation", description: "Approbation RH de la période" },
    { id: 4, title: "Clôture", description: "Verrouillage définitif du mois" },
    { id: 5, title: "Déclarations", description: "CNAS, IRG, virements bancaires" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* En-tête standard conforme §4.2 */}
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/" },
            { label: "Outils internes", href: "#" },
            { label: "Design System", href: "/design" },
          ]}
          title="Design System & Composants Netix SIRH"
          subtitle="Référentiel visuel unifié selon les spécifications NETIX_VISION_REFONTE (Phase 1). Une seule couleur de marque, zéro emoji, conformité WCAG AA."
          primaryAction={
            <Button
              variant="primary"
              icon={<ShieldCheck className="w-4 h-4" />}
              onClick={() => toast.success("Design System validé", "Tous les composants respectent les tokens officiels.")}
            >
              Action Principale Indigo
            </Button>
          }
          secondaryActions={
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={() => toast.info("Export", "Spécifications exportées au format JSON.")}
            >
              Exporter Tokens
            </Button>
          }
        />

        {/* SECTION 1 : PALETTE ET TOKENS (§3.2) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              1. Palette de Couleurs & Tokens (§3.2)
            </h2>
            <span className="text-xs text-[#64748B]">Règle : UNE seule couleur de marque</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Couleur de marque Indigo */}
            <Card>
              <CardHeader>
                <CardTitle>Marque : Indigo Unique</CardTitle>
                <CardDescription>
                  Utilisé pour les boutons principaux, liens et états actifs. Aucune autre couleur d'accent dans l'application.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                  <span>--brand-50 (Léger)</span>
                  <span className="font-mono">#EEF2FF</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#E0E7FF] text-[#4338CA] text-xs font-semibold">
                  <span>--brand-100 (Bordure douce)</span>
                  <span className="font-mono">#E0E7FF</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#6366F1] text-white text-xs font-semibold">
                  <span>--brand-500 (Intermédiaire)</span>
                  <span className="font-mono">#6366F1</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#4F46E5] text-white text-xs font-bold shadow-sm">
                  <span>--brand-600 (PRINCIPALE)</span>
                  <span className="font-mono">#4F46E5</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#4338CA] text-white text-xs font-semibold">
                  <span>--brand-700 (Hover)</span>
                  <span className="font-mono">#4338CA</span>
                </div>
              </CardContent>
            </Card>

            {/* Neutres */}
            <Card>
              <CardHeader>
                <CardTitle>Neutres : Structure de l'interface</CardTitle>
                <CardDescription>
                  Fonds de page, surfaces des cartes, tableaux et typographie générale.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-medium">
                  <span>--bg (Fond de page)</span>
                  <span className="font-mono">#F8FAFC</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium">
                  <span>--surface (Cartes & Tableaux)</span>
                  <span className="font-mono">#FFFFFF</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#F1F5F9] text-[#0F172A] text-xs font-medium">
                  <span>--surface-2 (En-têtes)</span>
                  <span className="font-mono">#F1F5F9</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white border border-[#CBD5E1] text-[#64748B] text-xs font-medium">
                  <span>--border (Bordure 1px)</span>
                  <span className="font-mono">#E2E8F0</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#0F172A] text-white text-xs font-semibold">
                  <span>--text (Texte principal)</span>
                  <span className="font-mono">#0F172A</span>
                </div>
              </CardContent>
            </Card>

            {/* Sémantiques strictes */}
            <Card>
              <CardHeader>
                <CardTitle>Sémantiques : Statuts UNIQUEMENT</CardTitle>
                <CardDescription>
                  Règle §3.2 : Usage STRICT pour exprimer un statut (badge, alerte). Jamais en décoration.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-2.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-semibold">
                  <span>Succès (Validé, Payé, Conforme)</span>
                  <span className="font-mono">#16A34A</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-semibold">
                  <span>Alerte (Échéance, À surveiller)</span>
                  <span className="font-mono">#D97706</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-semibold">
                  <span>Danger (Erreur, Retard, Retrait)</span>
                  <span className="font-mono">#DC2626</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-xs font-semibold">
                  <span>Neutre (Brouillon, Sorti, Archivé)</span>
                  <span className="font-mono">#64748B</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2 : TYPOGRAPHIE ET CHIFFRES DE PAIE (§3.3) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              2. Typographie & Chiffres de Paie Tabulaires (§3.3)
            </h2>
            <span className="text-xs text-[#64748B]">
              font-variant-numeric: tabular-nums obligatoire
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Échelle typographique */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Échelle de texte
                  </h4>
                  <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-2xl font-bold">Titre H1 (24px bold)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">text-2xl font-bold</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-lg font-semibold">Titre H2 (20px semibold)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">text-lg font-semibold</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-base font-semibold">Titre H3 (16px semibold)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">text-base font-semibold</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-sm">Corps tableau (14px regular)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">text-sm</span>
                  </div>
                  <div className="flex items-baseline justify-between pb-1">
                    <span className="text-xs text-[#64748B]">Légendes & Badges (12px)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">text-xs</span>
                  </div>
                </div>

                {/* Chiffres tabulaires & montants algériens */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Formatage Monétaire Algérien (75 253,00 DA)
                  </h4>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Salaire SNMG (2024)</span>
                      <span className="text-sm font-semibold tabular-nums text-right">
                        {formatDA(20000)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Lissage transition IRG</span>
                      <span className="text-sm font-semibold tabular-nums text-right">
                        {formatDA(35164.84)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Cadre Supérieur Brut</span>
                      <span className="text-sm font-semibold tabular-nums text-right">
                        {formatDA(250000)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2">
                      <span className="text-xs font-bold text-[#0F172A]">Masse Salariale Totale</span>
                      <span className="text-base font-bold text-[#4F46E5] tabular-nums text-right">
                        {formatDA(598880.84)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Les chiffres restent parfaitement alignés verticalement grâce à l'espacement tabulaire uniforme.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3 : COMPOSANTS BOUTONS ET BADGES (§3.6) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              3. Boutons & Badges (§3.6)
            </h2>
            <span className="text-xs text-[#64748B]">UN seul bouton Indigo par écran</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boutons */}
            <Card>
              <CardHeader>
                <CardTitle>Boutons (Button)</CardTitle>
                <CardDescription>
                  Variants primary, secondary, ghost, danger et danger-outline.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                    Primary (Indigo)
                  </Button>
                  <Button variant="secondary">Secondary (Gris)</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                    Danger
                  </Button>
                  <Button variant="danger-outline">Danger Outline</Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F1F5F9]">
                  <Button variant="secondary" size="sm">
                    Taille SM
                  </Button>
                  <Button variant="secondary" size="md">
                    Taille MD
                  </Button>
                  <Button variant="secondary" size="lg">
                    Taille LG
                  </Button>
                  <Button variant="primary" loading>
                    Chargement...
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges Sémantiques (Badge)</CardTitle>
                <CardDescription>
                  Strictement réservés aux statuts métier de l'application.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="success" dot>
                    Validé / Payé
                  </Badge>
                  <Badge variant="warning" dot>
                    À surveiller
                  </Badge>
                  <Badge variant="danger" dot>
                    Erreur / Rejet
                  </Badge>
                  <Badge variant="neutral">Brouillon</Badge>
                  <Badge variant="brand" dot>
                    En cours
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#F1F5F9]">
                  <Badge variant="success" size="sm">
                    CDI Actif
                  </Badge>
                  <Badge variant="warning" size="sm">
                    Fin de contrat J-15
                  </Badge>
                  <Badge variant="danger" size="sm">
                    Absence non justifiée
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    Archivé
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 4 : FORMULAIRES (INPUT, SELECT, DATEPICKER) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              4. Champs de Formulaire (§3.6)
            </h2>
            <span className="text-xs text-[#64748B]">Rayon 8px, bordures fines, focus Indigo</span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Nom du collaborateur"
                  placeholder="ex: Belkacem Amine"
                  helperText="Nom officiel tel qu'inscrit à la CNAS."
                  required
                />
                <Input
                  label="Recherche rapide"
                  placeholder="Matricule, nom..."
                  leftIcon={<Search className="w-4 h-4" />}
                />
                <Input
                  label="Salaire de Base"
                  type="number"
                  placeholder="0.00"
                  suffix="DA"
                />
                <Input
                  label="Numéro Sécurité Sociale"
                  defaultValue="12345"
                  error="Le numéro CNAS doit comporter 12 chiffres."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#F1F5F9]">
                <Select
                  label="Département"
                  options={[
                    { value: "rh", label: "Ressources Humaines" },
                    { value: "fin", label: "Finance & Comptabilité" },
                    { value: "it", label: "Systèmes d'Information" },
                    { value: "dir", label: "Direction Générale" },
                  ]}
                />
                <DatePicker
                  label="Date d'embauche"
                  defaultValue="2024-01-15"
                  helperText="Format standard JJ/MM/AAAA"
                />
                <Select
                  label="Type de Contrat"
                  options={[
                    { value: "cdi", label: "CDI (Durée indéterminée)" },
                    { value: "cdd", label: "CDD (Durée déterminée)" },
                    { value: "cta", label: "Contrat CTA" },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 5 : INDICATEURS STATCARDS & PROGRESSION STEPPER */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              5. Indicateurs StatCards & Stepper de Clôture (§5.1 & §5.2)
            </h2>
            <span className="text-xs text-[#64748B]">Guidage visuel sans surcharge</span>
          </div>

          {/* 4 StatCards comme requis pour l'Accueil §5.1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Masse Salariale Nette"
              value={formatDA(432261.66)}
              subtext="Mois de Mars 2026"
              icon={<Wallet className="w-4 h-4" />}
              trend={{ value: "+2.4%", positive: true }}
            />
            <StatCard
              label="Collaborateurs Actifs"
              value="8"
              subtext="Sur 8 contrats signés"
              icon={<Users className="w-4 h-4" />}
              badge={{ text: "100% Déclarés", variant: "success" }}
            />
            <StatCard
              label="Congés & Absences"
              value="3 demandes"
              subtext="Dont 1 sans solde"
              icon={<Calendar className="w-4 h-4" />}
              badge={{ text: "À valider", variant: "warning" }}
            />
            <StatCard
              label="Statut Période"
              value="En contrôle"
              subtext="Clôture prévue le 28"
              icon={<FileText className="w-4 h-4" />}
              badge={{ text: "Étape 2/5", variant: "brand" }}
            />
          </div>

          {/* Stepper de clôture */}
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Assistant de Clôture Mensuelle (§5.2)</CardTitle>
              <CardDescription>
                Parcours sécurisé en 5 étapes garantissant l'intégrité avant verrouillage définitif.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stepper
                steps={stepperSteps}
                currentStep={currentStep}
                onStepClick={(step) => setCurrentStep(step)}
              />
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#F1F5F9]">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                >
                  Étape précédente
                </Button>
                <div className="text-xs text-[#64748B]">
                  Étape active : <strong className="text-[#0F172A]">{stepperSteps[currentStep].title}</strong>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={currentStep === stepperSteps.length - 1}
                  onClick={() => setCurrentStep((s) => Math.min(stepperSteps.length - 1, s + 1))}
                >
                  Étape suivante
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 6 : TABLEAU DE DONNÉES DATATABLE (§3.3 & §3.6) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              6. Tableau de Données DataTable (§3.3 & §3.6)
            </h2>
            <span className="text-xs text-[#64748B]">Recherche en direct, tri, export CSV & montants alignés</span>
          </div>

          <DataTable
            data={DEMO_SALARIES}
            columns={columns}
            keyExtractor={(item) => item.id}
            title="Registre du Personnel & Rémunérations"
            searchPlaceholder="Filtrer par nom, département, matricule..."
            pageSize={5}
            exportFileName="salaries-netix"
            toolbarActions={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsModalOpen(true)}
              >
                Nouveau Collaborateur
              </Button>
            }
          />
        </section>

        {/* SECTION 7 : MODALES, TIROIRS & TOASTS (§3.6) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              7. Dialogues, Volets Latéraux & Notifications Toasts (§3.6 & §3.8)
            </h2>
            <span className="text-xs text-[#64748B]">Micro-interactions et confirmation d'actions sensibles</span>
          </div>

          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-4 items-center">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Ouvrir Modale standard
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedSalarie(DEMO_SALARIES[0]);
                  setIsDrawerOpen(true);
                }}
              >
                Ouvrir Volet Latéral (Drawer)
              </Button>

              <Button
                variant="danger-outline"
                onClick={() => setIsConfirmOpen(true)}
              >
                Dialogue de Confirmation Critique
              </Button>

              <div className="h-6 w-px bg-[#E2E8F0]" />

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success("Bulletin généré", "Le bulletin de Mars 2026 est prêt pour impression.")}
              >
                Toast Succès
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.warning("Contrôle nécessaire", "2 salariés n'ont pas encore leurs heures validées.")}
              >
                Toast Alerte
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.error("Erreur de validation", "La date de fin de contrat ne peut précéder la date d'embauche.")}
              >
                Toast Erreur
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 8 : ÉTATS VIDES EMPTYSTATE (§3.8) */}
        <section className="flex flex-col gap-4 pb-12">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              8. États Vides Explicatifs (§3.8)
            </h2>
            <span className="text-xs text-[#64748B]">Aucun écran blanc ou valeur à 0 sans explication</span>
          </div>

          <EmptyState
            title="Aucune déclaration CNAS générée"
            description="Le bordereau de déclaration CNAS (Télédéclaration DAS) sera généré automatiquement une fois la clôture mensuelle validée."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => toast.info("Assistant", "Démarrage de la préparation des déclarations.")}
              >
                Lancer la Clôture
              </Button>
            }
          />
        </section>

        {/* MODALE D'EXEMPLE */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouveau Collaborateur"
          description="Création d'un dossier salarié avec attribution automatique du matricule."
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsModalOpen(false);
                  toast.success("Salarié créé", "Le dossier a été initialisé avec succès.");
                }}
              >
                Enregistrer le collaborateur
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input label="Nom complet" placeholder="ex: Mansouri Yasmine" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Numéro CNAS" placeholder="12 chiffres" />
              <Select
                label="Département"
                options={[
                  { value: "tech", label: "Technique" },
                  { value: "rh", label: "Ressources Humaines" },
                  { value: "fin", label: "Finance" },
                ]}
              />
            </div>
            <Input label="Salaire de Base Mensuel" type="number" placeholder="40000" suffix="DA" />
          </div>
        </Modal>

        {/* DRAWER D'EXEMPLE */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedSalarie ? selectedSalarie.nom : "Détail Collaborateur"}
          description={selectedSalarie ? `${selectedSalarie.matricule} • ${selectedSalarie.departement}` : ""}
          footer={
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Fermer le volet
            </Button>
          }
        >
          {selectedSalarie && (
            <div className="flex flex-col gap-6">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col gap-2">
                <span className="text-xs uppercase font-bold text-[#64748B]">Rémunération Actuelle</span>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#64748B]">Salaire de base :</span>
                  <span className="text-sm font-semibold tabular-nums">{formatDA(selectedSalarie.base)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#64748B]">Salaire Brut :</span>
                  <span className="text-sm font-semibold tabular-nums">{formatDA(selectedSalarie.brut)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                  <span className="text-xs font-bold text-[#0F172A]">Net à Payer :</span>
                  <span className="text-base font-bold text-[#4F46E5] tabular-nums">{formatDA(selectedSalarie.net)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs uppercase font-bold text-[#64748B]">Informations Administratives</h4>
                <div className="flex justify-between text-xs py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Poste :</span>
                  <span className="font-semibold text-[#0F172A]">{selectedSalarie.poste}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Statut du dossier :</span>
                  <Badge variant={selectedSalarie.statut === "actif" ? "success" : "warning"} size="sm" dot>
                    {selectedSalarie.statut}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Régime de cotisation :</span>
                  <span className="font-semibold text-[#0F172A]">Régime Général (CNAS 9%/26%)</span>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* CONFIRM DIALOG */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Réouverture de période clôturée"
          description="Attention : réouvrir un mois déjà clôturé annulera le verrouillage de la paie et tracera l'action dans le journal d'audit. Confirmez-vous cette opération ?"
          variant="danger"
          confirmText="Réouvrir la période"
          onConfirm={() => {
            setIsConfirmOpen(false);
            toast.warning("Période réouverte", "L'événement a été consigné dans le journal d'audit.");
          }}
        />
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <DesignSystemContent />
    </ToastProvider>
  );
}
