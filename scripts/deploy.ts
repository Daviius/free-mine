import { ethers } from "hardhat";
import { parseUnits } from "ethers";

const deployPackages = [
  { id: 1, usdtAmount: "10" },
  { id: 2, usdtAmount: "30" },
  { id: 3, usdtAmount: "100" },
  { id: 4, usdtAmount: "250" },
] as const;

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;

  console.log("Deploying with:", deployer.address);
  console.log("Treasury:", treasury);

  const usdtFactory = await ethers.getContractFactory("USDTTest");
  const usdt = await usdtFactory.deploy(deployer.address);
  await usdt.waitForDeployment();

  const usdtAddress = await usdt.getAddress();
  console.log("USDTTest:", usdtAddress);

  const shopFactory = await ethers.getContractFactory("Shop");
  const shop = await shopFactory.deploy(usdtAddress, treasury, deployer.address);
  await shop.waitForDeployment();

  const shopAddress = await shop.getAddress();
  console.log("Shop:", shopAddress);

  for (const pkg of deployPackages) {
    const price = parseUnits(pkg.usdtAmount, 18);
    const tx = await shop.setPackage(pkg.id, price, true);
    await tx.wait();
    console.log(`Configured package ${pkg.id} => ${pkg.usdtAmount} USDT`);
  }

  const mintTx = await usdt.mint(deployer.address, parseUnits("1000000", 18));
  await mintTx.wait();
  console.log("Minted 1,000,000 USDTT to deployer");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
