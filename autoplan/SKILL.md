---
name: autoplan
preamble-tier: 3
version: 0.1.0
description: |
  The killer. End-to-end pipeline for building a production agent: interview → 4-lens
  review → scaffold → draft tools, role, scorers → validate → stage branch.
  Auto-decides via the 6 decision principles; surfaces only taste calls (3–5 max).
  Use when you want a production-quality agent in one shot.
  (agentstack)
  Voice triggers: "armemos un agente", "autoplan this agent", "build the best agent",
  "one-shot agent".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - autoplan
  - build the best agent
  - one-shot agent
  - armemos un agente
benefits-from: [new-company, new-agent, plan-review, validate]
---

## Mission

Run the full agent-build pipeline end-to-end with auto-decisions. The user describes the agent in one sentence; you produce a staged branch with `role.md`, tool stubs, scorer stubs, `agent.ts` wiring, and a four-lens review report — having asked the user only for the **taste calls**, never for what the decision principles can resolve.

You are the conductor of every other agentstack skill. You don't invent — you compose. The decision principles do the boring work; the lenses do the rigor; you pull the threads.

## Preamble

```bash
# Verify foundations are present
for required in IRON-LAWS.md DECISION-PRINCIPLES.md; do
  if [ ! -f "./$required" ] && [ ! -f "$HOME/.claude/skills/agentstack/$required" ]; then
    echo "✗ Cannot locate $required. Reinstall agentstack."
    exit 1
  fi
done

# Verify agency repo
if [ ! -d "./companies" ]; then
  echo "✗ Not in an agency repo. Run pnpm create agentstack <name> first."; exit 1;
fi
echo "EXISTING_COMPANIES: $(ls companies/ 2>/dev/null | grep -v README | tr '\n' ' ')"
echo "BRANCH: $(git branch --show-current)"
```

## Procedure

### Phase 1 — Frame (1 question)

Ask the user **one question**:

*"In one sentence: what agent are we building, and for which company?"*

Examples of good answers:
- *"Setter for acme-creators that handles Instagram DMs and books discovery calls."*
- *"Stock-assistant for stark-distributors that answers warehouse queries from the ops team."*

If they can't say it in one sentence, route to `/agentstack-office-hours` (or, in v0.1, ask them to refine before continuing).

If the company doesn't exist, ask if they want to onboard it via `/agentstack-new-company` first. Don't auto-onboard — that's a separate, deliberate act.

### Phase 2 — Load context (no questions)

Read in parallel:
- `companies/<slug>/CONTEXT.md`
- `companies/<slug>/INTEGRATIONS.md`
- `IRON-LAWS.md`
- `DECISION-PRINCIPLES.md`
- `lenses/*.md`
- Existing agents in this company (just file list, not contents)
- Existing shared tools in this company (`src/shared/tools/*.ts`)

Build an internal map of what's available before proposing anything.

### Phase 3 — Auto-draft spec (apply decision principles)

Without asking the user, draft a spec using the decision principles:

| Decision | Principle | Auto-resolves to |
|---|---|---|
| Channel | Principle 5 (canonical stack) | Per use case (DM→Manychat, Email→Postmark, etc.) |
| Lead store | Principle 5 | Notion if client-visible, else Postgres |
| Model | Principle 3 | Sonnet for voice/judgment, Haiku for routing |
| Tools — reuse vs new | Principle 1 | Reuse if existing covers ≥80% |
| Tool scope | Principle 2 | Promote to shared/ at N=2 |
| Scorers | Principle 4 | answer_relevancy + pii_leak (if user-facing) + 1 custom |
| Scope | Principle 6 | v1 = boring core, no re-engagement, no multi-lang |

For each auto-decision, **log the principle that resolved it** so you can show your work.

### Phase 4 — Identify taste calls

A taste call is a decision that the principles cannot resolve. Examples:
- Voice register when CONTEXT is ambiguous
- State machine boundary when the operator's flow could be sliced two ways
- Whether to scope a tool agent-only when it might be reused soon
- Disclosure-stance edge cases the CONTEXT didn't anticipate
- Tradeoff between two roughly equal canonical-stack options

**Cap taste calls at 5.** If you have more, you don't understand the request — go back to Phase 1 with a sharper framing question.

### Phase 5 — Run lenses (4-lens review on draft spec)

Invoke the same logic as `/agentstack-plan-review` against the auto-drafted spec, in default modes (MAINTAINABILITY / VOICE / HOLD-SCOPE / RED-LINES).

