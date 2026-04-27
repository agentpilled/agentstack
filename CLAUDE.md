# CLAUDE.md — for sessions working **on** agentstack

This file is for Claude (or any AI agent) developing the agentstack project itself. It is **not** the user-facing skill — that lives in `SKILL.md`.

If you're using agentstack to build agents in your own agency repo, ignore this file.

## Where you are

You are in the **agentstack source repo**. Public, MIT, anonymous (`agentpilled`). The output of work here ships to GitHub publicly. Treat every commit accordingly.

## Hard rules for this repo

1. **No real client names anywhere.** Never reference real client slugs, real client names, or the maintainer's personal identity in shipped files. Demo content uses the canonical examples only: `acme-creators`, `stark-distributors`. If you're tempted to add a real name as a "concrete example," stop — pick a fictional one.

2. **No identity leak.** Git is configured to use `agentpilled@users.noreply.github.com`. Don't change it. Don't add a real name to `package.json` author, README, CONTRIBUTING, LICENSE, or anywhere else.

3. **EN only in shipped docs.** Every file that ships in the repo (skills, foundations, examples, README) is in English. Internal planning notes that don't ship may be in any language.

4. **Iron Laws apply to ourselves.** Every change to a skill or to the framework is subject to the eight Iron Laws. Iron Law 1: no `_(pendiente)_` markers in shipped foundations. Iron Law 7: voice scorers ship with golden samples or not at all.

## Voice

Strong, opinionated, concrete. Quotes specific failure modes. Names trade-offs by their first name. No corporate hedging. No "consider the implications." No "this skill helps you to..." — say what it does.

When in doubt, read `lenses/operator.md` aloud. That's the voice.

## Repo map

```
agentstack/
├── README.md, LICENSE, CHANGELOG, VERSION       # marketing + meta
├── ETHOS.md, IRON-LAWS.md, DECISION-PRINCIPLES.md  # philosophy
├── SKILL.md                                     # root agentstack skill
├── ARCHITECTURE.md, CONTRIBUTING.md, CLAUDE.md  # docs
├── lenses/                                      # 4 review personalities
├── <skill-name>/SKILL.md                        # each skill is a folder
├── framework/                                   # @agentstack/framework (npm)
├── create-agentstack/                           # scaffolder (npm)
├── examples/                                    # canonical companies
├── bin/                                         # helper scripts
├── setup/                                       # install.sh, uninstall.sh
└── scripts/                                     # gen-skill-docs, validators
```

## Adding a new skill

1. Create `<name>/` at the repo root.
2. Add `SKILL.md` with the frontmatter format documented in `ARCHITECTURE.md`.
3. Update `setup/install.sh` if needed (the installer auto-discovers folders with `SKILL.md`).
4. Add an entry to the README skills table.
5. Update `CHANGELOG.md` under `[Unreleased] / Added`.
6. Run the equivalent of `/agentstack-validate` on your own change.

## Adding a new lens

Lenses are personalities, not roles. Each lens needs:

1. A real-world archetype (10+ years experience, real scars).
2. A tone signature (a quote that captures the voice).
3. 3–6 things they look at, in order.
4. 2–4 selectable modes.
5. An output format with severity / score.
6. 5+ "automatic flags" — failure patterns they call out without being asked.

A lens that lacks any of these is incomplete. Don't ship.

## Testing

Each skill should eventually have:

- A frontmatter validation test (schema is valid)
- A routing test (the trigger phrases actually route here)
- An e2e test against a fixture company

For v0.1 these are aspirational. v0.2 they become Iron Law candidates.

## When you ship

A commit to this repo is a commit to public OSS. Before merging:

- [ ] No real client / personal names
- [ ] EN throughout
- [ ] CHANGELOG updated
- [ ] No `_(pendiente)_` in foundations
- [ ] Voice consistent with `lenses/operator.md`
- [ ] Skill frontmatter parses
- [ ] If new skill: entry in README skills table

## When in doubt

Read `ETHOS.md`. Then read the lens that matches the concern (`compliance` for legal, `operator` for code, `lead-user` for prose, `stakeholder` for scope). They have opinions. Use them.
