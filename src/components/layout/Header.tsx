"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { useProofPayStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { ChevronDown, Fuel, RotateCcw, ShieldCheck, User } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Left: Plain text wordmark + Nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-baseline gap-2 group text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {/* Plain text wordmark - no logo graphic */}
            <span className="font-semibold tracking-tight text-[16px] text-zinc-900 dark:text-zinc-50">
              {BRAND.logoText}
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              escrow v1.0
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-[13px]">
            <Link
              href="/"
              className={`px-2.5 py-1 rounded-[5px] transition-colors ${
                pathname === "/"
                  ? "bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/jobs/new"
              className={`px-2.5 py-1 rounded-[5px] transition-colors ${
                pathname === "/jobs/new"
                  ? "bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              New Job
            </Link>
          </nav>
        </div>

        {/* Right: Role Switcher + Gas Sponsored Badge + User Chip */}
        <div className="flex items-center gap-3">
          {/* Reset Demo State helper */}
          <button
            onClick={handleReset}
            title="Reset to fresh demo seed"
            className="hidden md:inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 px-2 py-1 rounded-[4px] border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          {/* Gas sponsored indicator */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded-[4px]">
            <Fuel className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span>Gas sponsored</span>
          </div>

          {/* Role Switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 text-[12px] bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-[5px] text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] uppercase font-mono tracking-wider">
                  Role:
                </span>
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-zinc-400 text-[11px]">
                  ({currentRole === "client" ? "Client" : "Freelancer"})
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] shadow-sm z-50 py-1 text-[13px]">
                  <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <span>Demo Role Switcher</span>
                    <span className="text-teal-600 dark:text-teal-400 font-sans font-medium text-[10px] bg-teal-50 dark:bg-teal-950/50 px-1 py-0.2 rounded">
                      Demo Mode
                    </span>
                  </div>

                  <button
                    onClick={() => handleSwitchRole("client")}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                      currentRole === "client"
                        ? "bg-zinc-50 dark:bg-zinc-800/40 text-teal-700 dark:text-teal-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="w-4 h-4 mt-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px]">
                      C
                    </div>
                    <div>
                      <div className="font-medium text-[12px] flex items-center gap-1.5">
                        Aarav Mehta
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Client
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        aarav.mehta@acmecorp.in
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchRole("freelancer")}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                      currentRole === "freelancer"
                        ? "bg-zinc-50 dark:bg-zinc-800/40 text-teal-700 dark:text-teal-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="w-4 h-4 mt-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px]">
                      F
                    </div>
                    <div>
                      <div className="font-medium text-[12px] flex items-center gap-1.5">
                        Sagarika Das
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Freelancer
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        sagarika.das@devforge.io
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
