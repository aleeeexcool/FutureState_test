// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract ProposalEvaluation {
    address[] private judges;

    uint256 public proposalCount;
    uint256 public evaluationEndTime;

    uint256 public TIME_FOR_EVALUATION = 5 minutes;

    mapping (uint256 proposalId => Details) private proposals;

    struct Details {
        mapping(address judge => bool has_Evaluated) hasEvaluated;
        mapping(address judge => uint8 score) judgeScores;
        uint256 totalScore;
    }

    event EvaluationStarted(uint256 endTime);

    error MoreJudgesNeeded(uint256 current, uint8 min);
    error HaveAlreadyEvaluated();
    error NotCorrectScore(uint8 current, uint8 min, uint8 max);
    error NotAJudge();
    error EvaluationPeriodHasEnded(uint256 endTime, uint256 currentTime);
    error EvaluationPriodIsStillInProgress(uint256 endTime);
    error ProposalHasNotBeenEvatuatedYet(uint256 currentCount);

    modifier onlyJudge() {
        if(!isJudge(msg.sender)) {
            revert NotAJudge();
        }
        _;
    }

    modifier evaluationEnded() {
        if(block.timestamp > evaluationEndTime) {
            revert EvaluationPeriodHasEnded({
                endTime: evaluationEndTime,
                currentTime: block.timestamp
            });
        }
        _;
    }

    modifier evaluationInProgress() {
        if(block.timestamp <= evaluationEndTime) {
            revert EvaluationPriodIsStillInProgress({
                endTime: evaluationEndTime
            });
        }
        _;
    }

    constructor(address[] memory _judges) {
        if(_judges.length <= 2) {
            revert MoreJudgesNeeded({
                current: _judges.length,
                min: 3
            });
        }
        judges = _judges;
        proposalCount = 0;
    }

    function startEvaluation() external onlyJudge evaluationInProgress {
        proposalCount++;
        evaluationEndTime = block.timestamp + TIME_FOR_EVALUATION;

        emit EvaluationStarted(evaluationEndTime);
    }

    function submitScore(uint8 score) external onlyJudge evaluationEnded {
        if(proposals[proposalCount].hasEvaluated[msg.sender]) {
            revert HaveAlreadyEvaluated();
        }
        if(score > 10) {
            revert NotCorrectScore({
                current: score,
                min: 0,
                max: 10
            });
        }

        proposals[proposalCount].hasEvaluated[msg.sender] = true;
        proposals[proposalCount].judgeScores[msg.sender] = score;
        proposals[proposalCount].totalScore += score;
    }

    function getAverageScore(uint256 proposalId) external view returns (uint) {
        if(proposalId > proposalCount) {
            revert ProposalHasNotBeenEvatuatedYet({
                currentCount: proposalCount
            });
        } else if(proposalId == proposalCount) {
            if(block.timestamp <= evaluationEndTime) {
                    revert EvaluationPriodIsStillInProgress({
                        endTime: evaluationEndTime
                    });
                } else {
                    return proposals[proposalId].totalScore / judges.length;
                }
            } else {
                return proposals[proposalId].totalScore / judges.length;
            }
    }

    function getMyScore(uint256 proposalId) external view onlyJudge returns (uint8) {
        if(proposalId > proposalCount) {
            revert ProposalHasNotBeenEvatuatedYet({
                currentCount: proposalCount
            });
        } else {
            return proposals[proposalId].judgeScores[msg.sender];
        }
    }

    function isJudge(address judge) public view returns (bool) {
        for (uint256 i = 0; i < judges.length; i++) {
            if (judges[i] == judge) {
                return true;
            }
        }
        return false;
    }

    function getJudges() external view returns (address[] memory) {
        return judges;
    }
}
