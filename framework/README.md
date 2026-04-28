# agentstack-framework

Multi-tenant primitives for AI agents built with [Mastra](https://mastra.ai).

This is the **runtime** piece of [agentstack](https://github.com/agentpilled/agentstack). For the meta-tooling (skills, lenses, iron laws), see the parent repository.

## Install

```bash
pnpm add agentstack-framework @mastra/core
```

You also need Node.js ≥ 22.13.

## What you get

```ts
import {
  buildAgentConfig,        // compose CONTEXT.md + role.md (+ optional references) into a system prompt
  loadCompanyContext,      // read companies/<slug>/CONTEXT.md from disk
  companyMemory,           // wrap a Mastra Memory in per-company scoping
  companyThreadId,         // build thread IDs scoped to a company
  companyResourceId,       // build resource IDs scoped to a company
  companyRagNamespace,     // build RAG vector namespaces scoped to a company
} from 'agentstack-framework'

import { piiLeak, answerRelevancy, noFabrication, escalationHandled } from 'agentstack-framework/scorers'
```

### `buildAgentConfig` with reference docs

When the agent needs to know taxonomies, voice samples, product specs, or glossaries that don't belong in `CONTEXT.md`, pass them as `references`. They're spliced into the system prompt below CONTEXT + role:

```ts
const config = await buildAgentConfig({
  company: 'acme-creators',
  id: 'ig-setter',
  name: 'acme-creators · IG Setter',
  role: ROLE,
  references: [
    { label: 'Voice samples',           path: 'src/shared/rag/voice-samples.md' },
    { label: 'Classification criteria', path: 'src/shared/rag/criteria.md' },
  ],
})
```

`path` is resolved relative to `companies/<company>/`. Pass `content` instead if you've already loaded the string. `model` is optional — pass it here OR pass a real provider object directly to `new Agent({...config, model: openai('...')})`. Whichever you set last on the Agent wins.

And a CLI:

```bash
pnpm agentstack new company <slug>
pnpm agentstack new agent <company>/<agent-name>
```

## The contract

This package codifies five conventions out of the agentstack [SKILL.md](https://github.com/agentpilled/agentstack/blob/main/SKILL.md):

1. **Convention 1** — Read CONTEXT.md first → `loadCompanyContext`
2. **Convention 4** — Compose, don't paste → `buildAgentConfig`
3. **Convention 5** — Memory and RAG scoped by company → `companyMemory`, `companyRagNamespace`, `companyThreadId`, `companyResourceId`
4. **Convention 6** — Scaffold via CLI → `agentstack new ...`

Convention 2 (existing tools) and Convention 3 (no cross-company imports) are repository-level; see `/agentstack-validate`.

## Minimal example

```ts
// companies/acme-creators/src/agents/ig-setter/agent.ts
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAgentConfig, companyMemory } from 'agentstack-framework'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'

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

export const igSetterAgent = new Agent({
  ...config,
  memory: companyMemory({
    company: 'acme-creators',
    memory: new Memory(/* your Mastra config */),
  }),
  tools: {
    // ...
  },
})
```

## Scorers

Iron Law 2 demands ≥3 scorers per shipped agent. The framework gives you four built-in to compose with — pick the ones that fit your agent and add custom scorers per CONTEXT-specific policies on top.

| Scorer | Catches | Needs |
|---|---|---|
| **`piiLeak`** | Emails, phones, SSNs, credit cards in the output | output |
| **`answerRelevancy`** | Empty / too-short / refusal-pattern responses (heuristic, no LLM) | output |
| **`noFabrication`** | SKUs / order numbers / ticket numbers / UUIDs cited but not in context (Iron Law 4) | context + output |
| **`escalationHandled`** | Sparse context but agent answered confidently instead of escalating (Iron Law 4 complement) | context + output |

```ts
import { piiLeak, answerRelevancy, noFabrication, escalationHandled } from 'agentstack-framework/scorers'

const scorers = {
  pii_leak:            piiLeak({ allowlist: ['support@acme.com'] }),
  answer_relevancy:    answerRelevancy({ minLength: 30 }),
  no_fabrication:      noFabrication(),
  escalation_handled:  escalationHandled({ emptyContextThreshold: 80 }),
}
```

**What's NOT here (yet)**: voice and policy scorers. Iron Law 7 forbids shipping a voice scorer without golden samples and a real LLM-judge implementation. Same for policy scorers — they need an LLM judge to be useful, not a regex. Both land in v0.2 once the patterns stabilize from real builds (`/agentstack-learn`).

For now, write voice/policy scorers per-company in `companies/<slug>/src/agents/<agent>/evals/` — see `examples/acme-creators/` for the pattern.

## Versioning

Pre-1.0. Breaking changes are possible at minor versions until 1.0. Each release notes them in [CHANGELOG.md](https://github.com/agentpilled/agentstack/blob/main/CHANGELOG.md).

## License

MIT.
