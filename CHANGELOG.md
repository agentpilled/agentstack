# Changelog

All notable changes to agentstack are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.3] — 2026-04-28

### Added — closes the install UX gap
- **`agentstack-skills@0.1.0`** published. One-line installer: `npx agentstack-skills` fetches the latest released tag of `agentpilled/agentstack` from GitHub, extracts it to a temp dir, and copies all 9 skills (root dispatcher + 8 slash commands) into `~/.claude/skills/agentstack*`. Replaces the previous `git clone + bash setup/install.sh` flow as the primary onboarding path.
  - Default: pulls the latest GitHub release tag (stable).
  - `--ref <tag|branch>` to pin or live on `main`.
  - `--skills-dir <path>` to redirect away from `~/.claude/skills`.
  - `--dry-run` to preview what would happen.
  - `uninstall` subcommand to remove all `agentstack*` skills.
  - Zero npm dependencies beyond `picocolors`. Uses `curl` + `tar` (universal on macOS/Linux) under the hood.
- README install section rewritten to lead with `npx agentstack-skills`. The clone+bash flow is preserved as a `<details>` fallback for contributors developing on agentstack itself.

### Changed
- `pnpm-workspace.yaml` adds `install` to the workspace.

### Iron Law Overrides
None.

---

## [0.1.2] — 2026-04-28

### Added — closes the Iron Law 2 gap
- **Three new built-in scorers** in `agentstack-framework/scorers`. Iron Law 2 demands ≥3 scorers per shipped agent; previously the framework shipped only `piiLeak` and left the other two as user-invent. Now you compose:
  - **`answerRelevancy`** — heuristic check that the output is substantive (non-empty, above a length threshold, not a stock refusal pattern in en/es). v0.1 is heuristic-only; semantic relevance scoring requires an LLM judge (deferred to v0.2).
  - **`noFabrication`** — flags entity references (SKUs, year-prefixed order numbers, ticket numbers, UUIDs) cited in the output that don't appear in the provided context. Iron Law 4 enforcement at scoring time. Pure regex extraction + substring check, no LLM.
  - **`escalationHandled`** — when context is sparse (below a threshold), the output must explicitly escalate (en/es patterns) instead of improvising. Catches fabrication-by-confidence as a complement to `noFabrication`'s fabrication-by-specifics.
- All four scorers documented in `framework/README.md` with a "use when" table.
- `new-agent/SKILL.md` Step 8 rewritten to compose from the four built-ins plus one custom-per-CONTEXT-policy.
- `vitest` added as devDependency. 22 sanity tests covering all four scorers — pass/fail cases, allowlists, custom thresholds. `pnpm test` runs them; `prepublishOnly` gates publish on green tests.

### Changed
- Examples now use the same layout the CLI scaffolds: `examples/<slug>/src/agents/<agent>/` and `examples/<slug>/src/shared/`. Previously they sat at `examples/<slug>/agents/...` and `examples/<slug>/shared/...`, which meant copying an example into a real agency repo broke `loadCompanyContext` because the agent's `baseDir` resolved one level off. Both example agent files now use `baseDir: '../../../../..'` (matching the CLI template).
- `docs/getting-started.md` agent paths updated to `companies/<slug>/src/agents/<agent>/`.
- `create-agentstack/template/README.md` convention 2 updated to reference `src/shared/tools/` and `src/agents/*/tools/`.
- `README.md` adds an explicit "**Next:** follow the [getting-started walkthrough](docs/getting-started.md)" pointer after the install verification step.
- New `examples/README.md` with side-by-side comparison table of the two canonical examples — clarifies which to start from and what each demonstrates.

### Iron Law Overrides
None.

---

## [0.1.1] — 2026-04-28

### Added
- `create-agentstack` published. `pnpm create agentstack <target>` scaffolds a workspace-ready agency repo (template ships `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md`, empty `companies/`). The README claim from v0.1.0 is now true.
- `docs/getting-started.md` — 10-minute walkthrough from zero to first agent.

