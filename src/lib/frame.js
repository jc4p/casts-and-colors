const TIMEOUT = 10000;

console.log('Frame connection code loaded')
;
async function waitForDOMContentLoaded() {
  console.log('Waiting for DOM content loaded');
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        resolve();
      });
    }
  });
}

async function waitForFrameSDK() {
  console.log('Waiting for Frame SDK initialized');
  return new Promise((resolve, reject) => {
    const checkSDK = () => {
      if (window.frame?.sdk) {
        console.log('Frame SDK initialized');
        resolve();
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    setTimeout(() => reject(new Error('Frame SDK initialization timeout')), TIMEOUT);
    checkSDK();
  });
}

async function waitForUser() {
  console.log('Waiting for user');
  return new Promise((resolve, reject) => {
    const checkUser = () => {
      console.log('Checking user');
      if (window.frame?.sdk?.context?.user) {
        console.log('User found');
        resolve(window.frame.sdk.context.user);
      } else {
        setTimeout(checkUser, 100);
      }
    };
    setTimeout(() => reject(new Error('User context timeout')), TIMEOUT);
    checkUser();
  });
}

export async function initializeFrame() {
  console.log('Initializing Frame');
  if (typeof window === 'undefined') return;

  try {
    // Wait for DOM to be ready
    await waitForDOMContentLoaded();
    console.log('DOM Content Loaded');

    // Wait for Frame SDK initialization
    await waitForFrameSDK();
    console.log('Frame SDK Initialized');
    // Wait for user context
    const user = await waitForUser();

    console.log('User:', user);

    if (!user || !user.fid) {
      console.log('User not found');
      return;
    }

    // Store user info
    window.userFid = user.fid;
    window.userName = user.username || 'Anonymous';
    console.log('User Info:', { fid: window.userFid, username: window.userName });

    // Initialize Frame SDK
    if (window.frame?.sdk?.actions?.ready) {
      console.log('Calling ready');
      await window.frame.sdk.actions.ready();
      console.log('Frame SDK ready');
    }

    console.log('Switching to Base');

    // Switch to Base
    try {
      await window.frame.sdk.wallet.ethProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }] // Base mainnet chainId
      });
      console.log('Successfully switched to Base');
    } catch (switchError) {
      console.error('Error switching to Base:', switchError);
      return
    }

    console.log('Checking network');

    // Check which network we're on
    const chainId = await window.frame.sdk.wallet.ethProvider.request({
        method: 'eth_chainId'
    });
    console.log('Connected to network with chainId:', chainId);

    // Verify we're on Base (chainId 8453 / 0x2105)
    const chainIdDecimal = typeof chainId === 'number' ? chainId : parseInt(chainId, 16);
    if (chainIdDecimal !== 8453) {
        console.error(`Please connect to Base Mainnet. Current network: ${chainIdDecimal} (${chainId})`);
        return;
    }

    console.log('Network verified');

  } catch (error) {
    console.error('Frame initialization error:', error);
  }
}

export async function mintColor(color) {
  console.log('Minting color:', color);

  if (!color) {
    throw new Error('Color is required for minting');
  }

  try {
    const loggedInWallet = await window.frame.sdk.wallet.ethProvider.request({
      method: 'eth_requestAccounts'
    });

    if (!loggedInWallet || loggedInWallet.length === 0) {
      throw new Error('No wallet accounts available');
    }

    const userAddress = loggedInWallet[0];
    console.log('User address:', userAddress);

    const contractAddress = '0x7Bc1C072742D8391817EB4Eb2317F98dc72C61dB';
    const colorName = `Color ${color}`;

    // Create transaction
    const txData = {
      method: 'eth_sendTransaction',
      params: [{
        to: contractAddress,
        from: userAddress,
        data: `0x${
          // mint(string,string,address)
          '6a627842' + 
          // Encode color parameter
          '0000000000000000000000000000000000000000000000000000000000000060' +
          // Encode name parameter
          '00000000000000000000000000000000000000000000000000000000000000a0' +
          // Encode recipient address parameter
          userAddress.slice(2).padStart(64, '0') +
          // Encode color string length and data
          '0000000000000000000000000000000000000000000000000000000000000007' +
          Buffer.from(color).toString('hex').padEnd(64, '0') +
          // Encode name string length and data
          '000000000000000000000000000000000000000000000000000000000000000d' +
          Buffer.from(colorName).toString('hex').padEnd(64, '0')
        }`,
        value: '0x0'
      }]
    };

    console.log('Sending transaction...');
    const txHash = await window.frame.sdk.wallet.ethProvider.request(txData);
    console.log('Transaction hash:', txHash);
    
    return txHash;
  } catch (error) {
    console.error('Minting error:', error);
    throw new Error(error.message || 'Failed to mint color');
  }
}