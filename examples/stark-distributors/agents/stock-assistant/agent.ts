import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAgentConfig,
  companyMemory,
  companyResourceId,
  companyThreadId,
} from '@agentstack/framework'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/core/memory'

import { getWarehouseStock } from './tools/get-warehouse-stock.js'
import { listOpenShipments } from './tools/list-open-shipments.js'
import { searchProduct } from './tools/search-product.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROLE = readFileSync(resolve(HERE, 'role.md'), 'utf-8')

const config = await buildAgentConfig({
  company: 'stark-distributors',
  id: 'stock-assistant',
  name: 'stark-distributors · Stock Assistant',
  role: ROLE,
  // Haiku is fine for structured lookups; the agent doesn't need voice judgment
  // (Decision Principle 3).
  model: 'anthropic/claude-haiku-4-5',
  baseDir: resolve(HERE, '../../..'),
})

const memory = companyMemory({
  company: 'stark-distributors',
  memory: new Memory({
    /* Configure storage / vector / embedder per Mastra docs.
       In dev: LibSQL file storage. In prod: Postgres. */
  }),
})

export const stockAssistantAgent = new Agent({
  ...config,
  memory,
  tools: {
    search_product: searchProduct,
    get_warehouse_stock: getWarehouseStock,
    list_open_shipments: listOpenShipments,
  },
})

// Slack handler in src/main.ts uses these helpers when invoking the agent:
//   const threadId = companyThreadId('stark-distributors', `slack-${slack_thread_ts}`)
//   const resourceId = companyResourceId('stark-distributors', slack_user_id)
export { companyResourceId, companyThreadId }
