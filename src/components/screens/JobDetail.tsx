"use client";

import { useState } from "react";
import Link from "next/link";
import { useProofPayStore } from "@/lib/store";
import { Job, JobStatus, TestResult, VerificationReport } from "@/lib/types";
import { formatINR, formatISTDate, truncateHash } from "@/lib/utils";
import { escrow } from "@/lib/services/escrow";
import { sandbox, SAMPLE_CORRECT, SAMPLE_BUGGY } from "@/lib/services/sandbox";
import { StatusBadge } from "../ui/StatusBadge";
import { Stepper } from "../ui/Stepper";
import { EscrowCard } from "../ui/EscrowCard";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Fuel,
  Info,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface JobDetailProps {
  jobId: string;
}

type TabType =
  | "submission"
  | "verification"
  | "playground"
  | "criteria"
  | "brief"
  | "activity";

export function JobDetail({ jobId }: JobDetailProps) {
  const { getJob, updateJob, currentRole, currentUser, isLoaded } =
    useProofPayStore();
  const job = getJob(jobId);

  const [activeTab, setActiveTab] = useState<TabType>("submission");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Freelancer submission state
  const [codeDraft, setCodeDraft] = useState(
    job?.submissionCode || SAMPLE_CORRECT
  );
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [streamingResults, setStreamingResults] = useState<TestResult[]>([]);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);

  // Escrow funding / release transaction states
  const [isFunding, setIsFunding] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  // Playground state
  const [playgroundInput, setPlaygroundInput] = useState('"09876-543210"');
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [playgroundRuntime, setPlaygroundRuntime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isLoaded) {
    return (
      <div className="py-16 text-center text-zinc-500 text-[13px] font-mono">
        Loading cryptographic state…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-[14px] text-zinc-400">Job not found.</div>
        <Link
          href="/"
          className="text-cyan-400 text-[13px] underline hover:text-cyan-300"
        >
          Return to jobs list
        </Link>
      </div>
    );
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Approve Criteria Action
  const handleApproveCriteria = () => {
    const isClient = currentRole === "client";
    const approvedByClient = isClient ? true : job.criteriaApprovedByClient;
    const approvedByFreelancer = !isClient ? true : job.criteriaApprovedByFreelancer;
    const bothApproved = approvedByClient && approvedByFreelancer;

    const newStatus: JobStatus = bothApproved ? "criteria_approved" : job.status;

    updateJob(job.id, {
      criteriaApprovedByClient: approvedByClient,
      criteriaApprovedByFreelancer: approvedByFreelancer,
      status: newStatus,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `Criteria approved by ${currentUser.name}`,
          description: bothApproved
            ? "Both parties signed off. Escrow contract ready to be funded."
            : `Awaiting counterparty sign-off on test suite.`,
          actor: `${currentUser.name} (${currentRole})`,
        },
        ...job.activityLog,
      ],
    });

    toast.success(
      bothApproved
        ? "Both parties approved criteria! Ready to fund escrow."
        : "You approved the criteria. Awaiting counterparty."
    );
  };

  // 2. Fund Escrow Action (Gas-sponsored meta-tx)
  const handleFundEscrow = async () => {
    setIsFunding(true);
    try {
      toast.info("Submitting gasless funding meta-transaction to Base Sepolia…");
      const res = await escrow.fund(job.id, job.amount);

      updateJob(job.id, {
        status: "funded",
        contractAddress: res.contractAddress,
        criteriaHash: res.criteriaHash,
        fundTxHash: res.txHash,
        activityLog: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: `Escrow funded with ${formatINR(job.amount)}`,
            description: `Locked into ProofPayEscrow.sol. Gas sponsored by protocol.`,
            actor: `${currentUser.name} (Client)`,
            txHash: res.txHash,
          },
          ...job.activityLog,
        ],
      });

      toast.success(`Escrow funded! Tx: ${truncateHash(res.txHash, 6)}`);
    } catch {
      toast.error("Failed to fund escrow contract");
    } finally {
      setIsFunding(false);
    }
  };

  // 3. Run Tests in Sandbox & Live Stream Rows
  const handleRunVerification = async (codeToRun = codeDraft) => {
    if (!codeToRun.trim()) {
      toast.error("Please provide code to run");
      return;
    }

    setIsRunningTests(true);
    setStreamingResults([]);
    setActiveTestIndex(0);

    const interimResults: TestResult[] = [];

    try {
      const report = await sandbox.runTests(
        codeToRun,
        job.criteria,
        (res, index) => {
          interimResults.push(res);
          setStreamingResults([...interimResults]);
          setActiveTestIndex(index + 1);
        }
      );

      setActiveTestIndex(null);

      const passesAll = report.passed;

      if (passesAll) {
        toast.success("100% Acceptance criteria verified! Triggering automatic escrow release…");
        setIsReleasing(true);
        const releaseRes = await escrow.release(job.id);
        setIsReleasing(false);

        updateJob(job.id, {
          submissionCode: codeToRun,
          submittedAt: new Date().toISOString(),
          status: "paid",
          verificationReport: report,
          releaseTxHash: releaseRes.txHash,
          activityLog: [
            {
              id: `act-${Date.now()}-rel`,
              timestamp: new Date().toISOString(),
              title: `Escrow payment released (${formatINR(job.amount)})`,
              description: `Automated verifier trigger executed upon 100% test suite pass. Payment transferred to ${job.freelancer.name}.`,
              actor: "ProofPay Automated Verifier",
              txHash: releaseRes.txHash,
            },
            {
              id: `act-${Date.now()}-ver`,
              timestamp: new Date().toISOString(),
              title: "Verification passed (100%)",
              description: report.summary,
              actor: "Sandbox MicroVM",
            },
            ...job.activityLog,
          ],
        });

        toast.success(`Payment released on-chain! Tx: ${truncateHash(releaseRes.txHash, 6)}`);
        setActiveTab("verification");
      } else {
        updateJob(job.id, {
          submissionCode: codeToRun,
          submittedAt: new Date().toISOString(),
          status: "submitted",
          verificationReport: report,
          activityLog: [
            {
              id: `act-${Date.now()}-fail`,
              timestamp: new Date().toISOString(),
              title: `Sandbox tests completed (${report.score})`,
              description: report.summary,
              actor: "Sandbox MicroVM",
            },
            ...job.activityLog,
          ],
        });

        toast.error(`Verification failed (${report.score}). Freelancer revision required.`);
        setActiveTab("verification");
      }
    } catch {
      toast.error("Sandbox execution error");
    } finally {
      setIsRunningTests(false);
      setIsReleasing(false);
      setActiveTestIndex(null);
    }
  };

  // 4. Client Playground Run
  const handleRunPlayground = async () => {
    if (job.remainingPlaygroundRuns <= 0) {
      toast.error("No playground runs remaining. Source code releases upon payment.");
      return;
    }

    setIsPlaying(true);
    try {
      const codeToUse = job.submissionCode || SAMPLE_CORRECT;
      const res = await sandbox.runOnce(codeToUse, playgroundInput);

      setPlaygroundOutput(res.output);
      setPlaygroundRuntime(res.runtimeMs);

      const nextRemaining = Math.max(0, job.remainingPlaygroundRuns - 1);
      updateJob(job.id, {
        remainingPlaygroundRuns: nextRemaining,
      });

      if (nextRemaining === 0) {
        toast.info("Playground run quota exhausted (0 of 20 remaining).");
      }
    } catch {
      toast.error("Playground execution failure");
    } finally {
      setIsPlaying(false);
    }
  };

  // 5. Claim Refund Action
  const handleClaimRefund = async () => {
    if (!confirm("Are you sure you want to reclaim escrow balance?")) return;
    setIsRefunding(true);
    try {
      const res = await escrow.refund(job.id);
      updateJob(job.id, {
        status: "refunded",
        refundTxHash: res.txHash,
        activityLog: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: `Escrow refunded to ${job.client.name}`,
            description: `Claimed back ${formatINR(job.amount)}.`,
            actor: `${job.client.name} (Client)`,
            txHash: res.txHash,
          },
          ...job.activityLog,
        ],
      });
      toast.success("Escrow balance refunded to client");
    } catch {
      toast.error("Refund transaction failed");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-[12px] text-zinc-400">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs</span>
        </Link>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span>Job ID: {job.id}</span>
          <span>•</span>
          <span>Deadline: {formatISTDate(job.deadline)}</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="liquid-glass rounded-[14px] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[19px] font-bold text-white tracking-tight">
                {job.title}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="font-mono text-[12px] text-zinc-400 flex items-center gap-2">
              <span className="bg-white/[0.05] border border-white/[0.1] px-2.5 py-1 rounded-[6px] text-cyan-300">
                {job.functionSignature}
              </span>
            </div>
          </div>

          {/* Amount and Primary Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Escrow Value
              </div>
              <div className="text-[24px] font-mono tabular-nums font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                {formatINR(job.amount)}
              </div>
            </div>

            {/* Context-sensitive Primary Action Button */}
            <div className="pl-3 border-l border-white/[0.1]">
              {job.status === "drafted" && (
                <button
                  onClick={handleApproveCriteria}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Criteria</span>
                </button>
              )}

              {job.status === "criteria_approved" && (
                <button
                  onClick={handleFundEscrow}
                  disabled={isFunding}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Tx (Gasless)…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Fund Escrow ({formatINR(job.amount)})</span>
                    </>
                  )}
                </button>
              )}

              {job.status === "funded" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("submission")}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-[8px] text-[12px] font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Submit Work</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("playground")}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white rounded-[8px] text-[12px] font-semibold border border-white/[0.1] transition-all"
                  >
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Playground</span>
                  </button>
                </div>
              )}

              {job.status === "submitted" && (
                <button
                  onClick={() => handleRunVerification(job.submissionCode || codeDraft)}
                  disabled={isRunningTests}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {isRunningTests ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Sandbox…</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Verify in Sandbox</span>
                    </>
                  )}
                </button>
              )}

              {job.status === "paid" && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 rounded-[8px] text-[12px] font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Paid On-Chain</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counterparties Bar */}
        <div className="pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Client:</span>
              <span className="font-semibold text-zinc-200">
                {job.client.name}
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                ({job.client.email})
              </span>
            </div>

            <div className="text-zinc-600">•</div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Freelancer:</span>
              <span className="font-semibold text-zinc-200">
                {job.freelancer.name}
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                ({job.freelancer.email})
              </span>
            </div>
          </div>

          {job.status === "funded" && (
            <button
              onClick={handleClaimRefund}
              disabled={isRefunding}
              className="text-[11px] text-zinc-400 hover:text-rose-400 underline transition-colors"
            >
              {isRefunding ? "Processing refund…" : "Claim deadline refund"}
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Status Stepper */}
      <Stepper status={job.status} />

      {/* Smart Contract Escrow Card */}
      <EscrowCard job={job} />

      {/* Navigation Tabs */}
      <div className="border-b border-white/[0.08] flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[13px]">
          {(
            [
              { id: "submission", label: "Submission & Sandbox", icon: Code2 },
              { id: "verification", label: "Verification Report", icon: Terminal },
              { id: "playground", label: "Client Playground", icon: Play },
              { id: "criteria", label: `Criteria (${job.criteria.length})`, icon: CheckCircle2 },
              { id: "brief", label: "Task Brief", icon: FileText },
              { id: "activity", label: `Activity (${job.activityLog.length})`, icon: Clock },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "border-cyan-400 text-cyan-300 font-semibold shadow-[0_2px_10px_rgba(6,182,212,0.3)]"
                    : "border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-zinc-400"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[420px]">
        {/* TAB 1: SUBMISSION & SANDBOX TEST RUNNER */}
        {activeTab === "submission" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-[15px] font-semibold text-white">
                  Freelancer Code Submission
                </h3>
                <p className="text-[12px] text-zinc-400">
                  Deliver Python function. Smart contract unlocks ₹{job.amount} automatically upon 100% test pass.
                </p>
              </div>

              {/* Sample Loader Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400">
                  Demo Samples:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCodeDraft(SAMPLE_CORRECT);
                    toast.info("Loaded correct Python implementation");
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-[6px] hover:bg-cyan-500/25 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                >
                  Load sample (correct)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCodeDraft(SAMPLE_BUGGY);
                    toast.info("Loaded subtly buggy implementation (fails 2 edge cases)");
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-[6px] hover:bg-rose-500/25 transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                >
                  Load sample (buggy)
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  Isolated Firecracker microVM • Python 3.12
                </span>
                <span className="text-cyan-300">{job.functionSignature}</span>
              </div>
              <textarea
                rows={14}
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value)}
                className="w-full font-mono text-[12px] p-4 rounded-[10px] border border-white/[0.12] bg-[#05060a] text-cyan-100 focus:outline-none focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/50 leading-relaxed shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
                spellCheck={false}
              />
            </div>

            {/* Run Tests Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="text-[12px] text-zinc-400">
                <span className="font-semibold text-white">
                  Deterministic Release:
                </span>{" "}
                Passes all {job.criteria.length} assertions → Smart contract releases payment automatically.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunVerification(codeDraft)}
                  disabled={isRunningTests || isReleasing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 disabled:opacity-50 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {isRunningTests ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Streaming Sandbox Tests…</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Run Sandbox Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Streaming Results Table during test run */}
            {(isRunningTests || streamingResults.length > 0) && (
              <div className="mt-4 border border-white/[0.1] rounded-[10px] overflow-hidden bg-black/40 backdrop-blur-xl">
                <div className="bg-white/[0.04] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Live MicroVM Test Stream
                  </span>
                  <span className="font-mono text-[11px] text-cyan-300">
                    {streamingResults.filter((r) => r.passed).length} / {job.criteria.length} passed
                  </span>
                </div>

                <div className="divide-y divide-white/[0.06] text-[12px]">
                  {job.criteria.map((tc, idx) => {
                    const result = streamingResults.find((r) => r.testCaseId === tc.id);
                    const isActive = activeTestIndex === idx;

                    return (
                      <div
                        key={tc.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-2.5 flex-1">
                          {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                          ) : result ? (
                            result.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                            )
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/[0.2] shrink-0" />
                          )}

                          <span className="font-mono text-[11px] text-zinc-500">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-zinc-200">
                            {tc.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[11px] text-zinc-400">
                            {tc.input}
                          </span>
                          {result && (
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                result.passed
                                  ? "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]"
                                  : "text-rose-400"
                              }`}
                            >
                              {result.actualOutput} ({result.runtimeMs}ms)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFICATION REPORT */}
        {activeTab === "verification" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            {job.verificationReport ? (
              <div className="space-y-4">
                {/* Overall Score Header */}
                <div
                  className={`p-4 rounded-[10px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xl ${
                    job.verificationReport.passed
                      ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                      : "bg-rose-500/15 border-rose-500/35 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {job.verificationReport.passed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-[15px]">
                        Overall Score: {job.verificationReport.score}
                      </div>
                      <div className="text-[12px] opacity-90 mt-0.5">
                        {job.verificationReport.summary}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono opacity-80 shrink-0">
                    Run at: {formatISTDate(job.verificationReport.runAt)}
                  </div>
                </div>

                {/* Test Results Table */}
                <div className="border border-white/[0.1] rounded-[10px] overflow-hidden bg-black/40">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Test Case</th>
                        <th className="py-3 px-3">Input</th>
                        <th className="py-3 px-3">Expected</th>
                        <th className="py-3 px-3">Actual Output</th>
                        <th className="py-3 px-3 text-right">Runtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] font-mono text-[11px]">
                      {job.verificationReport.results.map((r, i) => (
                        <tr
                          key={r.testCaseId || i}
                          className={r.passed ? "hover:bg-white/[0.02]" : "bg-rose-500/[0.08]"}
                        >
                          <td className="py-3 px-3">
                            {r.passed ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-sans font-semibold text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-rose-400 font-sans font-semibold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-sans text-zinc-200 font-medium">
                            {r.name}
                          </td>
                          <td className="py-3 px-3 text-zinc-400">
                            {r.input || job.criteria[i]?.input}
                          </td>
                          <td className="py-3 px-3 text-zinc-400">
                            {r.expectedOutput}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={
                                r.passed
                                  ? "text-emerald-300 font-semibold"
                                  : "text-rose-400 font-bold"
                              }
                            >
                              {r.actualOutput}
                            </span>
                            {r.error && (
                              <div className="font-sans text-[11px] text-rose-400 mt-1">
                                {r.error}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-500">
                            {r.runtimeMs}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* If paid, show release confirmation */}
                {job.status === "paid" && job.releaseTxHash && (
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/35 rounded-[10px] flex items-center justify-between text-[12px] shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>
                        Contract unlocked funds to {job.freelancer.name}. Verified transaction recorded.
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-300 font-semibold">
                      Tx: {truncateHash(job.releaseTxHash, 8)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center text-zinc-500 text-[13px] space-y-2 font-mono">
                <div>No verification report recorded yet.</div>
                <button
                  onClick={() => setActiveTab("submission")}
                  className="text-cyan-400 text-[12px] font-sans font-medium underline hover:text-cyan-300"
                >
                  Submit Python code to run sandbox tests
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLIENT PLAYGROUND */}
        {activeTab === "playground" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-[15px] font-semibold text-white">
                  Rate-Limited Client Playground
                </h3>
                <p className="text-[12px] text-zinc-400">
                  Execute the submitted function live in a secure sandbox without viewing source code.
                </p>
              </div>

              {/* Counter: X of 20 runs left */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400">
                  Quota:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-mono font-semibold border ${
                    job.remainingPlaygroundRuns > 5
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  {job.remainingPlaygroundRuns} of {job.maxPlaygroundRuns} runs left
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-[10px] flex items-center justify-between gap-3 text-[12px]">
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Source code is released when payment is released. Playground executes inside a sandboxed microVM.
                </span>
              </div>
              <div className="font-mono text-[11px] text-cyan-300 shrink-0">
                {job.functionSignature}
              </div>
            </div>

            {/* Input & Output Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Area */}
              <div className="space-y-2">
                <label className="block text-[12px] font-semibold text-zinc-300">
                  Input Parameters
                </label>
                <input
                  type="text"
                  value={playgroundInput}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  placeholder='"09876-543210"'
                  disabled={job.remainingPlaygroundRuns <= 0 || isPlaying}
                  className="w-full font-mono text-[12px] p-3 rounded-[8px] border border-white/[0.1] bg-black/40 text-white focus:outline-none focus:border-cyan-400/70 disabled:opacity-50"
                />

                {/* Preset Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-400 font-mono">Try:</span>
                  {[
                    '"+91 98765 43210"',
                    '"09876-543210"',
                    '"2345678901"',
                    '"98765CALLME"',
                    '"9123456789"',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPlaygroundInput(preset)}
                      disabled={job.remainingPlaygroundRuns <= 0}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-[5px] border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-zinc-300">
                    Sandbox Output
                  </label>
                  {playgroundRuntime && (
                    <span className="font-mono text-[11px] text-cyan-400">
                      Latency: {playgroundRuntime}ms
                    </span>
                  )}
                </div>
                <div className="w-full h-[96px] font-mono text-[13px] p-3 rounded-[8px] border border-white/[0.1] bg-black/60 text-cyan-300 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                  {isPlaying ? (
                    <div className="flex items-center gap-2 text-zinc-400 text-[12px]">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Executing in microVM…</span>
                    </div>
                  ) : playgroundOutput !== null ? (
                    <span className="text-[15px] font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                      {playgroundOutput}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-[12px] font-sans">
                      Click Run to execute against sandbox
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunPlayground}
                disabled={isPlaying || job.remainingPlaygroundRuns <= 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-[8px] text-[13px] font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                {isPlaying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Run in Sandbox</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: ACCEPTANCE CRITERIA */}
        {activeTab === "criteria" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-[15px] font-semibold text-white">
                  Approved Acceptance Criteria
                </h3>
                <p className="text-[12px] text-zinc-400">
                  Cryptographically committed into the escrow smart contract.
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] font-mono">
                <span className="text-zinc-400">Criteria Digest:</span>
                <span className="bg-white/[0.06] border border-white/[0.1] px-2.5 py-1 rounded-[6px] text-cyan-300">
                  {truncateHash(job.criteriaHash, 6)}
                </span>
              </div>
            </div>

            <div className="border border-white/[0.1] rounded-[10px] overflow-hidden bg-black/40">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Case Name</th>
                    <th className="py-3 px-3">Input Argument</th>
                    <th className="py-3 px-3">Expected Output</th>
                    <th className="py-3 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {job.criteria.map((tc, idx) => (
                    <tr key={tc.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-mono text-cyan-400">#{idx + 1}</td>
                      <td className="py-3 px-3 font-medium text-white">
                        {tc.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-200">
                        {tc.input}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-300">
                        {tc.expectedOutput}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{tc.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BRIEF */}
        {activeTab === "brief" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-white mb-1">
                Plain-English Task Brief
              </h3>
              <p className="text-[12px] text-zinc-400 mb-3">
                Original specification provided by the client.
              </p>
              <div className="p-4 bg-black/40 rounded-[8px] border border-white/[0.08] text-[13px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {job.brief}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ACTIVITY TIMELINE */}
        {activeTab === "activity" && (
          <div className="liquid-glass rounded-[14px] p-5 space-y-4">
            <h3 className="text-[15px] font-semibold text-white mb-2">
              On-Chain & Verification Activity
            </h3>
            <div className="space-y-3">
              {job.activityLog.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 border border-white/[0.08] rounded-[8px] bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px]"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-100 flex items-center gap-2">
                      <span>{act.title}</span>
                      <span className="text-[11px] font-normal text-zinc-400">
                        • {act.actor}
                      </span>
                    </div>
                    <div className="text-zinc-400 text-[12px]">{act.description}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-zinc-500">
                      {formatISTDate(act.timestamp)}
                    </div>
                    {act.txHash && (
                      <div className="font-mono text-[11px] text-cyan-300">
                        Tx: {truncateHash(act.txHash, 5)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
