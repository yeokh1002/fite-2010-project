// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BlackjackAchievementNFT.sol";

contract Blackjack {
    address public owner;
    uint256 public nextGameId = 1;
    
    BlackjackAchievementNFT public achievementNFT;
    mapping(address => uint256) public playerWins;
    
    enum GameStatus { None, Active, Won, Lost, Tie }
    
    struct Game {
        uint256 gameId;
        address player;
        uint256 betAmount;
        uint8[] playerHand;
        uint8[] dealerHand;
        GameStatus status;
        uint256 timestamp;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    mapping(address => uint256) public activeGames;
    
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 bet);
    event Hit(uint256 indexed gameId, address indexed player, uint8 card);
    event Stand(uint256 indexed gameId, address indexed player, uint8[] dealerCards, GameStatus status);
    
    constructor(address _achievementNFT) {
        owner = msg.sender;
        achievementNFT = BlackjackAchievementNFT(_achievementNFT);
    }
    
    // Very simple pseudo-random card generator (1-13)
    // 1 = Ace (11 or 1), 11, 12, 13 = Face cards (10)
    function getRandomCard(uint256 seed) internal view returns (uint8) {
        return uint8((uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, seed))) % 13) + 1);
    }
    
    function getCardValue(uint8 card) internal pure returns (uint8) {
        if (card > 10) return 10;
        if (card == 1) return 11; // We handle 11 vs 1 in the hand total
        return card;
    }
    
    function getHandTotal(uint8[] memory hand) public pure returns (uint8) {
        uint8 total = 0;
        uint8 aces = 0;
        
        for (uint i = 0; i < hand.length; i++) {
            uint8 val = getCardValue(hand[i]);
            if (val == 11) aces += 1;
            total += val;
        }
        
        // Downgrade aces from 11 to 1 if we bust
        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }
        
        return total;
    }

    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
    
    function getPlayerHand(address player) external view returns (uint8[] memory) {
        uint256 gameId = activeGames[player];
        if (gameId == 0 && playerGames[player].length > 0) {
            gameId = playerGames[player][playerGames[player].length - 1]; // last game
        }
        return games[gameId].playerHand;
    }

    function getDealerHand(address player) external view returns (uint8[] memory) {
        uint256 gameId = activeGames[player];
        if (gameId == 0 && playerGames[player].length > 0) {
            gameId = playerGames[player][playerGames[player].length - 1];
        }
        return games[gameId].dealerHand;
    }

    function getStatus(address player) external view returns (uint8) {
        uint256 gameId = activeGames[player];
        if (gameId == 0 && playerGames[player].length > 0) {
            gameId = playerGames[player][playerGames[player].length - 1];
        }
        return uint8(games[gameId].status);
    }
    
    function startGame() external payable {
        require(msg.value > 0, "Bet must be > 0");
        require(activeGames[msg.sender] == 0, "Game already active");
        require(address(this).balance >= msg.value * 2, "Contract insufficient funds");
        
        // Create new game
        uint256 gameId = nextGameId++;
        activeGames[msg.sender] = gameId;
        playerGames[msg.sender].push(gameId);
        
        Game storage game = games[gameId];
        game.gameId = gameId;
        game.player = msg.sender;
        game.betAmount = msg.value;
        game.status = GameStatus.Active;
        game.timestamp = block.timestamp;
        
        // Deal cards
        game.playerHand.push(getRandomCard(1));
        game.playerHand.push(getRandomCard(2));
        game.dealerHand.push(getRandomCard(3));
        
        emit GameStarted(gameId, msg.sender, msg.value);
        
        // Immediate blackjack check
        if (getHandTotal(game.playerHand) == 21) {
            game.status = GameStatus.Won;
            activeGames[msg.sender] = 0; // End game
            payable(msg.sender).transfer(msg.value * 2);
            _handleWin(msg.sender);
            emit Stand(gameId, msg.sender, game.dealerHand, GameStatus.Won);
        }
    }
    
    function _handleWin(address player) internal {
        playerWins[player]++;
        if (playerWins[player] >= 3 && !achievementNFT.hasMinted(player)) {
            achievementNFT.mint(player);
        }
    }
    
    function hit() external {
        uint256 gameId = activeGames[msg.sender];
        require(gameId != 0, "No active game");
        
        Game storage game = games[gameId];
        
        uint8 newCard = getRandomCard(game.playerHand.length + 10);
        game.playerHand.push(newCard);
        
        emit Hit(gameId, msg.sender, newCard);
        
        if (getHandTotal(game.playerHand) > 21) {
            game.status = GameStatus.Lost;
            activeGames[msg.sender] = 0; // End game
            emit Stand(gameId, msg.sender, game.dealerHand, GameStatus.Lost);
        }
    }
    
    function stand() external {
        uint256 gameId = activeGames[msg.sender];
        require(gameId != 0, "No active game");
        
        Game storage game = games[gameId];
        
        uint8 dealerTotal = getHandTotal(game.dealerHand);
        uint256 seed = 100;
        
        while (dealerTotal < 17) {
            game.dealerHand.push(getRandomCard(seed));
            dealerTotal = getHandTotal(game.dealerHand);
            seed++;
        }
        
        uint8 playerTotal = getHandTotal(game.playerHand);
        
        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            game.status = GameStatus.Won;
            payable(msg.sender).transfer(game.betAmount * 2);
            _handleWin(msg.sender);
        } else if (playerTotal == dealerTotal) {
            game.status = GameStatus.Tie;
            payable(msg.sender).transfer(game.betAmount);
        } else {
            game.status = GameStatus.Lost;
        }
        
        activeGames[msg.sender] = 0; // End game
        emit Stand(gameId, msg.sender, game.dealerHand, game.status);
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
}