const PinataSDK = require('@pinata/sdk');

let pinataClient;

function getPinata() {
  if (!pinataClient) {
    pinataClient = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
  }
  return pinataClient;
}

async function uploadBuffer(buffer, filename) {
  try {
    const pinata = getPinata();
    const result = await pinata.pinFileToIPFS(buffer, { pinataMetadata: { name: filename } });
    return result.IpfsHash;
  } catch (err) {
    console.warn('[pinata] upload failed, using demo hash:', err.message);
    return `demo-ipfs-${Date.now()}`;
  }
}

async function unpinFile(ipfsHash) {
  try {
    const pinata = getPinata();
    return pinata.unpin(ipfsHash);
  } catch (err) {
    console.warn('[pinata] unpin failed:', err.message);
    return null;
  }
}

module.exports = { uploadBuffer, unpinFile };
