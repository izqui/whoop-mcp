import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();

// Use the same token file location as the main app
const getTokenFilePath = () => {
  if (process.env.WHOOP_TOKEN_FILE) {
    return process.env.WHOOP_TOKEN_FILE;
  }
  const configDir = path.join(os.homedir(), '.whoop-mcp');
  return path.join(configDir, 'tokens.json');
};

const WHOOP_API_HOSTNAME = 'https://api.prod.whoop.com';
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const CALLBACK_URL = 'http://localhost:3000/auth/whoop/callback';
const TOKEN_FILE = getTokenFilePath();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  firstName?: string;
  lastName?: string;
}

const whoopOAuthConfig = {
  authorizationURL: `${WHOOP_API_HOSTNAME}/oauth/oauth2/auth`,
  tokenURL: `${WHOOP_API_HOSTNAME}/oauth/oauth2/token`,
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  state: true,
  scope: ['offline', 'read:profile', 'read:cycles', 'read:sleep', 'read:recovery', 'read:workout'],
};

const saveTokens = async (tokenData: TokenData) => {
  // Ensure directory exists
  const dir = path.dirname(TOKEN_FILE);
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
  console.log(`\nTokens saved to ${TOKEN_FILE}`);
};

const fetchProfile = async (accessToken: string, done: any) => {
  try {
    const profileResponse = await fetch(
      `${WHOOP_API_HOSTNAME}/developer/v1/user/profile/basic`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();
    done(null, profile);
  } catch (error) {
    done(error);
  }
};

const getUser = async (
  accessToken: string,
  refreshToken: string,
  { expires_in }: { expires_in: number },
  profile: any,
  done: any
) => {
  try {
    const { first_name, last_name, user_id } = profile;

    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expires_in * 1000,
      userId: user_id,
      firstName: first_name,
      lastName: last_name,
    };

    await saveTokens(tokenData);
    done(null, tokenData);
  } catch (error) {
    done(error);
  }
};

const whoopAuthorizationStrategy = new OAuth2Strategy(whoopOAuthConfig, getUser);
whoopAuthorizationStrategy.userProfile = fetchProfile;

passport.use('withWhoop', whoopAuthorizationStrategy);

const app = express();
let server: any;

app.use(session({
  secret: 'whoop-mcp-auth-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 600000 // 10 minutes
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

app.get('/auth/whoop', passport.authenticate('withWhoop'));

app.get(
  '/auth/whoop/callback',
  passport.authenticate('withWhoop', { session: false }),
  (req, res) => {
    res.send(`
      <html>
        <body>
          <h1>Authentication Successful!</h1>
          <p>You can now close this window and return to your terminal.</p>
          <script>
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
    
    setTimeout(() => {
      console.log('\nAuthentication complete! You can now use the WHOOP MCP server.');
      server.close();
      process.exit(0);
    }, 1000);
  }
);

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Authentication error:', err);
  res.status(500).send('Authentication failed. Please check your credentials and try again.');
  setTimeout(() => {
    server.close();
    process.exit(1);
  }, 1000);
});

const PORT = 3000;

server = app.listen(PORT, () => {
  console.log(`\nAuthentication server started on http://localhost:${PORT}`);
  console.log(`\n=== IMPORTANT ===`);
  console.log(`Make sure your WHOOP OAuth app has this redirect URI configured:`);
  console.log(`${CALLBACK_URL}`);
  console.log(`=================\n`);
  console.log(`Please visit the following URL to authenticate with WHOOP:`);
  console.log(`http://localhost:${PORT}/auth/whoop`);
  console.log(`\nWaiting for authentication...`);
});