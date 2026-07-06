import { describe, expect, test } from 'bun:test';
import { toolDefinitionMap } from '../index.js';
import { transformToolName } from '../tool-name-transformer.js';

describe('Tool name uniqueness', () => {
  test('every tool definition transforms to a unique human-readable name', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const originalName of toolDefinitionMap.keys()) {
      const { humanReadableName } = transformToolName(originalName);
      const existing = seen.get(humanReadableName);
      if (existing) {
        collisions.push(`${humanReadableName} <- ${existing} AND ${originalName}`);
      }
      seen.set(humanReadableName, originalName);
    }

    expect(collisions).toEqual([]);
    expect(seen.size).toBe(toolDefinitionMap.size);
  });

  test('human-readable names are valid MCP tool names', () => {
    for (const originalName of toolDefinitionMap.keys()) {
      const { humanReadableName } = transformToolName(originalName);
      expect(humanReadableName).toMatch(/^[a-z0-9_]+$/);
    }
  });
});
