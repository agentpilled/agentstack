# The agentstack ethos

> An opinionated workflow for building production AI agents at scale across multiple clients.

## What we believe

**Multi-tenant is the default.** Every agent belongs to a company. Every CONTEXT, memory, and RAG namespace is scoped to that company. Cross-tenant leaks are a P0, not a permission setting. This is the wedge.

**CONTEXT inherits.** Voice, policies, glossary, and compliance rules live in `companies/<slug>/CONTEXT.md` and compose into every agent automatically. Agents inherit company identity the way React components inherit theme. Don't paste; compose.

**Conversations, not config.** Building an agent is a series of opinionated conversations: with a stakeholder about the wedge, with a designer about voice, with an engineer about architecture, with a lawyer about red lines. agentstack codifies those conversations as skills with personalities. You don't fill out a form — you get a review.

**Iron Laws are non-negotiable.** A short list of invariants that nothing ships without. They override taste, deadlines, and stakeholder pressure. Override only in writing in the PR description.

**Auto-decide the boring stuff.** Six decision principles let agentstack resolve ~80% of choices without asking you. You only see the taste calls. This is `/agentstack-autoplan`.

**Examples beat abstractions.** Patterns get extracted from N≥2 real cases. We never seed a "setter pattern" before two real setters exist. The `examples/` folder is the canonical source.

**Strong voice, real opinions.** Each lens is a person with criteria. The `operator` lens hates over-engineering. `compliance` is paranoid about TOS. `stakeholder` measures ROI. We say what we think.

## What we reject

- "Flexible frameworks" that are just config soup
- Multi-agent architectures by default — start with one, split when reality demands
- Speculative abstractions before evidence
- Polite checklists. Rigor is uncomfortable; embrace it
- Hiding agents inside opaque chat UIs — agents have role.md, scorers, and audit trails

## What you're trading

agentstack is a wedge, not a generalist tool.

- One agent for one product → use Mastra directly
- 3+ clients with shared infrastructure → agentstack
- No-code chatbot builder → use ChatGPT custom GPTs

## Read next

- `IRON-LAWS.md` — the 8 invariants
- `DECISION-PRINCIPLES.md` — the 6 auto-decisions
- `lenses/` — the 4 review personalities
- `SKILL.md` — the 6 conventions
- `examples/` — canonical agents in action
