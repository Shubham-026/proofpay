import { TestCase } from "../types";

/**
 * AI Service Mock
 * In production, this calls Gemini 1.5 / Claude / GPT to analyze the plain-English
 * brief and return structured, testable edge-case criteria.
 */
export const ai = {
  async draftCriteria(brief: string): Promise<TestCase[]> {
    // Simulate brief generation latency
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const lower = brief.toLowerCase();

    if (lower.includes("phone") || lower.includes("mobile") || lower.includes("normalize")) {
      return [
        {
          id: "tc-1",
          name: "Standard 10-digit mobile number",
          input: '"9876543210"',
          expectedOutput: '"+919876543210"',
          description: "Plain 10-digit valid Indian mobile number starting with 9",
        },
        {
          id: "tc-2",
          name: "Number with +91 country prefix and whitespace",
          input: '"+91 98765 43210"',
          expectedOutput: '"+919876543210"',
          description: "Input contains international prefix and human spacing",
        },
        {
          id: "tc-3",
          name: "Leading 0 STD/trunk prefix and hyphenation",
          input: '"09876-543210"',
          expectedOutput: '"+919876543210"',
          description: "Leading zero commonly dialed in domestic trunk calls",
        },
        {
          id: "tc-4",
          name: "Invalid starting digit (fixed-line prefix 2)",
          input: '"2345678901"',
          expectedOutput: "None",
          description: "Indian mobile allocations must start with 6, 7, 8, or 9",
        },
        {
          id: "tc-5",
          name: "Incomplete / short number",
          input: '"98765"',
          expectedOutput: "None",
          description: "Fewer than 10 digits must be rejected",
        },
        {
          id: "tc-6",
          name: "Alphanumeric corruption in input",
          input: '"98765CALLME"',
          expectedOutput: "None",
          description: "Garbage letters inside phone number should return None",
        },
      ];
    }

    if (lower.includes("gst") || lower.includes("tax") || lower.includes("invoice")) {
      return [
        {
          id: "tc-gst-1",
          name: "Intra-state standard 18% slab",
          input: '100000, False',
          expectedOutput: '{"cgst": 9000, "sgst": 9000, "igst": 0, "total": 118000}',
          description: "Splits into equal CGST and SGST within same state",
        },
        {
          id: "tc-gst-2",
          name: "Inter-state supply 18% slab",
          input: '100000, True',
          expectedOutput: '{"cgst": 0, "sgst": 0, "igst": 18000, "total": 118000}',
          description: "Entire tax levied under IGST for cross-border supply",
        },
        {
          id: "tc-gst-3",
          name: "Zero amount edge case",
          input: '0, False',
          expectedOutput: '{"cgst": 0, "sgst": 0, "igst": 0, "total": 0}',
          description: "Zero transaction value must compute 0 tax",
        },
        {
          id: "tc-gst-4",
          name: "Rounding odd paise transaction",
          input: '9999, False',
          expectedOutput: '{"cgst": 900, "sgst": 900, "igst": 0, "total": 11799}',
          description: "Rounds to nearest paise accurately",
        },
      ];
    }

    // Generic fallback generated test suite
    return [
      {
        id: `tc-${Date.now()}-1`,
        name: "Standard nominal input",
        input: '"alpha_beta_12"',
        expectedOutput: '"ALPHA_BETA_12"',
        description: "Valid baseline input follows standard transformation",
      },
      {
        id: `tc-${Date.now()}-2`,
        name: "Empty input handling",
        input: '""',
        expectedOutput: 'None',
        description: "Empty or null string returns None gracefully",
      },
      {
        id: `tc-${Date.now()}-3`,
        name: "Special characters & whitespace boundary",
        input: '"  trailing_space_test  "',
        expectedOutput: '"TRAILING_SPACE_TEST"',
        description: "Leading/trailing whitespace correctly trimmed",
      },
      {
        id: `tc-${Date.now()}-4`,
        name: "Exceeded boundary size condition",
        input: '"a" * 256',
        expectedOutput: 'None',
        description: "Inputs larger than permissible length rejected",
      },
    ];
  },
};
