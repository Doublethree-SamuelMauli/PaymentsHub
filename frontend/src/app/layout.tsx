import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://paymentshub.doublethree.com.br"),
  title: {
    default: "PaymentsHub · Orquestração de pagamentos B2B",
    template: "%s · PaymentsHub",
  },
  description:
    "Receba pagamentos do seu sistema, consolide em lote diário e envie PIX + TED ao banco em uma única operação auditável. Pela doublethree.",
  keywords: ["PIX", "TED", "CNAB 240", "pagamentos B2B", "orquestração", "doublethree"],
  authors: [{ name: "doublethree Tecnologia", url: "https://doublethree.com.br" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "PaymentsHub",
    title: "PaymentsHub · Orquestração de pagamentos B2B",
    description: "O fim da planilha de pagamentos da segunda-feira.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased scroll-smooth`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
