const fs = require('fs');
const MBNFT = artifacts.require("MBNFT");

module.exports = async function (deployer) {
  const startDate = Math.round(Date.now() / 1000);
  const endDate = startDate + 86400;
  console.log(7, startDate, endDate)
  await deployer.deploy(MBNFT,startDate, endDate);
  const MBNFTContract = await MBNFT.deployed()
  const MBNFTContractAddress = await MBNFTContract.address;
  console.log(11, MBNFTContractAddress)
};



// let config = `

// [
//   {
//     "token": "${tokenAddress}" ,
//     "name": "Collection 1"

//     }
// ]
//  `;

// let data = JSON.stringify(config);
// fs.writeFileSync('data.json', JSON.parse(data));
// console.log(35, data)