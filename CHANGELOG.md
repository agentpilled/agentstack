# Changelog

All notable changes to agentstack are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Foundation: `ETHOS.md`, `IRON-LAWS.md`, `DECISION-PRINCIPLES.md`
- Four review lenses: `operator`, `lead-user`, `stakeholder`, `compliance`
- Repository scaffolding: `LICENSE`, `VERSION`, `CHANGELOG`, `.gitignore`, `package.json`
- Installer: `setup/install.sh`, `setup/uninstall.sh`
- `@agentstack/framework@0.1.0` (in `framework/`):
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
- `create-agentstack@0.1.0` (in `create-agentstack/`):
  - `pnpm create agentstack <target>` scaffolds a workspace-ready agency repo
  - Template ships `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md`, empty `companies/`
  - `--force` flag for non-empty targets
- `docs/getting-started.md` — 10-minute walkthrough from zero to first agent.

### Changed
- `companyMemory` is now generic over the Memory type. Decouples from a specific Mastra release so the framework doesn't break when `@mastra/core` shifts subpath exports.
- Agent template (`framework/templates/agent/agent.ts.tpl`) imports `Memory` from `@mastra/memory` (its current home in 0.20+) and uses `baseDir: '../../../../..'` — five levels up from `companies/<slug>/src/agents/<agent>/` reaches the agency root, where `loadCompanyContext` looks for `companies/<slug>/CONTEXT.md`.
- `framework/README.md` example updated to import `Memory` from `@mastra/memory`.

### Iron Law Overrides
None.

---

## [0.1.0] — TBD

Initial release.
