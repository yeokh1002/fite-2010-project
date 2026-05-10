const hre = require("hardhat");

// We will use the same Lottery address from your last deployment
const LOTTERY_ADDRESS = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";

async function main() {
    console.log("🤖 Starting Auto-Draw Bot...");
    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = Lottery.attach(LOTTERY_ADDRESS);

    // Using the default hardhat account (Account #0) to pay gas for the draws
    const [botAccount] = await hre.ethers.getSigners();
    console.log(`Bot running on account: ${botAccount.address}`);

    // Check every 10 seconds
    setInterval(async () => {
        try {
            const ticketsSold = await lottery.getTicketsSoldCurrentRound();
            if (ticketsSold > 0) {
                const lastDrawTime = await lottery.lastDrawTime();
                const interval = await lottery.DRAW_INTERVAL();
                const latestBlock = await hre.ethers.provider.getBlock("latest");
                
                // If enough time has passed
                if (latestBlock.timestamp >= Number(lastDrawTime) + Number(interval)) {
                    console.log(`⏰ Time reached! Drawing winner for round...`);
                    const tx = await lottery.connect(botAccount).drawWinner();
                    const receipt = await tx.wait();
                    console.log(`🎉 Winner drawn successfully in tx: ${receipt.hash}`);
                }
            }
        } catch (error) {
            // Ignore reverted transactions if block timing isn't perfect yet
        }
    }, 10000);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});