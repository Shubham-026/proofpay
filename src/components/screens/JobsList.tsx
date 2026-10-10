"use client";

import Link from "next/link";
import { useState } from "react";
import { useProofPayStore } from "@/lib/store";
import { Job, JobStatus } from "@/lib/types";
import { formatINR, formatISTDate } from "@/lib/utils";
import { StatusBadge } from "../ui/StatusBadge";
import { ArrowRight, Plus, Search, Sparkles, ShieldCheck } from "lucide-react";

type FilterTab = "all" | "active" | "awaiting" | "completed";

export function JobsList() {
  const { jobs, currentRole, isLoaded } = useProofPayStore();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  if (!isLoaded) {
    return (
      <div className="py-16 text-center text-zinc-500 text-[13px] font-mono">
        Loading cryptographic ledger…
      </div>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.brief.toLowerCase().includes(search.toLowerCase()) ||
      job.functionSignature.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "all") return true;

    if (filter === "completed") {
      return job.status === "paid" || job.status === "refunded";
    }

    if (filter === "active") {
      return job.status !== "paid" && job.status !== "refunded";
    }

    if (filter === "awaiting") {
      if (currentRole === "client") {
        return (
          job.status === "drafted" ||
          job.status === "criteria_approved" ||
          job.status === "verified"
        );
      } else {
        return job.status === "drafted" || job.status === "funded";
      }
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner for Demo Evaluator Convenience */}
      <div className="liquid-glass rounded-[14px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px] border border-cyan-500/25 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
        <div className="flex items-center gap-3 text-zinc-200">
          <div className="p-2 rounded-[8px] bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Ready Demo Target</span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Escrow Funded
              </span>
            </div>
            <div className="text-zinc-400 text-[12px] mt-0.5">
              Task <code className="font-mono text-cyan-300 text-[12px]">Normalize Indian phone numbers</code> is funded in smart contract and awaiting Python sandbox verification.
            </div>
          </div>
        </div>
        <Link
          href="/jobs/job-norm-phone"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-[8px] text-[12px] font-semibold transition-all shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]"
        >
          <span>Open Demo Job</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Control bar: Tabs + Search + New Job */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] backdrop-blur-xl rounded-[10px] border border-white/[0.08] self-start shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          {(
            [
              { id: "all", label: "All Jobs" },
              { id: "active", label: "Active" },
              { id: "awaiting", label: "Awaiting Action" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] transition-all ${
                filter === t.id
                  ? "bg-white/[0.12] text-white font-semibold border border-white/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search and Action */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.1] rounded-[8px] focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 text-zinc-100 placeholder:text-zinc-500 w-48 sm:w-60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
            />
          </div>

          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-[8px] text-[12px] font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* Dense Table */}
      <div className="liquid-glass rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Job Title & Signature</th>
                <th className="py-3 px-3 font-medium">Counterparty</th>
                <th className="py-3 px-3 font-medium text-right">Escrow (₹)</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium">Deadline (IST)</th>
                <th className="py-3 px-4 font-medium text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-zinc-500 text-[13px] font-mono">
                    No escrow jobs found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const counterparty =
                    currentRole === "client" ? job.freelancer : job.client;

                  return (
                    <tr
                      key={job.id}
                      className="group hover:bg-white/[0.04] transition-all cursor-pointer"
                      onClick={() => (window.location.href = `/jobs/${job.id}`)}
                    >
                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium text-zinc-100 group-hover:text-cyan-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.title}
                          </Link>
                          {job.id === "job-norm-phone" && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded-full border border-cyan-500/30 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                              DEMO TARGET
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-400 mt-1">
                          {job.functionSignature}
                        </div>
                      </td>

                      {/* Counterparty */}
                      <td className="py-3.5 px-3">
                        <div className="text-[12px] font-medium text-zinc-200">
                          {counterparty.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {currentRole === "client" ? "Freelancer" : "Client"}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        {formatINR(job.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-3 text-[12px] text-zinc-400 font-mono">
                        {formatISTDate(job.deadline).split(",")[0]}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-right text-[11px] text-zinc-400 font-mono">
                        {formatISTDate(job.lastActivity)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
