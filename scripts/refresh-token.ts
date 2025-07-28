import { TokenValidator } from '../src/auth/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function refreshToken() {
  console.log('Loading current tokens...');
  const tokenData = await TokenValidator.loadTokens();
  
  if (!tokenData) {
    console.error('No tokens found. Please run "pnpm auth" first.');
    process.exit(1);
  }

  console.log('Current token expires at:', new Date(tokenData.expiresAt).toISOString());
  console.log('Attempting to refresh token...');
  
  const success = await TokenValidator.refreshAccessToken();
  
  if (success) {
    const updatedTokenData = await TokenValidator.loadTokens();
    console.log('Token refreshed successfully!');
    console.log('New token expires at:', new Date(updatedTokenData!.expiresAt).toISOString());
  } else {
    console.error('Failed to refresh token. You may need to re-authenticate with "pnpm auth".');
    process.exit(1);
  }
}

refreshToken().catch(console.error);