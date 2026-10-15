"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  TrendingUp,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Shield,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/lib/authContext";
import { Badge } from "./ui/Badge";

interface NavSubItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string; // Si route directe (ex: Accueil)
  items?: NavSubItem[];
}

/**
 * Sidebar — Navigation unifiée à 6 entrées groupées Netix SIRH
 * Règle §4.1 : Réduction de 13 entrées désordonnées à 6 entrées hiérarchiques.
 * Règle §3.1 : Zéro emoji, icônes Lucide exclusives, sélection Indigo unique.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, setRole } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    equipe: true,
    paie: true,
    temps: false,
    talents: false,
  });

  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // 6 entrées principales (§4.1)
  const NAV_TREE: NavGroup[] = [
    {
      id: "accueil",
      title: "Accueil",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      id: "equipe",
      title: "Équipe",
      icon: Users,
      items: [
        { label: "Collaborateurs", href: "/salaries" },
        { label: "Contrats & Documents", href: "/contrats" },
      ],
    },
    {
      id: "paie",
      title: "Paie",
      icon: Wallet,
      items: [
        { label: "Clôture du mois", href: "/paie/cloture" },
        { label: "Saisie individuelle", href: "/saisie" },
        { label: "Saisie collective", href: "/saisie/collective" },
        { label: "États & Déclarations", href: "/rapports" },
        { label: "Rubriques (Admin)", href: "/rubriques", adminOnly: true },
      ],
    },
    {
      id: "temps",
      title: "Temps",
      icon: CalendarDays,
      items: [
        { label: "Congés & Absences", href: "/conges" },
        { label: "Missions & Ordres", href: "/missions" },
      ],
    },
    {
      id: "talents",
      title: "Talents",
      icon: TrendingUp,
      items: [
        { label: "Carrière & Discipline", href: "/carriere" },
        { label: "Formations & Évaluations", href: "/formations" },
      ],
    },
  ];

  // Ouvre automatiquement la section contenant la route courante
  useEffect(() => {
    NAV_TREE.forEach((group) => {
      if (group.items?.some((item) => pathname.startsWith(item.href))) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <aside className="w-64 h-screen shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col justify-between select-none sticky top-0 hidden md:flex">
      {/* 1. BRAND HEADER */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-extrabold text-base shadow-xs">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[#0F172A] leading-tight">
                NETIX SIRH
              </span>
              <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase">
                Paie &amp; RH Algérie
              </span>
            </div>
          </Link>
        </div>

        {/* 2. NAVIGATION ARBORESCENTE À 6 ENTRÉES */}
        <nav className="p-3 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-175px)]">
          {NAV_TREE.map((group) => {
            const Icon = group.icon;

            // Entrée de premier niveau directe (Accueil)
            if (group.href) {
              const isActive = pathname === group.href;
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-[#4F46E5]" : "text-[#64748B]")} />
                  <span>{group.title}</span>
                </Link>
              );
            }

            // Groupe avec sous-menu repliable
            const isOpen = openGroups[group.id];
            const hasActiveChild = group.items?.some((i) => pathname.startsWith(i.href));

            return (
              <div key={group.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    hasActiveChild && !isOpen
                      ? "text-[#4F46E5] bg-[#EEF2FF]/60"
                      : "text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", hasActiveChild ? "text-[#4F46E5]" : "text-[#64748B]")} />
                    <span>{group.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-6 pr-1 pt-1 pb-1 flex flex-col gap-0.5">
                    {group.items?.map((item) => {
                      if (item.adminOnly && user.role !== "admin") return null;
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                            isItemActive
                              ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.adminOnly && (
                            <span className="text-[9px] bg-[#F1F5F9] text-[#64748B] px-1 py-0.2 rounded font-bold uppercase">
                              Admin
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. PIED DE MENU FIXE (§4.1) */}
      <div className="p-3 border-t border-[#F1F5F9] flex flex-col gap-1 bg-white">
        <Link
          href="/guide"
          className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            pathname === "/guide"
              ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
          )}
        >
          <BookOpen className="w-4 h-4 text-[#64748B]" />
          <span>Guide RH (Loi 90-11)</span>
        </Link>

        <Link
          href="/parametres"
          className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            pathname === "/parametres"
              ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
          )}
        >
          <Settings className="w-4 h-4 text-[#64748B]" />
          <span>Paramètres</span>
        </Link>

        {/* Profil de session & sélecteur de rôle (§6) */}
        <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
          <div
            onClick={() => setRoleModalOpen(true)}
            className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-85 p-1 rounded transition-opacity"
            title="Cliquez pour changer de rôle métier"
          >
            <div className="w-7 h-7 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs shrink-0">
              {user.nom.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] truncate leading-tight">
                {user.nom}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#64748B] capitalize truncate">
                  {user.role}
                </span>
                <span className="text-[9px] text-[#4F46E5] underline">changer</span>
              </div>
            </div>
          </div>

          <Link
            href="/"
            title="Retour au portail"
            className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-[#F1F5F9] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Modal Sélecteur de rôle (§6) */}
      {roleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setRoleModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg border border-[#E2E8F0] shadow-xl p-5 max-w-sm w-full text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                Sélection du Rôle Métier (§6)
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              Testez l&apos;interface selon les profils d&apos;habilitation définis dans le cahier des charges :
            </p>

            <div className="flex flex-col gap-2">
              {[
                { r: "admin", label: "Administrateur", desc: "Accès intégral, rubriques, barèmes" },
                { r: "rh", label: "Gestionnaire RH / Paie", desc: "Collaborateurs, paie, contrats, congés" },
                { r: "manager", label: "Manager d'équipe", desc: "Validation congés/missions, consultation équipe" },
                { r: "direction", label: "Direction Générale", desc: "Tableau de bord et masse salariale (lecture)" },
                { r: "salarie", label: "Salarié", desc: "Portail collaborateur individuel" },
              ].map((item) => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => {
                    setRole(item.r as UserRole);
                    setRoleModalOpen(false);
                  }}
                  className={cn(
                    "flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                    user.role === item.r
                      ? "border-[#4F46E5] bg-[#EEF2FF]"
                      : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">{item.label}</span>
                    {user.role === item.r && <Badge variant="brand" size="sm">Actif</Badge>}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold px-3 py-1.5"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
