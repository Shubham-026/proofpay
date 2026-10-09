"use client";

import { useEffect, useState } from "react";
import { Job, JobParty, TestCase, UserRole, VerificationReport } from "./types";

export const CLIENT_USER: JobParty = {
  name: "Aarav Mehta",
  email: "aarav.mehta@acmecorp.in",
  address: "0x89205A3A3b2A55384e45BC654B644796B26A024E",
  role: "client",
};

export const FREELANCER_USER: JobParty = {
  name: "Sagarika Das",
  email: "sagarika.das@devforge.io",
  address: "0x1A2b3c4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B",
  role: "freelancer",
};

const SEED_JOBS: Job[] = [
  {
    id: "job-norm-phone",
    title: "Normalize Indian phone numbers to E.164 (+91)",
    functionSignature: "normalize_phone(number: str) -> str | None",
    brief:
      "Write a Python function normalize_phone(number) that accepts strings containing Indian phone numbers formatted with spaces, dashes, parentheses, or +91/0 prefixes. It should return a standard +91XXXXXXXXXX string where X is a 10-digit number starting with digits 6, 7, 8, or 9. If the number has invalid length, invalid starting digit, or non-phone characters, return None.",
    amount: 4500,
    client: CLIENT_USER,
    freelancer: FREELANCER_USER,
    status: "funded",
    deadline: "2026-10-14T18:30:00.000Z",
    lastActivity: "2026-10-09T09:15:00.000Z",
    contractAddress: "0x71C8A698762512F2d2b5c5eAA23a0740E53B55f1",
    criteriaHash: "0x4e29b11d8c1c54b79b90c1f54d19aa91f1807096e12df1e5bb0f47bc5265434d",
    fundTxHash: "0x9a3e4210d79f0f9b6c43f87f6512399d8b18ec6204589d97033cb4190b4cb912",
    criteriaApprovedByClient: true,
    criteriaApprovedByFreelancer: true,
    remainingPlaygroundRuns: 20,
    maxPlaygroundRuns: 20,
    criteria: [
      {
        id: "tc-1",
        name: "Standard 10-digit mobile number",
        input: '"9876543210"',
        expectedOutput: '"+919876543210"',
        description: "Valid 10-digit series starting with 9",
      },
      {
        id: "tc-2",
        name: "With +91 country prefix and whitespace",
        input: '"+91 98765 43210"',
        expectedOutput: '"+919876543210"',
        description: "International E.164 country prefix format with spaces",
      },
      {
        id: "tc-3",
        name: "Leading 0 STD/trunk prefix and hyphenation",
        input: '"09876-543210"',
        expectedOutput: '"+919876543210"',
        description: "Standard domestic trunk dial prefix format",
      },
      {
        id: "tc-4",
        name: "Invalid starting digit (fixed-line prefix 2)",
        input: '"2345678901"',
        expectedOutput: "None",
        description: "Indian mobiles must start with 6, 7, 8, or 9",
      },
      {
        id: "tc-5",
        name: "Incomplete / short phone number",
        input: '"98765"',
        expectedOutput: "None",
        description: "Fewer than 10 digits must be rejected",
      },
      {
        id: "tc-6",
        name: "Alphanumeric junk inside number",
        input: '"98765CALLME"',
        expectedOutput: "None",
        description: "Letters mixed in must invalidate the entire string",
      },
    ],
    activityLog: [
      {
        id: "act-1",
        timestamp: "2026-10-09T08:00:00.000Z",
        title: "Escrow contract deployed & funded",
        description: "Client locked ₹4,500 into smart contract. Gas sponsored by protocol.",
        actor: "Aarav Mehta (Client)",
        txHash: "0x9a3e4210d79f0f9b6c43f87f6512399d8b18ec6204589d97033cb4190b4cb912",
      },
      {
        id: "act-2",
        timestamp: "2026-10-09T07:42:00.000Z",
        title: "Acceptance criteria locked",
        description: "Both client and freelancer signed off on 6 test cases.",
        actor: "Sagarika Das (Freelancer)",
      },
      {
        id: "act-3",
        timestamp: "2026-10-09T07:30:00.000Z",
        title: "Job created with AI criteria draft",
        description: "Brief drafted and 6 test cases synthesized.",
        actor: "Aarav Mehta (Client)",
      },
    ],
  },
  {
    id: "job-ifsc-lookup",
    title: "Validate RBI IFSC code and resolve bank branch metadata",
    functionSignature: "lookup_ifsc(code: str) -> dict | None",
    brief:
      "Validate 11-character Indian Financial System Code (IFSC). Characters 1-4 are bank code alphabets, character 5 is always 0, and characters 6-11 are alphanumeric branch identifiers.",
    amount: 5000,
    client: CLIENT_USER,
    freelancer: FREELANCER_USER,
    status: "criteria_approved",
    deadline: "2026-10-18T18:30:00.000Z",
    lastActivity: "2026-10-08T16:20:00.000Z",
    contractAddress: "0x34Bc9287A215dDe32b7201aC42A68410E3411aB9",
    criteriaHash: "0x89ac911d8c1c54b79b90c1f54d19aa91f1807096e12df1e5bb0f47bc5265411a",
    criteriaApprovedByClient: true,
    criteriaApprovedByFreelancer: true,
    remainingPlaygroundRuns: 20,
    maxPlaygroundRuns: 20,
    criteria: [
      {
        id: "tc-ifsc-1",
        name: "Standard HDFC IFSC code",
        input: '"HDFC0000240"',
        expectedOutput: '{"valid": True, "bank": "HDFC"}',
      },
      {
        id: "tc-ifsc-2",
        name: "Invalid 5th character (non-zero)",
        input: '"SBIN1001234"',
        expectedOutput: "None",
      },
      {
        id: "tc-ifsc-3",
        name: "Incorrect length code",
        input: '"ICIC0001"',
        expectedOutput: "None",
      },
      {
        id: "tc-ifsc-4",
        name: "Lowercase auto-sanitization",
        input: '"sbin0000123"',
        expectedOutput: '{"valid": True, "bank": "SBIN"}',
      },
    ],
    activityLog: [
      {
        id: "act-ifsc-1",
        timestamp: "2026-10-08T16:20:00.000Z",
        title: "Criteria approved by both parties",
        description: "Waiting for client to fund escrow.",
        actor: "Sagarika Das (Freelancer)",
      },
    ],
  },
  {
    id: "job-validate-pan",
    title: "Validate Indian PAN structure & entity tax-status check",
    functionSignature: "validate_pan(pan: str) -> bool",
    brief:
      "Validate 10-character alphanumeric Indian PAN card string. 5 uppercase letters, 4 digits, 1 uppercase letter. Fourth character designates entity type (P=Person, C=Company, H=HUF, F=Firm, T=Trust).",
    amount: 6500,
    client: CLIENT_USER,
    freelancer: FREELANCER_USER,
    status: "paid",
    deadline: "2026-10-06T18:30:00.000Z",
    lastActivity: "2026-10-07T11:45:00.000Z",
    contractAddress: "0x12Fa98762512F2d2b5c5eAA23a0740E53B55f10b",
    criteriaHash: "0x11ff22bb8c1c54b79b90c1f54d19aa91f1807096e12df1e5bb0f47bc5265434d",
    fundTxHash: "0x2e8f10b7d34190b4cb9129a3e4210d79f0f9b6c43f87f6512399d8b18ec62045",
    releaseTxHash: "0x89ab410d79f0f9b6c43f87f6512399d8b18ec6204589d97033cb4190b4cb2e8",
    criteriaApprovedByClient: true,
    criteriaApprovedByFreelancer: true,
    remainingPlaygroundRuns: 14,
    maxPlaygroundRuns: 20,
    criteria: [
      {
        id: "tc-pan-1",
        name: "Valid individual PAN",
        input: '"ABCDE1234F"',
        expectedOutput: "True",
      },
      {
        id: "tc-pan-2",
        name: "Valid company PAN",
        input: '"AAACV9876K"',
        expectedOutput: "True",
      },
      {
        id: "tc-pan-3",
        name: "Invalid 4th character entity type",
        input: '"ABCDZ1234F"',
        expectedOutput: "False",
      },
      {
        id: "tc-pan-4",
        name: "Digits instead of letters in prefix",
        input: '"12345ABCDE"',
        expectedOutput: "False",
      },
      {
        id: "tc-pan-5",
        name: "Invalid string length",
        input: '"ABCDE1234"',
        expectedOutput: "False",
      },
    ],
    verificationReport: {
      passed: true,
      score: "5/5 passed",
      summary: "All PAN format requirements and entity type checks passed in microVM sandbox.",
      runAt: "2026-10-07T11:40:00.000Z",
      results: [
        { testCaseId: "tc-pan-1", name: "Valid individual PAN", passed: true, runtimeMs: 0.9, actualOutput: "True", expectedOutput: "True" },
        { testCaseId: "tc-pan-2", name: "Valid company PAN", passed: true, runtimeMs: 1.1, actualOutput: "True", expectedOutput: "True" },
        { testCaseId: "tc-pan-3", name: "Invalid 4th character entity type", passed: true, runtimeMs: 0.8, actualOutput: "False", expectedOutput: "False" },
        { testCaseId: "tc-pan-4", name: "Digits instead of letters in prefix", passed: true, runtimeMs: 0.7, actualOutput: "False", expectedOutput: "False" },
        { testCaseId: "tc-pan-5", name: "Invalid string length", passed: true, runtimeMs: 0.8, actualOutput: "False", expectedOutput: "False" },
      ],
    },
    activityLog: [
      {
        id: "act-pan-1",
        timestamp: "2026-10-07T11:45:00.000Z",
        title: "Escrow funds released to freelancer",
        description: "Automated trigger executed upon 100% test pass. ₹6,500 sent to Sagarika Das.",
        actor: "ProofPay Protocol Verifier",
        txHash: "0x89ab410d79f0f9b6c43f87f6512399d8b18ec6204589d97033cb4190b4cb2e8",
      },
      {
        id: "act-pan-2",
        timestamp: "2026-10-07T11:40:00.000Z",
        title: "Sandbox test suite passed (5/5)",
        description: "Sandbox verification passed cleanly.",
        actor: "Sandbox Test Runner",
      },
    ],
  },
  {
    id: "job-calc-tax",
    title: "Calculate GST breakdown for B2B invoices",
    functionSignature: "calculate_gst(amount_paise: int, is_interstate: bool) -> dict",
    brief:
      "Calculate 18% GST on paise amounts. If intra-state, split into CGST (9%) and SGST (9%). If inter-state, allocate all 18% to IGST. Return integer paise rounded appropriately.",
    amount: 3000,
    client: CLIENT_USER,
    freelancer: FREELANCER_USER,
    status: "drafted",
    deadline: "2026-10-16T18:30:00.000Z",
    lastActivity: "2026-10-09T05:10:00.000Z",
    contractAddress: "0xPendingCriteriaApproval",
    criteriaHash: "0xPendingApproval",
    criteriaApprovedByClient: true,
    criteriaApprovedByFreelancer: false,
    remainingPlaygroundRuns: 20,
    maxPlaygroundRuns: 20,
    criteria: [
      {
        id: "tc-gst-1",
        name: "Intra-state standard 18% slab",
        input: "100000, False",
        expectedOutput: '{"cgst": 9000, "sgst": 9000, "igst": 0, "total": 118000}',
      },
      {
        id: "tc-gst-2",
        name: "Inter-state supply 18% slab",
        input: "100000, True",
        expectedOutput: '{"cgst": 0, "sgst": 0, "igst": 18000, "total": 118000}',
      },
      {
        id: "tc-gst-3",
        name: "Zero amount edge case",
        input: "0, False",
        expectedOutput: '{"cgst": 0, "sgst": 0, "igst": 0, "total": 0}',
      },
      {
        id: "tc-gst-4",
        name: "Odd paise rounding",
        input: "9999, False",
        expectedOutput: '{"cgst": 900, "sgst": 900, "igst": 0, "total": 11799}',
      },
    ],
    activityLog: [
      {
        id: "act-gst-1",
        timestamp: "2026-10-09T05:10:00.000Z",
        title: "Drafted by client",
        description: "Awaiting freelancer review and approval of test criteria.",
        actor: "Aarav Mehta (Client)",
      },
    ],
  },
];

