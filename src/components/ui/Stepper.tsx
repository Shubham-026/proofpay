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
  disputed: 3, // alternate branch
  refunded: 5, // terminal branch
};

export function Stepper({ status }: StepperProps) {
  const currentIndex = STEP_ORDER[status] ?? 0;

  return (
    <div className="w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-3 px-4 overflow-x-auto">
      <div className="flex items-center min-w-[560px] justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex || (status === "paid" && idx === 5);
          const isCurrent = idx === currentIndex && status !== "paid";
          const isUpcoming = idx > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-colors ${
                    isCompleted
                      ? "bg-teal-700 text-white dark:bg-teal-600"
                      : isCurrent
                      ? "border-2 border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60"
                      : "border border-zinc-300 dark:border-zinc-700 text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span
                  className={`text-[12px] whitespace-nowrap tracking-tight ${
                    isCurrent
                      ? "font-semibold text-zinc-900 dark:text-zinc-100"
                      : isCompleted
                      ? "font-medium text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-[1px] mx-2 sm:mx-3 flex-1 min-w-[20px] transition-colors ${
                    idx < currentIndex
                      ? "bg-teal-600 dark:bg-teal-700"
                      : "bg-zinc-200 dark:bg-zinc-800"
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
