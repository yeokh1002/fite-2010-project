const { expect } = require("chai");

describe("CoinFlip - Complete Test Suite", function () {
    let coinFlip;
    let owner;
    let player1;
    let player2;
    let otherAccount;
    const MIN_BET = ethers.parseEther("0.001");
    const MAX_BET = ethers.parseEther("1");
    const HOUSE_EDGE = 5; // 5%

    // ============================================
    // DEPLOYMENT & SETUP TESTS
    // ============================================
    beforeEach(async function () {
        [owner, player1, player2, otherAccount] = await ethers.getSigners();
        const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
        const achievementNFT = await AchievementNFT.deploy();
        await achievementNFT.waitForDeployment();

        const CoinFlip = await ethers.getContractFactory("CoinFlip");
        coinFlip = await CoinFlip.deploy(await achievementNFT.getAddress());
        await coinFlip.waitForDeployment();

        // Set CoinFlip as owner of the NFT contract
        await achievementNFT.transferOwnership(await coinFlip.getAddress());
        
        // Fund the contract with 10 ETH for payouts
        await owner.sendTransaction({
            to: await coinFlip.getAddress(),
            value: ethers.parseEther("10")
        });
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await coinFlip.owner()).to.equal(owner.address);
        });
        
        it("Should have correct MIN_BET value", async function () {
            expect(await coinFlip.MIN_BET()).to.equal(MIN_BET);
        });
        
        it("Should have correct MAX_BET value", async function () {
            expect(await coinFlip.MAX_BET()).to.equal(MAX_BET);
        });
        
        it("Should have correct HOUSE_EDGE", async function () {
            expect(await coinFlip.HOUSE_EDGE()).to.equal(HOUSE_EDGE);
        });
        
        it("Should start with nextGameId = 0", async function () {
            expect(await coinFlip.nextGameId()).to.equal(0);
        });
        
        it("Should have initial contract balance of 10 ETH", async function () {
            const balance = await coinFlip.getContractBalance();
            expect(ethers.formatEther(balance)).to.equal("10.0");
        });
    });

    // ============================================
    // GAME PLAY TESTS
    // ============================================
    describe("Game Play - Valid Moves", function () {
        it("Should allow player to flip coin with Heads guess", async function () {
            await expect(
                coinFlip.connect(player1).flipCoin(0, { value: MIN_BET })
            ).to.not.be.reverted;
        });
        
        it("Should allow player to flip coin with Tails guess", async function () {
            await expect(
                coinFlip.connect(player1).flipCoin(1, { value: MIN_BET })
            ).to.not.be.reverted;
        });
        
        it("Should increment gameId after each game", async function () {
            expect(await coinFlip.nextGameId()).to.equal(0);
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            expect(await coinFlip.nextGameId()).to.equal(1);
            await coinFlip.connect(player2).flipCoin(1, { value: MIN_BET });
            expect(await coinFlip.nextGameId()).to.equal(2);
        });
        
        it("Should store game details correctly", async function () {
            const betAmount = ethers.parseEther("0.05");
            await coinFlip.connect(player1).flipCoin(1, { value: betAmount });
            await coinFlip.connect(player1).resolveGame(0);
            const game = await coinFlip.games(0);
            expect(game.player).to.equal(player1.address);
            expect(game.betAmount).to.equal(betAmount);
            expect(game.guess).to.equal(1);
            expect(game.status).to.equal(1); // Completed
        });
        
        it("Should track player game history", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            await coinFlip.connect(player1).flipCoin(1, { value: MIN_BET });
            
            const playerGames = await coinFlip.getPlayerGames(player1.address);
            expect(playerGames.length).to.equal(2);
            expect(playerGames[0]).to.equal(0);
            expect(playerGames[1]).to.equal(1);
        });
    });

    // ============================================
    // INPUT VALIDATION TESTS
    // ============================================
    describe("Input Validation", function () {
        it("Should reject invalid guess (not 0 or 1)", async function () {
            await expect(
                coinFlip.connect(player1).flipCoin(2, { value: MIN_BET })
            ).to.be.revertedWith("Invalid guess: 0=Heads, 1=Tails");
            
            await expect(
                coinFlip.connect(player1).flipCoin(99, { value: MIN_BET })
            ).to.be.revertedWith("Invalid guess: 0=Heads, 1=Tails");
        });
        
        it("Should reject bets below minimum", async function () {
            const tinyBet = ethers.parseEther("0.0005");
            await expect(
                coinFlip.connect(player1).flipCoin(0, { value: tinyBet })
            ).to.be.revertedWith("Bet must be >= MIN_BET");
        });
        
        it("Should reject bets above maximum", async function () {
            const hugeBet = ethers.parseEther("2");
            await expect(
                coinFlip.connect(player1).flipCoin(0, { value: hugeBet })
            ).to.be.revertedWith("Bet must be <= MAX_BET");
        });
        
        it("Should reject bet if contract has insufficient funds", async function () {
            // Create a new contract with no initial funding
            const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
            const achievementNFT = await AchievementNFT.deploy();
            await achievementNFT.waitForDeployment();

            const CoinFlip = await ethers.getContractFactory("CoinFlip");
            const emptyContract = await CoinFlip.deploy(await achievementNFT.getAddress());
            await emptyContract.waitForDeployment();
            
            await expect(
                emptyContract.connect(player1).flipCoin(0, { value: MIN_BET })
            ).to.be.revertedWith("Contract insufficient balance");
        });
    });

    // ============================================
    // EVENT EMISSION TESTS
    // ============================================
    describe("Event Emissions", function () {
        it("Should emit GameCreated event when flipping coin", async function () {
            await expect(coinFlip.connect(player1).flipCoin(0, { value: MIN_BET }))
                .to.emit(coinFlip, "GameCreated")
                .withArgs(0, player1.address, MIN_BET, 0);
        });
        
        it("Should emit GameResult event after game completes", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            const tx = await coinFlip.connect(player1).resolveGame(0);
            const receipt = await tx.wait();
            // Check that GameResult event was emitted
            const event = receipt.logs.find(
                log => log.fragment && log.fragment.name === "GameResult"
            );
            expect(event).to.not.be.undefined;
        });
        
        it("Should emit GameCancelled event when cancelling", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            // Increase time by 1 hour
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(coinFlip.connect(player1).cancelGame(0))
                .to.emit(coinFlip, "GameCancelled")
                .withArgs(0);
        });
    });

    // ============================================
    // CANCEL GAME TESTS
    // ============================================
    describe("Cancel Game", function () {
        it("Should allow player to cancel game after 1 hour", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(coinFlip.connect(player1).cancelGame(0))
                .to.not.be.reverted;
        });
        
        it("Should prevent cancellation before 1 hour", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            await expect(
                coinFlip.connect(player1).cancelGame(0)
            ).to.be.revertedWith("Wait 1 hour before cancel");
        });
        
        it("Should prevent non-player from cancelling", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(
                coinFlip.connect(player2).cancelGame(0)
            ).to.be.revertedWith("Not your game");
        });
        
        it("Should refund bet when cancelled", async function () {
            const initialBalance = await ethers.provider.getBalance(player1.address);
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            const tx = await coinFlip.connect(player1).cancelGame(0);
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(player1.address);
            
            // Player should have their bet back (minus gas)
            expect(finalBalance + gasCost).to.be.closeTo(
                initialBalance, 
                ethers.parseEther("0.001")
            );
        });
        
        it("Should mark cancelled game status", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await coinFlip.connect(player1).cancelGame(0);
            
            const game = await coinFlip.games(0);
            expect(game.status).to.equal(2); // Cancelled
        });
    });

    // ============================================
    // VIEW FUNCTION TESTS
    // ============================================
    describe("View Functions", function () {
        it("Should return correct game details via getGame", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            
            const game = await coinFlip.getGame(0);
            expect(game.player).to.equal(player1.address);
            expect(game.betAmount).to.equal(MIN_BET);
        });
        
        it("Should return correct player games array", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            await coinFlip.connect(player1).flipCoin(1, { value: MIN_BET });
            
            const games = await coinFlip.getPlayerGames(player1.address);
            expect(games).to.deep.equal([0n, 1n]);
        });
        
        it("Should return correct contract balance", async function () {
            const balance = await coinFlip.getContractBalance();
            expect(ethers.formatEther(balance)).to.equal("10.0");
        });
    });

    // ============================================
    // MULTIPLE PLAYER TESTS
    // ============================================
    describe("Multiple Players", function () {
        it("Should handle multiple players independently", async function () {
            await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            await coinFlip.connect(player2).flipCoin(1, { value: MIN_BET });
            
            const player1Games = await coinFlip.getPlayerGames(player1.address);
            const player2Games = await coinFlip.getPlayerGames(player2.address);
            
            expect(player1Games.length).to.equal(1);
            expect(player2Games.length).to.equal(1);
            expect(player1Games[0]).to.equal(0);
            expect(player2Games[0]).to.equal(1);
        });
    });

    // ============================================
    // EDGE CASE TESTS
    // ============================================
    describe("Edge Cases", function () {
        it("Should handle maximum bet amount", async function () {
            await expect(
                coinFlip.connect(player1).flipCoin(0, { value: MAX_BET })
            ).to.not.be.reverted;
        });
        
        it("Should handle multiple games from same player", async function () {
            for (let i = 0; i < 5; i++) {
                await coinFlip.connect(player1).flipCoin(0, { value: MIN_BET });
            }
            
            const games = await coinFlip.getPlayerGames(player1.address);
            expect(games.length).to.equal(5);
            expect(await coinFlip.nextGameId()).to.equal(5);
        });
    });
});