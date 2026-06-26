import sss from 'shamir-secret-sharing';

// Wrap SSS functions to work with hex strings since encryption keys are hex

export const splitSecret = (secretHex, sharesCount, threshold) => {
  try {
    // Convert hex string to buffer
    const secretBuffer = Buffer.from(secretHex, 'hex');
    
    // Generate shares (returns Array of Buffers)
    const shares = sss.split(secretBuffer, { shares: sharesCount, threshold });
    
    // Convert share buffers to hex strings for easy storage/transmission
    return shares.map(share => share.toString('hex'));
  } catch (err) {
    console.error('Failed to split secret:', err);
    throw new Error('Failed to generate guardian shares');
  }
};

export const combineShares = (sharesHexArray) => {
  try {
    // Convert hex strings back to buffers
    const shareBuffers = sharesHexArray.map(hex => Buffer.from(hex, 'hex'));
    
    // Combine shares
    const recoveredBuffer = sss.combine(shareBuffers);
    
    // Convert back to hex string (the original key)
    return recoveredBuffer.toString('hex');
  } catch (err) {
    console.error('Failed to combine shares:', err);
    throw new Error('Could not recover key. Ensure you have enough valid shares.');
  }
};
