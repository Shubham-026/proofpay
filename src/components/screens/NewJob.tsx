"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ai } from "@/lib/services/ai";
import { useProofPayStore } from "@/lib/store";
import { TestCase, Job } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Bot, Plus, Trash2, CheckCircle2, ArrowRight, Loader2, Sparkles, Layers } from "lucide-react";
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
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-white/[0.08] gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white flex items-center gap-2">
            <span>Create Verifiable Escrow Task</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AI Synthesizer
            </span>
          </h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">
            Describe specifications in natural English. AI synthesizes executable assertions committed to smart contract.
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
            className="text-[11px] font-mono text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-[6px] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all"
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
            className="text-[11px] font-mono text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-[6px] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all"
          >
            Load Phone brief
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Brief & Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-300 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-[13px] px-3.5 py-2 rounded-[8px] border border-white/[0.1] bg-white/[0.04] text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                placeholder="e.g. Normalize phone numbers"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-300 mb-1.5">
                Target Python Function Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full text-[12px] font-mono px-3.5 py-2 rounded-[8px] border border-white/[0.1] bg-white/[0.04] text-cyan-300 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                placeholder="normalize_phone(number: str) -> str | None"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-300 mb-1.5">
                  Escrow Budget (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-[13px]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-[13px] font-mono tabular-nums pl-8 pr-3.5 py-2 rounded-[8px] border border-white/[0.1] bg-white/[0.04] text-white focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-300 mb-1.5">
                  Delivery Window
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full text-[13px] px-3.5 py-2 rounded-[8px] border border-white/[0.1] bg-[#0c0f18] text-zinc-200 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                >
                  <option value={3}>3 Days (Fast Track)</option>
                  <option value={5}>5 Days (Standard)</option>
                  <option value={7}>7 Days (Extended)</option>
                  <option value={14}>14 Days</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-zinc-300">
                  Plain-English Task Brief
                </label>
                <span className="text-[11px] font-mono text-zinc-400">Describe edge cases</span>
              </div>
              <textarea
                rows={6}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full text-[13px] p-3.5 rounded-[8px] border border-white/[0.1] bg-white/[0.04] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 resize-y leading-relaxed shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                placeholder="Describe what the function must do and invalid inputs it should reject..."
              />
            </div>

            <button
              type="button"
              onClick={handleDraftCriteria}
              disabled={isDrafting || !brief.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 disabled:opacity-50 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
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

          <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.06] text-[12px] text-zinc-400 space-y-1.5">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>How ProofPay Verifies Escrow</span>
            </div>
            <div>
              1. The AI synthesizes boundary conditions into deterministic test cases.
            </div>
            <div>
              2. Both parties approve; criteria SHA-256 hash is locked in the smart contract.
            </div>
            <div>
              3. MicroVM sandbox verifies delivered function; funds release automatically on pass.
            </div>
          </div>
        </div>

        {/* Right Column: Acceptance Criteria Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="liquid-glass rounded-[14px] p-5 flex flex-col h-full min-h-[520px]">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
              <div>
                <div className="text-[15px] font-semibold text-white flex items-center gap-2">
                  <span>Acceptance Test Criteria</span>
                  {criteria.length > 0 && (
                    <span className="text-[11px] font-mono bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full text-cyan-300">
                      {criteria.length} assertions
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-zinc-400">
                  Executable assertions checked by sandbox before escrow release
                </div>
              </div>

              {criteria.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddCase}
                  className="inline-flex items-center gap-1.5 text-[12px] text-zinc-300 hover:text-white border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-[6px] transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
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
                    className="p-3.5 border border-white/[0.08] rounded-[10px] space-y-2.5 bg-white/[0.02]"
                  >
                    <div className="h-4 bg-white/[0.1] rounded w-1/3" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-white/[0.08] rounded" />
                      <div className="h-8 bg-white/[0.08] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isDrafting && criteria.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-zinc-400 px-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Bot className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-[15px] font-semibold text-white mb-1">
                  No criteria generated yet
                </div>
                <p className="text-[13px] text-zinc-400 max-w-sm mb-4">
                  Write your task brief on the left and click <strong>Draft Criteria with AI</strong> to synthesize test cases.
                </p>
                <button
                  type="button"
                  onClick={handleDraftCriteria}
                  className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 hover:text-white rounded-[8px] text-[12px] font-medium transition-all"
                >
                  Generate initial test suite
                </button>
              </div>
            )}

            {/* Editable Criteria List */}
            {!isDrafting && criteria.length > 0 && (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {criteria.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className="p-3.5 border border-white/[0.08] rounded-[10px] bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5 text-[12px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-[11px] text-cyan-400 shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={tc.name}
                          onChange={(e) => handleUpdateCase(idx, "name", e.target.value)}
                          className="font-medium text-[13px] bg-transparent border-b border-transparent hover:border-white/[0.2] focus:border-cyan-400 focus:outline-none flex-1 text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCase(idx)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove test case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Input Argument
                        </span>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) => handleUpdateCase(idx, "input", e.target.value)}
                          className="w-full font-mono text-[11px] px-2.5 py-1.5 rounded-[6px] border border-white/[0.1] bg-black/40 text-cyan-200 focus:outline-none focus:border-cyan-400/60"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Expected Return Output
                        </span>
                        <input
                          type="text"
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            handleUpdateCase(idx, "expectedOutput", e.target.value)
                          }
                          className="w-full font-mono text-[11px] px-2.5 py-1.5 rounded-[6px] border border-white/[0.1] bg-black/40 text-emerald-300 focus:outline-none focus:border-cyan-400/60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            {criteria.length > 0 && !isDrafting && (
              <div className="pt-4 border-t border-white/[0.08] mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-[12px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={criteriaApproved}
                    onChange={(e) => setCriteriaApproved(e.target.checked)}
                    className="rounded bg-black/40 border-white/[0.2] text-cyan-500 focus:ring-cyan-400 w-4 h-4"
                  />
                  <span>I approve these acceptance criteria as legally binding</span>
                </label>

                <button
                  type="button"
                  onClick={handleCreateJob}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Deploy Escrow Job ({formatINR(amount)})</span>
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
