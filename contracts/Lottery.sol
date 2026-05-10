// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./security/ReentrancyGuard.sol";
import "./LotteryTicket.sol";

contract Lottery is Ownable, ReentrancyGuard {
    LotteryTicket public ticketNFT;
    
    uint256 public ticketPrice = 0.05 ether;
    uint256 public currentPool;
    uint256[] public currentRoundTickets;
    uint256 public lotteryRound;
    
    // Auto-draw threshold: e.g., 20 tickets * 0.05 = 1.0 ETH
    uint256 public constant POOL_THRESHOLD = 1 ether;

    event TicketPurchased(address indexed buyer, uint256 indexed tokenId, uint256 round);
    event WinnerDrawn(uint256 indexed round, address indexed winner, uint256 prize);

    constructor(address _ticketNFT) Ownable() {
        ticketNFT = LotteryTicket(_ticketNFT);
    }

    // Buy a ticket NFT representing an entry in the current round
    function buyTicket() external payable nonReentrant {
        require(msg.value == ticketPrice, "Incorrect ticket price");
        
        currentPool += msg.value;
        uint256 tokenId = ticketNFT.mint(msg.sender);
        currentRoundTickets.push(tokenId);

        emit TicketPurchased(msg.sender, tokenId, lotteryRound);

        // Automatically trigger draw if threshold is met
        if (currentPool >= POOL_THRESHOLD) {
            _drawWinner();
        }
    }

    // Internal function to draw a winner when threshold is met
    function _drawWinner() internal {
        // Pseudo-random generation (Good enough for local testing, use Chainlink VRF for mainnet)
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            currentRoundTickets.length,
            msg.sender
        ))) % currentRoundTickets.length;

        uint256 winningTokenId = currentRoundTickets[randomIndex];
        address winner = ticketNFT.ownerOf(winningTokenId);
        
        uint256 prize = currentPool;
        currentPool = 0;
        delete currentRoundTickets;
        lotteryRound++;

        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Transfer failed");

        emit WinnerDrawn(lotteryRound - 1, winner, prize);
    }
    
    function getTicketsSoldCurrentRound() external view returns (uint256) {
        return currentRoundTickets.length;
    }
}