"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { useProofPayStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { ChevronDown, Fuel, RotateCcw, ShieldCheck, Sparkles, User } from "lucide-react";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { currentRole, setRole, currentUser, resetToSeed } = useProofPayStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleSwitchRole = (role: UserRole) => {
    setRole(role);
    setRoleMenuOpen(false);
  };

  const handleReset = () => {
    if (confirm("Reset demo jobs to fresh state?")) {
      resetToSeed();
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090b12]/75 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      {/* Specular top border sheen */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Left: Liquid Wordmark + Navigation */}
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
          >
            {/* Luminous Liquid Wordmark */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-cyan-400/30 to-teal-600/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="font-mono text-cyan-300 font-bold text-[14px]">P</span>
              </div>
              <span className="font-bold tracking-tight text-[17px] bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                {BRAND.logoText}
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              v1.0 ESCROW
            </span>
          </Link>

          <nav className="flex items-center gap-1.5 text-[13px]">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-[8px] transition-all ${
                pathname === "/"
                  ? "bg-white/[0.08] font-semibold text-white border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/jobs/new"
              className={`px-3 py-1.5 rounded-[8px] transition-all ${
                pathname === "/jobs/new"
                  ? "bg-white/[0.08] font-semibold text-white border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              New Job
            </Link>
          </nav>
        </div>

        {/* Right: Reset + Gas Sponsored Pill + Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Reset Demo Data button */}
          <button
            onClick={handleReset}
            title="Reset to fresh demo seed"
            className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-[8px] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all hover:border-white/[0.15]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Demo</span>
          </button>

          {/* Gas sponsored pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            <Fuel className="w-3 h-3 text-emerald-400" />
            <span>Gas sponsored</span>
          </div>

          {/* Role Switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 text-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.18] px-3 py-1.5 rounded-[8px] text-zinc-200 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                  {currentRole === "client" ? "C" : "F"}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <div className="font-semibold text-zinc-100 flex items-center gap-1">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300/80">
                    {currentRole === "client" ? "Client" : "Freelancer"}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-[#0d101a]/95 border border-white/[0.14] backdrop-blur-2xl rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-50 py-1.5 text-[13px] overflow-hidden">
                  <div className="px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                    <span>Select Persona</span>
                    <span className="text-cyan-400 font-sans font-semibold text-[10px] bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                      Demo Mode
                    </span>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => handleSwitchRole("client")}
                      className={`w-full text-left p-2.5 rounded-[8px] flex items-start gap-3 transition-all ${
                        currentRole === "client"
                          ? "bg-cyan-500/15 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "hover:bg-white/[0.05] text-zinc-300"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400/30 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        C
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] text-white flex items-center justify-between">
                          <span>Aarav Mehta</span>
                          <span className="text-[10px] font-mono text-cyan-300">Client</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">
                          aarav.mehta@acmecorp.in
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSwitchRole("freelancer")}
                      className={`w-full text-left p-2.5 rounded-[8px] flex items-start gap-3 transition-all ${
                        currentRole === "freelancer"
                          ? "bg-teal-500/15 border border-teal-500/30 text-white shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                          : "hover:bg-white/[0.05] text-zinc-300"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 border border-teal-400/30 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                        F
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] text-white flex items-center justify-between">
                          <span>Sagarika Das</span>
                          <span className="text-[10px] font-mono text-teal-300">Freelancer</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">
                          sagarika.das@devforge.io
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
