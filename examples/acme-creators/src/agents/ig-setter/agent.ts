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

import { escalateSilently } from './tools/escalate-silently.js'
import { getLead } from './tools/get-lead.js'
import { sendCalendly } from './tools/send-calendly.js'
import { upsertLead } from './tools/upsert-lead.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROLE = readFileSync(resolve(HERE, 'role.md'), 'utf-8')

const config = await buildAgentConfig({
  company: 'acme-creators',
  id: 'ig-setter',
  name: 'acme-creators · IG Setter',
  role: ROLE,
  model: 'anthropic/claude-sonnet-4-6',
  baseDir: resolve(HERE, '../../..'),
})

const memory = companyMemory({
  company: 'acme-creators',
  memory: new Memory({
    /* Configure storage / vector / embedder per Mastra docs.
       In dev: LibSQL file storage. In prod: Postgres + pgvector. */
  }),
})

export const igSetterAgent = new Agent({
  ...config,
  memory,
  tools: {
    get_lead: getLead,
    upsert_lead: upsertLead,
    send_calendly: sendCalendly,
    escalate_silently: escalateSilently,
  },
})

// Helpers used by the webhook receiver in src/main.ts when invoking the agent:
//   const threadId = companyThreadId('acme-creators', `dm-${ig_user_id}`)
//   const resourceId = companyResourceId('acme-creators', ig_user_id)
export { companyResourceId, companyThreadId }
