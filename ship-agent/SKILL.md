---
name: ship-agent
preamble-tier: 2
version: 0.1.0
description: |
  Ship an agent. Pipeline: validate → 4-lens review (HOLD-SCOPE modes) → register in
  src/main.ts → run tests → commit → push branch → open PR with each lens's report
  in the description. (agentstack)
  Voice triggers: "ship this agent", "release agent", "PR this agent".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
triggers:
  - ship this agent
  - release agent
  - PR this agent
benefits-from: [validate, qa, plan-review]
---

## Mission

Take an agent from "built and tested locally" to "PR open with reviewer-ready evidence." Every gate is mandatory. If a gate fails, halt — `ship-agent` never bypasses Iron Laws.

You are the release engineer. You don't decide if the agent is good — `validate`, `qa`, and `plan-review` already did. You collect their verdicts, gather artifacts, and open a PR that reviewers can approve in 5 minutes because every question is answered in the description.

## Preamble

```bash
# Confirm in agency repo + on a non-main branch
if [ ! -d "./companies" ]; then
  echo "✗ Not in an agency repo."; exit 1;
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "✗ On $CURRENT_BRANCH. Switch to a feature branch first."
  echo "  git checkout -b agent/<slug>-<name>"
  exit 1
fi
echo "BRANCH: $CURRENT_BRANCH"

# Confirm clean working tree
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "⚠ Working tree dirty. Commit or stash first."
  git status --short
  exit 1
fi
```

## Procedure

### Gate 1 — Validate

Run `/agentstack-validate --agent <slug>/<name>` (or invoke its checks inline).

If P0 findings → **halt**. Print findings, tell user to fix or override per `IRON-LAWS.md`.

### Gate 2 — QA report

Confirm `/agentstack-qa <slug>/<name>` ran and passed within the last 24h. Look for:

- A recent QA report file in `agents/<name>/evals/reports/<date>.md`, OR
- Recent commits with `fix(qa <slug>/<name>):` prefix indicating QA was done

If neither: **halt**. *"No recent QA. Run /agentstack-qa first."*

### Gate 3 — Plan-review (HOLD-SCOPE modes)

Run `/agentstack-plan-review` against the built agent in **HOLD-SCOPE / FAILURE-GRACE / RED-LINES** modes (the conservative pass before shipping).

Capture each lens's verdict and score. If any lens is Red → **halt**.

If Stakeholder is Yellow without a documented metric: **halt**. Iron Law cousin: agents without a defined success metric don't ship.

### Gate 4 — Wiring

Confirm:

```bash
grep -q "${agent_export_name}" companies/<slug>/src/main.ts
```

The agent must be imported and registered. If not: **halt**.

### Gate 5 — Tests

```bash
pnpm --filter @<agency>/<slug> test
```

All tests pass. If they don't: **halt**.

### Gate 6 — Commit hygiene

Look at the commits on this branch:

```bash
git log main..HEAD --oneline
```

Each commit must:
- Have a message in `<area>: <what>` format
- Have a clear scope (no "wip", "stuff", "fixes")

If commits are messy → suggest squashing into a clean history. (Don't auto-squash.)

### Step 7 — Compose the PR description

Build a PR body that reviewers can read top-to-bottom and decide in 5 minutes:

```markdown
## What this ships

<one paragraph: agent name, company, problem solved, success metric>

## Architecture

- **Funnel states:** <list>
- **Channel:** <e.g. Manychat IG DMs>
- **Lead store:** <Notion DB / Postgres / etc.>
- **Model:** <Sonnet / Haiku>
- **Tools added:** <N> (<X> reused, <Y> new)
- **Tools modified:** <list>

## Validation

- ✓ /agentstack-validate: 0 P0, 0 P1
- ✓ /agentstack-qa: <N>/<N> golden inputs pass at thresholds
- ✓ /agentstack-plan-review:
  - Operator [MAINTAINABILITY]: 8/10
  - Lead-User [VOICE]: 7/10
  - Stakeholder [HOLD-SCOPE]: Greenlight, 8/10
  - Compliance [RED-LINES]: Green, 9/10

## Iron Law overrides

None.  <!-- or list each override with reason -->

## Risks I'm aware of

<the operator's honest "what could break" list — required, even if short>

## Rollout

- [ ] Deploy to staging
- [ ] Smoke test with <N> real inputs
- [ ] Monitor scorer dashboard for <N> hours
- [ ] Promote to prod

🤖 Shipped via /agentstack-ship-agent v0.1.0
```

### Step 8 — Push and open PR

```bash
git push -u origin "$CURRENT_BRANCH"

gh pr create \
  --title "agent(<slug>): ship <name>" \
  --body-file /tmp/agentstack-pr-body.md \
  --base main
```

If `gh` is not configured, print the PR description and tell the user to open it manually with that body.

## Output format

```
✓ Shipped: <slug>/<name>

PR:    <URL>
Branch: <branch> (pushed)
Commits: <N>

Gates:
  validate    ✓
  qa          ✓ (<n>/<n>, last run <time ago>)
  plan-review ✓ (avg 8.0)
  wiring      ✓
  tests       ✓ (<n> tests, <duration>)

Next:
  - Reviewer signs off (link above)
  - Merge → triggers staging deploy
  - Watch scorer dashboard for <N> hours
  - Promote to prod
```

## Things you do not do

- You don't bypass any gate. If validate fails, you don't ship and add "TODO follow-up."
- You don't open a PR with auto-generated boilerplate the operator hasn't read. They sign off on the description before you push.
- You don't squash commits without asking. The history is the operator's.
- You don't deploy. `ship-agent` opens the PR. Deploy is downstream — different skill or CI.
- You don't push to a branch that's not the current branch. No surprises.
