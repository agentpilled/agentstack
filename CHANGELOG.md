# Changelog

All notable changes to agentstack are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.5] — 2026-04-29

### Added — `/agentstack-schedule` skill
- New skill at `schedule/SKILL.md`. Puts an agentstack runner script on a recurring schedule using the OS's native job scheduler — `launchd` on macOS, `systemd` user timers on Linux. Activated by `/agentstack-schedule` from inside an agency repo.
- Generates four pieces:
  - **Wrapper script** (`scripts/_<name>-wrapper.sh`) that handles the four things schedulers can't: cd to agency root, source `.env`, gate by window of operation (e.g. `09-21h`), hold a `flock` against overlapping runs.
  - **Platform config** — `~/Library/LaunchAgents/agentstack.<slug>.<name>.plist` (macOS) or `~/.config/systemd/user/<name>.{service,timer}` (Linux).
  - **Helper scripts** — `scripts/<name>-{pause,resume,logs,uninstall}.sh`. Each is platform-aware (one script, runs on macOS or Linux).
  - **Logs** — `~/Library/Logs/agentstack.<slug>.<name>.log` (macOS) or `~/.local/state/agentstack/...` (Linux). XDG-compliant on Linux.
- Supported cadences: `every Nm`, `every Nh`, `hourly`, `daily HH:MM`. The skill explicitly does NOT accept arbitrary cron expressions because launchd has no equivalent — half the cron expressions don't translate cleanly, and silent partial-translations hide bugs. Users wanting cron syntax edit the generated config by hand.
- Supports macOS `WakeFromSleep` (with explicit warning that it requires AC power + System Settings opt-in).
- Step 7 of the procedure runs a one-shot verification immediately after activation — catches `.env` issues, PATH issues, missing deps at install time instead of three days later.
- All 4 helper script templates + the wrapper template + macos.plist template + linux service/timer templates lint clean (`bash -n`, `plutil -lint`, systemd section structure).
- Distributed via the existing `agentstack-skills` installer — no new npm package, no framework code change. After this release, `npx agentstack-skills` discovers `agentstack-schedule` automatically.

### Why a skill, not a framework primitive
Documented in `schedule/README.md`. Short version: scheduling has too many design dimensions (cron vs interval vs calendar, env loading, locking, log rotation, wake-from-sleep, platform differences) to commit to a primitive after seeing only one real build (mati-clase email triager). Once N≥2 real scheduled runners exist, the framework graduates `defineRunner({ ..., schedule: ... })` and the skill reads that metadata instead of asking the user — that's a v0.2 milestone.

### Iron Law Overrides
None.

---

## [0.1.4] — 2026-04-28

### Background — gaps surfaced from a real build

This release closes four gaps surfaced by reviewing a real agentstack build (an email triager for a B2B SaaS company on top of Gmail). Each fix below is N=1 evidence, not speculation. The `/agentstack-learn` workflow against ourselves.

### Added — `references` option in `buildAgentConfig`
- **`agentstack-framework@0.1.3`** published.
- New `references?: AgentReference[]` option on `buildAgentConfig`. Each reference is `{ label, path }` (path resolved relative to `companies/<company>/`) or `{ label, content }` (pre-loaded string). References are spliced into the system prompt below CONTEXT + role + cross-cutting rules, each as a `# Reference — <label>` section separated by `---`.
- Eliminates ~28 lines of manual `readFileSync` + string-interpolation boilerplate per agent that needs reference docs (taxonomies, voice samples, product specs, glossaries).
- Real-world before: agent.ts inlined `readFileSync` + array-join across 3 RAG files. Real-world after: `references: [{ label, path }, ...]` in the `buildAgentConfig` call.
- 10 new vitest tests for `buildAgentConfig` covering both shapes, error cases (both/neither set, missing path), and ordering.

### Changed — `model` is optional in `BuildAgentConfigOptions`
- Real-world finding: callers commonly pass a real provider object (e.g. `openai('gpt-4o-mini')`) directly to `new Agent({...config, model: provider})`. The `model: string` we required at config-build time was a placeholder. Now optional. The Agent's own `model` prop is the source of truth.

### Added — `scripts/` in the agency template
- **`create-agentstack@0.1.2`** published.
- Template now scaffolds an empty `scripts/.gitkeep` at the agency root. Documented in `CLAUDE.md` and `README.md` of the generated repo as the home for agency-level operational helpers: auth setup (`gmail-oauth.ts`), manual runners (`run-triage.ts`), one-off fixtures (`extract-voice-samples.ts`), QA teardown (`restore-inbox.ts`).
- Template `agentstack-framework` peerDep widened to `^0.1.3` so freshly-scaffolded agencies pick up the new `references` API.
- Template `.gitignore` adds `*.tgz` to keep generated tarballs out of repos.

### Added — `docs/patterns/structured-dispatch.md`
- New documented pattern: structured-output + deterministic dispatch (Pattern B) vs. LLM-tool-calls (Pattern A). Each one's failure modes, when each fits, and a hybrid composition.
- Sourced from a real bug class: LLM classifies "read-only" but still calls an archive tool. Pattern B sidesteps the class entirely by removing tools from the agent and dispatching deterministically from a runner.
- `new-agent/SKILL.md` Step 7 now points to this doc as the FIRST decision before drafting tool stubs.
- Linked from main `README.md` under a new `## Patterns` section.

### Iron Law Overrides
None.

---

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
