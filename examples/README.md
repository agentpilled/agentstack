# Examples

Two canonical demo companies. Each demonstrates a distinct shape of agentstack agent — same primitives, different trade-offs. Read both before building. They're the reference for what good looks like.

## At a glance

| | [`acme-creators/`](./acme-creators/) | [`stark-distributors/`](./stark-distributors/) |
|---|---|---|
| **Type** | B2C, high-exposure | B2B, low-exposure |
| **Audience** | External (creator's followers) | Internal (agency operators) |
| **What the agent does** | Replies to Instagram DMs, qualifies leads, books Calendly | Answers stock / shipment queries from internal staff |
| **Voice** | Strong personal-brand voice — voice scorer required | Operational, no voice to imitate |
| **Disclosure (Iron Law 8)** | Honest answer when asked ("Lol, you got the team — Sam reads everything but I handle first replies.") | Plain — internal users already know it's AI |
| **Funnel** | 7-state machine (cold → greeted → discovering → qualified → booked + unqualified + ghosted) | None — single query/response |
| **Tools** | 4 (`get_lead`, `upsert_lead`, `send_calendly`, `escalate_silently`) | 3 (`search_product`, `get_stock`, `list_shipments`) |
| **Side-effect tools** | 3 of 4 (`requireApproval: true`) | 0 of 3 (all read-only — Iron Law 6 doesn't fire) |
| **Scorers** | `pii_leak`, `tone_matches_acme`, `no_impersonation` | `answer_relevancy`, `no_fabrication` |
| **Iron Laws demonstrated** | 1, 5, 6, 7, 8 | 1, 4 |
| **Stack** | Manychat + Calendly + Notion + Telegram | Internal HTTP / SAP / warehouse DB |

## When to use which as your starting point

- **Building a setter, qualifier, or front-of-funnel agent for a personal brand?** Start from `acme-creators/`. It carries the heaviest weight of Iron Laws (especially 7 and 8) — the patterns transfer to any creator-as-product agent.

- **Building an internal agent for an operations team, customer support, or knowledge-base lookup?** Start from `stark-distributors/`. It demonstrates the *boring case* — read-only tools, no voice scorer, plain disclosure — which is where most B2B agents actually live.

## What these are NOT

- **Not runnable as-is.** Every external tool throws `"not implemented"` until you wire credentials. The structure, schemas, and scoring are real; the side-effects are stubs.
- **Not a starter template.** They're reference content. Copy what applies, drop what doesn't, adapt the rest. The CLI (`pnpm agentstack new company`) gives you a clean skeleton.
- **Not exhaustive.** Two companies cover the B2C / B2B split. They don't cover: multi-language agents, voice/audio channels, agents that orchestrate other agents, agents with long-running tasks. Patterns for those will land in `examples/` as N≥2 real cases extract them (the "no speculative patterns" rule).

## How to use them

Easiest path — copy the structure into a real agency repo:

```bash
# In your agentstack agency repo:
cp -R examples/acme-creators/CONTEXT.md      companies/<your-slug>/CONTEXT.md
cp -R examples/acme-creators/INTEGRATIONS.md companies/<your-slug>/INTEGRATIONS.md
cp -R examples/acme-creators/src/.           companies/<your-slug>/src/
```

Then rename slugs, fill `voice-samples.md` with your client's actual writing, and replace tool stubs with real credentials. Each example's own README has step-by-step instructions tailored to its shape.

## Read next

- [`acme-creators/README.md`](./acme-creators/README.md) — the B2C voice-driven case in detail
- [`stark-distributors/README.md`](./stark-distributors/README.md) — the B2B internal case in detail
- Root [`SKILL.md`](../SKILL.md) — the six conventions both examples follow
- [`IRON-LAWS.md`](../IRON-LAWS.md) — the eight invariants that decide what each example does and doesn't do
