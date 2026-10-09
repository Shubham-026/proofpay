/**
 * Escrow Service Mock
 * In production, this coordinates with an ERC-4337 Paymaster for gas sponsorship
 * and calls the ProofPayEscrow smart contract on Base Sepolia.
 */

function generatePseudoHash(prefix: string): string {
  const chars = "0123456789abcdef";
  let hash = prefix;
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const escrow = {
  /**
   * Lock funds in escrow smart contract (Gas-sponsored meta-transaction)
   */
  async fund(
    jobId: string,
    amount: number
  ): Promise<{ txHash: string; contractAddress: string; criteriaHash: string }> {
    // 1.5s transaction confirmation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      txHash: generatePseudoHash("0x"),
      contractAddress: "0x71C8A698762512F2d2b5c5eAA23a0740E53B55f1",
      criteriaHash: generatePseudoHash("0x"),
    };
  },

  /**
   * Release locked funds to freelancer after verification passes
   */
  async release(jobId: string): Promise<{ txHash: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return {
      txHash: generatePseudoHash("0x"),
    };
  },

  /**
   * Claim refund if deadline elapsed or disputed
   */
  async refund(jobId: string): Promise<{ txHash: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return {
      txHash: generatePseudoHash("0x"),
    };
  },
};
