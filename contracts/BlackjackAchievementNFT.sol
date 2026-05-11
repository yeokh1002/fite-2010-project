// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract BlackjackAchievementNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId;
    mapping(address => bool) public hasMinted;

    constructor() ERC721("Blackjack Master", "BJM") Ownable() {}

    function mint(address to) external onlyOwner {
        require(!hasMinted[to], "Already received blackjack achievement NFT");
        _safeMint(to, nextTokenId);
        hasMinted[to] = true;
        nextTokenId++;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory customImageURL = "ipfs://bafkreieyi33vj63shlgezhk4s7n3rqesxzxf6arw6r4ia7blhlby7zkfre";
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Lucky Lamb #', tokenId.toString(), '", ',
                        '"description": "An exclusive NFT awarded for winning 3 Blackjack games!", ',
                        '"image": "', customImageURL, '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}