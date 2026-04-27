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

### Iron Law Overrides
None.

---

## [0.1.0] — TBD

Initial release.
