# agentstack

> **The Rails for AI agencies.** Multi-tenant by default.

If you build AI agents for more than one client, you've solved the same five problems N times: how to keep voice consistent, how to scope memory and RAG, how to enforce review, how to ship without breaking other clients, how to measure quality. agentstack solves them once.

agentstack is an opinionated workflow for building production AI agents at scale across multiple clients. It turns Claude Code into your agency's playbook: an architect who scaffolds the company, a designer who locks the voice, an engineer who writes the state machine, a lawyer who reviews the disclosure, and a release manager who ships the PR. **Eight slash commands. Four review lenses. Eight Iron Laws.**

Built on [Mastra](https://mastra.ai). MIT.

---

## What you can do in 12 minutes

```bash
# Scaffold a new agency repo
$ pnpm create agentstack my-agency
$ cd my-agency

# Onboard a new client
$ claude
> /agentstack-new-company acme-creators
# [interview, CONTEXT.md + INTEGRATIONS.md filled]

# Build a production-ready agent for them
> /agentstack-autoplan setter for acme-creators
# [runs four-lens review → scaffolds agent → drafts tools, role, scorers]
# [surfaces three taste calls; you decide]

# Verify against golden inputs
> /agentstack-qa acme-creators/ig-setter

# Ship
> /agentstack-ship-agent acme-creators/ig-setter
# [creates PR with review comments from each lens]
```

12 minutes from "we need a setter for this client" to "PR with four-lens review attached."

---

## Install — 30 seconds

Requirements: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Node.js 22.13+.

```bash
npx agentstack-skills
```

That fetches the latest released tag of this repo from GitHub and copies the eight skills + root dispatcher to `~/.claude/skills/agentstack-*`. Restart Claude Code or open a new project.

To pin to a specific version, install from `main`, or uninstall — see the [`agentstack-skills` readme](https://www.npmjs.com/package/agentstack-skills).

<details>
<summary>Alternative: install from a local clone (for contributing to agentstack itself)</summary>

```bash
git clone https://github.com/agentpilled/agentstack.git ~/agentstack
cd ~/agentstack && bash setup/install.sh
```

</details>

Verify:

```
> /agentstack-validate
```

**Next:** follow the [getting-started walkthrough](docs/getting-started.md) — 6 steps, ~10 minutes, from a fresh clone to your first running agent.

---

## Skills

| Slash command | What it does |
|---|---|
| `/agentstack-new-company` | Interview + scaffold a new client workspace (CONTEXT, INTEGRATIONS, env) |
| `/agentstack-new-agent` | Interview + scaffold an agent for an existing company |
| `/agentstack-validate` | Run the 8 Iron Laws against the repo |
| `/agentstack-plan-review` | Four-lens review of an agent spec |
| `/agentstack-autoplan` | The killer. Spec → 4 reviews → scaffold → drafts. Auto-decides via 6 principles |
| `/agentstack-qa` | Replay golden inputs, score, fix iteratively |
| `/agentstack-learn` | Extract patterns post-build, propose updates to SKILL/IRON-LAWS |
| `/agentstack-ship-agent` | Validate → review → register → tests → PR |

---

## Foundations

Read in this order:

1. **`ETHOS.md`** — what we believe and what we reject
2. **`IRON-LAWS.md`** — eight invariants nothing ships without
3. **`DECISION-PRINCIPLES.md`** — six principles `/agentstack-autoplan` uses to auto-resolve
4. **`lenses/`** — four review personalities (operator, lead-user, stakeholder, compliance)
5. **`SKILL.md`** — the six conventions every agentstack repo follows
6. **`ARCHITECTURE.md`** — repo shape, the agent journey, package model

---

## Examples

Two canonical demo companies, each with one production-grade agent:

- **`examples/acme-creators/`** — agency-managed personal-brand creator (Instagram setter)
- **`examples/stark-distributors/`** — B2B distributor (stock/inventory assistant)

Read these before building. They are the source of truth for what good looks like.

---

## Why agentstack and not [thing]

| | Foco | What it doesn't do |
|---|---|---|
| Mastra | Agent runtime primitives | Single-tenant. No build workflow |
| LangGraph | Graph orchestration | Lower-level. No tenancy model |
| CrewAI | Multi-agent within one project | Not multi-client |
| **agentstack** | **Multi-client agent workflow + framework** | (the wedge) |

agentstack is for agencies, consultancies, internal AI teams, and anyone who builds agents for more than one stakeholder.

---

## Contributing

PRs welcome. See `CONTRIBUTING.md`. Iron Laws apply to contributions.

---

## License

MIT — see `LICENSE`.
