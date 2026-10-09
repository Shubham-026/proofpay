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
} from "lucide-react";
import { toast } from "sonner";

interface JobDetailProps {
  jobId: string;
}

type TabType =
  | "brief"
  | "criteria"
  | "submission"
  | "verification"
  | "playground"
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
      <div className="py-12 text-center text-zinc-400 text-[13px]">
        Loading job ledger…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-[14px] text-zinc-600 dark:text-zinc-400">
          Job not found.
        </div>
        <Link
          href="/"
          className="text-teal-700 text-[13px] underline hover:text-teal-800"
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

      // Determine updated job status
      const passesAll = report.passed;

      if (passesAll) {
        // Automatically trigger release as specified!
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
        // Failed some tests
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
    <div className="space-y-4">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-[12px] text-zinc-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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

      {/* Main Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {job.title}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="font-mono text-[12px] text-zinc-500 flex items-center gap-2">
              <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-teal-800 dark:text-teal-300">
                {job.functionSignature}
              </span>
            </div>
          </div>

          {/* Amount and Primary Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Escrow Value
              </div>
              <div className="text-[20px] font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-50">
                {formatINR(job.amount)}
              </div>
            </div>

            {/* Context-sensitive Primary Action Button */}
            <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800">
              {job.status === "drafted" && (
                <button
                  onClick={handleApproveCriteria}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-[5px] text-[13px] font-medium transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Criteria</span>
                </button>
              )}

              {job.status === "criteria_approved" && (
                <button
                  onClick={handleFundEscrow}
                  disabled={isFunding}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-zinc-300 text-white rounded-[5px] text-[13px] font-medium transition-colors"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-[5px] text-[12px] font-medium transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Submit Work</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("playground")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-[5px] text-[12px] font-medium border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Playground</span>
                  </button>
                </div>
              )}

              {job.status === "submitted" && (
                <button
                  onClick={() => handleRunVerification(job.submissionCode || codeDraft)}
                  disabled={isRunningTests}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-zinc-300 text-white rounded-[5px] text-[13px] font-medium transition-colors"
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-[5px] text-[12px] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Paid On-Chain</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counterparties Bar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Client:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {job.client.name}
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">
                ({job.client.email})
              </span>
            </div>

            <div className="text-zinc-300 dark:text-zinc-700">•</div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Freelancer:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {job.freelancer.name}
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">
                ({job.freelancer.email})
              </span>
            </div>
          </div>

          {/* Refund button if applicable */}
          {job.status === "funded" && (
            <button
              onClick={handleClaimRefund}
              disabled={isRefunding}
              className="text-[11px] text-zinc-400 hover:text-rose-600 underline transition-colors"
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
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1 text-[13px]">
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
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div>
                <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                  Freelancer Code Submission
                </h3>
                <p className="text-[12px] text-zinc-500">
                  Submit Python function. Payment will unlock automatically when all {job.criteria.length} assertions pass in the sandbox.
                </p>
              </div>

              {/* Sample Loader Buttons for quick testing */}
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
                  className="px-2 py-1 text-[11px] font-mono bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-[4px] hover:bg-teal-100 transition-colors"
                >
                  Load sample (correct)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCodeDraft(SAMPLE_BUGGY);
                    toast.info("Loaded subtly buggy implementation (fails 2 edge cases)");
                  }}
                  className="px-2 py-1 text-[11px] font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-[4px] hover:bg-rose-100 transition-colors"
                >
                  Load sample (buggy)
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Language: Python 3.12 (Isolated Sandbox VM)</span>
                <span>Target: {job.functionSignature}</span>
              </div>
              <textarea
                rows={14}
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value)}
                className="w-full font-mono text-[12px] p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Run Tests Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="text-[12px] text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Deterministic release:
                </span>{" "}
                Passes all tests → Smart contract releases ₹{job.amount} automatically.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunVerification(codeDraft)}
                  disabled={isRunningTests || isReleasing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-zinc-400 text-white rounded-[5px] text-[13px] font-medium transition-colors"
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
              <div className="mt-4 border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-900/80 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Live Sandbox Test Stream
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {streamingResults.filter((r) => r.passed).length} / {job.criteria.length} passed
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-[12px]">
                  {job.criteria.map((tc, idx) => {
                    const result = streamingResults.find((r) => r.testCaseId === tc.id);
                    const isActive = activeTestIndex === idx;

                    return (
                      <div
                        key={tc.id}
                        className="px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 shrink-0" />
                          ) : result ? (
                            result.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0" />
                          )}

                          <span className="font-mono text-[11px] text-zinc-400">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {tc.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[11px] text-zinc-400">
                            {tc.input}
                          </span>
                          {result && (
                            <span
                              className={`font-mono text-[11px] ${
                                result.passed ? "text-teal-700 dark:text-teal-400" : "text-rose-600"
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            {job.verificationReport ? (
              <div className="space-y-4">
                {/* Overall Score Header */}
                <div
                  className={`p-3 rounded-[6px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    job.verificationReport.passed
                      ? "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-900 dark:text-teal-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {job.verificationReport.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-[14px]">
                        Overall Score: {job.verificationReport.score}
                      </div>
                      <div className="text-[12px] opacity-90">
                        {job.verificationReport.summary}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono opacity-80 shrink-0">
                    Run at: {formatISTDate(job.verificationReport.runAt)}
                  </div>
                </div>

                {/* Test Results Table */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Test Case</th>
                        <th className="py-2.5 px-3">Input</th>
                        <th className="py-2.5 px-3">Expected</th>
                        <th className="py-2.5 px-3">Actual Output</th>
                        <th className="py-2.5 px-3 text-right">Runtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]">
                      {job.verificationReport.results.map((r, i) => (
                        <tr
                          key={r.testCaseId || i}
                          className={r.passed ? "" : "bg-rose-50/40 dark:bg-rose-950/20"}
                        >
                          <td className="py-2.5 px-3">
                            {r.passed ? (
                              <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-sans font-medium text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-sans font-medium text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-zinc-800 dark:text-zinc-200 font-medium">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                            {r.input || job.criteria[i]?.input}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                            {r.expectedOutput}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={
                                r.passed
                                  ? "text-teal-700 dark:text-teal-400"
                                  : "text-rose-600 font-semibold"
                              }
                            >
                              {r.actualOutput}
                            </span>
                            {r.error && (
                              <div className="font-sans text-[11px] text-rose-600 mt-1">
                                {r.error}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">
                            {r.runtimeMs}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* If paid, show release confirmation */}
                {job.status === "paid" && job.releaseTxHash && (
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-[6px] flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>
                        Contract released funds to {job.freelancer.name}. Transaction confirmed.
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-teal-800 dark:text-teal-300">
                      Tx: {truncateHash(job.releaseTxHash, 8)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-[13px] space-y-2">
                <div>No verification report recorded yet.</div>
                <button
                  onClick={() => setActiveTab("submission")}
                  className="text-teal-700 dark:text-teal-400 text-[12px] font-medium underline"
                >
                  Submit Python code to run sandbox tests
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLIENT PLAYGROUND */}
        {activeTab === "playground" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div>
                <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                  Rate-Limited Client Playground
                </h3>
                <p className="text-[12px] text-zinc-500">
                  Execute the submitted function live in a secure sandbox without viewing source code.
                </p>
              </div>

              {/* Counter: X of 20 runs left */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400">
                  Quota:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[12px] font-mono font-medium border ${
                    job.remainingPlaygroundRuns > 5
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                      : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {job.remainingPlaygroundRuns} of {job.maxPlaygroundRuns} runs left
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-[6px] flex items-center justify-between gap-3 text-[12px]">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>
                  Source code is released when payment is released. Playground executes inside a sandboxed microVM.
                </span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400 shrink-0">
                {job.functionSignature}
              </div>
            </div>

            {/* Input & Output Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Area */}
              <div className="space-y-2">
                <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                  Input Parameters
                </label>
                <input
                  type="text"
                  value={playgroundInput}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  placeholder='"09876-543210"'
                  disabled={job.remainingPlaygroundRuns <= 0 || isPlaying}
                  className="w-full font-mono text-[12px] p-2.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-700 disabled:opacity-50"
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
                      className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                    Sandbox Output
                  </label>
                  {playgroundRuntime && (
                    <span className="font-mono text-[11px] text-zinc-400">
                      Latency: {playgroundRuntime}ms
                    </span>
                  )}
                </div>
                <div className="w-full h-[88px] font-mono text-[13px] p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-teal-400 flex items-center justify-center">
                  {isPlaying ? (
                    <div className="flex items-center gap-2 text-zinc-400 text-[12px]">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                      <span>Executing in sandbox…</span>
                    </div>
                  ) : playgroundOutput !== null ? (
                    <span className="text-[14px] font-bold">{playgroundOutput}</span>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white dark:text-zinc-900 rounded-[5px] text-[13px] font-medium transition-colors"
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div>
                <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                  Approved Acceptance Criteria
                </h3>
                <p className="text-[12px] text-zinc-500">
                  Cryptographically committed into the escrow smart contract.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-zinc-400">Criteria Digest:</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {truncateHash(job.criteriaHash, 6)}
                </span>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Case Name</th>
                    <th className="py-2.5 px-3">Input Argument</th>
                    <th className="py-2.5 px-3">Expected Output</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {job.criteria.map((tc, idx) => (
                    <tr key={tc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-mono text-zinc-400">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {tc.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-700 dark:text-zinc-300">
                        {tc.input}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-700 dark:text-zinc-300">
                        {tc.expectedOutput}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500">{tc.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BRIEF */}
        {activeTab === "brief" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            <div>
              <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Plain-English Task Brief
              </h3>
              <p className="text-[12px] text-zinc-500 mb-3">
                Original specification provided by the client.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-[5px] border border-zinc-200 dark:border-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {job.brief}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ACTIVITY TIMELINE */}
        {activeTab === "activity" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
            <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              On-Chain & Verification Activity
            </h3>
            <div className="space-y-3">
              {job.activityLog.map((act) => (
                <div
                  key={act.id}
                  className="p-3 border border-zinc-100 dark:border-zinc-800/80 rounded-[5px] bg-zinc-50/40 dark:bg-zinc-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px]"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <span>{act.title}</span>
                      <span className="text-[11px] font-normal text-zinc-400">
                        • {act.actor}
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[12px]">{act.description}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-zinc-400">
                      {formatISTDate(act.timestamp)}
                    </div>
                    {act.txHash && (
                      <div className="font-mono text-[11px] text-teal-700 dark:text-teal-400">
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
