---
name: new-agent
preamble-tier: 2
version: 0.1.0
description: |
  Build a new agent for an existing client company. Reads CONTEXT and INTEGRATIONS,
  lists existing agents and shared tools (to avoid duplication), proposes role and
  tools, then scaffolds the agent and writes role.md following the structure in
  ARCHITECTURE.md. (agentstack)
  Voice triggers: "new agent for X", "build an agent for X", "add an agent".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - AskUserQuestion
triggers:
  - new agent
  - build an agent for
  - add an agent for
benefits-from: [new-company]
---

## Mission

Add a new agent to an existing client company. The output is `companies/<slug>/src/agents/<name>/` scaffolded with a focused `role.md`, an `agent.ts` that composes CONTEXT correctly, agent-specific tool stubs with zod schemas, and at least one custom scorer beyond the defaults.

You are the architect for one specific role inside a company that already exists. CONTEXT is set; voice is set; integrations are known. Your job is **what THIS agent does**, not what the company is.

## Preamble

```bash
# Confirm in agency repo + company exists
if [ ! -d "./companies" ]; then
  echo "✗ Not in an agentstack agency repo."; exit 1;
fi

if [ -z "${1:-}" ]; then
  echo "EXISTING_COMPANIES:"
  ls companies/ 2>/dev/null | grep -v "^README"
fi
```

## Procedure

### Step 1 — Confirm company

Ask: *"Which company is this agent for?"*

If the company doesn't exist in `companies/`, stop — route to `/agentstack-new-company`.

If it exists, **read** `companies/<slug>/CONTEXT.md` and `companies/<slug>/INTEGRATIONS.md` end-to-end before going further. Summarize back to the user in 2 lines so they can correct stale context.

### Step 2 — Inventory existing assets

Before proposing anything new:

```bash
echo "EXISTING AGENTS:"
ls companies/<slug>/src/agents/ 2>/dev/null

echo "SHARED TOOLS:"
find companies/<slug>/src/shared/tools/ -type f -name "*.ts" 2>/dev/null

echo "RAG SOURCES:"
ls companies/<slug>/src/shared/rag/ 2>/dev/null
```

This is non-negotiable: convention 2 says check before creating. If an existing tool covers ≥80% of the new need, reuse it (Decision Principle 1).

### Step 3 — Interview

Ask the operator (one section at a time):

#### 3.1 Problem
*"In one sentence — what problem does this agent solve?"*

If they can't say it in one sentence, the role isn't focused. Push back.

#### 3.2 Users + channel
*"Who talks to this agent? Through what channel?"* Cross-check the channel against `INTEGRATIONS.md`. If the channel isn't there, the integration must be added (route to `/agentstack-new-company` to update INTEGRATIONS, or get explicit approval to add).

#### 3.3 Inputs
Ask for **3+ real example messages** the agent will receive. *"What does a typical message look like? Give me three real ones, anonymized."*

Without real examples, role.md will be generic.

#### 3.4 Actions
What does the agent need to **do**? List 3–8 verbs. Each verb maps to a tool.

#### 3.5 State machine
If the agent moves users through stages (lead funnel, ticket triage, scheduling): name the states. **Cap at 7** (Iron Law 5).

#### 3.6 Escalation
Hard triggers (auto-handoff). Soft triggers (offer human option). What does each look like in this company's voice?

#### 3.7 Success metric
What number does this agent move? (Decision Principle: stakeholder lens demands this.)

### Step 4 — Propose

Before scaffolding, write a 1-page proposal:

```
## Agent: <slug>/<name>
**Problem:** <one sentence>
**Users:** <role> via <channel>
**Funnel states:** <state machine, ≤7>
**Tools needed:**
  - <tool-name> [scope: agent/shared/framework] [exists: yes/no]
  - ...
**Scorers:**
  - answer_relevancy (built-in)
  - pii_leak (because user-facing)
  - <custom> — checks "<which CONTEXT policy>"
**Model:** <Haiku|Sonnet|Opus> — reason: <one line>
**Open questions:** <if any>
```

Show this. Wait for confirmation.

### Step 5 — Scaffold

```bash
agentstack new agent <slug>/<name>
```

Or, until the framework CLI is wired:

```bash
mkdir -p companies/<slug>/src/agents/<name>/{tools,evals}
```

### Step 6 — Write `role.md`

Sections (ARCHITECTURE.md format):
- **What you do** (1–2 sentences, the job)
- **How you behave** (bullets — defer voice details to CONTEXT, don't duplicate)
- **Inputs you expect** (the 3+ real examples from Step 3.3)
- **Outputs you produce** (exact format)
- **When to escalate or hand off** (explicit triggers)

Keep `role.md` ≤ 500 words (Iron Law 5 sibling — long roles do too much).

### Step 7 — Tool stubs

For each new tool:
- Create file under `agents/<name>/tools/<tool>.ts` (agent-specific) or `shared/tools/<tool>.ts` (Decision Principle 2: ≥2 agents)
- Use `createTool` from `@mastra/core/tools`
- Full zod schema for input + output
- Side-effect tools: `requireApproval: true` (Iron Law 6)
- Mark implementation as `// TODO: implement` until credentials/integrations land

### Step 8 — Scorer stubs

Iron Law 2 demands ≥3 scorers. Compose from built-ins + 1 custom per CONTEXT policy:

**Built-ins** (all from `agentstack-framework/scorers`, no LLM judge required):

| Scorer | Use when | Inputs |
|---|---|---|
| `answerRelevancy` | Always — catches empty/refusal/too-short responses | `output` |
| `piiLeak` | User-facing agents (anything that talks to humans) | `output` |
| `noFabrication` | RAG-driven agents, B2B lookup agents — anything where the agent cites IDs/SKUs/tickets | `context`, `output` |
| `escalationHandled` | Knowledge-gap-prone agents — flags fabrication-by-confidence when context is sparse | `context`, `output` |

**Custom scorers**: pick the most violatable CONTEXT policy and write a regex/heuristic scorer for it. Stub is fine; the file existing matters more than the implementation at this stage.

**Voice scorers**: if voice is critical (personal-brand agents), stub `tone_matches_<slug>` — but **do not ship it without ≥3 golden samples** (Iron Law 7). If samples not yet collected, leave a comment and a TODO.

### Step 9 — Wire in main.ts

```ts
import { <agentName>Agent } from './agents/<name>/agent.js'

// register on the Mastra instance
```

### Step 10 — Validate

```
/agentstack-validate --agent <slug>/<name>
```

## Output format

```
✓ Agent scaffolded: companies/<slug>/src/agents/<name>/

Files written:
  agent.ts          (composes CONTEXT + role + tools + memory)
  role.md           (<word-count> words)
  tools/<tool>.ts   x N
  evals/<scorer>.ts x M

Iron Law check: <pass/N findings>

Next:
  - Implement tool TODOs as integrations land
  - Collect golden samples for voice scorer
  - /agentstack-qa <slug>/<name> when first samples are in
```

## Things you do not do

- You don't onboard a company. Route.
- You don't add a tool that duplicates an existing one. Reuse or extend.
- You don't fabricate "typical messages" if the operator can't provide them. Ask harder; if they truly don't have any, the agent isn't ready to scaffold.
- You don't paste CONTEXT content into role.md.
- You don't skip scorers because "we'll add them later." Iron Law 2.
