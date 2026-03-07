# Attio MCP Server

A high-performance Model Context Protocol (MCP) server that provides seamless access to the Attio API, enabling AI assistants like Claude and Cursor to interact with your Attio workspace through human-readable tools.

Supports both **remote HTTP mode** (cloud-hosted, multi-user) and **local stdio mode**.

## Features

- **🌐 Remote HTTP Mode**: Host as a cloud service — each user provides their own Attio API key via headers
- **🏷️ Human-Readable Tool Names**: Automatically transforms technical API names (like `getv2objects`) into clear, categorized names (like `list_objects`)
- **📊 Full API Coverage**: Access to objects, records, attributes, lists, tasks, notes, and more
- **📁 Organized by Category**: Tools are grouped into logical categories for easy navigation
- **🤖 AI Assistant Ready**: Works seamlessly with Claude Desktop and Cursor
- **⚡ High Performance**: Built with Bun for fast execution and native TypeScript support

## Remote HTTP Mode (Cloud-Hosted)

Host the server on any platform (DigitalOcean, Railway, Fly.io, etc.) and connect from anywhere. Each user provides their own Attio API key via request headers.

### Deploy

```bash
bun install
bun run build
bun run start
# Server runs at http://localhost:3000/mcp
```

**DigitalOcean App Platform** — connect the repo, set build command to `bun run build` and run command to `bun run start`. The server reads `PORT` from the environment automatically.

### Connect from Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "attio": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-app.ondigitalocean.app/mcp",
        "--header",
        "x-attio-token: YOUR_ATTIO_API_KEY"
      ]
    }
  }
}
```

Get your Attio API key from: https://app.attio.com/settings/api

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST, GET, DELETE | MCP Streamable HTTP transport |
| `/health` | GET | Health check (returns server status) |

### Authentication

Pass your Attio API key in either header:
- `x-attio-token: YOUR_KEY`
- `Authorization: Bearer YOUR_KEY`

The key is required on the initial `initialize` request and is stored for the duration of the session.

## Local stdio Mode

For local-only use (single user, token in `.env`).

### Quick Start

1. **Install Bun:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install and build:**
   ```bash
   bun install
   bun run build
   ```

3. **Add your Attio access token to `.env`:**
   ```
   ATTIO_ACCESS_TOKEN=your_token_here
   ```

4. **Configure Claude Desktop / Cursor** to use the stdio server:
   ```json
   {
     "mcpServers": {
       "attio": {
         "command": "node",
         "args": ["/path/to/attio-mcp-server/build/stdio.js"]
       }
     }
   }
   ```

Or use the install scripts: `./install-claude.sh` or `./install-cursor.sh`

## Available Tools

The MCP server exposes all Attio API endpoints as tools with human-readable names, organized by category:

### Core Data Management
- **Objects**: `list_objects`, `create_object`, `get_object`, `update_object`
- **Records**: `list_records`, `create_record`, `query_records`, `delete_record`
- **Attributes**: `list_attributes`, `create_attribute`, `update_attribute_status`

### Lists & Entries
- **Lists**: `list_lists`, `create_list`, `update_list`
- **List Entries**: `create_list_entry`, `query_list_entries`, `update_list_entry`

### Collaboration
- **Tasks**: `list_tasks`, `create_task`, `update_task`, `delete_task`
- **Notes**: `list_notes`, `create_note`, `get_note`, `delete_note`
- **Comments**: `create_comment`, `get_comment`, `list_comment_threads`

### Administration
- **Workspace**: `list_workspace_members`, `get_workspace_member`
- **Webhooks**: `list_webhooks`, `create_webhook`, `update_webhook`
- **Authentication**: `get_current_user`

## Manual Testing

To test the server directly:

```bash
bun start
```

## Configuration

The server uses the following environment variables:

- `ATTIO_ACCESS_TOKEN`: Your Attio workspace access token (required)
- `PORT`: Port for web transport (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)

## Troubleshooting

1. **Server not showing in Claude/Cursor:**
   - Restart the application after installation
   - Check the logs for any errors
   - Ensure the server is built: `bun run build`

2. **Authentication errors:**
   - Verify your access token in `.env`
   - Ensure the token has the necessary permissions

3. **Build errors:**
   - Run `bun install` to ensure all dependencies are installed
   - Run `bun run build` to compile TypeScript

## Development

To modify the server:

1. Edit `src/index.ts`
2. Run `bun run build`
3. Test with `bun test`
4. Restart Claude/Cursor to load changes

### Development Commands

```bash
# Install dependencies
bun install

# Build the server
bun run build

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Format and lint code
bun run check

# Manual testing
bun run test:manual
```

## Support

For issues with:
- **This MCP server**: Create an issue in this repository
- **Attio API**: Contact support@attio.com
- **MCP Protocol**: Visit https://modelcontextprotocol.io

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the MIT License.

---

<div align="center">
<sub>Built with ❤️ for the AI community</sub>
</div>
