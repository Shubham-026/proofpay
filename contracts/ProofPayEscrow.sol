// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofPayEscrow
 * @notice Protocol implementation for ProofPay:
 *         Escrow smart contracts released exclusively on verifiable test passes.
 *
 * ============================================================================
 * Deployment Guide (Base Sepolia Testnet)
 * ============================================================================
 * 1. Install Foundry:
 *    curl -L https://foundry.paradigm.xyz | bash && foundryup
 *
 * 2. Set required environment variables:
 *    export BASE_SEPOLIA_RPC="https://sepolia.base.org"
 *    export DEPLOYER_KEY="0x..."
 *    export VERIFIER_ADDRESS="0x..." # Firecracker sandbox oracle/attestation service
 *    export BASESCAN_API_KEY="..."
 *
 * 3. Deploy contract:
 *    forge create contracts/ProofPayEscrow.sol:ProofPayEscrow \
 *      --rpc-url $BASE_SEPOLIA_RPC \
 *      --private-key $DEPLOYER_KEY \
 *      --constructor-args $VERIFIER_ADDRESS
 *
 * 4. Verify bytecode on Basescan:
 *    forge verify-contract <DEPLOYED_ADDRESS> contracts/ProofPayEscrow.sol:ProofPayEscrow \
 *      --chain-id 84532 \
 *      --etherscan-api-key $BASESCAN_API_KEY
 * ============================================================================
 */

contract ProofPayEscrow {
    enum JobStatus {
        Created,
        Funded,
        Released,
        Refunded
    }

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        bytes32 criteriaHash;
        uint256 deadline;
        JobStatus status;
    }

    address public immutable verifier;
    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, bytes32 criteriaHash, uint256 deadline);
    event JobFunded(uint256 indexed jobId, address indexed funder, uint256 amount);
    event JobReleased(uint256 indexed jobId, address indexed recipient, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed client, uint256 amount);

    error NotVerifier();
    error NotAuthorized();
    error InvalidAmount();
    error InvalidStatus();
    error DeadlineNotPassed();
    error TransferFailed();

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert NotVerifier();
        _;
    }

    constructor(address _verifier) {
        verifier = _verifier;
    }

    function createJob(
        address _client,
        address _freelancer,
        uint256 _amount,
        bytes32 _criteriaHash,
        uint256 _deadline
    ) external returns (uint256 jobId) {
        if (_amount == 0) revert InvalidAmount();
        jobId = ++jobCount;

        jobs[jobId] = Job({
            client: _client,
            freelancer: _freelancer,
            amount: _amount,
            criteriaHash: _criteriaHash,
            deadline: _deadline,
            status: JobStatus.Created
        });

        emit JobCreated(jobId, _client, _freelancer, _amount, _criteriaHash, _deadline);
    }

    function fund(uint256 _jobId) external payable {
        Job storage job = jobs[_jobId];
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (msg.value != job.amount) revert InvalidAmount();

        job.status = JobStatus.Funded;
        emit JobFunded(_jobId, msg.sender, msg.value);
    }

    function release(uint256 _jobId) external onlyVerifier {
        Job storage job = jobs[_jobId];
        if (job.status != JobStatus.Funded) revert InvalidStatus();

        job.status = JobStatus.Released;
        emit JobReleased(_jobId, job.freelancer, job.amount);

        (bool success, ) = payable(job.freelancer).call{value: job.amount}("");
        if (!success) revert TransferFailed();
    }

    function refund(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        if (job.status != JobStatus.Funded) revert InvalidStatus();
        if (block.timestamp <= job.deadline) revert DeadlineNotPassed();
        if (msg.sender != job.client && msg.sender != verifier) revert NotAuthorized();

        job.status = JobStatus.Refunded;
        emit JobRefunded(_jobId, job.client, job.amount);

        (bool success, ) = payable(job.client).call{value: job.amount}("");
        if (!success) revert TransferFailed();
    }
}
