import { JobStatus } from "@/lib/types";
import { Check } from "lucide-react";

interface StepperProps {
  status: JobStatus;
}

const STEPS: { key: JobStatus; label: string }[] = [
  { key: "drafted", label: "Drafted" },
  { key: "criteria_approved", label: "Criteria approved" },
  { key: "funded", label: "Funded" },
  { key: "submitted", label: "Submitted" },
  { key: "verified", label: "Verified" },
  { key: "paid", label: "Paid" },
];

const STEP_ORDER: Record<JobStatus, number> = {
  drafted: 0,
  criteria_approved: 1,
  funded: 2,
  submitted: 3,
  verified: 4,
  paid: 5,
  disputed: 3,
  refunded: 5,
};

export function Stepper({ status }: StepperProps) {
  const currentIndex = STEP_ORDER[status] ?? 0;

  return (
    <div className="w-full liquid-glass rounded-[12px] p-3.5 px-5 overflow-x-auto relative">
      <div className="flex items-center min-w-[580px] justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex || (status === "paid" && idx === 5);
          const isCurrent = idx === currentIndex && status !== "paid";
          const isUpcoming = idx > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 transition-all ${
                    isCompleted
                      ? "bg-gradient-to-tr from-cyan-600 to-teal-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] border border-cyan-300/40"
                      : isCurrent
                      ? "border-2 border-cyan-400 text-cyan-200 font-bold bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
                      : "border border-white/[0.1] text-zinc-500 bg-white/[0.03]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span
                  className={`text-[12px] whitespace-nowrap tracking-tight ${
                    isCurrent
                      ? "font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      : isCompleted
                      ? "font-medium text-cyan-100"
                      : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-[2px] mx-2.5 sm:mx-4 flex-1 min-w-[24px] rounded-full transition-all ${
                    idx < currentIndex
                      ? "bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      : "bg-white/[0.08]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
