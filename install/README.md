# agentstack-skills

One-line installer for the [agentstack](https://github.com/agentpilled/agentstack) Claude Code skills.

## Usage

```bash
npx agentstack-skills
```

That's it. The installer:

1. Looks up the latest released tag of `agentpilled/agentstack` on GitHub
2. Downloads and extracts that tag
3. Copies all 9 skills (the root dispatcher + 8 slash commands) into `~/.claude/skills/agentstack*`

Restart Claude Code afterward and verify with `/agentstack-validate`.

## Subcommands and flags

```bash
# install (default action)
npx agentstack-skills
npx agentstack-skills install

# install from a specific tag or branch
npx agentstack-skills install --ref v0.1.2
npx agentstack-skills install --ref main

# preview without writing
npx agentstack-skills install --dry-run

# install to a different location
npx agentstack-skills install --skills-dir ~/my-claude/skills

# uninstall everything this package installed
npx agentstack-skills uninstall

# print the installer's own version
npx agentstack-skills version
```

## Requirements

- Node.js ≥ 22.13
- `curl` and `tar` on PATH (default on macOS / Linux)
- Claude Code installed (i.e. `~/.claude/` exists)

## Why a separate package

agentstack ships in three pieces, each doing one job:

- [`agentstack-framework`](https://www.npmjs.com/package/agentstack-framework) — the runtime primitives (`buildAgentConfig`, `companyMemory`, scorers, `agentstack` CLI for scaffolding companies/agents)
- [`create-agentstack`](https://www.npmjs.com/package/create-agentstack) — the agency repo scaffolder (`pnpm create agentstack <name>`)
- **`agentstack-skills`** (this package) — installs the Claude Code slash commands to your machine

The skills are *meta-tooling* — they live in `~/.claude/skills/`, not in your project's `node_modules`. So they need their own delivery mechanism. This package is that mechanism.

## License

MIT.
