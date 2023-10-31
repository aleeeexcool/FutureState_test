import { ethers } from "hardhat";

async function main() {
  const judges = ["0x...", "0x...", "0x...", "0x...", "0x..."];

  const Evaluation = await ethers.getContractFactory("ProposalEvaluation");
  const evaluation = await Evaluation.deploy(judges);
  await evaluation.waitForDeployment();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
