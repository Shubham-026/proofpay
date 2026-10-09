"use client";

import Link from "next/link";
import { useState } from "react";
import { useProofPayStore } from "@/lib/store";
import { Job, JobStatus } from "@/lib/types";
import { formatINR, formatISTDate } from "@/lib/utils";
import { StatusBadge } from "../ui/StatusBadge";
import { ArrowRight, Plus, Search, Sparkles } from "lucide-react";

type FilterTab = "all" | "active" | "awaiting" | "completed";

export function JobsList() {
  const { jobs, currentRole, isLoaded } = useProofPayStore();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  if (!isLoaded) {
    return (
      <div className="py-12 text-center text-zinc-400 text-[13px]">
        Loading jobs ledger…
      </div>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    // Search query filter
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
        // Awaiting client action: criteria to approve, or fund, or view report
        return (
          job.status === "drafted" ||
          job.status === "criteria_approved" ||
          job.status === "verified"
        );
      } else {
        // Awaiting freelancer action: criteria review, or submission
        return job.status === "drafted" || job.status === "funded";
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner for Demo Evaluator Convenience */}
      <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 rounded-[6px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
          <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>
            <strong>Demo Quickstart:</strong> Job{" "}
            <code className="font-mono text-[12px] bg-teal-100 dark:bg-teal-900 px-1 py-0.5 rounded">
              Normalize Indian phone numbers
            </code>{" "}
            is currently funded and ready for Python submission and sandbox verification.
          </span>
        </div>
        <Link
          href="/jobs/job-norm-phone"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-[5px] text-[12px] font-medium transition-colors shrink-0"
        >
          <span>Open Demo Job</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Control bar: Tabs + Search + New Job */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-[6px] border border-zinc-200/80 dark:border-zinc-800 self-start">
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "awaiting", label: "Awaiting me" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1 rounded-[4px] text-[12px] transition-colors ${
                filter === t.id
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search and Action */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter jobs or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 text-[12px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-teal-700 w-44 sm:w-56"
            />
          </div>

          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-[5px] text-[12px] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* Dense Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Job Title & Signature</th>
                <th className="py-2.5 px-3 font-medium">Counterparty</th>
                <th className="py-2.5 px-3 font-medium text-right">Escrow (₹)</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Deadline (IST)</th>
                <th className="py-2.5 px-4 font-medium text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 text-[13px]">
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
                      className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/jobs/${job.id}`)}
                    >
                      {/* Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.title}
                          </Link>
                          {job.id === "job-norm-phone" && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800/60 font-semibold">
                              DEMO TARGET
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {job.functionSignature}
                        </div>
                      </td>

                      {/* Counterparty */}
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        <div className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                          {counterparty.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {currentRole === "client" ? "Freelancer" : "Client"}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatINR(job.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-3 text-[12px] text-zinc-500 font-mono">
                        {formatISTDate(job.deadline).split(",")[0]}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-4 text-right text-[11px] text-zinc-400 font-mono">
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
