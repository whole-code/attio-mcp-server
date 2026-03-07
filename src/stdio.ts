#!/usr/bin/env node
import { main } from './index.js';

process.on('SIGINT', () => {
  console.error('Shutting down MCP server...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.error('Shutting down MCP server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error in main execution:', error);
  process.exit(1);
});
