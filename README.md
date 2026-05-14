
# FITE 2010 Group Project

A decentralized gaming platform built with Hardhat, featuring smart contracts for Blackjack, Coin Flip, and Lottery games, with NFT-based achievements and a simple web frontend.

## Features

- **Blackjack, Coin Flip, and Lottery games** implemented as smart contracts in Solidity.
- **NFT Achievements**: Earn NFTs for in-game accomplishments.
- **Lottery Ticket NFTs**: Each lottery entry is an NFT.
- **Frontend**: Simple HTML/JS interface for interacting with the contracts.
- **Security**: Includes a custom ReentrancyGuard and uses OpenZeppelin contracts.

## Project Structure

```
contracts/         # Solidity smart contracts
  AchievementNFT.sol
  Blackjack.sol
  BlackjackAchievementNFT.sol
  CoinFlip.sol
  Lottery.sol
  LotteryAchievementNFT.sol
  LotteryTicket.sol
  security/
	 ReentrancyGuard.sol

frontend/          # Simple web frontend (index.html)
scripts/           # Deployment and utility scripts
  autoDraw.js
  deploy.js
test/              # Test scripts for contracts
  CoinFlip.js
  CoinFlipNFT.js
  Lock.js
hardhat.config.js  # Hardhat configuration
package.json       # Project dependencies and scripts
```

## Getting Started

1. **Install dependencies:**
	```sh
	npm install
	```

2. **Start Hardhat local node:**
	```sh
	npx hardhat node
	```

3. **Deploy contracts:**
	```sh
	npx hardhat run scripts/deploy.js --network localhost
	```

4. **Run the frontend:**
	```sh
	npx http-server ./frontend -p 8000
	```
	Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Contracts Overview

- **Blackjack.sol**: On-chain blackjack game with NFT rewards.
- **CoinFlip.sol**: Simple coin flip betting game, win streaks earn NFTs.
- **Lottery.sol**: Buy NFT tickets, auto-draw when pool threshold is met, winner gets prize and NFT.
- **AchievementNFT.sol / LotteryAchievementNFT.sol / BlackjackAchievementNFT.sol**: ERC721 NFT contracts for achievements.
- **LotteryTicket.sol**: ERC721 NFT representing lottery tickets.
- **security/ReentrancyGuard.sol**: Protects against reentrancy attacks.

## Testing

Write and run tests in the `test/` directory using Hardhat:
```sh
npx hardhat test
```

## License

MIT
