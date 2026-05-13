# Lucky Ledger Project Introduction

## 1. Overview
Lucky Ledger is a decentralized gaming platform developed for the FITE 2010 group project. The system is built using Solidity smart contracts and Hardhat, and it includes several blockchain-based mini games with NFT rewards.

The project currently focuses on three main game modes:
- Coin Flip
- Lottery
- Blackjack

In addition, the platform includes achievement NFTs that are minted when players meet certain milestones.

## 2. Main Features

### 2.1 Coin Flip
- Players place a bet and choose heads or tails.
- The game stores each round on-chain.
- Players can resolve their own open games.
- If the player reaches the win threshold, an achievement NFT can be minted.
- Players can cancel an unresolved game after one hour and receive a refund.

### 2.2 Lottery
- Players can buy ticket NFTs for the current lottery round.
- Each ticket represents one entry into the pool.
- When the pool reaches the threshold, a winner is automatically drawn.
- The winner receives the prize pool.
- A lottery achievement NFT is minted for the winner if they do not already have one.

### 2.3 Blackjack
- Players can start a Blackjack game by placing a bet.
- The contract deals initial cards to the player and dealer.
- Players can choose to `hit` or `stand`.
- Game results are tracked on-chain.
- A Blackjack achievement NFT is awarded after reaching the required win threshold.

### 2.4 NFT Rewards
- The project includes multiple NFT contracts for different game achievements.
- These NFTs are used to reward players for repeated wins or lottery success.
- Each NFT has a custom name, description, and image metadata.

### 2.5 Frontend and Scripts
- A simple frontend is provided for interacting with the contracts.
- Deployment and utility scripts are included for local testing and deployment.

## 3. Current Limitations

The project is functional, but it still has some important limitations:

- **Pseudo-randomness is not fully secure**: random outcomes are generated using block variables and timestamps, so the results are suitable for demo and local testing rather than production use.
- **Not fully decentralized randomness**: the games do not use a trusted randomness oracle such as Chainlink VRF.
- **Basic frontend**: the current frontend is simple and focused on demonstration.

## 4. Conclusion
Lucky Ledger demonstrates how blockchain can be used to build a decentralized gaming platform with on-chain game logic and NFT-based rewards. The current version supports multiple games, reward tracking, and contract-based game management in a complete project structure.
