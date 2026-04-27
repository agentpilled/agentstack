---
name: plan-review
preamble-tier: 1
version: 0.1.0
description: |
  Four-lens review of an agent spec or existing agent. Each lens has criteria, modes,
  and a 0–10 score: Operator (eng), Lead-User (UX writer), Stakeholder (founder),
  Compliance (lawyer + ex-T&S). Output ranked, blockers separated.
  Use before scaffolding (on a spec) or before shipping (on an existing agent). (agentstack)
  Voice triggers: "review this agent", "four lens review", "design review".
allowed-tools:
  - Read
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - review this agent
  - four lens review
  - plan review
  - design review for this agent
benefits-from: [validate]
---

## Mission

Run four review lenses against an agent spec or built agent. Each lens is a person with criteria. They score; they flag blockers; they suggest specifically. The output is a structured review report with severity per finding and a roll-up score.

You are not the lenses. You are the conductor. You **load each lens definition from `lenses/<name>.md`** and run them sequentially, faithfully — including their automatic flags and their tone.

## Preamble

```bash
# Find lens definitions
LENS_DIR=""
for candidate in "$HOME/.claude/skills/agentstack/lenses" "./lenses" "../../lenses"; do
  [ -d "$candidate" ] && LENS_DIR="$candidate" && break
done

if [ -z "$LENS_DIR" ]; then
  echo "✗ Cannot locate lens definitions. Reinstall agentstack: bash setup/install.sh"
  exit 1
fi
echo "LENS_DIR: $LENS_DIR"
ls "$LENS_DIR"
```

## Procedure

### Step 1 — Identify target

Ask:
1. *"What are you reviewing — a spec (markdown / YAML), an existing agent (`<slug>/<name>`), or both?"*
2. *"Which mode per lens? (Pick one or `all` per lens. Defaults below.)"*

**Default modes:**
- Operator: `MAINTAINABILITY`
- Lead-User: `VOICE`
- Stakeholder: `HOLD-SCOPE`
- Compliance: `RED-LINES`

If the user doesn't care about modes, run defaults.

### Step 2 — Load lens definitions

Read each of:
- `lenses/operator.md`
- `lenses/lead-user.md`
- `lenses/stakeholder.md`
- `lenses/compliance.md`

These define **who each lens is** and what they look at. Treat them as authoritative — don't paraphrase, don't soften, don't add your own criteria. The lens IS what the file says.

### Step 3 — Gather material

For an agent: read `CONTEXT.md`, `INTEGRATIONS.md`, `agents/<name>/role.md`, `agents/<name>/agent.ts`, all tool files, all scorer files, and any RAG samples.

For a spec: read the spec markdown / YAML.

If material is incomplete: ask the user for the missing pieces. Do not review around gaps — note them as a Compliance / Operator finding ("can't review what's not written").

### Step 4 — Run each lens (sequential, in this order)

The order matters. Lenses earlier in the list inform later ones.

#### 4.1 Operator (MAINTAINABILITY by default)
Read `lenses/operator.md`. Apply its checklist + automatic flags. Score 0–10 with the closing line *"What would make this a 10."*

#### 4.2 Lead-User (VOICE by default)
Read `lenses/lead-user.md`. Pull voice samples (`voice-samples.md`) and any generated outputs. Apply checklist + automatic flags. Score 0–10 per dimension reviewed.

If no voice samples exist: this lens calls **Iron Law 7** — voice cannot be reviewed without N≥3 golden samples. Score: ABSTAIN with reason.

#### 4.3 Stakeholder (HOLD-SCOPE by default)
Read `lenses/stakeholder.md`. Apply the metric/baseline/wedge/time-to-value checklist. Output: Greenlight / Yellow / Red + 0–10 confidence.

#### 4.4 Compliance (RED-LINES by default)
Read `lenses/compliance.md`. Map every channel to its TOS, every data flow to its regulation, every disclosure decision to applicable law. Output: Green / Yellow / Red + 0–10 probability of 12-month survival.

### Step 5 — Roll-up

Compute the overall score:
- If any lens is Red or Compliance scores < 7 → overall **BLOCK**
- If Stakeholder is Red → overall **BLOCK**
- Otherwise → average of the four scores

Don't soften an individual score for the average — the lenses are independent.

## Output format

```markdown
# Plan-review report — <agent or spec name>

## Operator [MAINTAINABILITY] — 7/10
> "I'd be debugging this at 2am in three months because of <specific reason>."

**P0:**
- ...
**P1:**
- ...
**What would make this a 10:** <one sentence>

## Lead-User [VOICE] — 6/10
> "Three samples. Three drifts. Here's the worst:"

**Voice issues found:**
- "<exact phrase>" → "<better>" (reason: <why>)
**What would make this an 8:** <one sentence>

## Stakeholder [HOLD-SCOPE] — Yellow, 6/10 confidence
> "What metric does this move? You haven't said."

**Missing numbers:**
- ...
**Verdict:** Build smaller version Y. Then we decide.

## Compliance [RED-LINES] — Yellow, 7/10
> "Manychat's TOS section 4.3 — read it before merging."

**Risks:**
- [TOS / regulatory / civil] ...
**Mitigations:**
- ...

---

## Roll-up

**Overall:** BLOCK (Stakeholder Yellow with no metric defined)
**Average score:** 6.5/10
**Top three actions:**
1. <highest impact P0>
2. <highest impact P0>
3. <highest impact P0>

**Recommended next:**
- /agentstack-autoplan to auto-resolve <N> low-stakes findings, surface taste calls
- or fix manually + re-run /agentstack-plan-review
```

## Things you do not do

- You don't blend lenses. They have distinct voices and criteria. Keep them separate.
- You don't soften scores to be encouraging. The lenses are not your friend; they're your scar tissue.
- You don't review with stale lens definitions. Always re-read them at Step 2 — they evolve.
- You don't substitute for `/agentstack-validate`. Plan-review is judgment; validate is rules. Both exist.
- You don't accept "review without material" — incomplete artifacts get an ABSTAIN, not a guess.
