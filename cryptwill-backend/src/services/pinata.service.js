const PinataSDK = require('@pinata/sdk');

let pinataClient;

function getPinata() {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
    return null;
  }
  if (!pinataClient) {
    pinataClient = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
  }
  return pinataClient;
}

async function uploadBuffer(buffer, filename) {
  try {
    const pinata = getPinata();
    if (!pinata) {
      console.warn('[pinata] No API keys configured, using demo IPFS hash');
      return `demo-ipfs-${Date.now()}`;
    }
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
    if (!pinata) return null;
    return pinata.unpin(ipfsHash);
  } catch (err) {
    console.warn('[pinata] unpin failed:', err.message);
    return null;
  }
}

module.exports = { uploadBuffer, unpinFile };
