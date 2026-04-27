# stark-distributors / stock-assistant

Internal Slack-resident assistant for warehouse stock and shipment lookups.

## State

| Component | Status |
|---|---|
| `role.md` | Filled, ≤ 500 words |
| `agent.ts` | Composes CONTEXT via `buildAgentConfig`, uses `companyMemory`, model: Haiku |
| Tools | 3 read-only stubs with full zod schemas, `// TODO: implement` for runtime |
| Scorers | `answer_relevancy` (built-in), `pii_leak` (framework), `no_fabrication` (custom — flags invented SKUs) |
| Golden inputs | 2 in `evals/golden/` |

## Why no voice scorer

Internal-team agent with no brand voice to match. Iron Law 7 doesn't apply — there's nothing to score against. The CONTEXT voice ("internal, professional, fact-first") is enforced via `role.md` instructions and `tone_matches` is unnecessary at v0.1.

## Why all tools are read-only

This agent answers questions; it doesn't change state. Iron Law 6 (`requireApproval: true` for side effects) doesn't fire because there are none. If you add a tool that *writes* (e.g., "mark this SKU as low priority"), set `requireApproval: true` until a custom scorer validates outputs.

## To run

1. Copy this directory into a real agentstack agency repo's `companies/<slug>/src/agents/`
2. Implement each tool's `execute` against your warehouse API (env: `WAREHOUSE_API_URL`, `WAREHOUSE_API_KEY`)
3. Wire a Slack event subscription handler in `src/main.ts` that translates Slack messages into agent invocations
4. Register in `src/main.ts`:
   ```ts
   import { stockAssistantAgent } from './agents/stock-assistant/agent.js'
   ```
5. `/agentstack-validate --agent <slug>/stock-assistant`
6. `/agentstack-qa <slug>/stock-assistant`
7. `/agentstack-ship-agent <slug>/stock-assistant`
