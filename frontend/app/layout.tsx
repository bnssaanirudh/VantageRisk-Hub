import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VendGuard — AI Vendor Risk Intelligence",
  description:
    "Automate vendor security audits in minutes. VendGuard uses Gemini 1.5 Pro + RAG to analyze compliance documents and generate deterministic risk scores.",
  keywords: ["vendor risk", "compliance", "AI audit", "security", "SOC2", "GDPR"],
  openGraph: {
    title: "VendGuard — AI Vendor Risk Intelligence",
    description: "Enterprise vendor risk assessment, automated by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#080B14] text-white`}>
        <AuthProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
