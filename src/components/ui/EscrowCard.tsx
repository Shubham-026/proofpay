"use client";

import { Job } from "@/lib/types";
import { formatINR, truncateHash } from "@/lib/utils";
import { Check, Copy, ExternalLink, Fuel, Lock, ShieldCheck, Sparkles } from "lucide-react";
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
    <div className="liquid-glass rounded-[14px] p-5 text-[13px] relative overflow-hidden">
      {/* Ambient glass reflection sheen */}
      <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent pointer-events-none rounded-tr-[14px]" />

      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-[8px] bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">
              On-Chain Escrow Vault
            </span>
            <div className="text-[11px] text-zinc-400 font-mono">
              ProofPayEscrow.sol • Base Sepolia
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
          <span>Chain ID: 84532</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Escrow Balance */}
        <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
            <span>Escrow Balance</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-[22px] font-mono tabular-nums font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            {formatINR(job.amount)}
          </div>
          <div className="text-[11px] flex items-center gap-1.5 mt-1">
            {isFundedOrLater ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                Locked in smart contract
              </span>
            ) : (
              <span className="text-zinc-500">Deposit pending</span>
            )}
          </div>
        </div>

        {/* Contract Address */}
        <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Contract Address
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[12px] text-zinc-200 bg-white/[0.06] px-2 py-1 rounded-[6px] border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
              title={job.contractAddress}
            >
              {truncateHash(job.contractAddress, 5)}
            </span>
            <button
              onClick={() => copyToClipboard(job.contractAddress, "contract")}
              className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] rounded-[6px] transition-all border border-white/[0.06]"
              title="Copy contract address"
            >
              {copiedKey === "contract" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Immutable escrow logic
          </div>
        </div>

        {/* Criteria Digest */}
        <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Criteria Digest (Hash)
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[12px] text-zinc-200 bg-white/[0.06] px-2 py-1 rounded-[6px] border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
              title={job.criteriaHash}
            >
              {truncateHash(job.criteriaHash, 5)}
            </span>
            <button
              onClick={() => copyToClipboard(job.criteriaHash, "criteria")}
              className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] rounded-[6px] transition-all border border-white/[0.06]"
              title="Copy criteria hash"
            >
              {copiedKey === "criteria" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            SHA-256 criteria commitment
          </div>
        </div>

        {/* Transactions */}
        <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Transactions
          </div>
          <div className="space-y-1.5">
            {job.fundTxHash ? (
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] text-zinc-400">Fund:</span>
                <span
                  className="font-mono text-[11px] text-cyan-300"
                  title={job.fundTxHash}
                >
                  {truncateHash(job.fundTxHash, 4)}
                </span>
                <button
                  onClick={() => copyToClipboard(job.fundTxHash!, "fund")}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  {copiedKey === "fund" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 italic">No deposit tx yet</div>
            )}

            {job.releaseTxHash && (
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] text-emerald-400 font-medium">Release:</span>
                <span
                  className="font-mono text-[11px] text-emerald-300 font-semibold"
                  title={job.releaseTxHash}
                >
                  {truncateHash(job.releaseTxHash, 4)}
                </span>
                <button
                  onClick={() => copyToClipboard(job.releaseTxHash!, "release")}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  {copiedKey === "release" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
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
