"use client";

import { Job } from "@/lib/types";
import { formatINR, truncateHash } from "@/lib/utils";
import { Check, Copy, ExternalLink, Fuel, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface EscrowCardProps {
  job: Job;
}

export function EscrowCard({ job }: EscrowCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isFundedOrLater =
    job.status === "funded" ||
    job.status === "submitted" ||
    job.status === "verified" ||
    job.status === "paid";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 text-[13px]">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-[4px] bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Smart Contract Escrow
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>Base Sepolia (84532)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Amount Locked */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            Escrow Balance
          </div>
          <div className="text-[18px] font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">
            {formatINR(job.amount)}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
            {isFundedOrLater ? (
              <span className="text-teal-700 dark:text-teal-400 font-medium">
                Locked in contract
              </span>
            ) : (
              <span>Pending deposit</span>
            )}
          </div>
        </div>

        {/* Contract Address */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            Contract Address
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded-[4px] border border-zinc-200 dark:border-zinc-800"
              title={job.contractAddress}
            >
              {truncateHash(job.contractAddress, 5)}
            </span>
            <button
              onClick={() => copyToClipboard(job.contractAddress, "contract")}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title="Copy contract address"
            >
              {copiedKey === "contract" ? (
                <Check className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            ProofPayEscrow.sol
          </div>
        </div>

        {/* Criteria Hash */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            Criteria Digest (Hash)
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded-[4px] border border-zinc-200 dark:border-zinc-800"
              title={job.criteriaHash}
            >
              {truncateHash(job.criteriaHash, 5)}
            </span>
            <button
              onClick={() => copyToClipboard(job.criteriaHash, "criteria")}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title="Copy criteria hash"
            >
              {copiedKey === "criteria" ? (
                <Check className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            SHA-256 test suite commitment
          </div>
        </div>

        {/* Gas & Tx Hashes */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            Transactions
          </div>
          <div className="space-y-1">
            {job.fundTxHash ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Fund:</span>
                <span
                  className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                  title={job.fundTxHash}
                >
                  {truncateHash(job.fundTxHash, 4)}
                </span>
                <button
                  onClick={() => copyToClipboard(job.fundTxHash!, "fund")}
                  className="p-0.5 text-zinc-400 hover:text-zinc-700"
                >
                  {copiedKey === "fund" ? (
                    <Check className="w-3 h-3 text-teal-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 italic">No deposit tx yet</div>
            )}

            {job.releaseTxHash && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                  Release:
                </span>
                <span
                  className="font-mono text-[11px] text-teal-800 dark:text-teal-300"
                  title={job.releaseTxHash}
                >
                  {truncateHash(job.releaseTxHash, 4)}
                </span>
                <button
                  onClick={() => copyToClipboard(job.releaseTxHash!, "release")}
                  className="p-0.5 text-zinc-400 hover:text-zinc-700"
                >
                  {copiedKey === "release" ? (
                    <Check className="w-3 h-3 text-teal-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
