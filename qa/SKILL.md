---
name: qa
preamble-tier: 2
version: 0.1.0
description: |
  Replay golden inputs against an agent, score with the agent's scorers, iteratively
  fix failures with atomic commits, re-verify until thresholds pass.
  Use after building or before shipping an agent. (agentstack)
  Voice triggers: "qa this agent", "test this agent", "run scorers".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
triggers:
  - qa
  - test this agent
  - run scorers
  - verify this agent works
benefits-from: [validate]
---

## Mission

Run an agent against its golden inputs, score outputs with the agent's scorers, identify failures, fix them with atomic commits, re-run until thresholds pass. Output a before/after report.

You are not the test runner — Mastra's eval harness is. You are the operator who reads results, diagnoses failures, applies the smallest possible fix, and re-runs. **One fix per commit.** When you start guessing, stop and surface to the user.

## Preamble

```bash
# Locate target agent
if [ -z "${1:-}" ]; then
  echo "✗ Specify <slug>/<agent>. e.g.: /agentstack-qa acme-creators/ig-setter"
  exit 1
fi

AGENT_PATH="companies/${1%/*}/src/agents/${1#*/}"
[ -d "$AGENT_PATH" ] || { echo "✗ Agent not found at $AGENT_PATH"; exit 1; }
echo "AGENT: $AGENT_PATH"

# Locate golden inputs
GOLDEN_DIR="$AGENT_PATH/evals/golden"
if [ ! -d "$GOLDEN_DIR" ] || [ -z "$(ls -A "$GOLDEN_DIR" 2>/dev/null)" ]; then
  echo "✗ No golden inputs at $GOLDEN_DIR. Add them before /agentstack-qa."
  exit 1
fi
echo "GOLDEN_INPUTS: $(ls "$GOLDEN_DIR" | wc -l | tr -d ' ')"
```

## Procedure

### Step 1 — Load golden inputs

Each golden input is a `.json` or `.md` file in `agents/<name>/evals/golden/` with:
- `input`: the message / payload the agent receives
- `expected`: optional — what an ideal output looks like (for relevancy)
- `must_not`: optional — patterns the output must not contain (for pii_leak, no-impersonation, etc.)
- `context`: optional — prior turns or state setup

If golden inputs don't have this structure, fix the structure first (and tell the user to use that format going forward).

### Step 2 — Determine scorer thresholds

Each scorer in `agents/<name>/evals/*.ts` has a threshold (in code or in a `thresholds.json`). If undefined, use:
- `answer_relevancy`: ≥ 0.75
- `pii_leak`: 100% (any leak fails)
- custom voice scorer: ≥ 0.80
- custom policy scorer: 100% (policy violation fails)

Print the thresholds before running. The user can override.

### Step 3 — Run the agent against golden inputs

```bash
# Use Mastra's eval CLI when available; fallback to a script:
pnpm --filter @<agency>/<slug> test:evals -- --agent <name>
```

Capture: per-input output, per-scorer score, pass/fail.

### Step 4 — Triage failures

Group failures by **root cause**, not by golden input. Patterns to look for:
- Same scorer fails on multiple inputs → systemic (role/tool/CONTEXT issue)
- Same input fails multiple scorers → input is testing a hard edge case (good)
- One scorer, one input → genuinely a one-off

For each failure cluster, identify the minimal source-code change that would fix it. Candidates (cheapest to most expensive):
1. Adjust a tool's output format
2. Tighten role.md (remove ambiguity)
3. Add a missing escalation trigger
4. Fix a scorer threshold (only if threshold is wrong, not if output is wrong)
5. Update CONTEXT.md (rare — usually means something's incorrectly defined)

### Step 5 — Fix iteratively (atomic commits)

For each failure cluster:

1. Apply the smallest possible fix
2. `git add` only the files changed for THIS fix
3. `git commit -m "fix(qa <slug>/<name>): <root cause>"`
4. Re-run the failing inputs only
5. If pass → mark cluster resolved, move to next
6. If fail → revert the commit, escalate to user with: *"I tried X. It moved the score from A to B. Suggest: <next step>."*

**Do not bundle fixes.** Each commit = one root cause. This is how the user can revert when a fix breaks something else.

### Step 6 — Final re-run

After all clusters fixed, re-run the full golden set. All thresholds must pass.

If any still fail: print the report, surface to user, **do not declare done**.

## Output format

```
═══════════════════════════════════════════════
QA REPORT — <slug>/<name>
═══════════════════════════════════════════════

Golden inputs: N
Scorers: <list>
Thresholds: <map>

─── BEFORE ───
  answer_relevancy:  X/N pass (avg score Y)
  pii_leak:          X/N pass
  <custom>:          X/N pass

─── FIXES APPLIED (k commits) ───
  1. fix(qa): <root cause> — moved relevancy 0.62 → 0.81 on 4 inputs
  2. fix(qa): <root cause> — added escalation trigger for "<phrase>"
  ...

─── AFTER ───
  answer_relevancy:  N/N pass (avg score Z)
  pii_leak:          N/N pass
  <custom>:          N/N pass

✓ Ship-ready (all thresholds met) | ✗ N failures remain (see triage)

Next:
  /agentstack-validate --agent <slug>/<name>
  /agentstack-ship-agent <slug>/<name>
```

## Things you do not do

- You don't lower thresholds to pass. If a threshold is wrong, fix it deliberately and document why.
- You don't bundle multiple fixes in one commit. Atomic.
- You don't "improve" an agent beyond fixing failures. Out-of-scope work belongs in a separate session.
- You don't run QA without scorers (Iron Law 2 already prevents this — but if it's somehow missing, refuse).
- You don't run on agents whose tools have unimplemented `// TODO`. Implement first; QA can't grade what doesn't run.