const STORAGE_KEY = "proofpay_jobs_v1";
const ROLE_KEY = "proofpay_role_v1";

export function useProofPayStore() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>("client");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setJobs(JSON.parse(stored));
      } else {
        setJobs(SEED_JOBS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_JOBS));
      }

      const storedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
      if (storedRole === "client" || storedRole === "freelancer") {
        setCurrentRole(storedRole);
      }
    } catch {
      setJobs(SEED_JOBS);
    }
    setIsLoaded(true);
  }, []);

  const saveJobs = (newJobs: Job[]) => {
    setJobs(newJobs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
    } catch {
      // ignore
    }
  };

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // ignore
    }
  };

  const getJob = (id: string): Job | undefined => {
    return jobs.find((j) => j.id === id);
  };

  const addJob = (job: Job) => {
    const updated = [job, ...jobs];
    saveJobs(updated);
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    const updated = jobs.map((j) => {
      if (j.id === id) {
        return {
          ...j,
          ...updates,
          lastActivity: new Date().toISOString(),
        };
      }
      return j;
    });
    saveJobs(updated);
  };

  const resetToSeed = () => {
    saveJobs(SEED_JOBS);
  };

  const currentUser = currentRole === "client" ? CLIENT_USER : FREELANCER_USER;

  return {
    jobs,
    isLoaded,
    currentRole,
    setRole,
    currentUser,
    getJob,
    addJob,
    updateJob,
    resetToSeed,
  };
}
