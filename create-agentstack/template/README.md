# Your agentstack agency

This repo was scaffolded with `create-agentstack`. It's a multi-tenant agency: every client lives in `companies/<slug>/` with its own context, agents, and tools.

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in provider keys
```

Then in Claude Code (with the agentstack skills installed — see [agentstack repo](https://github.com/agentpilled/agentstack)):

```
/agentstack-new-company my-first-client
/agentstack-new-agent my-first-client/setter
```

## Layout

```
companies/
  <slug>/
    CONTEXT.md            # company brand, voice, policies — read first by every agent
    INTEGRATIONS.md       # external systems for this client
    package.json
    src/
      main.ts             # entrypoint — register your agents here
      agents/
        <agent-name>/
          agent.ts        # Mastra Agent wired with companyMemory + buildAgentConfig
          role.md         # what this specific agent does
          tools/          # agent-specific tools
          evals/golden/   # fixtures replayed by /agentstack-qa
      shared/
        tools/            # tools reused across agents of this company
        prompts/          # prompt fragments
        schemas/          # zod schemas
        rag/              # source docs for RAG ingestion
```

## Conventions

agentstack codifies five conventions you don't get to skip:

1. **Read CONTEXT.md first** (`loadCompanyContext`)
2. **Existing tools before new tools** — search `companies/<slug>/src/shared/tools/` and `companies/<slug>/src/agents/*/tools/` first
3. **No cross-company imports** — `companies/foo` cannot import from `companies/bar`
4. **Compose, don't paste** — `buildAgentConfig` composes CONTEXT into the prompt
5. **Memory + RAG scoped per company** — `companyMemory`, `companyThreadId`, `companyResourceId`, `companyRagNamespace`

`/agentstack-validate` checks all of these.

## Docs

- agentstack: <https://github.com/agentpilled/agentstack>
- Mastra: <https://mastra.ai>
