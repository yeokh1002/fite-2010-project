const { expect } = require("chai");

describe("CoinFlip NFT Reward Integration", function () {
    let coinFlip, achievementNFT;
    let owner, player1;
    const MIN_BET = ethers.parseEther("0.001");
    const NFT_WIN_THRESHOLD = 10;

    beforeEach(async function () {
        [owner, player1] = await ethers.getSigners();
        const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
        achievementNFT = await AchievementNFT.deploy();
        await achievementNFT.waitForDeployment();

        const CoinFlip = await ethers.getContractFactory("CoinFlip");
        coinFlip = await CoinFlip.deploy(await achievementNFT.getAddress());
        await coinFlip.waitForDeployment();

        // Set CoinFlip as owner of the NFT contract
        await achievementNFT.transferOwnership(await coinFlip.getAddress());

        // Fund CoinFlip contract
        await owner.sendTransaction({
            to: await coinFlip.getAddress(),
            value: ethers.parseEther("10")
        });
    });

    it("Should mint NFT to player after 10 wins (mocked)", async function () {
        // Directly increment playerWins for testing
        for (let i = 0; i < NFT_WIN_THRESHOLD; i++) {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            // Manually set win and completed status
            await coinFlip.connect(owner).setPlayerWinForTest(player1.address);
        }
        // Player should have received an NFT
        expect(await achievementNFT.balanceOf(player1.address)).to.equal(1);
        // Should not mint again on further wins
        await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
        await coinFlip.connect(owner).setPlayerWinForTest(player1.address);
        expect(await achievementNFT.balanceOf(player1.address)).to.equal(1);
    });
});
