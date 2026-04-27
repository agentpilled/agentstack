# Decision Principles

Six principles `/agentstack-autoplan` uses to auto-resolve low-stakes choices. You see only the taste calls.

## Why principles, not flowcharts

A flowchart fails when reality has more branches than you imagined. Principles are stable: they apply in cases we haven't anticipated. Each one has a default and an explicit override condition.

---

## Principle 1 — Reuse over recreate (≥80% rule)

If an existing tool covers ≥80% of the need, reuse it. Extend it if needed. Don't create a near-duplicate.

**Auto-decides:** tool selection during agent build.

**Override:** existing tool has bugs you can't fix without breaking other agents that depend on it.

---

## Principle 2 — Promote at N=2

A tool used by two agents in the same company gets promoted from `agents/<X>/tools/` to `companies/<slug>/src/shared/tools/`. A tool used by two companies gets promoted to `framework/`.

**Auto-decides:** scope of new tools.

**Override:** the second use case is materially different and merging would create dead branches in the implementation.

---

## Principle 3 — Cheapest model that meets the bar

- **Haiku** for classification, routing, structured extraction
- **Sonnet** for voice, judgment, multi-step reasoning
- **Opus** only for genuinely hard reasoning under uncertainty

**Auto-decides:** model choice per agent.

**Override:** evaluation shows quality drop unacceptable on the cheaper tier.

---

## Principle 4 — Three scorers, no inflation

Default scorer set: `answer_relevancy` + `pii_leak` (if user-facing) + one custom per CONTEXT policy plausibly violated. Don't add scorers because they exist.

**Auto-decides:** scorer set during agent build.

**Override:** sectoral compliance regime requires more (HIPAA, GDPR Article 22, etc.).

---

## Principle 5 — Canonical stack per use case

When the stakeholder hasn't specified, default to:

| Use case | Tool |
|---|---|
| Instagram DMs | Manychat |
| Email | Postmark |
| Calendar booking | Calendly URL |
| Lead store, client-visible | Notion |
| Lead store, internal only | Postgres (Supabase) |
| Webhook hosting in prod | Fly.io |
| Vector DB | pgvector on Supabase |
| Logging | Axiom |

**Auto-decides:** integration choices when not specified.

**Override:** stakeholder mandates a specific tool, or existing client infrastructure dictates otherwise.

---

## Principle 6 — v1 = the boring core

v1 of any agent ships **without**: re-engagement, multi-language, voice notes, A/B testing, advanced personalization, sentiment analysis, "smart" memory beyond the conversation thread.

These are v0.2.

**Auto-decides:** scope cut during planning.

**Override:** stakeholder explicitly funds a longer v1 with criteria for "done" written in the spec.
