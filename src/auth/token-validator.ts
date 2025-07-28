import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config({ quiet: true});

// Use a consistent location for tokens regardless of where the script is run from
const getTokenFilePath = () => {
  // First, check if a custom path is set via environment variable
  if (process.env.WHOOP_TOKEN_FILE) {
    return process.env.WHOOP_TOKEN_FILE;
  }
  
  // Otherwise, use a consistent location in the user's home directory
  const configDir = path.join(os.homedir(), '.whoop-mcp');
  return path.join(configDir, 'tokens.json');
};

const TOKEN_FILE = getTokenFilePath();
const WHOOP_API_HOSTNAME = 'https://api.prod.whoop.com';
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  firstName?: string;
  lastName?: string;
}

export class TokenValidator {
  private static tokenData: TokenData | null = null;

  static async loadTokens(): Promise<TokenData | null> {
    try {
      const data = await fs.readFile(TOKEN_FILE, 'utf-8');
      this.tokenData = JSON.parse(data);
      return this.tokenData;
    } catch (error) {
      return null;
    }
  }

  static async saveTokens(tokenData: TokenData): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(TOKEN_FILE);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
    this.tokenData = tokenData;
  }

  static async refreshAccessToken(): Promise<boolean> {
    if (!this.tokenData?.refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set in .env file');
      return false;
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.tokenData.refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });

      const response = await fetch(`${WHOOP_API_HOSTNAME}/oauth/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to refresh token:', error);
        return false;
      }

      const data = await response.json();
      
      const updatedTokenData: TokenData = {
        ...this.tokenData,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.tokenData.refreshToken, // Some providers return new refresh token
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      await this.saveTokens(updatedTokenData);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  static async getValidToken(): Promise<string | null> {
    if (!this.tokenData) {
      await this.loadTokens();
    }

    if (!this.tokenData) {
      return null;
    }

    // Check if token is expired or will expire in the next 5 minutes
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    if (Date.now() >= this.tokenData.expiresAt - expiryBuffer) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        console.error('Failed to refresh token. Please run "pnpm auth" to re-authenticate.');
        return null;
      }
    }

    return this.tokenData.accessToken;
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return token !== null;
  }

  static async requireAuth(): Promise<string> {
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('Not authenticated. Please run "pnpm auth" to authenticate with WHOOP.');
    }
    return token;
  }

  static async getUserInfo(): Promise<Omit<TokenData, 'accessToken' | 'refreshToken'> | null> {
    if (!this.tokenData) {
      await this.loadTokens();
    }

    if (!this.tokenData) {
      return null;
    }

    const { accessToken, refreshToken, ...userInfo } = this.tokenData;
    return userInfo;
  }
}