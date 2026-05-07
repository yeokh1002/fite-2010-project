// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementNFT is ERC721, Ownable {
    uint256 public nextTokenId;
    mapping(address => bool) public hasMinted;

        constructor() ERC721("CoinFlipAchievement", "CFA") Ownable() {}

    function mint(address to) external onlyOwner {
        require(!hasMinted[to], "Already received achievement NFT");
        _safeMint(to, nextTokenId);
        hasMinted[to] = true;
        nextTokenId++;
    }
}
