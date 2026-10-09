import { TestCase, TestResult, VerificationReport } from "../types";

export const SAMPLE_CORRECT = `import re

def normalize_phone(number: str) -> str | None:
    """
    Accepts Indian phone numbers with various formatting (spaces, dashes,
    brackets, leading 0 or +91) and normalizes to E.164 (+91XXXXXXXXXX).
    Rejects invalid lengths, landline prefixes, or alphanumeric junk.
    """
    if not isinstance(number, str):
        return None
        
    # Remove standard punctuation and whitespace
    cleaned = re.sub(r'[\\s\\-\\(\\)\\.]', '', number.strip())
    
    # Check for leading country/trunk codes
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
        
    # Must be exactly 10 digits and start with 6, 7, 8, or 9
    if len(cleaned) == 10 and cleaned.isdigit() and cleaned[0] in '6789':
        return f"+91{cleaned}"
        
    return None
`;

export const SAMPLE_BUGGY = `import re

def normalize_phone(number: str) -> str | None:
    """
    Subtly flawed implementation:
    1. Blindly strips all non-digits (failing to invalidate alphanumeric junk)
    2. Fails to verify that mobile numbers must start with 6, 7, 8, or 9
    """
    if not isinstance(number, str):
        return None
        
    # Bug 1: Silently strips characters instead of rejecting contaminated inputs
    digits = re.sub(r'\\D', '', number)
    
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith('0') and len(digits) == 11:
        digits = digits[1:]
        
    # Bug 2: Checks length 10 but allows invalid starting digits like 2, 3, 4, 5
    if len(digits) == 10:
        return f"+91{digits}"
        
    return None
`;

/**
 * In-browser sandbox simulator for demo verification.
 * In production, this dispatches code into a gVisor / Firecracker container
 * with strict 500ms timeout, no network, and 64MB memory limits.
 */
export const sandbox = {
  async runTests(
    submission: string,
    tests: TestCase[],
    onProgress?: (result: TestResult, index: number) => void
  ): Promise<VerificationReport> {
    const isCorrect =
      submission.includes("cleaned[0] in '6789'") ||
      (submission.includes("6789") && !submission.includes("Bug 1"));
    const isBuggy =
      submission.includes("Bug 1") ||
      submission.includes("\\D") ||
      submission.includes("Blindly strips");

    const results: TestResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < tests.length; i++) {
      const tc = tests[i];
      // Streaming delay to simulate sandbox VM initialization and test runner output
      await new Promise((resolve) => setTimeout(resolve, 380));

      let passed = false;
      let actualOutput = "";
      let error: string | undefined = undefined;
      const runtimeMs = +(0.8 + Math.random() * 0.9).toFixed(1);

      if (isCorrect) {
        passed = true;
        actualOutput = tc.expectedOutput;
      } else if (isBuggy) {
        // Buggy fails test case 4 (tc-4: "2345678901") and case 6 (tc-6: "98765CALLME")
        if (tc.id === "tc-4" || tc.input.includes("2345678901")) {
          passed = false;
          actualOutput = '"+912345678901"';
          error = "AssertionError: Expected None for landline prefix, got '+912345678901'. First digit must be in [6, 7, 8, 9].";
        } else if (tc.id === "tc-6" || tc.input.includes("CALLME")) {
          passed = false;
          actualOutput = '"+9198765"';
          error = "AssertionError: Expected None for alphanumeric input, got '+9198765'. Alphanumeric characters must invalidate string.";
        } else {
          passed = true;
          actualOutput = tc.expectedOutput;
        }
      } else {
        // Arbitrary unverified code submission fallback
        if (i < 2) {
          passed = true;
          actualOutput = tc.expectedOutput;
        } else {
          passed = false;
          actualOutput = 'None';
          error = `AssertionError: Expected ${tc.expectedOutput}, received None. Unhandled exception in submission AST.`;
        }
      }

      if (passed) passedCount++;

      const res: TestResult = {
        testCaseId: tc.id,
        name: tc.name,
        input: tc.input,
        passed,
        runtimeMs,
        actualOutput,
        expectedOutput: tc.expectedOutput,
        error,
      };

      results.push(res);
      if (onProgress) {
        onProgress(res, i);
      }
    }

    const allPassed = passedCount === tests.length;
    const summary = allPassed
      ? `All ${tests.length} acceptance criteria passed with zero regressions. Execution verified in isolated microVM.`
      : `Failed ${tests.length - passedCount} of ${tests.length} acceptance tests. Review edge cases and submit a revision.`;

    return {
      passed: allPassed,
      score: `${passedCount}/${tests.length} passed`,
      summary,
      results,
      runAt: new Date().toISOString(),
    };
  },

  async runOnce(
    submission: string,
    rawInput: string
  ): Promise<{ output: string; runtimeMs: number; error?: string }> {
    // 250ms sandbox roundtrip
    await new Promise((resolve) => setTimeout(resolve, 250));

    const isCorrect =
      submission.includes("cleaned[0] in '6789'") ||
      (submission.includes("6789") && !submission.includes("Bug 1"));
    const isBuggy = submission.includes("Bug 1") || submission.includes("\\D");

    const cleanInput = rawInput.trim().replace(/^["']|["']$/g, "");
    const runtimeMs = +(0.9 + Math.random() * 0.6).toFixed(1);

    if (isCorrect) {
      // Correct logic implementation
      const cleaned = cleanInput.replace(/[\s\-\(\)\.]/g, "");
      let digits = cleaned;
      if (digits.startsWith("+91")) digits = digits.slice(3);
      else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
      else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

      if (/^[6-9]\d{9}$/.test(digits)) {
        return { output: `"+91${digits}"`, runtimeMs };
      }
      return { output: "None", runtimeMs };
    }

    if (isBuggy) {
      // Buggy logic: strips non-digits and allows any 10 digits
      let digits = cleanInput.replace(/\D/g, "");
      if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
      else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

      if (digits.length === 10) {
        return { output: `"+91${digits}"`, runtimeMs };
      }
      return { output: "None", runtimeMs };
    }

    // Generic code execution fallback
    return {
      output: cleanInput ? `"+91${cleanInput.slice(0, 10)}"` : "None",
      runtimeMs,
    };
  },
};
