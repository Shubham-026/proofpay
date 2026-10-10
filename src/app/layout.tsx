import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07080d] text-zinc-100 font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
        {/* Subtle Liquid Grid Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <Suspense
          fallback={
            <div className="h-16 border-b border-white/[0.08] bg-[#0c0e17]/80 backdrop-blur-xl" />
          }
        >
          <Header />
        </Suspense>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7 relative z-10">
          {children}
        </main>

        <footer className="border-t border-white/[0.06] bg-[#07080d]/80 backdrop-blur-xl py-5 text-center text-[12px] font-mono text-zinc-500 relative z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-zinc-300 font-semibold">{BRAND.name}</span>
              <span className="text-zinc-600">/</span>
              <span>Liquid Test-Verifiable Escrow</span>
            </div>
            <div className="text-zinc-500 text-[11px]">
              Engineered for Base Sepolia (Chain 84532) • Gas Abstracted
            </div>
          </div>
        </footer>

        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(14, 18, 28, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f1f5f9",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
            },
          }}
        />
      </body>
    </html>
  );
}
