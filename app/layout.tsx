import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["600", "800"],
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], variable: "--font-dm-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Quem sou eu?",
  description: "O jogo de adivinhar quem você é — cada um no seu celular, todos na mesma mesa.",
};

export const viewport: Viewport = {
  themeColor: "#150c2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
