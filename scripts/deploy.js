const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // 1) Deploy AchievementNFT
  const AchievementNFT = await hre.ethers.getContractFactory("AchievementNFT");
  const achievementNFT = await AchievementNFT.deploy();
  await achievementNFT.waitForDeployment();
  const achievementNFTAddress = await achievementNFT.getAddress();
  console.log(`✅ AchievementNFT deployed to: ${achievementNFTAddress}`);

  // 2) Deploy CoinFlip with NFT address
  const CoinFlip = await hre.ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy(achievementNFTAddress);
  await coinFlip.waitForDeployment();
  const coinFlipAddress = await coinFlip.getAddress();
  console.log(`✅ CoinFlip deployed to: ${coinFlipAddress}`);

  // 3) Transfer NFT ownership to CoinFlip
  const transferTx = await achievementNFT.transferOwnership(coinFlipAddress);
  await transferTx.wait();
  console.log("✅ AchievementNFT ownership transferred to CoinFlip");

  // 4) Fund CoinFlip with 10 ETH for payouts
  const fundTx = await deployer.sendTransaction({
    to: coinFlipAddress,
    value: hre.ethers.parseEther("10"),
  });
  await fundTx.wait();
  console.log("✅ CoinFlip funded with 10 ETH");

  // 5) Deploy Lottery contracts
  const LotteryTicket = await hre.ethers.getContractFactory("LotteryTicket");
  const lotteryTicket = await LotteryTicket.deploy();
  await lotteryTicket.waitForDeployment();
  const lotteryTicketAddress = await lotteryTicket.getAddress();
  console.log(`✅ LotteryTicket NFT deployed to: ${lotteryTicketAddress}`);

  const LotteryAchievementNFT = await hre.ethers.getContractFactory("LotteryAchievementNFT");
  const lotteryAchievementNFT = await LotteryAchievementNFT.deploy();
  await lotteryAchievementNFT.waitForDeployment();
  const lotteryAchievementNFTAddress = await lotteryAchievementNFT.getAddress();
  console.log(`✅ LotteryAchievementNFT deployed to: ${lotteryAchievementNFTAddress}`);

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(lotteryTicketAddress, lotteryAchievementNFTAddress);
  await lottery.waitForDeployment();
  const lotteryAddress = await lottery.getAddress();
  console.log(`✅ Lottery game deployed to: ${lotteryAddress}`);

  const ltTx = await lotteryTicket.setLotteryContract(lotteryAddress);
  await ltTx.wait();
  console.log("✅ LotteryTicket minting rights given to Lottery contract");

  const laTx = await lotteryAchievementNFT.transferOwnership(lotteryAddress);
  await laTx.wait();
  console.log("✅ LotteryAchievementNFT ownership transferred to Lottery contract");

  // 6) Deploy and fund Blackjack
  const BlackjackAchievementNFT = await hre.ethers.getContractFactory("BlackjackAchievementNFT");
  const blackjackAchievementNFT = await BlackjackAchievementNFT.deploy();
  await blackjackAchievementNFT.waitForDeployment();
  const blackjackAchievementNFTAddress = await blackjackAchievementNFT.getAddress();
  console.log(`✅ BlackjackAchievementNFT deployed to: ${blackjackAchievementNFTAddress}`);

  const Blackjack = await hre.ethers.getContractFactory("Blackjack");
  const blackjack = await Blackjack.deploy(blackjackAchievementNFTAddress);
  await blackjack.waitForDeployment();
  const blackjackAddress = await blackjack.getAddress();
  console.log(`✅ Blackjack game deployed to: ${blackjackAddress}`);

  const baTx = await blackjackAchievementNFT.transferOwnership(blackjackAddress);
  await baTx.wait();
  console.log("✅ BlackjackAchievementNFT ownership transferred to Blackjack contract");

  const fundBjTx = await deployer.sendTransaction({
    to: blackjackAddress,
    value: hre.ethers.parseEther("10"),
  });
  await fundBjTx.wait();
  console.log("✅ Blackjack funded with 10 ETH");

  // 7) Print frontend values
  console.log("\n📝 Frontend config:");
  console.log(`CONTRACT_ADDRESS = "${coinFlipAddress}"`);
  console.log(`ACHIEVEMENT_NFT_ADDRESS = "${achievementNFTAddress}"`);
  console.log(`LOTTERY_ADDRESS = "${lotteryAddress}"`);
  console.log(`LOTTERY_TICKET_ADDRESS = "${lotteryTicketAddress}"`);
  console.log(`LOTTERY_ACHIEVEMENT_NFT_ADDRESS = "${lotteryAchievementNFTAddress}"`);
  console.log(`BLACKJACK_ADDRESS = "${blackjackAddress}"`);
  console.log(`BLACKJACK_ACHIEVEMENT_NFT_ADDRESS = "${blackjackAchievementNFTAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});