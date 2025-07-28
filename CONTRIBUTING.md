# Contributing to WHOOP MCP Server

Thank you for your interest in contributing to the WHOOP MCP Server! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

- Check if the issue already exists in the GitHub issues
- Provide a clear description of the problem
- Include steps to reproduce the issue
- Mention your environment (Node version, OS, etc.)

### Suggesting Features

- Open an issue with the "enhancement" label
- Clearly describe the feature and its use case
- Explain how it would benefit users

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass (`pnpm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/whoop-mcp.git
cd whoop-mcp

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Add your WHOOP credentials

# Run in development mode
pnpm dev
```

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable and function names

## Adding New Tools

When adding new MCP tools:

1. Create a new file in `src/tools/`
2. Follow the existing tool structure:
   - Export `schema` for parameters
   - Export `metadata` for tool info
   - Export default function for implementation
3. Add TypeScript types to `src/api/types.ts` if needed
4. Update the README with tool documentation

Example:
```typescript
export const schema = {
  // Parameter definitions
};

export const metadata: ToolMetadata = {
  name: 'tool-name',
  description: 'Tool description',
  // ...
};

export default async function toolName(params: InferSchema<typeof schema>) {
  // Implementation
}
```

## Testing

- Test your changes with real WHOOP data when possible
- Ensure error handling works correctly
- Verify token refresh functionality

## Documentation

- Update the README for new features
- Add JSDoc comments for new functions
- Include examples in documentation

## Questions?

Feel free to open an issue for any questions about contributing!