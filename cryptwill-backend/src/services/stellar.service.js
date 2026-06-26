const StellarSdk = require('stellar-sdk');

const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const POOL_PUBLIC = process.env.POOL_WALLET_PUBLIC || 'GCPZMR6HRLDUCRMXJZBTUL4ZMWIVDBO7VHZHZEDQOTWA7FMR6D2AAISR';
const POOL_SECRET = process.env.POOL_WALLET_SECRET || 'SCBYDUBHAXKDPIET7RPBCU4ELAMLXNV4U7AKYWBM3BH3VB4GCUNCU62V';

const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const networkPassphrase = NETWORK === 'testnet'
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

const poolKeypair = StellarSdk.Keypair.fromSecret(POOL_SECRET);

async function submitMicroTransaction(ownerPublicKey) {
  try {
    const sourceAccount = await server.loadAccount(ownerPublicKey);
    const fee = await server.fetchBaseFee();

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: POOL_PUBLIC,
        asset: StellarSdk.Asset.native(),
        amount: '0.0001',
      }))
      .addMemo(StellarSdk.Memo.text('CryptWill Check-In'))
      .setTimeout(30)
      .build();

    // Note: In production, this would be signed by the user's Freighter wallet
    // For the pool wallet instant check-in path, pool signs
    transaction.sign(poolKeypair);
    const result = await server.submitTransaction(transaction);
    return { txHash: result.hash };
  } catch (err) {
    console.error('[submitMicroTransaction]', err.message);
    throw err;
  }
}

async function poolWalletMicroTransaction(ownerPublicKey) {
  try {
    const sourceAccount = await server.loadAccount(POOL_PUBLIC);
    const fee = await server.fetchBaseFee();

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: ownerPublicKey || POOL_PUBLIC,
        asset: StellarSdk.Asset.native(),
        amount: '0.0001',
      }))
      .addMemo(StellarSdk.Memo.text('CryptWill Instant Check-In'))
      .setTimeout(30)
      .build();

    transaction.sign(poolKeypair);
    const result = await server.submitTransaction(transaction);
    return { txHash: result.hash };
  } catch (err) {
    console.error('[poolWalletMicroTransaction]', err.message);
    throw err;
  }
}

async function mintProofOfLifeToken(ownerPublicKey, contractId) {
  try {
    const tokenCode = `POL${Date.now().toString(36).toUpperCase()}`;
    const asset = new StellarSdk.Asset(tokenCode.slice(0, 12), POOL_PUBLIC);
    const sourceAccount = await server.loadAccount(POOL_PUBLIC);
    const fee = await server.fetchBaseFee();

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset,
        source: POOL_PUBLIC,
      }))
      .addOperation(StellarSdk.Operation.payment({
        destination: POOL_PUBLIC,
        asset,
        amount: '1',
      }))
      .addMemo(StellarSdk.Memo.text(`POL:${contractId.slice(0, 20)}`))
      .setTimeout(30)
      .build();

    tx.sign(poolKeypair);
    const result = await server.submitTransaction(tx);
    return { tokenId: tokenCode, txHash: result.hash };
  } catch (err) {
    console.error('[mintProofOfLifeToken]', err.message);
    return { tokenId: `POL-${Date.now()}`, txHash: null };
  }
}

async function deployContract({ ownerWallet, guardianAddresses, quorum, intervalDays }) {
  // In production, this would deploy a Soroban contract via RPC
  // For demo, we record on-chain metadata via transaction memo
  try {
    const sourceAccount = await server.loadAccount(POOL_PUBLIC);
    const fee = await server.fetchBaseFee();
    const memo = `CW:DEPLOY:${quorum}:${intervalDays}d`;

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: ownerWallet || POOL_PUBLIC,
        asset: StellarSdk.Asset.native(),
        amount: '0.0001',
      }))
      .addMemo(StellarSdk.Memo.text(memo.slice(0, 28)))
      .setTimeout(30)
      .build();

    tx.sign(poolKeypair);
    const result = await server.submitTransaction(tx);
    return { contractAddress: `CTEST${result.hash.slice(0, 20).toUpperCase()}`, txHash: result.hash };
  } catch (err) {
    console.error('[deployContract stellar]', err.message);
    const mockHash = `demo${Date.now().toString(36)}`;
    return { contractAddress: `CTEST${mockHash.toUpperCase()}`, txHash: mockHash };
  }
}

async function executeTransfer({ fromWallet, toWallet, amount, asset }) {
  try {
    const sourceAccount = await server.loadAccount(POOL_PUBLIC);
    const fee = await server.fetchBaseFee();

    const stellarAsset = asset === 'XLM' ? StellarSdk.Asset.native() : StellarSdk.Asset.native();

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: toWallet,
        asset: stellarAsset,
        amount: amount.toString(),
      }))
      .addMemo(StellarSdk.Memo.text('CryptWill Inheritance Transfer'))
      .setTimeout(30)
      .build();

    tx.sign(poolKeypair);
    const result = await server.submitTransaction(tx);
    return { txHash: result.hash };
  } catch (err) {
    console.error('[executeTransfer]', err.message);
    throw err;
  }
}

module.exports = { submitMicroTransaction, poolWalletMicroTransaction, mintProofOfLifeToken, deployContract, executeTransfer };
