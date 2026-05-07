// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./security/ReentrancyGuard.sol";
import "./AchievementNFT.sol";

contract CoinFlip is Ownable, ReentrancyGuard {
    enum GameStatus { Open, Completed, Cancelled }
    
    struct Game {
        uint256 gameId;
        address player;
        uint256 betAmount;
        uint8 guess;
        uint8 result;
        GameStatus status;
        uint256 timestamp;
        bool won;
    }
    
    uint256 public nextGameId;
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    mapping(address => uint256) public playerWins;

    AchievementNFT public achievementNFT;
    uint256 public constant NFT_WIN_THRESHOLD = 10;
    
    event GameCreated(uint256 indexed gameId, address indexed player, uint256 betAmount, uint8 guess);
    event GameResult(uint256 indexed gameId, uint8 result, bool won, uint256 payout);
    event GameCancelled(uint256 indexed gameId);
    
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 1 ether;
    uint256 public constant HOUSE_EDGE = 5;
    uint256 public constant MAX_RANDOM = 100;
    
        constructor(address _achievementNFT) Ownable() {
            achievementNFT = AchievementNFT(_achievementNFT);
        }
    
    // Helper function to generate random result
    function _determineResult() internal view returns (uint8) {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            msg.sender
        ))) % MAX_RANDOM;
        
        return randomNumber < 50 ? 0 : 1;
    }
    
    // Create a new game (remains open until resolved or cancelled)
    function flipCoin(uint8 _guess) external payable nonReentrant {
        require(_guess == 0 || _guess == 1, "Invalid guess: 0=Heads, 1=Tails");
        require(msg.value >= MIN_BET, "Bet must be >= MIN_BET");
        require(msg.value <= MAX_BET, "Bet must be <= MAX_BET");
        require(address(this).balance >= msg.value * 2, "Contract insufficient balance");

        uint256 gameId = nextGameId++;

        games[gameId] = Game({
            gameId: gameId,
            player: msg.sender,
            betAmount: msg.value,
            guess: _guess,
            result: 2,
            status: GameStatus.Open,
            timestamp: block.timestamp,
            won: false
        });

        playerGames[msg.sender].push(gameId);

        emit GameCreated(gameId, msg.sender, msg.value, _guess);
    }

    // Resolve an open game (can only be called by the player)
    function resolveGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.player == msg.sender, "Not your game");
        require(game.status == GameStatus.Open, "Game not open");

        uint8 result = _determineResult();
        game.result = result;
        game.status = GameStatus.Completed;

        bool won = (game.guess == result);
        game.won = won;

        uint256 payout = 0;
        if (won) {
            payout = (game.betAmount * 2 * (100 - HOUSE_EDGE)) / 100;
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");
            playerWins[msg.sender]++;
            // Mint NFT if player reaches threshold and hasn't received one
            if (playerWins[msg.sender] == NFT_WIN_THRESHOLD && !achievementNFT.hasMinted(msg.sender)) {
                achievementNFT.mint(msg.sender);
            }
        }

        emit GameResult(gameId, result, won, payout);
    }
    
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    receive() external payable {}
    
    // Allow player to cancel their game after 1 hour if still open
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.player == msg.sender, "Not your game");
        require(game.status == GameStatus.Open, "Game not open");
        require(block.timestamp >= game.timestamp + 1 hours, "Wait 1 hour before cancel");

        game.status = GameStatus.Cancelled;
        uint256 refund = game.betAmount;
        game.betAmount = 0;
        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "Refund failed");
        emit GameCancelled(gameId);
    }

    // TESTING ONLY: Directly increment wins and mint NFT if threshold reached
    function setPlayerWinForTest(address player) external onlyOwner {
        playerWins[player]++;
        if (playerWins[player] == NFT_WIN_THRESHOLD && !achievementNFT.hasMinted(player)) {
            achievementNFT.mint(player);
        }
    }
}
