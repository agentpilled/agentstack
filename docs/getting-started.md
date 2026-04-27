# Getting started

A 10-minute walkthrough from zero to a working agent for your first client. By the end you will have:

- Claude Code with the agentstack skills installed
- A fresh agency repo
- One company with `CONTEXT.md` filled in
- One agent that runs against that context

## Prerequisites

- **Node.js ≥ 22.13.** `node --version` to check.
- **pnpm.** `npm i -g pnpm` if missing.
- **Claude Code.** Install from <https://docs.anthropic.com/en/docs/claude-code>.
- **Git.** For commits.
- **An Anthropic or OpenAI API key.** You'll add it to `.env` later.

## 1. Install the agentstack skills (30 seconds)

The skills are what make the slash commands (`/agentstack-new-company`, `/agentstack-autoplan`, etc.) appear inside Claude Code.

```bash
git clone https://github.com/agentpilled/agentstack.git ~/agentstack
cd ~/agentstack && bash setup/install.sh
```

That copies eight skills into `~/.claude/skills/agentstack-*`. **Restart Claude Code** (or open a new project) so it picks them up.

Verify in Claude Code:

```
> /agentstack-validate
```

If `/agentstack-*` commands show up in the autocomplete, you're good.

## 2. Scaffold your agency (1 minute)

```bash
pnpm create agentstack my-agency
cd my-agency
pnpm install
cp .env.example .env
```

Open `.env` and fill in at least one provider key (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`).

What you got:

```
my-agency/
├── package.json            # workspace root, lists @agentstack/framework
├── pnpm-workspace.yaml     # packages: ["companies/*"]
├── tsconfig.json
├── .env / .env.example
├── .gitignore
├── README.md
├── CLAUDE.md               # agency repo conventions for Claude
└── companies/              # (empty — about to fill it)
```

## 3. Onboard your first company (3 minutes)

Open Claude Code in `my-agency/`, then:

```
> /agentstack-new-company acme-creators
```

The skill interviews you about industry, voice, policies, glossary, and integrations, then writes:

- `companies/acme-creators/CONTEXT.md` — brand, voice, policies, glossary
- `companies/acme-creators/INTEGRATIONS.md` — external systems, env keys, retry budgets
- `companies/acme-creators/.env.example` — keys this client needs

If you'd rather see what a finished CONTEXT looks like before doing your own, copy the canonical example:

```bash
cp -r ~/agentstack/examples/acme-creators companies/
```

## 4. Build your first agent (5 minutes)

```
> /agentstack-new-agent acme-creators/setter
```

Same pattern: interview, then scaffold:

- `companies/acme-creators/agents/setter/role.md` — what this specific agent does
- `companies/acme-creators/agents/setter/agent.ts` — Mastra `Agent` wired with `buildAgentConfig` + `companyMemory`
- `companies/acme-creators/agents/setter/tools/` — placeholder tools

The generated `agent.ts` looks like this — note how `buildAgentConfig` composes the company `CONTEXT.md` into the prompt automatically:

```ts
import { buildAgentConfig, companyMemory } from '@agentstack/framework'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
// ...

const config = await buildAgentConfig({
  company: 'acme-creators',
  id: 'setter',
  name: 'acme-creators · Setter',
  role: ROLE,
  model: 'anthropic/claude-sonnet-4-6',
})

export const setterAgent = new Agent({
  ...config,
  memory: companyMemory({
    company: 'acme-creators',
    memory: new Memory(/* your Mastra config */),
  }),
  tools: { /* … */ },
})
```

## 5. Validate (30 seconds)

```
> /agentstack-validate
```

This runs the eight Iron Laws against your repo and flags anything that drifts: cross-company imports, missing `CONTEXT.md`, voice scorers without golden samples, agents that didn't go through `buildAgentConfig`. A clean run is the bar for shipping.

## 6. Run the agent (2 minutes)

`pnpm build` to compile, then wire `setterAgent` into your existing Mastra runtime — webhook, CLI, queue worker, whatever. Quick smoke test:

```ts
import { setterAgent } from './companies/acme-creators/agents/setter/agent.js'
import { companyThreadId, companyResourceId } from '@agentstack/framework'

const result = await setterAgent.generate('hey, do you have anything for engineers?', {
  threadId: companyThreadId('acme-creators', 'dm-12345'),
  resourceId: companyResourceId('acme-creators', '12345'),
})
console.log(result.text)
```

The thread and resource IDs are scoped to `acme-creators` — convention 5 in action. Memory and RAG never leak across clients.

## What's next

- **Add a second client.** `/agentstack-new-company` again. Watch how everything stays scoped — that's the wedge.
- **Run the killer demo.** `/agentstack-autoplan setter for acme-creators` runs four-lens review → auto-decisions → drafts. ~12 minutes from spec to PR.
- **Replay golden inputs.** `/agentstack-qa acme-creators/setter` scores against fixtures.
- **Ship.** `/agentstack-ship-agent acme-creators/setter` opens a PR with each lens's review attached.

## Read next

- [`SKILL.md`](../SKILL.md) — the six conventions
- [`IRON-LAWS.md`](../IRON-LAWS.md) — the eight invariants nothing ships without
- [`lenses/`](../lenses/) — the four review personalities you'll meet in `/agentstack-plan-review`
- [`examples/acme-creators/`](../examples/acme-creators/) — a canonical company end-to-end
