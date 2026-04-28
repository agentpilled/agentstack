/**
 * no_fabrication — flags entity references in the output that don't appear in
 * the provided context. Iron Law 4 enforcement at scoring time.
 *
 * The classic failure mode: agent confidently mentions an SKU, shipment ID,
 * order number, or ticket number that doesn't exist. Pure regex extraction +
 * substring check against the context — no LLM needed for the common case.
 *
 * What it catches:
 *   ✓ "Tu orden 2024-ABC123 está demorada" when 2024-ABC123 isn't in RAG
 *   ✓ "El SKU XYZ-456 está sin stock" when XYZ-456 isn't in RAG
 *   ✓ "Ticket #98765" when no such ticket exists in context
 *
 * What it does NOT catch (needs LLM judge — v0.2):
 *   ✗ Plausible-sounding policies the agent invented in plain prose
 *   ✗ Wrong-but-real entities (SKU exists but not in this user's account)
 *   ✗ Numerical fabrication ("the price is $42" when no price is in context)
 *
 * @example
 *   const scorer = noFabrication({ allowlist: ['ACME-001', 'ACME-002'] })
 *   const r = scorer.score({
 *     context: ragSnippet,
 *     output: agent.response,
 *   })
 *   if (!r.passed) console.error('fabricated:', r.findings)
 */

const DEFAULT_PATTERNS: RegExp[] = [
  // SKU-like: ABC-1234, ACME-001, SHP-12345
  /\b[A-Z]{2,6}-\d{2,8}\b/g,
  // Year-prefixed order numbers: 2024-ABC123
  /\b(?:19|20)\d{2}-[A-Z0-9]{3,10}\b/g,
  // Ticket / reference numbers prefixed with #: #12345
  /#\d{3,10}\b/g,
  // UUID-like: 550e8400-e29b-41d4-a716-446655440000
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
]

export interface NoFabricationOptions {
  /** Patterns to extract entity references from output. Defaults cover SKUs, order #s, ticket #s, UUIDs. */
  patterns?: RegExp[]
  /** Strings explicitly allowed even if not in context (e.g., generic categories the agent always knows). */
  allowlist?: string[]
}

export interface NoFabricationResult {
  score: 0 | 1
  passed: boolean
  findings: string[]
}

export function noFabrication(opts: NoFabricationOptions = {}) {
  const patterns = opts.patterns ?? DEFAULT_PATTERNS
  const allow = new Set((opts.allowlist ?? []).map((s) => s.toLowerCase()))

  return {
    name: 'no_fabrication',
    description:
      'Flags entity references (SKUs, order numbers, ticket numbers, UUIDs) in the output that don\'t appear in the provided context. Iron Law 4 enforcement.',
    score(args: { context: string; output: string }): NoFabricationResult {
      const ctx = (args.context ?? '').toLowerCase()
      const out = args.output ?? ''
      const findings: string[] = []
      const seen = new Set<string>()

      for (const re of patterns) {
        // Each call to matchAll requires a fresh iterator
        for (const m of out.matchAll(re)) {
          const candidate = m[0]
          const key = candidate.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          if (allow.has(key)) continue
          if (!ctx.includes(key)) {
            findings.push(candidate)
          }
        }
      }

      const passed = findings.length === 0
      return { score: passed ? 1 : 0, passed, findings }
    },
  }
}
