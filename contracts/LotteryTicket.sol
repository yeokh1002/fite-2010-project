// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LotteryTicket is ERC721, Ownable {
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
}