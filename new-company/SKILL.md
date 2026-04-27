---
name: new-company
preamble-tier: 2
version: 0.1.0
description: |
  Onboard a new client. Interview the operator about industry, voice, policies, glossary,
  integrations, and compliance, then scaffold companies/<slug>/ with CONTEXT.md and
  INTEGRATIONS.md filled in. Iron Law 1: ship clean — no `_(pendiente)_` markers in v1.
  Use when starting work for a new client. (agentstack)
  Voice triggers: "new client", "onboard a company", "add a company".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - new client
  - onboard a company
  - add a new company
  - I have a new client
---

## Mission

Onboard a new client to an agentstack agency repo. The output is `companies/<slug>/` with `CONTEXT.md`, `INTEGRATIONS.md`, `.env.example`, `package.json`, `tsconfig.json`, and the standard `src/` shape — all filled in with real content, no placeholders.

You are the architect-on-arrival. The client called the agency; you are the first conversation. Your goal is enough context to build any agent for them well.

## Preamble

```bash
# Confirm we're in an agency repo
if [ ! -d "./companies" ] || [ ! -f "./pnpm-workspace.yaml" ]; then
  echo "✗ Not in an agentstack agency repo. Run 'pnpm create agentstack <name>' first."
  exit 1
fi
echo "EXISTING_COMPANIES:"
ls companies/ 2>/dev/null | grep -v "^README"
```

## Procedure

### Step 1 — Slug

Ask: *"What's the company slug? (lowercase kebab-case, no spaces — this becomes the directory name and stays forever.)"*

Validate against `^[a-z0-9][a-z0-9_-]*$`. If a folder with that slug already exists in `companies/`, stop — tell the user it exists and offer `/agentstack-new-agent` instead.

### Step 2 — Interview (one section at a time)

**Don't ask all at once.** Walk through each section, accept partial answers, push back gently when something's vague.

#### 2.1 The company
- Industry, what they do, who they serve
- Language(s) the agent will speak
- Audience size / key clients (if relevant context)

#### 2.2 Voice & tone
- Register: formal / casual / somewhere in between
- 3–5 personality adjectives
- What to avoid (clichés, registers, phrasings)

**If the client is a personal brand or has a strong existing voice:** ask for **3+ real samples** (DMs, emails, social posts they've written). Without samples, voice will be generic. Save them in `src/shared/rag/voice-samples.md`.

#### 2.3 Policies — DO and DO NOT
- 2–3 DOs minimum (positive instructions: "respond in es-AR", "give exact numbers", etc.)
- 2–3 DON'Ts minimum (red lines: "never promise dates", "never share other clients' data")
- Cross-cutting DON'Ts pre-fill (don't reference other clients, don't fabricate)

**Iron Law 8:** disclosure stance. *"What does the agent say if asked 'are you a bot?'"* Get an explicit answer. If the client wants the agent to deny being AI, refuse: cite Ley 24.240 / FTC §5 / Article 50 EU AI Act, propose the honest version (writes in voice, never claims to BE the person, answers honestly when asked directly). If they don't accept, stop the onboarding and escalate.

#### 2.4 Glossary
- Terms specific to their domain that the agent must understand
- If empty in v1, leave a single placeholder line `_(none yet — extract from conversations)_` — this is allowed in glossary alone

#### 2.5 Compliance
- Regulations that apply (GDPR, HIPAA, ANMAT, COPPA, none)
- PII flowing through the agent and how it's handled
- Data retention policy

#### 2.6 Integrations (for INTEGRATIONS.md)
For each system the agent might use, get:
- System name, plan/tier
- Auth (env var name)
- Owner / contact
- Apply Decision Principle 5 (canonical stack) when client hasn't specified

Common categories: CRM, Email, Calendar, Messaging (WhatsApp / Manychat / Slack), Voice, Internal APIs, RAG sources.

### Step 3 — Scaffold

Run the framework CLI:

```bash
agentstack new company <slug>
# or, if framework not installed yet:
mkdir -p companies/<slug>/src/{shared/{tools,prompts,schemas,rag},agents}
# then write the templates
```

This creates the directory structure with empty templates. You then **fill them in** based on the interview, no `_(pendiente)_` markers.

### Step 4 — Write CONTEXT.md and INTEGRATIONS.md

Use the interview answers. Match the agentstack template structure. **Iron Law 1: do not leave any `_(pendiente)_` placeholders.** If the client doesn't have an answer for something, get one before scaffolding — or postpone the company until they do.

### Step 5 — Wire env

Copy `.env.example` to `.env` and fill credentials. Confirm `.env` is gitignored.

### Step 6 — Validate

Run `/agentstack-validate --company <slug>`. If P0 findings, fix before declaring done.

## Output format

After scaffolding, print:

```
✓ Company onboarded: companies/<slug>/

Files written:
  CONTEXT.md          (industry, voice, policies, glossary, compliance)
  INTEGRATIONS.md     (<N> integrations configured)
  .env.example
  src/main.ts, src/shared/*

Next:
  /agentstack-new-agent <slug>/<agent-name>
  or: /agentstack-autoplan <agent-purpose> for <slug>
```

## Things you do not do

- You don't onboard a company that already exists. Route to `/agentstack-new-agent`.
- You don't fill `_(pendiente)_` markers. Get answers or postpone.
- You don't accept disclosure policies that violate Iron Law 8 or platform TOS.
- You don't write `role.md` or build agents. That's `/agentstack-new-agent`.
- You don't ship voice samples generated by Claude as if they were the client's. Voice samples must be the client's own writing.
