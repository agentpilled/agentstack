# Architecture

How agentstack is structured, why it's structured that way, and how the pieces compose.

## Two-package model

agentstack ships as **two npm packages and one git repository**:

```
github.com/agentpilled/agentstack          ← skills + foundations + examples (this repo)
                                             clone + install.sh

npm: @agentstack/framework                  ← runtime library
                                             user projects import this

npm: create-agentstack                      ← scaffolder
                                             pnpm create agentstack my-agency
```

This is intentional. Skills (the meta-tooling) and the framework (the runtime) have different audiences and release cadences. Skills can change opinions weekly; framework breaking changes are rare.

## Repository shape

```
agentstack/
├── README.md                            # marketing + install
├── LICENSE                              # MIT
├── CHANGELOG.md
├── VERSION
├── ETHOS.md                             # what we believe
├── ARCHITECTURE.md                      # this file
├── CONTRIBUTING.md
├── CLAUDE.md                            # for Claude sessions developing on agentstack
├── package.json                         # tooling
├── pnpm-workspace.yaml                  # framework + create-agentstack + examples
│
├── SKILL.md                             # root agentstack skill (foundation, the 6 conventions)
├── IRON-LAWS.md                         # 8 invariants
├── DECISION-PRINCIPLES.md               # 6 auto-decisions
├── lenses/                              # 4 review personalities
│   ├── operator.md
│   ├── lead-user.md
│   ├── stakeholder.md
│   └── compliance.md
│
├── # ─── skills (each = one slash command) ─────────────────────
├── new-company/SKILL.md                 # /agentstack-new-company
├── new-agent/SKILL.md                   # /agentstack-new-agent
├── validate/SKILL.md                    # /agentstack-validate
├── plan-review/SKILL.md                 # /agentstack-plan-review
├── autoplan/SKILL.md                    # /agentstack-autoplan
├── qa/SKILL.md                          # /agentstack-qa
├── learn/SKILL.md                       # /agentstack-learn
├── ship-agent/SKILL.md                  # /agentstack-ship-agent
│
├── # ─── runtime (npm-publishable) ─────────────────────────────
├── framework/                           # @agentstack/framework
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── agent.ts                     # buildAgentConfig
│       ├── context.ts                   # loadCompanyContext
│       ├── memory.ts                    # companyMemory, companyThreadId, companyResourceId
│       ├── rag.ts                       # companyRagNamespace
│       ├── scorers/                     # canonical scorers
│       │   ├── pii-leak.ts
│       │   ├── voice-match.ts
│       │   └── policy-violation.ts
│       └── cli/                         # `agentstack new ...`
│
├── # ─── scaffolder (npm-publishable) ──────────────────────────
├── create-agentstack/
│   ├── package.json
│   └── template/
│
├── # ─── canonical examples ────────────────────────────────────
├── examples/
│   ├── acme-creators/                   # B2C agency
│   └── stark-distributors/              # B2B distribution
│
├── bin/                                 # helper scripts
├── setup/                               # install.sh, uninstall.sh
└── scripts/                             # gen-skill-docs, etc.
```

## How a user agency repository is structured

When you run `pnpm create agentstack my-agency`, you get a repo following this shape:

```
my-agency/
├── package.json                         # depends on @agentstack/framework
├── pnpm-workspace.yaml                  # companies/* are workspaces
├── .env.example
└── companies/
    └── <slug>/
        ├── CONTEXT.md                   # voice, policies, glossary, compliance
        ├── INTEGRATIONS.md              # systems this client connects to
        ├── package.json                 # @<agency>/<slug>
        ├── .env.example
        └── src/
            ├── main.ts                  # Hono server registering all agents
            ├── shared/
            │   ├── tools/               # tools shared across this company's agents
            │   ├── prompts/             # prompt fragments
            │   ├── schemas/             # zod schemas for company domain
            │   └── rag/                 # RAG content for this company
            └── agents/<name>/
                ├── agent.ts             # composes CONTEXT + role + tools + memory
                ├── role.md              # this agent's role (no CONTEXT duplication)
                ├── tools/               # agent-specific tools
                └── evals/               # scorers
```

Cross-company imports are forbidden (Iron Law 3, lint-enforced). Shared logic moves to `framework/`.

## The agent journey

Building an agent is a series of stages, each backed by a skill:

```
                     ┌────────────────────────┐
idea ───────────────►│  /agentstack-new-      │
                     │  company (if needed)   │
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-new-agent │  spec interview
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-plan-     │  4-lens review
                     │  review                │  (op / lead / stake / comp)
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-autoplan  │  composes the above
                     │  (the killer)          │  + auto-decides via 6 principles
                     └─────────┬──────────────┘
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ scaffold │ │  drafts  │ │  taste   │
            │  agent   │ │ tools+   │ │  calls   │
            │  files   │ │ scorers  │ │  to you  │
            └────┬─────┘ └─────┬────┘ └────┬─────┘
                 └─────────────┼───────────┘
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-qa        │  golden inputs, scorers
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-validate  │  Iron Laws gate
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-ship-     │  validate → review → PR
                     │  agent                 │
                     └─────────┬──────────────┘
                               │
                               ▼
                     ┌────────────────────────┐
                     │  /agentstack-learn     │  extract patterns
                     │  (post-merge)          │
                     └────────────────────────┘
```

Each stage has explicit inputs, outputs, and an Iron Law that gates it.

## Composition: how `/agentstack-autoplan` works

`autoplan` is the killer because it composes the rest. Internally:

1. **Loads context** — reads `SKILL.md`, `IRON-LAWS.md`, `DECISION-PRINCIPLES.md`, lenses, the target company's `CONTEXT.md` and `INTEGRATIONS.md`, and existing tools/agents in that company.
2. **Drafts a spec** — interview compressed to taste-call gates only. Auto-fills via decision principles.
3. **Runs the four lenses sequentially** — operator, lead-user, stakeholder, compliance. Each scores. Each flags blockers.
4. **Resolves auto-resolvable issues** — applies decision principles to ≥80% of the lens-flagged items.
5. **Surfaces taste calls** — shows the user only what genuinely requires judgment.
6. **Drafts artifacts** — `role.md`, tool stubs with zod schemas, scorer stubs with golden-input templates.
7. **Validates** — runs `/agentstack-validate` against the drafted state.
8. **Stages a branch** — commits drafts ready for human review.

What you see: 3–5 questions and a branch. What you didn't have to do: 30+ intermediate decisions.

## Skill file format

Every skill is `<name>/SKILL.md` with YAML frontmatter:

```yaml
---
name: <name>                     # without prefix; harness adds agentstack-
preamble-tier: 1|2|3              # how heavy the preamble is
version: 0.1.0
description: |
  One-paragraph what + when.
  Use when asked to "X", "Y", "Z".
  Proactively suggest when ... (agentstack)
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion]
triggers:
  - phrase 1
  - phrase 2
benefits-from: [other-skill]      # skills that pre-condition the work
---

## Preamble
[bash that runs first — version check, repo detect]

## Mission
[the actual instructions, in second person, gstack-voice]
```

When installed via `setup/install.sh`, `<name>/` becomes `~/.claude/skills/agentstack-<name>/` and the harness registers `/agentstack-<name>` as a slash command.
