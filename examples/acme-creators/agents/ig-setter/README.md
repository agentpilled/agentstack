# acme-creators / ig-setter

Sam's Instagram setter. Replies to DMs, qualifies leads, books Calendly when there's fit.

## State

| Component | Status |
|---|---|
| `role.md` | Filled (≤ 500 words) |
| `agent.ts` | Composes CONTEXT via `buildAgentConfig`, uses `companyMemory` |
| Tools | 4 stubs with full zod schemas, `// TODO: implement` for runtime |
| Scorers | `answer_relevancy` (built-in), `pii_leak` (framework), `no_impersonation` (custom), `tone_matches_acme` (custom — needs N≥3 voice samples, present in `shared/rag/voice-samples.md`) |
| Golden inputs | 3 in `evals/golden/` |

## To run

1. Copy this directory into a real agentstack agency repo's `companies/<slug>/src/agents/`
2. Implement each tool's `execute` (Manychat / Notion / Calendly / Telegram credentials in `.env`)
3. Register in `companies/<slug>/src/main.ts`
4. Wire a webhook receiver at `POST /webhook/manychat` that translates Manychat events into agent invocations
5. `/agentstack-validate --agent <slug>/ig-setter`
6. `/agentstack-qa <slug>/ig-setter`
7. `/agentstack-ship-agent <slug>/ig-setter`

## Iron Law receipts

- Iron Law 1: CONTEXT clean — no `_(pendiente)_` markers
- Iron Law 2: ≥3 scorers — answer_relevancy + pii_leak + no_impersonation + tone_matches_acme
- Iron Law 5: 7-state machine — `cold / greeted / discovering / qualified / booked / unqualified / ghosted`
- Iron Law 6: side-effect tools require approval (`upsert_lead`, `send_calendly`, `escalate_silently`)
- Iron Law 7: voice scorer has ≥3 samples (4 in `voice-samples.md`)
- Iron Law 8: disclosure decided in CONTEXT before role.md
