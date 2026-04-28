# Example: acme-creators

> Canonical B2C example: a personal-brand creator on Instagram with an Instagram setter agent.

This example is reference content, not a runnable agency. To use it, copy the files into a real agentstack agency repo:

```bash
# In your agency repo:
cp -R examples/acme-creators/CONTEXT.md      companies/<your-slug>/CONTEXT.md
cp -R examples/acme-creators/INTEGRATIONS.md companies/<your-slug>/INTEGRATIONS.md
cp -R examples/acme-creators/src/.            companies/<your-slug>/src/
```

Then rename `acme-creators` → `<your-slug>` in `agent.ts`, fill `voice-samples.md` with **your client's actual writing**, and replace tool TODOs with real Manychat / Calendly / Notion / Telegram credentials.

## What this demonstrates

| agentstack concept | Where you see it |
|---|---|
| **Iron Law 1** — CONTEXT clean | `CONTEXT.md` has zero `_(pendiente)_` markers |
| **Iron Law 8** — Disclosure decided | Explicit DO policy on "are you a bot?" with a canned response |
| **Convention 4** — Compose, don't paste | `agent.ts` uses `buildAgentConfig`; `role.md` does not duplicate voice or policies |
| **Convention 5** — Per-company memory | `companyMemory({ company: 'acme-creators' })`, threads prefixed with `acme-creators:` |
| **Decision Principle 5** — Canonical stack | Channel: Manychat. Booking: Calendly. Lead store: Notion. Alerts: Telegram |
| **State machine ≤ 7 (Iron Law 5)** | 7 states: `cold → greeted → discovering → qualified → booked` (+ `unqualified`, `ghosted`) |
| **Side-effect tools require approval (Iron Law 6)** | `send_calendly`, `upsert_lead`, `escalate_silently` all set `requireApproval: true` |
| **Voice scorer with golden samples (Iron Law 7)** | `voice-samples.md` has 4 real samples; `tone_matches_acme` scorer references them |
| **3 golden inputs for QA** | `evals/golden/` — cold cohort question, "are you a bot?", hot lead founder |

## What this does NOT demonstrate

- **A real running agent.** Tools throw `"not implemented"` until credentials are wired.
- **Voice scorer implementation.** The structure is shown; implementation needs an embedding model and an LLM judge — see Iron Law 7 and `framework/scorers/` (v0.2).
- **Multi-language.** This example is English-only. Personal-brand creators in other languages should fork voice-samples and run a separate voice scorer per language.

## When to use this as your starting point

Use this example when you're building a setter, qualifier, or front-of-funnel agent for:

- A personal-brand creator (any platform — IG/X/LinkedIn/TikTok DMs)
- A founder who replies to inbound DMs and wants leverage
- A small agency that handles multiple creators (one company per creator)

Use `stark-distributors/` instead if you're building an internal-team agent or a B2B agent that doesn't impersonate anyone.
