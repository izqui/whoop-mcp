# WHOOP MCP Server - Development Context

This document captures the development context and decisions made while building the WHOOP MCP server.

## Project Overview

This is a Model Context Protocol (MCP) server that integrates with the WHOOP API v2, allowing LLMs to access sleep, recovery, and physiological cycle data from WHOOP devices.

## Architecture Decisions

### Technology Stack
- **xmcp**: Fast, type-safe MCP implementation (chosen for performance)
- **TypeScript**: Full type safety throughout the codebase
- **Passport OAuth2**: Industry-standard OAuth implementation
- **Express**: Temporary server for OAuth callback handling only

### Authentication Strategy
1. **OAuth Flow**: Uses WHOOP's OAuth2 implementation with authorization code flow
2. **Token Storage**: Local file storage (`.whoop-tokens.json`) for tokens
3. **Auto-refresh**: Tokens are automatically refreshed when near expiration (5-minute buffer)
4. **Scopes**: Requests all read scopes: `offline`, `read:profile`, `read:cycles`, `read:sleep`, `read:recovery`, `read:workout`

### API Client Design
- **Singleton Pattern**: Single instance of WhoopAPIClient to manage all API calls
- **Base URL**: Uses `/developer/v2` prefix (discovered through testing)
- **Error Handling**: Comprehensive error messages for 401, 404, 429, and 500 errors
- **Type Safety**: Full TypeScript interfaces for all API responses

## Key Implementation Details

### Token Management (`src/auth/token-validator.ts`)
- Automatically loads tokens from file when needed
- Checks token expiration with 5-minute buffer
- Refreshes tokens using refresh token
- Saves updated tokens back to file
- Clear error messages when authentication fails

### API Endpoints
All endpoints use the base URL: `https://api.prod.whoop.com/developer/v2`

1. **Sleep Endpoints**:
   - `/activity/sleep/{sleepId}` - Get sleep by UUID
   - `/cycle/{cycleId}/sleep` - Get sleep for a cycle

2. **Cycle Endpoints**:
   - `/cycle` - Get cycle collection (paginated)
   - `/cycle/{cycleId}` - Get specific cycle

3. **Recovery Endpoints**:
   - `/cycle/{cycleId}/recovery` - Get recovery for a cycle

### MCP Tools

1. **get-recent-cycles**:
   - Retrieves physiological cycles with strain data
   - Optional day range filtering
   - Calculates average strain across cycles
   - Converts kilojoules to calories for better understanding

2. **get-sleep-by-id**:
   - Takes a sleep UUID
   - Returns comprehensive sleep metrics
   - Formats time durations in human-readable format

3. **get-sleep-for-cycle**:
   - Takes a cycle ID
   - Returns the sleep associated with that cycle
   - Same formatting as get-sleep-by-id

4. **get-recovery-for-cycle**:
   - Takes a cycle ID
   - Returns recovery score, HRV, resting heart rate
   - Includes interpretation (Green/Yellow/Red)
   - Optional SpO2 and skin temperature data

### Data Formatting Decisions
- Times converted to locale strings for readability
- Durations shown in hours/minutes instead of milliseconds
- Percentages formatted with appropriate precision
- Temperature shown in both Celsius and Fahrenheit
- Recovery scores include color interpretation

## OAuth Implementation Details

### Auth Script (`scripts/auth.ts`)
1. Spins up Express server on port 3000
2. Uses passport-oauth2 for WHOOP OAuth
3. Includes express-session for state parameter support
4. Fetches user profile using v1 endpoint (still required during OAuth)
5. Saves tokens and shuts down server after success

### Important URLs
- Authorization: `https://api.prod.whoop.com/oauth/oauth2/auth`
- Token: `https://api.prod.whoop.com/oauth/oauth2/token`
- Profile (OAuth): `https://api.prod.whoop.com/developer/v1/user/profile/basic`
- Callback: `http://localhost:3000/auth/whoop/callback`

## Challenges & Solutions

### API Version Discovery
- **Problem**: Initial v2 endpoints returned 404
- **Solution**: Discovered `/developer` prefix requirement through testing

### OAuth Scopes
- **Problem**: Initial auth only had `read:profile`, causing 401 errors
- **Solution**: Added all necessary read scopes during authentication

### Session Support
- **Problem**: Passport OAuth2 requires session for state parameter
- **Solution**: Added express-session middleware to auth script

### Token Refresh
- **Problem**: Access tokens expire after 1 hour
- **Solution**: Implemented automatic refresh with 5-minute buffer

## File Structure
```
whoop-mcp/
├── src/
│   ├── api/
│   │   ├── types.ts        # TypeScript interfaces for API responses
│   │   └── whoop-client.ts # API client with request methods
│   ├── auth/
│   │   ├── index.ts        # Auth exports
│   │   └── token-validator.ts # Token management and validation
│   └── tools/              # MCP tool implementations
│       ├── get-recent-cycles.ts
│       ├── get-recovery-for-cycle.ts
│       ├── get-sleep-by-id.ts
│       └── get-sleep-for-cycle.ts
├── scripts/
│   ├── auth.ts             # OAuth authentication flow
│   └── refresh-token.ts    # Manual token refresh utility
└── dist/                   # Compiled output (gitignored)
```

## Security Considerations
- Client credentials stored in environment variables
- Tokens stored locally, never transmitted except to WHOOP
- `.whoop-tokens.json` is gitignored
- Clear instructions about credential security in README

## Testing Notes
- All tools tested with real WHOOP data
- Error handling verified for expired tokens, invalid IDs
- Token refresh mechanism confirmed working
- Rate limiting not encountered during development

## Future Improvements
- Add workout endpoints
- Implement webhook support
- Add rate limiting protection
- Support for multiple user accounts
- Token encryption at rest
- Add more comprehensive error recovery

## Transport Recommendations
- **STDIO**: Recommended for Claude Desktop (better performance)
- **HTTP**: Available for other integrations
- Both transports fully supported by xmcp

## Open Source Preparation
- Comprehensive README with setup instructions
- MIT License
- CONTRIBUTING.md with guidelines
- Example environment file
- Clear documentation for all tools
- Links to WHOOP developer documentation

## Key Commands
```bash
# Development
pnpm dev           # Run in development mode
pnpm build         # Build for production
pnpm auth          # Authenticate with WHOOP
pnpm refresh-token # Manually refresh tokens

# Usage
node dist/stdio.js  # Run STDIO server
node dist/http.js   # Run HTTP server
```

This MCP server provides a clean, type-safe interface to WHOOP data for LLMs, with robust error handling and automatic token management.