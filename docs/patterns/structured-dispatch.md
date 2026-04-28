# Pattern: Structured-output + deterministic dispatch

> When to let the LLM call tools, and when to make it classify only.

This is one of the choices that shapes how an agent behaves under pressure. There are two patterns. They're not interchangeable — picking the wrong one for your case produces a class of bugs that's hard to debug.

## Pattern A — LLM calls tools (the default)

The agent has tools wired in. It decides when to call them. Mastra's `Agent` constructor + `tools: { ... }` is built for this.

```ts
export const igSetterAgent = new Agent({
  ...config,
  memory,
  tools: {
    get_lead:           getLead,
    upsert_lead:        upsertLead,
    send_calendly:      sendCalendly,
    escalate_silently:  escalateSilently,
  },
})
```

The agent's reasoning loop decides *if* and *when* to call each tool, often interleaved with text. It's the right default — you'd expect this when reading the Mastra docs.

**Use this when:**

- The agent's job genuinely requires conditional, mid-conversation decisions about which tools to call
- The output space is open (creative drafting, multi-turn conversation, exploratory queries)
- You can ship side-effect tools with `requireApproval: true` (Iron Law 6) so a human gates the writes
- The set of tools is small (≤4) and the agent's role.md gives clear guidance about when each fires

**Example: `examples/acme-creators/src/agents/ig-setter/`** — Instagram setter agent. The LLM decides per-message whether to qualify, send Calendly, escalate, or just reply. Tools are wired in directly. Side-effect tools all set `requireApproval: true`.

## Pattern B — Structured output, deterministic dispatch

The agent has **no tools**. Its only job is to produce a structured output (zod schema). A separate runner — yours, not Mastra's — reads the output and dispatches side effects deterministically based on the classification.

```ts
// agent.ts
export const triageOutputSchema = z.object({
  classification: z.enum(['respond', 'read-only', 'archive', 'escalate']),
  reason: z.string(),
  draftBody: z.string().nullable(),
})

export const emailTriagerAgent = new Agent({
  ...config,
  model: openai('gpt-4o-mini'),
  memory,
  tools: {},  // ← deliberately empty
})

// scripts/run-triage.ts (the runner)
const result = await emailTriagerAgent.generate(userPrompt, {
  structuredOutput: { schema: triageOutputSchema },
  memory: { thread, resource },
})

const output = result.object
const plan = planForClassification(output.classification)
//        ↑ pure deterministic function — no LLM in the loop

await applyGmailLabels(messageId, plan.addLabels)
if (plan.shouldArchive) await archiveGmailThread(threadId)
if (plan.shouldDraft)   await createGmailDraft(messageId, output.draftBody)
```

The LLM does the *judgment* (classify + draft). The runner does the *action*.

**Use this when:**

- The output space is small and enumerable (4 classifications, 6 statuses, 3 ticket priorities)
- A classification → wrong-tool-call would be a P0 bug (LLM says "read-only" but calls `archive_thread` anyway — yes, this happens)
- The dispatch logic is mechanical: classification X → side effects {Y, Z}. No conditional reasoning needed at action time.
- You want the runner's behavior to be auditable and unit-testable independently of the LLM

**Example: `mati-clase/companies/maticarrera/src/agents/email-triager/`** — email triager. 4 classifications (`respond`, `read-only`, `archive`, `escalate`). The agent emits classification + (optionally) draft body. The runner applies Gmail labels, archives threads, creates drafts. No tool calls from the LLM at all.

## How to choose

| Question | If yes → A | If yes → B |
|---|---|---|
| Can a misclassified action cause real damage (sent message, archived important thread, charged customer)? | | ✓ |
| Is the output space enumerable in 3-7 categories? | | ✓ |
| Does the agent need to call multiple tools in one turn, in a sequence the LLM decides? | ✓ | |
| Is the conversation multi-turn with the agent reacting to tool outputs? | ✓ | |
| Are side effects gated by external approval (`requireApproval: true`)? | ✓ | (less critical here) |
| Do you want unit tests on the dispatch behavior independent of the LLM? | | ✓ |

If you're unsure, **start with Pattern B** for any agent whose first failure mode is "agent did the wrong action." It's easier to relax to Pattern A later than to recover trust after a bad write.

## Hybrid: classification → handoff to a tool-calling agent

The two patterns can compose. A common shape:

1. Classifier agent (Pattern B) decides *which kind of work* this is
2. Runner routes to one of N specialist agents (Pattern A) that have the right tools

This is the agent-of-agents shape. Don't reach for it until you have ≥2 specialist agents you'd actually route to — premature multi-agent architectures are listed as an anti-pattern in [`ETHOS.md`](../../ETHOS.md).

## What this pattern does NOT solve

- **Hallucinated structured fields**: the LLM can still return a `draftBody` that mentions a customer name or order number that doesn't exist. Use the `noFabrication` scorer (Iron Law 4) to catch this at QA time.
- **Wrong classification with high confidence**: the LLM can be wrong AND certain. Pattern B doesn't grade the classification — it just trusts it. Catch wrong classifications with goldens (`/agentstack-qa`) and a `classification_correct` scorer that checks each fixture's expected vs. actual classification.
- **Drift in the dispatch table**: if you add a 5th classification later, you must update both the schema enum AND the dispatch function. Tests on the dispatch function should fail-loud when the enum gains a member it doesn't handle.

## Iron Laws relationship

- **Iron Law 5 — state machines stay legible**: Pattern B's dispatch table IS the state machine. If your `planForClassification` switch is hard to read, the agent is probably doing two jobs.
- **Iron Law 6 — side-effect tools require approval**: Pattern B sidesteps this by NOT giving the agent side-effect tools. Approval lives in the runner (you). For Pattern A, this stays in force per-tool.

## When you've outgrown Pattern B

The code smell: your runner becomes a multi-step orchestrator that reads the agent's output, makes another decision, calls another tool, reads another agent's output. That's a workflow engine. At that point either:

- Move the orchestration into a Mastra workflow (which is what Mastra workflows are for)
- Or split into multiple agents (Pattern A composition) with explicit handoffs

You're no longer in "structured-output dispatch" land — you're in coordination land, which is a different problem.
