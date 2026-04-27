# @agentstack/framework

Multi-tenant primitives for AI agents built with [Mastra](https://mastra.ai).

This is the **runtime** piece of [agentstack](https://github.com/agentpilled/agentstack). For the meta-tooling (skills, lenses, iron laws), see the parent repository.

## Install

```bash
pnpm add @agentstack/framework @mastra/core
```

You also need Node.js ≥ 22.13.

## What you get

```ts
import {
  buildAgentConfig,        // compose CONTEXT.md + role.md into an agent system prompt
  loadCompanyContext,      // read companies/<slug>/CONTEXT.md from disk
  companyMemory,           // wrap a Mastra Memory in per-company scoping
  companyThreadId,         // build thread IDs scoped to a company
  companyResourceId,       // build resource IDs scoped to a company
  companyRagNamespace,     // build RAG vector namespaces scoped to a company
} from '@agentstack/framework'

import { piiLeak } from '@agentstack/framework/scorers'
```

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
import { buildAgentConfig, companyMemory } from '@agentstack/framework'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/core/memory'

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

v0.1 ships one canonical scorer:

- **`piiLeak`** — strict regex-based detector for emails, phones, SSNs, credit cards. Fails on any leak.

Voice and policy scorers are not in v0.1 because Iron Law 7 forbids shipping voice scorers without golden samples and a proper LLM-judge implementation. Bring your own; future versions will add them as the patterns stabilize from real builds (`/agentstack-learn`).

## Versioning

Pre-1.0. Breaking changes are possible at minor versions until 1.0. Each release notes them in [CHANGELOG.md](https://github.com/agentpilled/agentstack/blob/main/CHANGELOG.md).

## License

MIT.
