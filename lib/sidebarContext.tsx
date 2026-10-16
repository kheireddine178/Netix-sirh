"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {},
  toggleSidebar: () => {},
  openSidebar: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpenState] = useState(true);

  // Restaurer l'état précédent depuis le stockage local (persistance)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("netix_sidebar_open");
      if (stored !== null) {
        setIsOpenState(stored === "true");
      }
    } catch {
      // Ignorer si localStorage n'est pas disponible
    }
  }, []);

  const setIsOpen = (open: boolean) => {
    setIsOpenState(open);
    try {
      localStorage.setItem("netix_sidebar_open", String(open));
    } catch {
      // Ignorer
    }
  };

  const toggleSidebar = () => {
    setIsOpenState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("netix_sidebar_open", String(next));
      } catch {
        // Ignorer
      }
      return next;
    });
  };

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  // Raccourci clavier universel Ctrl+B / Cmd+B pour masquer ou afficher le volet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, setIsOpen, toggleSidebar, openSidebar, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