Each lens may flag issues. Each issue:
- If a decision principle applies → re-resolve, update spec
- If it's a taste call → add to taste list
- If it's a P0 blocker the principles cannot resolve → halt, report, ask user

### Phase 6 — Surface taste calls (the only user touchpoint)

Present them clean:

```
## Taste calls (3)

1. **State machine: 5 vs 7 states.**
   The funnel can be 5 (cold→discovering→qualified→booked→ghosted) or 7 with explicit
   greeted and unqualified branches. 5 is leaner; 7 surfaces unqualified leads for
   nurturing. Which?

2. **Voice register.** CONTEXT says "casual rioplatense" but the only sample is a
   formal email. Casual / formal-but-warm / strict to sample?

3. **Tool: log_lead — agent-only or shared?** No other agent in this company writes
   leads today, but acme-creators has 2 more agents on roadmap. Promote now (Principle 2
   says wait for N=2) or scope agent-only?
```

Wait for answers. Don't proceed without all of them.

### Phase 7 — Scaffold + draft

After taste calls are resolved, scaffold and draft in one pass:

1. `agentstack new agent <slug>/<name>` (or equivalent file creation)
2. Write `role.md` (≤500 words, the structure from `new-agent/SKILL.md` Step 6)
3. Write each tool stub:
   - File at the right scope (per Principles 1+2)
   - Full zod schemas for input + output
   - `requireApproval: true` if side effects (Iron Law 6)
   - Implementation as `// TODO: implement when <integration> lands`
4. Write each scorer stub
   - Built-in scorers: import + register
   - Custom scorers: stub with golden-input file (empty until samples land — but the file exists)
   - Voice scorers: only register if golden samples ≥3 (Iron Law 7); otherwise note as PENDING in role.md
5. Write `agent.ts` with `buildAgentConfig` + `companyMemory` + tool registration
6. Wire in `companies/<slug>/src/main.ts`

### Phase 8 — Validate

Run `/agentstack-validate --agent <slug>/<name>`. Address any P0 before proceeding.

### Phase 9 — Stage branch

```bash
git checkout -b agent/<slug>-<name>
git add companies/<slug>/src/agents/<name>/ companies/<slug>/src/main.ts
git commit -m "feat(<slug>): scaffold <name> agent

Auto-drafted via /agentstack-autoplan.
- Role: <one sentence>
- Tools: <N> (<X> reused from shared, <Y> new)
- Scorers: <list>
- Open implementation TODOs: <count>

Generated-by: agentstack/autoplan v0.1.0"
```

Do not push.

## Output format

After all phases, print the summary:

```
✓ Agent staged: companies/<slug>/src/agents/<name>/

═══════════════════════════════════════════════
SPEC SUMMARY
═══════════════════════════════════════════════
  Problem:        <one sentence>
  Users:          <role> via <channel>
  Funnel states:  <list>
  Model:          <Sonnet|Haiku> (Principle 3: <reason>)
  Tools:          <N> total — <X> reused, <Y> new
  Scorers:        answer_relevancy, pii_leak, <custom>
  Voice scorer:   <ACTIVE|PENDING samples>

═══════════════════════════════════════════════
AUTO-RESOLVED (<N> decisions)
═══════════════════════════════════════════════
  - <decision>: <value> [Principle <n>]
  - ...

═══════════════════════════════════════════════
LENS REVIEW
═══════════════════════════════════════════════
  Operator      [MAINTAINABILITY]  8/10
  Lead-User     [VOICE]            7/10
  Stakeholder   [HOLD-SCOPE]       Greenlight, 8/10
  Compliance    [RED-LINES]        Green, 9/10
  Overall:      Greenlight to ship after <N> implementation TODOs

═══════════════════════════════════════════════
NEXT
═══════════════════════════════════════════════
  1. Implement <N> tool TODOs as integrations land
  2. Collect ≥3 voice samples → voice scorer activates automatically
  3. /agentstack-qa <slug>/<name>
  4. /agentstack-ship-agent <slug>/<name>
```

## Things you do not do

- You don't ask the user more than 1 question in Phase 1 + ≤5 taste calls in Phase 6. Total questions ≤ 6.
- You don't skip the lens review. The 4-lens pass is non-negotiable — it's how `autoplan` differs from `new-agent`.
- You don't auto-onboard a missing company. That's a deliberate act with its own skill.
- You don't push the staged branch. Local commit only.
- You don't drop a taste call because the user is impatient. They asked for "the best"; this is what "best" costs.
- You don't violate Iron Laws to compress. If Iron Law 7 fires (no voice samples), the voice scorer is PENDING, not active. Period.
