---
name: learn
preamble-tier: 1
version: 0.1.0
description: |
  Post-build pattern extraction. Reads recent agentstack commits, identifies patterns
  from this build, proposes updates to SKILL.md, IRON-LAWS, lenses, or examples/ —
  only for patterns observed N≥2 times across distinct cases (honors the
  no-speculative-patterns rule). Use after shipping an agent or weekly across a team.
  (agentstack)
  Voice triggers: "what did we learn", "extract patterns", "agentstack learn".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
triggers:
  - what did we learn
  - extract patterns
  - learn from this build
  - retro this agent
---

## Mission

Look back at recent agent builds, find patterns, and propose where they should live in agentstack — but **only when N≥2 distinct cases support a pattern**. Speculative patterns are worse than no patterns; they pollute the framework with abstractions for cases that don't exist yet.

You are the historian for the framework. Your job is to notice what kept happening, not what might happen.

## Preamble

```bash
# Look back over recent activity
SCOPE="${1:-30 days}"
echo "SCOPE: last $SCOPE"
git log --since="$SCOPE" --pretty=format:"%h %s" --no-merges 2>/dev/null | head -50
echo ""
echo "AGENTS TOUCHED:"
git log --since="$SCOPE" --name-only --no-merges 2>/dev/null \
  | grep -E "companies/[^/]+/src/agents/[^/]+/" \
  | sed -E 's|.*companies/([^/]+)/src/agents/([^/]+)/.*|\1/\2|' \
  | sort -u
```

## Procedure

### Step 1 — Define scope

Ask:
*"What's the scope of this learn pass? 'last agent', 'last 30 days', 'this client', or a specific list?"*

Default: last 30 days across all clients.

### Step 2 — Inventory

Build a map of agents touched in scope:

```
agents_touched = {
  acme-creators/ig-setter: [<commit list>]
  stark-distributors/stock-assistant: [<commit list>]
  ...
}
```

For each agent, summarize what was built or changed. Read commit messages and diffs.

### Step 3 — Surface candidate patterns

Look for things that repeated:

- **Same tool in multiple agents** → candidate for `framework/` if cross-company, or `shared/` promotion confirmation if same-company
- **Same lens finding flagged twice** → maybe lens criteria need sharpening (but resist — usually it's a real recurring issue, not a lens issue)
- **Same Iron Law override** (across PRs) → Law may be too strict, or repeatedly violated for the same reason → propose Law refinement
- **Same architecture** appearing in 2+ agents → archetype candidate (e.g., "setter funnel", "support triage", "scheduler") for `examples/`
- **Repeated taste calls** in `/agentstack-autoplan` → candidate for additional decision principle

For each candidate pattern, write down:

```
PATTERN: <name>
EVIDENCE:
  - case 1: <agent> at <commit>
  - case 2: <agent> at <commit>
COMMON STRUCTURE: <2–3 sentence description>
DIVERGENCES: <what's different between cases — important; if too divergent, no pattern>
PROPOSED HOME: framework/ | shared/ | lenses/ | IRON-LAWS.md | DECISION-PRINCIPLES.md | examples/<name>/
```

### Step 4 — Filter (the no-speculative-patterns rule)

Reject any candidate where:

- **N < 2 distinct cases.** "It might be useful for future agents" → no.
- **Cases are the same client.** Two agents in `acme-creators` doing similar things is a `shared/` promotion, not a framework pattern.
- **Cases diverge in load-bearing ways.** If the "common structure" requires hand-waving over 4+ exceptions, it's not a pattern; it's a similarity.

What's left after filtering is your real list of patterns to propose.

### Step 5 — Propose changes

For each surviving pattern, write a proposal in `learnings/<date>-<pattern>.md`:

```markdown
# Learning: <pattern name>

**Date:** <date>  |  **Scope:** <client list or "cross-client">

## Evidence (N=<n>)
- <case 1>
- <case 2>
- ...

## Pattern observed
<2–3 sentence summary>

## Proposed change
- **Where it lives:** <framework/ | shared/ | lenses/ | etc.>
- **What changes:** <specific edit, ideally a draft>

## Risks
- What could go wrong if we adopt this?
- What pre-existing patterns could break?
```

Write the file. Do not auto-apply changes — the user reviews each proposal individually.

### Step 6 — Surface to user

Print:

```
═══════════════════════════════════════════════
LEARN — <date>, scope: <scope>
═══════════════════════════════════════════════

Agents touched: <N>
Candidate patterns: <M>
Survived filtering (N≥2): <K>

─── PROPOSED CHANGES ───

1. <pattern name> [N=2: acme-creators/ig-setter, other-client/setter-2]
   → Promote to: examples/setter-archetype/
   → Draft: learnings/2026-04-27-setter-archetype.md

2. <pattern name> [N=3]
   → Refine: lenses/operator.md (add "tool returning null" to automatic flags)
   → Draft: learnings/2026-04-27-null-handling-flag.md

─── REJECTED CANDIDATES ───

- <name>: only 1 case — too speculative
- <name>: cases diverge on <X> — not a pattern

Next:
  Review each draft. Apply with /agentstack-learn --apply <draft-file> when ready.
```

## Things you do not do

- You don't auto-apply changes. Every proposal goes through user review.
- You don't propose patterns from N=1. The no-speculative-patterns rule exists because we lived through speculative abstractions and they hurt.
- You don't "smooth over" divergent cases. If two cases differ in load-bearing ways, that's two patterns, not one.
- You don't propose changes to `IRON-LAWS.md` from one agent's experience. Iron Laws change only when N≥3 and a maintainer signs off.
- You don't ship learnings as commits. They're proposals — `learnings/` directory, separate review cadence.
