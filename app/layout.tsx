import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Netix SIRH — Gestion RH & Paie Simplifiée",
  description: "Plateforme tout-en-un pour piloter facilement vos collaborateurs, automatiser la paie et gérer les congés et contrats.",
  manifest: "/manifest.json",
  themeColor: "#4F46E5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Netix SIRH",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${dmSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

