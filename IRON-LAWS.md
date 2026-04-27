# Iron Laws

Non-negotiable invariants. Nothing ships that violates one of these. Override requires a written exception in the PR description.

## Why iron, not guidelines

Guidelines bend under pressure. Iron Laws don't. Every Law has been violated by someone (often us), shipped, and broken something downstream. They're scar tissue, not preferences.

---

## Law 1 — CONTEXT.md ships clean

A `CONTEXT.md` with `_(pendiente)_`, `TBD`, or `_(unknown)_` markers is **undecided product**, not unfinished documentation. Decide first, ship second. The agent will inherit the gaps and fill them with hallucinations.

**Override:** never, before v1 of an agent.

---

## Law 2 — Three scorers minimum

Every shipped agent has at least:

1. `answer_relevancy` (built-in)
2. `pii_leak` (if user-facing)
3. one custom scorer per CONTEXT policy that is plausibly violatable

No scorers = no merge.

**Override:** internal-only experimental agents, time-boxed to two weeks.

---

## Law 3 — No cross-company imports

A file under `companies/A/` MUST NOT import from `companies/B/`. Lint-enforced at pre-commit. Shared logic belongs in `framework/` or in the company's own `src/shared/`.

**Override:** never. If you think you need this, you need a `framework/` change.

---

## Law 4 — No fabrication in knowledge gaps

If RAG doesn't have it, the agent escalates. Period. "Best guess" is a banned phrase. The reviewer who would have caught the lie won't be there for every conversation.

**Override:** never.

---

## Law 5 — State machines stay legible

A state machine has 5–7 states max in v1. More states = the agent is doing two jobs. Split it.

**Override:** documented in `role.md` with the reason and a planned split date.

---

## Law 6 — Side-effect tools require approval

Any tool that writes, sends, deletes, or charges money sets `requireApproval: true` until a custom scorer validates outputs across at least 50 production-like examples.

**Override:** read-only tools (the default) or tools behind a manual operator gate.

---

## Law 7 — No empty voice scorers

A `tone_matches_X` scorer ships only with N≥3 golden samples. Without samples, the scorer is theater.

**Override:** never. If you can't get samples, don't claim to score voice.

---

## Law 8 — Disclosure decided before role.md

The agent's stance on "are you a bot? / are you [the creator]? / are you human?" is decided in `CONTEXT.md` before any `role.md` is written. Disclosure isn't a corner case — it's a product decision and a legal exposure.

**Override:** never.

---

## How to override

1. Open the PR.
2. In the description, write `## Iron Law Override` followed by which Law and the specific reason.
3. Tag the maintainer for sign-off.
4. The override gets logged in `CHANGELOG.md` so we learn from the cases where Laws bent.
