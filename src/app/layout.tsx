import type { Metadata, Viewport } from "next";
import { Newsreader, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", weight: ["300", "400"], style: ["normal", "italic"] });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://rishi-sangare.github.io"),
  title: "Rishi Sangare · AI / LLM engineer",
  description:
    "Rishi Sangare ships LLM systems and measures them honestly. Ask the site a question and watch a forward pass work out who he is: retrieval, evals, agents, and the products behind them.",
  openGraph: {
    title: "Rishi Sangare · AI / LLM engineer",
    description: "A forward pass that ends in a person. Retrieval, evals and LLM products, with real numbers.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0c0b0a", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rishi Sangare",
  jobTitle: "AI / LLM Engineer",
  address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressCountry: "IN" },
  sameAs: ["https://github.com/rishi-sangare", "https://www.linkedin.com/in/rishi-sangare", "https://huggingface.co/Rishi-19"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
