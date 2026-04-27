# {{company}}/{{agent}}

[One-line description of this agent's purpose.]

## Setup

1. Fill `role.md` with the agent's role (see structure already in the file)
2. Implement tool stubs in `tools/` with full zod schemas
3. Add scorers in `evals/` (Iron Law 2: at least 3 — `answer_relevancy`, `pii_leak` if user-facing, 1 custom)
4. Add golden inputs in `evals/golden/` for `/agentstack-qa`
5. Register in `companies/{{company}}/src/main.ts`:
   ```ts
   import { {{varName}}Agent } from './agents/{{agent}}/agent.js'
   ```
6. Run `/agentstack-validate --agent {{company}}/{{agent}}`
7. When implementations and golden inputs are in: `/agentstack-qa {{company}}/{{agent}}`
8. Ship: `/agentstack-ship-agent {{company}}/{{agent}}`

## Notes

- Tools live in `tools/` (agent-specific) or `companies/{{company}}/src/shared/tools/` (shared across this company's agents). See Decision Principle 2.
- Side-effect tools must set `requireApproval: true` until validated by a custom scorer (Iron Law 6).
