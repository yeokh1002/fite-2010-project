// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract LotteryAchievementNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId;
    mapping(address => bool) public hasMinted;

    constructor() ERC721("Lottery Jackpot Winner", "LJW") Ownable() {}

    function mint(address to) external onlyOwner {
        require(!hasMinted[to], "Already received lottery achievement NFT");
        _safeMint(to, nextTokenId);
        hasMinted[to] = true;
        nextTokenId++;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory customImageURL = "ipfs://bafkreifq2xbbdyo34dnccu36d2znkw5gifsjesxeevj52bujxcnahs2dfi";
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Lucky Calf #', tokenId.toString(), '", ',
                        '"description": "An exclusive NFT awarded for winning the Lottery Jackpot!", ',
                        '"image": "', customImageURL, '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}