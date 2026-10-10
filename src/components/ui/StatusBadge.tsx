import { JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; dotColor: string; bgClass: string; textClass: string; borderClass: string; glowClass: string }
> = {
  drafted: {
    label: "Drafted",
    dotColor: "bg-zinc-400 shadow-[0_0_6px_rgba(161,161,170,0.8)]",
    bgClass: "bg-white/[0.04]",
    textClass: "text-zinc-300",
    borderClass: "border-white/[0.1]",
    glowClass: "",
  },
  criteria_approved: {
    label: "Criteria Approved",
    dotColor: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]",
    bgClass: "bg-sky-500/[0.1]",
    textClass: "text-sky-300",
    borderClass: "border-sky-500/30",
    glowClass: "shadow-[0_0_12px_rgba(56,189,248,0.15)]",
  },
  funded: {
    label: "Escrow Funded",
    dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse",
    bgClass: "bg-emerald-500/[0.12]",
    textClass: "text-emerald-300 font-medium",
    borderClass: "border-emerald-500/35",
    glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
  },
  submitted: {
    label: "Work Submitted",
    dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    bgClass: "bg-amber-500/[0.12]",
    textClass: "text-amber-300",
    borderClass: "border-amber-500/30",
    glowClass: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  },
  verified: {
    label: "Tests Passed",
    dotColor: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]",
    bgClass: "bg-teal-500/[0.12]",
    textClass: "text-teal-300 font-medium",
    borderClass: "border-teal-500/35",
    glowClass: "shadow-[0_0_14px_rgba(20,184,166,0.2)]",
  },
  paid: {
    label: "Payment Released",
    dotColor: "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,1)]",
    bgClass: "bg-cyan-500/[0.15]",
    textClass: "text-cyan-200 font-semibold",
    borderClass: "border-cyan-400/40",
    glowClass: "shadow-[0_0_16px_rgba(6,182,212,0.25)]",
  },
  disputed: {
    label: "In Dispute",
    dotColor: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]",
    bgClass: "bg-rose-500/[0.12]",
    textClass: "text-rose-300",
    borderClass: "border-rose-500/30",
    glowClass: "shadow-[0_0_12px_rgba(244,63,94,0.18)]",
  },
  refunded: {
    label: "Refunded",
    dotColor: "bg-zinc-400 shadow-[0_0_6px_rgba(161,161,170,0.8)]",
    bgClass: "bg-zinc-800/40",
    textClass: "text-zinc-400",
    borderClass: "border-zinc-700/50",
    glowClass: "",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.drafted;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border tabular-nums leading-none tracking-tight backdrop-blur-md transition-all",
        config.bgClass,
        config.textClass,
        config.borderClass,
        config.glowClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
