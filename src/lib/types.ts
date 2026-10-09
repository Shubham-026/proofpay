export type JobStatus =
  | "drafted"
  | "criteria_approved"
  | "funded"
  | "submitted"
  | "verified"
  | "paid"
  | "disputed"
  | "refunded";

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface TestResult {
  testCaseId: string;
  name: string;
  input?: string;
  passed: boolean;
  runtimeMs: number;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
}

export interface VerificationReport {
  passed: boolean;
  score: string;
  summary: string;
  results: TestResult[];
  runAt: string;
}

export interface JobParty {
  name: string;
  email: string;
  address: string;
  role: "client" | "freelancer";
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  txHash?: string;
}

export interface Job {
  id: string;
  title: string;
  functionSignature: string;
  brief: string;
  amount: number; // in INR (₹)
  client: JobParty;
  freelancer: JobParty;
  status: JobStatus;
  deadline: string; // ISO date string
  lastActivity: string; // ISO date string
  contractAddress: string;
  criteriaHash: string;
  fundTxHash?: string;
  releaseTxHash?: string;
  refundTxHash?: string;
  criteria: TestCase[];
  criteriaApprovedByClient: boolean;
  criteriaApprovedByFreelancer: boolean;
  submissionCode?: string;
  submittedAt?: string;
  verificationReport?: VerificationReport;
  remainingPlaygroundRuns: number;
  maxPlaygroundRuns: number;
  activityLog: ActivityEntry[];
}

export type UserRole = "client" | "freelancer";
