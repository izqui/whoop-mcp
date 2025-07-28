# WHOOP MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the WHOOP API. This server enables LLMs to retrieve sleep, recovery, and physiological cycle data from WHOOP.

## Features

- 🔐 **OAuth 2.0 Authentication** with automatic token refresh
- 😴 **Sleep Data**: Retrieve detailed sleep metrics by ID or cycle
- 🔄 **Cycle Data**: Access physiological cycles with strain and heart rate data
- 💪 **Recovery Data**: Get recovery scores, HRV, and readiness metrics
- 🚀 **Built with xmcp**: Fast, type-safe MCP implementation

## Prerequisites

- Node.js 20 or higher
- A WHOOP account
- WHOOP API credentials (Client ID and Secret)

## Getting WHOOP API Credentials

1. Visit the [WHOOP Developer Dashboard](https://developer.whoop.com/)
2. Create a new OAuth application
3. Set the redirect URI to: `http://localhost:3000/auth/whoop/callback`
4. Note your Client ID and Client Secret

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/whoop-mcp.git
cd whoop-mcp

# Install dependencies
pnpm install
# or npm install

# Build the project
pnpm build
# or npm run build
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Add your WHOOP credentials to `.env`:
```env
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
```

## Authentication

Before using the MCP server, you need to authenticate with WHOOP:

```bash
pnpm auth
```

This will:
1. Open a browser window for WHOOP OAuth login
2. Save your access and refresh tokens locally
3. Automatically refresh tokens when they expire

## Usage

### Using with Claude Desktop - STDIO Mode (Recommended)

STDIO mode is recommended for better performance and reliability.

1. Get the full path to your installation:
```bash
pwd  # Copy this path, e.g., /Users/yourname/projects/whoop-mcp
```

2. Add the server to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "whoop": {
      "command": "node",
      "args": ["/Users/yourname/projects/whoop-mcp/dist/stdio.js"],
      "env": {
        "WHOOP_CLIENT_ID": "your_client_id",
        "WHOOP_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Replace `/Users/yourname/projects/whoop-mcp` with your actual installation path.

### Using via HTTP Mode

For HTTP mode, start the server:

```bash
pnpm start
# or
node dist/http.js
```

The server will run on `http://localhost:3002/mcp`

For Claude Desktop HTTP configuration:
```json
{
  "mcpServers": {
    "whoop": {
      "url": "http://localhost:3002/mcp",
      "env": {
        "WHOOP_CLIENT_ID": "your_client_id",
        "WHOOP_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

See [xmcp HTTP transport documentation](https://xmcp.dev/docs#http-transport) for more details.

### Development Mode

```bash
pnpm dev
```

## Available Tools

### `get-recent-cycles`
Retrieves recent physiological cycles (days) with strain and heart rate data.

**Parameters:**
- `limit` (number, optional): Number of cycles to retrieve (1-25, default: 10)
- `days` (number, optional): Number of days to look back (1-30)

**Example:**
```
Get my last 7 days of WHOOP cycles
```

### `get-sleep-by-id`
Gets detailed sleep data for a specific sleep ID.

**Parameters:**
- `sleepId` (string): UUID of the sleep activity

**Example:**
```
Get sleep data for ID ecfc6a15-4661-442f-a9a4-f160dd7afae8
```

### `get-sleep-for-cycle`
Retrieves sleep data associated with a specific cycle.

**Parameters:**
- `cycleId` (number): ID of the cycle

**Example:**
```
Get sleep data for cycle 12345
```

### `get-recovery-for-cycle`
Gets recovery metrics for a specific cycle, including HRV and readiness scores.

**Parameters:**
- `cycleId` (number): ID of the cycle

**Example:**
```
Get recovery data for cycle 12345
```

## Data Interpretation

### Recovery Scores
- **Green (67-100%)**: Ready for high strain
- **Yellow (34-66%)**: Moderate readiness  
- **Red (0-33%)**: Focus on recovery

### Strain Scale
- WHOOP Strain is measured on a scale from 0 to 21
- Higher values indicate greater cardiovascular load

## Project Structure

```
whoop-mcp/
├── src/
│   ├── api/           # WHOOP API client and types
│   ├── auth/          # Authentication and token management
│   └── tools/         # MCP tool implementations
├── scripts/
│   ├── auth.ts        # OAuth authentication script
│   └── refresh-token.ts # Manual token refresh
└── dist/              # Compiled output
```

## Token Management

- Tokens are stored in `.whoop-tokens.json` (git-ignored)
- Access tokens expire after 1 hour
- Refresh tokens are automatically used to obtain new access tokens
- Run `pnpm refresh-token` to manually refresh tokens

## Troubleshooting

### "Not authenticated" error
Run `pnpm auth` to authenticate with WHOOP.

### "Resource not found" error
Ensure your WHOOP app has the required scopes:
- `read:cycles`
- `read:sleep` 
- `read:recovery`
- `read:profile`
- `offline` (for refresh tokens)

### Rate limiting
WHOOP API has rate limits. If you encounter 429 errors, wait before making more requests.

## Development

```bash
# Build the project
pnpm build

# Run in development mode
pnpm dev

# Manually refresh tokens
pnpm refresh-token
```

## Security Notes

- Never commit `.env` or `.whoop-tokens.json`
- Keep your Client Secret secure
- Tokens are stored locally and never transmitted except to WHOOP

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - See LICENSE file for details

## Acknowledgments

- Built with [xmcp](https://github.com/zerdos/xmcp) - Fast MCP implementation
- Uses the [WHOOP API v2](https://developer.whoop.com/api)

## Additional Resources

- [xmcp Documentation - Using Tools](https://xmcp.dev/docs#using-tools)
- [xmcp Documentation](https://xmcp.dev/docs)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)

## Support

For WHOOP API issues, visit the [WHOOP Developer Documentation](https://developer.whoop.com/docs/developing-your-app).

For MCP-related questions, see the [Model Context Protocol documentation](https://modelcontextprotocol.io/).