### Changed
- **Renamed framework package: `@agentstack/framework` → `agentstack-framework`** (unscoped). The `@agentstack` org name was unavailable on npm, so we ship without a scope rather than under a workaround scope. Parallel to `create-agentstack` — same naming pattern, same branding.
- `agentstack-framework` bumped to `0.1.1` and published.
- `companyMemory` is now generic over the Memory type. Decouples from a specific Mastra release so the framework doesn't break when `@mastra/core` shifts subpath exports.
- `framework` peerDep widened to `@mastra/core >=0.20.0 <2.0.0` (was `>=0.1.0 <1.0.0`). Covers both 0.x and 1.x; `companyMemory` is generic so type-level safety is preserved.
- Agent template (`framework/templates/agent/agent.ts.tpl`) imports `Memory` from `@mastra/memory` (its current home in 0.20+) and uses `baseDir: '../../../../..'` — five levels up from `companies/<slug>/src/agents/<agent>/` reaches the agency root, where `loadCompanyContext` looks for `companies/<slug>/CONTEXT.md`. Previous `'../../..'` resolved one level inside the company dir, so `loadCompanyContext` could never find `CONTEXT.md`.
- `framework/README.md` example imports `Memory` from `@mastra/memory`.
- `examples/acme-creators/agents/ig-setter/agent.ts` imports `Memory` from `@mastra/memory`.

### Iron Law Overrides
None.

---

## [0.1.0] — 2026-04-27

### Added
- Foundation: `ETHOS.md`, `IRON-LAWS.md`, `DECISION-PRINCIPLES.md`
- Four review lenses: `operator`, `lead-user`, `stakeholder`, `compliance`
- Repository scaffolding: `LICENSE`, `VERSION`, `CHANGELOG`, `.gitignore`, `package.json`
- Installer: `setup/install.sh`, `setup/uninstall.sh`
- `agentstack-framework@0.1.0` (in `framework/`):
  - `buildAgentConfig` — composes CONTEXT + role into agent system prompt
  - `loadCompanyContext` — reads `companies/<slug>/CONTEXT.md`
  - `companyMemory`, `companyThreadId`, `companyResourceId` — per-company memory scoping
  - `companyRagNamespace` — per-company RAG namespacing
  - `scorers/piiLeak` — strict regex PII detector (canonical scorer)
  - `agentstack` CLI (`new company`, `new agent`) with template scaffolding
- Eight skills (each as `<name>/SKILL.md`):
  - `validate` — Iron Laws + conventions checker (mechanical + semantic)
  - `new-company` — interview + scaffold a client workspace
  - `new-agent` — interview + scaffold an agent for an existing company
  - `plan-review` — four-lens review with selectable modes
  - `autoplan` — end-to-end pipeline with auto-decisions (the killer)
  - `qa` — golden-input replay + iterative atomic fixes
  - `learn` — post-build pattern extraction (N≥2 only)
  - `ship-agent` — gated PR pipeline with lens reports in description
- Two canonical examples in `examples/`:
  - `acme-creators/` — B2C creator on Instagram with an IG setter agent. Demonstrates Iron Laws 1, 5, 6, 7, 8; per-company memory; Manychat + Calendly + Notion + Telegram stack. Includes 4 voice samples, 4 golden inputs, 2 custom scorers (`no_impersonation`, `tone_matches_acme`).
  - `stark-distributors/` — B2B distributor with an internal stock-assistant agent. Demonstrates the boring-disclosure case, read-only tool baseline (no `requireApproval`), no voice scorer (no brand voice to match). Includes 2 golden inputs and a `no_fabrication` custom scorer (Iron Law 4).

### Iron Law Overrides
None.

---

Note: `0.1.0` was tagged but never published to npm. The `pnpm add agentstack-framework` and `pnpm create agentstack` commands in the v0.1.0 README assumed packages that didn't exist on the registry. `0.1.1` is the first release where both packages are actually published and the killer demo flow works end-to-end.
