import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAgentConfig,
  companyMemory,
  companyResourceId,
  companyThreadId,
} from 'agentstack-framework'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROLE = readFileSync(resolve(HERE, 'role.md'), 'utf-8')

// Agent file lives at companies/<slug>/src/agents/<agent>/agent.ts.
// Five levels up from HERE = agency root, where loadCompanyContext expects
// to find companies/<slug>/CONTEXT.md.
const config = await buildAgentConfig({
  company: '{{company}}',
  id: '{{agent}}',
  name: '{{company}} · {{agent}}',
  role: ROLE,
  model: 'anthropic/claude-sonnet-4-6',
  baseDir: resolve(HERE, '../../../../..'),
})

// Wire your Mastra Memory backend here. v0.1: bring your own.
const memory = companyMemory({
  company: '{{company}}',
  memory: new Memory({
    /* configure storage / vector / embedder per Mastra docs */
  }),
})

export const {{varName}}Agent = new Agent({
  ...config,
  memory,
  tools: {
    // Add agent-specific tools. Reuse from ../../shared/tools/ when possible.
  },
})

// Helpers for routing inbound requests:
//   const threadId = companyThreadId('{{company}}', conversationId)
//   const resourceId = companyResourceId('{{company}}', userId)
export { companyThreadId, companyResourceId }
