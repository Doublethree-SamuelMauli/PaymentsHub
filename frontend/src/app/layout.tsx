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
    default: "PaymentsHub — Aprovação de pagamentos para empresas | PIX e TED automáticos",
    template: "%s | PaymentsHub",
  },
  description:
    "Aprove todos os pagamentos do dia em um lote só. PIX e TED automáticos, direto do seu sistema para o banco. Sem planilha, sem portal bancário. Teste grátis.",
  keywords: [
    "aprovação de pagamentos",
    "pagamentos em lote",
    "PIX automático",
    "TED automático",
    "pagamento de fornecedores",
    "contas a pagar",
    "sistema financeiro",
    "pagamentos B2B",
    "doublethree",
    "PaymentsHub",
    "software de pagamentos",
    "gestão financeira",
    "aprovação de lote",
    "CNAB 240",
    "integração bancária",
    "Itaú PIX",
    "Inter pagamentos",
    "Bradesco empresas",
  ],
  authors: [{ name: "doublethree Tecnologia", url: "https://doublethree.com.br" }],
  creator: "doublethree Tecnologia",
  publisher: "doublethree Tecnologia",
  category: "Fintech",
  alternates: {
    canonical: "https://paymentshub.doublethree.com.br",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://paymentshub.doublethree.com.br",
    siteName: "PaymentsHub",
    title: "PaymentsHub — Aprovação de pagamentos para empresas",
    description:
      "Aprove todos os pagamentos do dia em um lote só. PIX e TED automáticos, sem planilha, sem portal de banco. Pela doublethree.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PaymentsHub — Sistema de aprovação de pagamentos para empresas brasileiras",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaymentsHub — Aprovação de pagamentos para empresas",
    description: "Aprove todos os pagamentos do dia em um lote só. PIX e TED automáticos.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

// JSON-LD structured data — static content, safe to inline
const JSONLD_STRING = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PaymentsHub",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Sistema de aprovação e envio de pagamentos em lote para empresas brasileiras. PIX e TED automáticos integrados com Itaú, Inter, Bradesco e Caixa.",
  url: "https://paymentshub.doublethree.com.br",
  author: {
    "@type": "Organization",
    name: "doublethree Tecnologia",
    url: "https://doublethree.com.br",
    address: { "@type": "PostalAddress", addressLocality: "Curitiba", addressRegion: "PR", addressCountry: "BR" },
    contactPoint: { "@type": "ContactPoint", telephone: "+55-47-99277-0701", email: "contato@doublethree.com.br", contactType: "sales", availableLanguage: "Portuguese" },
  },
  offers: [
    { "@type": "Offer", name: "Grátis", price: "0", priceCurrency: "BRL" },
    { "@type": "Offer", name: "Starter", price: "97", priceCurrency: "BRL", priceSpecification: { "@type": "UnitPriceSpecification", unitText: "por usuário/mês" } },
    { "@type": "Offer", name: "Business", price: "97", priceCurrency: "BRL", priceSpecification: { "@type": "UnitPriceSpecification", unitText: "por usuário/mês" } },
  ],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line -- static JSON-LD, no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSONLD_STRING }} />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
