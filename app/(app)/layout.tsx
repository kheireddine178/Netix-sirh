import React from "react";
import Sidebar from "@/components/Sidebar";
import { NavbarMobile } from "@/components/NavbarMobile";
import Footer from "@/components/Footer";
import { checkAdminAccess } from "@/lib/authHelper";
import { AuthProvider } from "@/lib/authContext";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await checkAdminAccess();

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] text-[#0F172A]">
          {/* Header Mobile avec Burger & Drawer */}
          <NavbarMobile />

          {/* Sidebar Desktop fixe à 6 entrées groupées */}
          <Sidebar />

          {/* Zone de contenu principale standardisée */}
          <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="flex-1 w-full">{children}</div>
            <Footer />
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
