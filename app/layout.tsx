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
  title: "Netix SIRH 2.0 — Standard Fintech Haut de Gamme & Paie Algérienne",
  description: "Grille financière haute vélocité Spreadsheet 2026, calcul instantané Loi 90-11, CNAS 34,5% et barème officiel DGI Art. 104.",
  manifest: "/manifest.json",
  themeColor: "#0D3B2E",
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
        <meta name="theme-color" content="#0D3B2E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-[#F8F7F4] text-[#111315]">{children}</body>
    </html>
  );
}

