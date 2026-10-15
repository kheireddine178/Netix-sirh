"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, LayoutDashboard, Users, Wallet, CalendarDays, TrendingUp, BookOpen, Settings } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Badge } from "./ui/Badge";

export function NavbarMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const NAV_GROUPS = [
    {
      title: "Accueil",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Équipe",
      icon: Users,
      items: [
        { label: "Collaborateurs", href: "/salaries" },
        { label: "Contrats & Documents", href: "/contrats" },
      ],
    },
    {
      title: "Paie",
      icon: Wallet,
      items: [
        { label: "Saisie mensuelle", href: "/saisie" },
        { label: "Saisie collective", href: "/saisie/collective" },
        { label: "États & Déclarations", href: "/rapports" },
        { label: "Rubriques (Admin)", href: "/rubriques", adminOnly: true },
      ],
    },
    {
      title: "Temps",
      icon: CalendarDays,
      items: [
        { label: "Congés & Absences", href: "/conges" },
        { label: "Missions & Ordres", href: "/missions" },
      ],
    },
    {
      title: "Talents",
      icon: TrendingUp,
      items: [
        { label: "Carrière & Discipline", href: "/carriere" },
        { label: "Formations & Évaluations", href: "/formations" },
      ],
    },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-xs">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-base shadow-xs">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-[#0F172A] leading-none">
            NETIX SIRH
          </span>
          <span className="text-[10px] text-[#64748B] font-medium tracking-wide">
            Paie & RH Algérie
          </span>
        </div>
      </Link>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[53px] z-50 bg-slate-900/30 backdrop-blur-xs flex flex-col"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-4/5 max-w-sm h-full bg-white border-r border-[#E2E8F0] shadow-xl p-4 overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-5">
              {/* Profil actif */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#0F172A]">{user.nom}</span>
                  <span className="text-[11px] text-[#64748B]">{user.poste}</span>
                </div>
                <Badge variant="brand" size="sm">
                  {user.role.toUpperCase()}
                </Badge>
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-1">
                {NAV_GROUPS.map((group, idx) => {
                  if (group.href) {
                    const isActive = pathname === group.href;
                    return (
                      <Link
                        key={idx}
                        href={group.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-[#EEF2FF] text-[#4F46E5]"
                            : "text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                        }`}
                      >
                        <group.icon className="w-4 h-4" />
                        <span>{group.title}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={idx} className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        <group.icon className="w-3.5 h-3.5" />
                        <span>{group.title}</span>
                      </div>
                      <div className="pl-6 flex flex-col gap-0.5">
                        {group.items?.map((item, itemIdx) => {
                          if (item.adminOnly && user.role !== "admin") return null;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={itemIdx}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Pied du menu mobile */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-1">
              <Link
                href="/guide"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Guide RH (Loi 90-11)</span>
              </Link>
              <Link
                href="/parametres"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
