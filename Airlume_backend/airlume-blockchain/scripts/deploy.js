const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying AirlumeData contract locally...\n");

  const AirlumeData = await hre.ethers.getContractFactory("AirlumeData");
  const airlumeData = await AirlumeData.deploy();
  
  await airlumeData.waitForDeployment();
  
  const address = await airlumeData.getAddress();
  
  console.log("✅ AirlumeData deployed to:", address);
  
  // Save contract address to a file
  const deploymentInfo = {
    contractAddress: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Copy ABI to root for easy access
  const artifactPath = path.join(__dirname, '../artifacts/contracts/AirlumeData.sol/AirlumeData.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  fs.writeFileSync(
    'contract_abi.json',
    JSON.stringify(artifact.abi, null, 2)
  );
  
  console.log("📝 Contract info saved to deployment-info.json");
  console.log("📝 ABI saved to contract_abi.json\n");
  
  // Display some contract info
  const totalReadings = await airlumeData.getTotalReadings();
  const owner = await airlumeData.owner();
  
  console.log("📊 Contract Info:");
  console.log("   Owner:", owner);
  console.log("   Total Readings:", totalReadings.toString());
  console.log("\n✨ Ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });