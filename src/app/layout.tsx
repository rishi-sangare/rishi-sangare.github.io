import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen", weight: ["500", "600", "700"] });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Rishi Sangare · Forward Pass",
  description:
    "AI / LLM engineer. A portfolio that is itself an LLM run: your question goes through a real tokenizer, real embeddings and real GPT-2 attention, and every stage opens one of my projects.",
  openGraph: {
    title: "Rishi Sangare · Forward Pass",
    description: "AI / LLM engineer shipping production LLM systems. Scroll through a transformer to see the work.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#07080f", width: "device-width", initialScale: 1 };

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
    <html lang="en" className={`${familjen.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
