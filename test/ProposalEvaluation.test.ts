import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ProposalEvaluation } from "../typechain-types";

describe("Test proposal evaluation", function () {
  let judges: Array<Signer>;
  let deployer: Signer;
  let judge1: Signer;
  let judge2: Signer;
  let judge3: Signer;
  let user1: Signer;

  let judger1Address: string;
  let judger2Address: string;
  let judger3Address: string;
  let user1Address: string;

  let evaluation: ProposalEvaluation;
  
  beforeEach(async () => {
    [deployer, judge1, judge2, judge3, user1] = await ethers.getSigners();

    judges = [judge1, judge2, judge3];

    judger1Address = await judge1.getAddress();
    judger2Address = await judge2.getAddress();
    judger3Address = await judge3.getAddress();
    user1Address = await user1.getAddress();

    const Evaluation = await ethers.getContractFactory("ProposalEvaluation");
    evaluation = await Evaluation.deploy(judges);
    await evaluation.waitForDeployment();
  });

  describe("Deployment", () => {
    it("Should set the right judges' addresses", async () => {
      const judgesAddresses = await evaluation.getJudges();

      expect(judgesAddresses).to.deep.equal([judger1Address, judger2Address, judger3Address]);
    });
  });

  describe("Start evaluation and submiting score", () => {
    it("Should allow judge1 to start evaluation and other judges to submit scores", async () => {
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge1).submitScore(2);
      await evaluation.connect(judge2).submitScore(7);
      await evaluation.connect(judge3).submitScore(5);
      await time.increase(300);

      const res = await evaluation.connect(judge1).getAverageScore(1);
      expect(res).to.be.equal(4);
    });

    it("Should revert custom error after judge2 will try to submit a new score and judge1 after sumbit to the requested value", async () => {
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge2).submitScore(7);
      await evaluation.connect(judge3).submitScore(5);

      await expect(evaluation.connect(judge2).submitScore(3)).to.be.revertedWithCustomError(evaluation, "HaveAlreadyEvaluated");
      await expect(evaluation.connect(judge1).submitScore(100)).to.be.revertedWithCustomError(evaluation, "NotCorrectScore");
    });

    it("Should revert custom error if user1 will try to submit score", async () => {
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge2).submitScore(7);

      await expect(evaluation.connect(user1).submitScore(5)).to.be.revertedWithCustomError(evaluation, "NotAJudge");
    });
  });

  describe("Getter functions", () => {
    it("Should allow to get average score of second proposal after passing three", async () => {
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge2).submitScore(7);
      await evaluation.connect(judge3).submitScore(5);
      await time.increase(300);

      const res = await evaluation.connect(judge1).getAverageScore(1);
      expect(res).to.be.equal(4);

      await evaluation.connect(judge2).startEvaluation();
      await evaluation.connect(judge3).submitScore(10);
      await evaluation.connect(judge1).submitScore(5);
      await evaluation.connect(judge2).submitScore(9);
      await time.increase(300);

      const res2 = await evaluation.connect(judge3).getAverageScore(2);
      expect(res2).to.be.equal(8);

      await evaluation.connect(judge2).startEvaluation();
      await evaluation.connect(judge3).submitScore(3);
      await evaluation.connect(judge1).submitScore(2);
      await evaluation.connect(judge2).submitScore(1);
      await time.increase(300);

      const res3 = await evaluation.connect(judge2).getAverageScore(1);
      expect(res3).to.be.equal(4);
    });

    it("Should allow judge2 to get his score in first and second proposals", async () =>{
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge2).submitScore(7);
      await evaluation.connect(judge3).submitScore(5);
      await time.increase(300);

      const res = await evaluation.connect(judge1).getAverageScore(1);
      expect(res).to.be.equal(4);

      await evaluation.connect(judge2).startEvaluation();
      await evaluation.connect(judge3).submitScore(10);
      await evaluation.connect(judge1).submitScore(5);
      await evaluation.connect(judge2).submitScore(9);
      await time.increase(300);

      expect(await evaluation.connect(judge2).getMyScore(1)).to.be.equal(7);
      expect(await evaluation.connect(judge2).getMyScore(2)).to.be.equal(9);
    });

    it("Should revert custom error after judge1 will try to get average score until evaluation time has passed", async () => {
      await evaluation.connect(judge1).startEvaluation();
      await evaluation.connect(judge2).submitScore(7);
      await evaluation.connect(judge3).submitScore(5);

      await time.increase(250);

      await expect(evaluation.connect(judge1).getAverageScore(1)).to.be.revertedWithCustomError(evaluation,"EvaluationPriodIsStillInProgress");
    });

    it("Should revert custom error after user1 will try to get average score of evaluation which has not been evatuated yet", async () => {
      await expect(evaluation.connect(user1).getAverageScore(1)).to.be.revertedWithCustomError(evaluation, "ProposalHasNotBeenEvatuatedYet");
    });

    it("Should return false after check thats user1 is not a judge", async () =>{
      const res = await evaluation.isJudge(user1Address);
      expect(res).to.be.equal(false);
    });
  });
});
