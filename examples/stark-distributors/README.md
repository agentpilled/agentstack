# Example: stark-distributors

> Canonical B2B example: an industrial parts distributor with an internal-team stock assistant.

This example is structural reference content. It demonstrates a B2B agent that does **not** impersonate anyone — internal users know they're talking to an AI assistant. Disclosure stance is the boring case (no Iron Law 8 nuance), letting the example focus on the multi-tenant + tooling story.

To use:

```bash
# In your agency repo:
cp -R examples/stark-distributors/CONTEXT.md       companies/<your-slug>/CONTEXT.md
cp -R examples/stark-distributors/INTEGRATIONS.md  companies/<your-slug>/INTEGRATIONS.md
cp -R examples/stark-distributors/src/.            companies/<your-slug>/src/
```

## What this demonstrates

| agentstack concept | Where you see it |
|---|---|
| **Iron Law 1** — CONTEXT clean | `CONTEXT.md` filled, no `_(pendiente)_` markers |
| **Iron Law 4** — No fabrication | `evals/no-fabrication.ts` scorer flags invented SKUs |
| **Iron Law 8 — boring case** | Disclosure: internal users know it's AI; CONTEXT says "If asked, confirm plainly." |
| **Convention 4** — Compose, don't paste | Voice/glossary live in CONTEXT, role.md is short and focused |
| **Convention 5** — Per-company memory | `companyMemory({ company: 'stark-distributors' })` |
| **Decision Principle 6** — v1 = boring core | No funnel, no follow-ups, no notifications. Direct query/response. |
| **Read-only tool baseline** | All tools are read-only; no `requireApproval` needed (Iron Law 6 doesn't fire) |

## Contrast with `acme-creators`

| | acme-creators | stark-distributors |
|---|---|---|
| Audience | External public (creator's followers) | Internal staff (agency operators) |
| Voice | Strong personal-brand voice — voice scorer required | Internal/operational — no voice scorer needed |
| Disclosure | Honest answer when asked (Iron Law 8 nuance) | Plain — they already know |
| Funnel | 7 states (cold → booked) | None — single query/response |
| Side-effect tools | 3 of 4 (`requireApproval: true`) | 0 of 3 (all read-only) |
| Channel | Manychat + Calendly + Notion + Telegram | Internal HTTP / Slack |

Both use the same primitives. Different shapes, same skeleton. That's the multi-tenant story.

## When to use this as your starting point

Use this when building:

- Internal-team query agents (inventory, ticket triage, customer lookup, knowledge base)
- B2B agents that don't impersonate anyone
- Agents whose tools are all read-only (low-risk to ship the agent before scorers harden)
