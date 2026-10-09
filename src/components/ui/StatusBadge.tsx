import { JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; dotColor: string; bgClass: string; textClass: string; borderClass: string }
> = {
  drafted: {
    label: "Drafted",
    dotColor: "bg-zinc-400",
    bgClass: "bg-zinc-100 dark:bg-zinc-800/60",
    textClass: "text-zinc-600 dark:text-zinc-400",
    borderClass: "border-zinc-200 dark:border-zinc-700",
  },
  criteria_approved: {
    label: "Criteria Approved",
    dotColor: "bg-sky-500",
    bgClass: "bg-sky-50 dark:bg-sky-950/40",
    textClass: "text-sky-700 dark:text-sky-400",
    borderClass: "border-sky-200 dark:border-sky-800/60",
  },
  funded: {
    label: "Escrow Funded",
    dotColor: "bg-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-emerald-800/60",
  },
  submitted: {
    label: "Work Submitted",
    dotColor: "bg-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-800/60",
  },
  verified: {
    label: "Tests Passed",
    dotColor: "bg-teal-500",
    bgClass: "bg-teal-50 dark:bg-teal-950/40",
    textClass: "text-teal-700 dark:text-teal-400",
    borderClass: "border-teal-200 dark:border-teal-800/60",
  },
  paid: {
    label: "Payment Released",
    dotColor: "bg-teal-600",
    bgClass: "bg-teal-50 dark:bg-teal-950/50",
    textClass: "text-teal-800 dark:text-teal-300",
    borderClass: "border-teal-300 dark:border-teal-800",
  },
  disputed: {
    label: "In Dispute",
    dotColor: "bg-rose-500",
    bgClass: "bg-rose-50 dark:bg-rose-950/40",
    textClass: "text-rose-700 dark:text-rose-400",
    borderClass: "border-rose-200 dark:border-rose-800/60",
  },
  refunded: {
    label: "Refunded",
    dotColor: "bg-zinc-500",
    bgClass: "bg-zinc-100 dark:bg-zinc-800/60",
    textClass: "text-zinc-700 dark:text-zinc-300",
    borderClass: "border-zinc-300 dark:border-zinc-700",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.drafted;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[12px] font-medium border tabular-nums leading-none tracking-tight",
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
