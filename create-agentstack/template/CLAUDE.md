# CLAUDE.md — agency repo conventions

You are working in an **agentstack agency repo**. Every client is a workspace under `companies/<slug>/`.

## Five conventions (non-negotiable)

1. **Read `companies/<slug>/CONTEXT.md` first** before doing anything for that client. Use `loadCompanyContext` from `agentstack-framework`.
2. **Existing tools before new tools.** Before writing a tool, grep `companies/<slug>/src/shared/tools/` and `companies/<slug>/src/agents/*/tools/` for the same capability.
3. **No cross-company imports.** `companies/foo` may never import from `companies/bar`. Shared utilities live at the agency root, not inside another company.
4. **Compose, don't paste.** Use `buildAgentConfig({ company, role, … })` — it composes the company CONTEXT into the agent's system prompt. Never copy CONTEXT into role.md.
5. **Memory + RAG scoped per company.** Wrap your Mastra `Memory` with `companyMemory({ company, memory })`. Build thread/resource IDs with `companyThreadId` / `companyResourceId`. Build RAG namespaces with `companyRagNamespace`.

## Slash commands

You probably want these (from the agentstack skill set — see <https://github.com/agentpilled/agentstack>):

- `/agentstack-new-company <slug>` — interview + scaffold a new client workspace
- `/agentstack-new-agent <company>/<agent>` — interview + scaffold an agent
- `/agentstack-validate` — run the 8 Iron Laws against this repo
- `/agentstack-plan-review` — four-lens review of an agent spec
- `/agentstack-autoplan` — spec → 4 reviews → scaffold → drafts (the killer)
- `/agentstack-qa <company>/<agent>` — replay golden inputs and score
- `/agentstack-ship-agent <company>/<agent>` — validate → review → register → tests → PR

## Where things live

```
mi-agencia/
├── companies/<slug>/        # one dir per client (everything client-specific)
│   ├── CONTEXT.md
│   ├── INTEGRATIONS.md
│   └── src/
│       ├── agents/
│       └── shared/
│           ├── tools/       # reused across this client's agents
│           ├── prompts/
│           ├── schemas/
│           └── rag/         # MD docs the agents inherit via buildAgentConfig({ references })
└── scripts/                 # agency-level operational helpers (not client-specific)
    # Examples of what lives here:
    #   - auth setup        (gmail-oauth.ts, slack-install.ts)
    #   - manual runners    (run-triager.ts, replay-thread.ts)
    #   - one-off fixtures  (extract-voice-samples.ts, seed-rag.ts)
    #   - QA teardown       (restore-inbox.ts, reset-state.ts)
```

`scripts/` is the agency-level home for anything that isn't a client deliverable but supports the operation: auth, runners, fixtures, teardown. If you find yourself writing something that doesn't fit `companies/<slug>/`, it probably belongs here.

## When in doubt

Read the company's `CONTEXT.md`. The voice, policies, and constraints live there — not in your head.
