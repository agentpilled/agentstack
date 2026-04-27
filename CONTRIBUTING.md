# Contributing to agentstack

PRs welcome. Iron Laws apply.

## What we'd love

- **New examples.** A canonical company in a vertical we don't cover yet (legal, medical, real estate, ecommerce). Two real agents, scorers, and a `README.md` explaining the wedge.
- **Lens improvements.** A lens with sharper modes or a new automatic flag pattern. Bonus: with a real failure case it would have caught.
- **Skill bug fixes.** A skill that misroutes, hallucinates, or violates an Iron Law in a specific scenario.
- **Framework primitives.** A scorer, memory helper, or RAG utility that's already shipping in two real agencies.
- **Documentation.** A clearer ETHOS, a sharper README hook, a missing piece of `ARCHITECTURE.md`.

## What we'd love less

- **New skills with no track record.** Show us where you've used the workflow on real builds before adding new commands.
- **"Refactors" that are taste-only.** Pulling apart files because they look unfamiliar isn't an improvement.
- **Adding flexibility / config.** agentstack is opinionated by design. If you need flexibility, you might be at the wrong layer.
- **Dependency additions.** Each new dep is a vendor commitment. We say no by default.

## How to PR

1. **Open an issue first** for non-trivial changes. We'd rather hash out the design before you've written code.
2. **One concern per PR.** A skill change is one PR. A doc improvement is another. Don't bundle.
3. **Iron Laws apply to your change too.** A new skill ships with frontmatter complete, EN, voice consistent, and at least a routing test.
4. **CHANGELOG.md entry** under `[Unreleased]`. Categorize: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.
5. **No real names.** This repo is anonymous. Don't add `Author: <Real Name>` anywhere. Use GitHub-noreply emails for commits.

## Iron Law overrides

Sometimes a Law has to bend. The mechanism:

1. In your PR description, add a section: `## Iron Law Override`
2. Specify which Law (1–8), what you're overriding, and the **specific reason**.
3. Tag a maintainer.
4. If accepted, the override is logged in `CHANGELOG.md` so we learn from it.

Examples of accepted overrides (so far): none. We'd like to keep it that way.

## Commit messages

Format: `<area>: <what changed>`. Examples:

- `framework: add policy_violation scorer`
- `skill(autoplan): handle missing CONTEXT gracefully`
- `lens(compliance): COPPA flag for child-adjacent agents`
- `docs(ethos): tighten the wedge paragraph`
- `examples(acme-creators): add boundaries to ig-setter role`

Keep them short. The PR description has the room.

## Voice in contributed prose

If you contribute prose (READMEs, ETHOS, skill descriptions, lenses), match the existing voice:

- Direct. Cuts the yist.
- Names specific failure modes.
- No corporate hedging.
- No "consider the implications" / "may want to think about" / "depending on the use case."
- No emojis (except where actively useful, which is approximately never).

If you find yourself writing *"This module empowers users to..."* — stop. Start over.

## Code of Conduct

Be kind. Argue ideas, not people. If someone's wrong, show your work. If you're wrong, say so. The Iron Laws apply to discourse too.

## License

By contributing, you agree your contributions will be licensed under MIT (the project's license).
