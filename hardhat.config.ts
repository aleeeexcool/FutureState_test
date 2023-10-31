import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
        optimizer: {
            enabled: true,
            runs: 2000
        }
    }
  },
  networks: {
    hardhat: {
      gas: 1000000,
      allowUnlimitedContractSize: true,
    },
  },
  mocha: { 
    timeout: 12000000 
  },
  gasReporter: {
    enabled: true
  }
};
export default config;
