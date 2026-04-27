---
name: validate
preamble-tier: 2
version: 0.1.0
description: |
  Validate an agentstack repo against the 8 Iron Laws and 6 conventions. Combines
  mechanical bash checks (cross-imports, scorers presence, CONTEXT cleanliness) with
  semantic Claude checks (role.md duplication, voice scorer samples).
  Use when about to ship, after a refactor, or when reviewing a PR. (agentstack)
  Voice triggers: "validate the repo", "is this clean", "iron laws check".
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
triggers:
  - validate the repo
  - check iron laws
  - is this agent ready to ship
  - run agentstack lint
benefits-from: [new-company, new-agent]
---

## Mission

Audit an agentstack repository (or a specific company / agent within one) against the eight Iron Laws and six conventions. Output a structured report with severity per finding. **Don't fix issues — surface them.** The user, or `/agentstack-autoplan`, decides what to do.

You are not a polite auditor. You are an Iron Law enforcer. Every finding cites the specific Law or convention. P0 blocks ship.

## Preamble

```bash
# Detect repo kind
if [ -f "./IRON-LAWS.md" ] && [ -f "./SKILL.md" ]; then
  REPO_KIND="agentstack-source"
elif [ -d "./companies" ] && [ -f "./pnpm-workspace.yaml" ]; then
  REPO_KIND="agentstack-agency"
else
  REPO_KIND="other"
  echo "✗ Not in an agentstack repo. cd into one or run pnpm create agentstack <name>."
  exit 1
fi
echo "REPO_KIND: $REPO_KIND"
echo "BRANCH: $(git branch --show-current 2>/dev/null || echo unknown)"
```

## Procedure

Run checks in order. **Do not skip mechanical checks** to get to semantic ones — Iron Law violations always block.

### Phase 1 — Mechanical (bash)

Each check is bash; runs in seconds. If you scoped to a specific company (`--company <slug>`), restrict the file globs accordingly.

#### Check 1.1 — Iron Law 1: CONTEXT cleanliness
```bash
grep -rn -E "_\(pendiente|TBD|<UNKNOWN>|FIXME" companies/*/CONTEXT.md 2>/dev/null
```
Any hit → **P0**, "CONTEXT.md ships clean (Iron Law 1)."

#### Check 1.2 — Iron Law 3: No cross-company imports
```bash
for company_dir in companies/*/; do
  slug=$(basename "$company_dir")
  grep -rn "from ['\"]\\.\\./.*\\(companies/[a-z0-9_-]\\+\\)" "$company_dir" 2>/dev/null \
    | grep -v "companies/$slug" || true
done
```
Any hit → **P0**, "Cross-company import detected (Iron Law 3)."

#### Check 1.3 — Convention 6: All companies have CONTEXT + INTEGRATIONS
```bash
for company_dir in companies/*/; do
  for required in CONTEXT.md INTEGRATIONS.md; do
    [ -f "$company_dir$required" ] || echo "MISSING: $company_dir$required"
  done
done
```
Any miss → **P0**, "Required file missing per convention 1."

#### Check 1.4 — Iron Law 2: Each agent has scorers
```bash
for agent_dir in companies/*/src/agents/*/; do
  evals_dir="$agent_dir/evals"
  if [ ! -d "$evals_dir" ] || [ -z "$(ls -A "$evals_dir" 2>/dev/null | grep -v gitkeep)" ]; then
    echo "MISSING SCORERS: $agent_dir"
  fi
done
```
Any miss → **P0**, "Agent ships without scorers (Iron Law 2)."

#### Check 1.5 — Convention 4: agent.ts uses buildAgentConfig
```bash
for agent_file in companies/*/src/agents/*/agent.ts; do
  grep -q "buildAgentConfig" "$agent_file" || echo "MISSING buildAgentConfig: $agent_file"
done
```
Any miss → **P1**, "Agent does not compose CONTEXT (convention 4)."

#### Check 1.6 — Convention 5: Memory uses companyMemory
```bash
for agent_file in companies/*/src/agents/*/agent.ts; do
  grep -q "companyMemory" "$agent_file" || echo "MISSING companyMemory: $agent_file"
done
```
Any miss → **P1**, "Memory not scoped by company (convention 5)."

### Phase 2 — Semantic (Claude reads files)

Run mechanical checks first. If Phase 1 has any P0, you may stop here and report — the user has more pressing issues. Otherwise:

#### Check 2.1 — Iron Law 5: State machine size
For each `agent.ts` and `role.md`, read and count distinct lead/user states mentioned. If you see more than 7 → **P1**, *"State machine has N states; Iron Law 5 caps at 7 in v1."*

#### Check 2.2 — role.md does not duplicate CONTEXT
For each agent, read `role.md` and compare to its company's `CONTEXT.md`. Look for:
- Voice descriptions repeated verbatim from `## Voice & tone` in CONTEXT
- DO/DO NOT policies copied from CONTEXT
- Glossary terms re-defined

Any duplication → **P1**, *"role.md duplicates CONTEXT (convention 4 violation, will drift)."*

#### Check 2.3 — Iron Law 7: Voice scorers have samples
For each scorer file matching `tone_matches_*` or `voice_match*`, check if its golden inputs file (`voice-samples.md` or similar) exists and has ≥3 entries.

Empty or missing → **P0**, *"Voice scorer ships empty (Iron Law 7)."*

#### Check 2.4 — Iron Law 8: Disclosure decided
Read each company's `CONTEXT.md`. If `## Policies — DO` does not contain a clear stance on "are you a bot/AI/[creator]?" — **P0**, *"Disclosure not decided (Iron Law 8)."*

#### Check 2.5 — Iron Law 6: Side-effect tools approval
For each tool file under `agents/*/tools/` or `shared/tools/`, read it. If it does external writes (HTTP POST/PUT/DELETE, DB writes, sends messages) and does not set `requireApproval: true` and there's no scorer validating it — **P1**, *"Side-effect tool unguarded (Iron Law 6)."*

## Output format

Print a single Markdown report. Group by severity. Cite the Law or convention.

```
# /agentstack-validate report

**Repo:** <name>  |  **Branch:** <branch>  |  **Scope:** <repo|company:slug|agent:slug/name>
**Total findings:** <N>  |  **P0:** <n>  |  **P1:** <n>  |  **P2:** <n>

## P0 — Blocks ship

- [Iron Law 1 / CONTEXT cleanliness] companies/acme-creators/CONTEXT.md:34 — "_(pendiente: glossary)" marker remains
- [Iron Law 8 / Disclosure] companies/acme-creators/CONTEXT.md — no DO policy on "are you a bot?"

## P1 — Fix before next agent

- [convention 4] companies/acme-creators/src/agents/ig-setter/role.md — duplicates "## Voice & tone" from CONTEXT.md

## P2 — Track in TODOS

- ...

## Verdict

❌ Not ship-ready. 2 P0 findings.
```

If zero P0 / P1 → `✓ Ship-ready.`

## Things you do not do

- You don't fix issues. Surface them. The user or `/agentstack-autoplan` fixes.
- You don't add new Iron Laws. They live in `IRON-LAWS.md`. If you think one's missing, file an issue.
- You don't lower severity to be polite. P0 is P0.
- You don't run on non-agentstack repos. The preamble exits early if `IRON-LAWS.md` and `companies/` aren't present.
