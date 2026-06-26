const { PinataSDK } = require('pinata');

let pinataClient;

function getPinata() {
  if (!pinataClient) {
    pinataClient = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: 'gateway.pinata.cloud',
    });
  }
  return pinataClient;
}

async function uploadBuffer(buffer, filename) {
  const pinata = getPinata();
  const file = new File([buffer], filename);
  const upload = await pinata.upload.file(file);
  return upload.IpfsHash;
}

async function unpinFile(ipfsHash) {
  const pinata = getPinata();
  return pinata.unpin([ipfsHash]);
}

module.exports = { uploadBuffer, unpinFile };
