# ProofPay

> Escrow smart contracts released exclusively on verifiable test passes.

ProofPay is a freelance escrow protocol where payment is locked into a smart contract and released to the freelancer only when delivered code passes cryptographically committed acceptance tests in an isolated sandbox.

---

## Architecture & Mock Layer Summary

As specified in the prototype requirements, the following components are currently implemented through clear mock interfaces (`lib/services/*.ts`) that make dropping in real production infrastructure trivial:

| Component | Production Target | Prototype Mock Implementation | Interface File |
| :--- | :--- | :--- | :--- |
| **Smart Contract Escrow** | `ProofPayEscrow.sol` deployed on Base Sepolia | Simulated gasless ERC-4337 meta-transactions with 1.5s confirmation delays and pseudorandom transaction hashes | `lib/services/escrow.ts` |
| **AI Criteria Synthesis** | LLM API (Gemini 1.5 / Claude / GPT) | Prompt-aware parser generating 4–6 test cases with realistic network latency | `lib/services/ai.ts` |
| **Sandbox Execution** | Firecracker microVMs / gVisor container runners | In-browser deterministic test runner with live row-by-row streaming results | `lib/services/sandbox.ts` |
| **Client Playground** | Rate-limited ephemeral gVisor container | In-browser sandbox evaluator enforcing 20-run quota without exposing source code | `lib/services/sandbox.ts` |
| **Account Abstraction** | Biconomy / ZeroDev Paymaster | Role switcher toggle ("Aarav Mehta" & "Sagarika Das") with gas sponsorship badges | `lib/store.ts` |
| **State Persistence** | PostgreSQL / The Graph Indexer | Reactive browser `localStorage` state with 4 seeded jobs | `lib/store.ts` |

---

## Smart Contract

The complete Solidity contract is included at [`contracts/ProofPayEscrow.sol`](file:///Users/shubhamgupta/Desktop/Projects/ProofPay/contracts/ProofPayEscrow.sol):
- `createJob(client, freelancer, amount, criteriaHash, deadline)`
- `fund(jobId)`
- `release(jobId)` (restricted to `verifier` oracle address)
- `refund(jobId)` (callable if deadline elapsed without pass)
- Instructions to deploy using Foundry to Base Sepolia are included in the file header comments.

---

## 2-Minute Demo Walkthrough

1. **Start Dev Server**:
   ```bash
   npm run dev
   ```
2. **Review Ledger**:
   - Visit `http://localhost:3000` to see 4 seeded jobs with Indian Rupee amounts and IST timestamps.
3. **Open Ready Demo Job**:
   - Click the banner or row for **"Normalize Indian phone numbers to E.164 (+91)"** (currently `Funded`).
4. **Test Buggy Submission**:
   - Under the **Submission & Sandbox** tab, click **Load sample (buggy)**.
   - Click **Run Sandbox Tests**. Watch live row-by-row streaming tests fail on 2 edge cases (landline prefix rejection & alphanumeric sanitation).
5. **Test Correct Submission & Auto-Release**:
   - Click **Load sample (correct)**.
   - Click **Run Sandbox Tests**. Watch all 6 tests stream to a 100% pass.
   - ProofPay automatically triggers smart contract release, transitions to `Paid`, records the on-chain release transaction hash, and displays a toast notification.
6. **Try Client Playground**:
   - Switch to the **Client Playground** tab. Try inputs like `"+91 98765 43210"` or `"09876-543210"`.
   - The client can run and verify the function behavior live without viewing the source code.
7. **Create New Escrow Job**:
   - Click **New Job** in the top navigation.
   - Type a task brief (or click **Load GST brief**), click **Draft Criteria with AI** to view skeleton loading and generated test cases, approve criteria, and create the escrow job.
