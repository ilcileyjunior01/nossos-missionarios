import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Nossos Missionários — Estaca SP BR Taboão",
  description: "Painel de acompanhamento dos missionários da Estaca SP BR Taboão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col text-[#1a1a1a] font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
