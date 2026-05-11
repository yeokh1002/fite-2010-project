// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract LotteryTicket is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId;
    address public lotteryContract;

    constructor() ERC721("LotteryTicket", "LTK") Ownable() {}

    function setLotteryContract(address _lottery) external onlyOwner {
        lotteryContract = _lottery;
    }

    function mint(address to) external returns (uint256) {
        require(msg.sender == lotteryContract, "Only lottery contract can mint");
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        nextTokenId++;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory svg = "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' style='background:#181c1f'><rect x='40' y='100' width='220' height='100' rx='15' fill='#ff4d6d' stroke='#fff' stroke-width='4' stroke-dasharray='10,5'/><circle cx='40' cy='150' r='20' fill='#181c1f'/><circle cx='260' cy='150' r='20' fill='#181c1f'/><text x='150' y='160' font-size='40' text-anchor='middle' fill='#fff' font-family='sans-serif'>&#127915; TICKET</text></svg>";
        
        string memory imageURI = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Lottery Ticket #', tokenId.toString(), '", ',
                        '"description": "An official ticket for the decentralized Lottery Game.", ',
                        '"image": "', imageURI, '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}