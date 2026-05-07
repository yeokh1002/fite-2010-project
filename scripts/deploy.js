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

  // 5) Print frontend values
  console.log("\n📝 Frontend config:");
  console.log(`CONTRACT_ADDRESS = "${coinFlipAddress}"`);
  console.log(`ACHIEVEMENT_NFT_ADDRESS = "${achievementNFTAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});