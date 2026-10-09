"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ai } from "@/lib/services/ai";
import { useProofPayStore } from "@/lib/store";
import { TestCase, Job } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Bot, Plus, Trash2, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function NewJob() {
  const router = useRouter();
  const { addJob, currentUser } = useProofPayStore();

  const [title, setTitle] = useState("Normalize Indian phone numbers to E.164 (+91)");
  const [signature, setSignature] = useState("normalize_phone(number: str) -> str | None");
  const [brief, setBrief] = useState(
    "Write a Python function normalize_phone(number) that accepts strings containing Indian phone numbers formatted with spaces, dashes, parentheses, or +91/0 prefixes. It should return a standard +91XXXXXXXXXX string where X is a 10-digit number starting with digits 6, 7, 8, or 9. If the number has invalid length, invalid starting digit, or non-phone characters, return None."
  );
  const [amount, setAmount] = useState<number>(4500);
  const [deadlineDays, setDeadlineDays] = useState<number>(5);

  const [isDrafting, setIsDrafting] = useState(false);
  const [criteria, setCriteria] = useState<TestCase[]>([]);
  const [criteriaApproved, setCriteriaApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDraftCriteria = async () => {
    if (!brief.trim()) {
      toast.error("Please provide a brief first.");
      return;
    }

    setIsDrafting(true);
    try {
      const generated = await ai.draftCriteria(brief);
      setCriteria(generated);
      setCriteriaApproved(false);
      toast.success(`Synthesized ${generated.length} test criteria from brief`);
    } catch {
      toast.error("Failed to generate criteria");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAddCase = () => {
    const newCase: TestCase = {
      id: `tc-custom-${Date.now()}`,
      name: `Custom Test Case ${criteria.length + 1}`,
      input: '"test_input"',
      expectedOutput: 'None',
      description: "User-defined acceptance boundary",
    };
    setCriteria([...criteria, newCase]);
  };

  const handleRemoveCase = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCase = (index: number, field: keyof TestCase, value: string) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleCreateJob = async () => {
    if (criteria.length === 0) {
      toast.error("Please draft and review acceptance criteria first.");
      return;
    }

    setIsSubmitting(true);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    const newJobId = `job-${Date.now().toString().slice(-6)}`;
    const newJob: Job = {
      id: newJobId,
      title: title.trim() || "Python Task",
      functionSignature: signature.trim() || "task_func(input)",
      brief,
      amount: Number(amount) || 3000,
      client: {
        name: "Aarav Mehta",
        email: "aarav.mehta@acmecorp.in",
        address: "0x89205A3A3b2A55384e45BC654B644796B26A024E",
        role: "client",
      },
      freelancer: {
        name: "Sagarika Das",
        email: "sagarika.das@devforge.io",
        address: "0x1A2b3c4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B",
        role: "freelancer",
      },
      status: criteriaApproved ? "criteria_approved" : "drafted",
      deadline: deadlineDate.toISOString(),
      lastActivity: new Date().toISOString(),
      contractAddress: "0xPendingFunding",
      criteriaHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      criteriaApprovedByClient: criteriaApproved,
      criteriaApprovedByFreelancer: false,
      remainingPlaygroundRuns: 20,
      maxPlaygroundRuns: 20,
      criteria,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: "Job created with AI acceptance criteria",
          description: `Initialized with ${criteria.length} test assertions and ₹${amount} escrow budget.`,
          actor: "Aarav Mehta (Client)",
        },
      ],
    };

    addJob(newJob);
    toast.success("Escrow task created successfully");
    router.push(`/jobs/${newJobId}`);
  };

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Create Verifiable Escrow Task
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Define requirements in plain English. AI synthesizes testable criteria that release payment upon sandbox pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTitle("Calculate GST breakdown for B2B invoices");
              setSignature("calculate_gst(amount_paise: int, is_interstate: bool) -> dict");
              setBrief("Calculate 18% GST on paise amounts. If intra-state, split into CGST (9%) and SGST (9%). If inter-state, allocate all 18% to IGST. Return integer paise rounded appropriately.");
              setAmount(3000);
            }}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
          >
            Load GST brief
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle("Normalize Indian phone numbers to E.164 (+91)");
              setSignature("normalize_phone(number: str) -> str | None");
              setBrief("Write a Python function normalize_phone(number) that accepts strings containing Indian phone numbers formatted with spaces, dashes, parentheses, or +91/0 prefixes. It should return a standard +91XXXXXXXXXX string where X is a 10-digit number starting with digits 6, 7, 8, or 9. If the number has invalid length, invalid starting digit, or non-phone characters, return None.");
              setAmount(4500);
            }}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
          >
            Load Phone brief
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Brief & Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-3.5">
            <div>
              <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-700"
                placeholder="e.g. Normalize phone numbers"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Python Function Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full text-[12px] font-mono px-3 py-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-700"
                placeholder="normalize_phone(number: str) -> str | None"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Escrow Budget (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-[12px]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-[13px] font-mono tabular-nums pl-7 pr-3 py-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Delivery Window
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full text-[13px] px-3 py-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-700"
                >
                  <option value={3}>3 Days (Fast)</option>
                  <option value={5}>5 Days (Standard)</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                  Plain-English Task Brief
                </label>
                <span className="text-[11px] text-zinc-400">Describe edge cases</span>
              </div>
              <textarea
                rows={6}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full text-[13px] p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-700 resize-y leading-relaxed"
                placeholder="Describe what the function must do and invalid inputs it should reject..."
              />
            </div>

            <button
              type="button"
              onClick={handleDraftCriteria}
              disabled={isDrafting || !brief.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-[5px] text-[13px] font-medium transition-colors"
            >
              {isDrafting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing test cases with AI…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Draft Criteria with AI</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-[6px] text-[12px] text-zinc-500 space-y-1">
            <div className="font-medium text-zinc-700 dark:text-zinc-300">
              How ProofPay escrows work
            </div>
            <div>
              1. The AI synthesizes edge cases into executable test assertions.
            </div>
            <div>
              2. Once approved, the criteria SHA-256 hash is committed into the smart contract.
            </div>
            <div>
              3. The freelancer submits code; the sandbox verifies tests and unlocks funds automatically.
            </div>
          </div>
        </div>

        {/* Right Column: Acceptance Criteria Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-3">
              <div>
                <div className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Acceptance Test Criteria</span>
                  {criteria.length > 0 && (
                    <span className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                      {criteria.length} assertions
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-zinc-500">
                  Executable assertions checked by sandbox before escrow release
                </div>
              </div>

              {criteria.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddCase}
                  className="inline-flex items-center gap-1 text-[12px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-[4px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Case</span>
                </button>
              )}
            </div>

            {/* Skeleton Loading State */}
            {isDrafting && (
              <div className="space-y-3 py-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-[6px] space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30"
                  >
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isDrafting && criteria.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-zinc-400 px-4">
                <Bot className="w-8 h-8 stroke-[1.5] mb-2 text-zinc-300 dark:text-zinc-700" />
                <div className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  No criteria generated yet
                </div>
                <p className="text-[13px] text-zinc-500 max-w-sm mb-4">
                  Write your task brief on the left and click <strong>Draft Criteria with AI</strong> to synthesize test cases.
                </p>
                <button
                  type="button"
                  onClick={handleDraftCriteria}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-[5px] text-[12px] font-medium transition-colors"
                >
                  Generate initial test cases
                </button>
              </div>
            )}

            {/* Editable Criteria List */}
            {!isDrafting && criteria.length > 0 && (
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {criteria.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-[5px] bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2 text-[12px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={tc.name}
                          onChange={(e) => handleUpdateCase(idx, "name", e.target.value)}
                          className="font-medium text-[12px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-teal-700 focus:outline-none flex-1 text-zinc-800 dark:text-zinc-200"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCase(idx)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove test case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[11px] font-mono text-zinc-400 mb-0.5">
                          Input Argument
                        </span>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) => handleUpdateCase(idx, "input", e.target.value)}
                          className="w-full font-mono text-[11px] px-2 py-1 rounded-[4px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-mono text-zinc-400 mb-0.5">
                          Expected Return Output
                        </span>
                        <input
                          type="text"
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            handleUpdateCase(idx, "expectedOutput", e.target.value)
                          }
                          className="w-full font-mono text-[11px] px-2 py-1 rounded-[4px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            {criteria.length > 0 && !isDrafting && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-[12px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={criteriaApproved}
                    onChange={(e) => setCriteriaApproved(e.target.checked)}
                    className="rounded text-teal-800 focus:ring-teal-700 w-4 h-4"
                  />
                  <span>I approve these acceptance criteria as binding</span>
                </label>

                <button
                  type="button"
                  onClick={handleCreateJob}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-[5px] text-[13px] font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Job ({formatINR(amount)})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
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
