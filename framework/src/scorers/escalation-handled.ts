/**
 * escalation_handled — when context is sparse, the agent must escalate
 * explicitly instead of improvising. Iron Law 4 complement (no_fabrication
 * looks at false specifics; this looks at false confidence).
 *
 * The classic failure mode pair:
 *   - RAG hit nothing → agent should say "I don't have that info, escalating"
 *   - Instead, agent invents a plausible answer
 *
 * Heuristic: if context is below threshold (effectively empty), the output
 * must match an escalation pattern (English / Spanish defaults). Otherwise,
 * it's a fabrication risk.
 *
 * Limits: this is a coarse safety net. A real "agent escalated correctly"
 * judge needs an LLM. v0.2 will graduate this to an LLM-judge variant.
 *
 * @example
 *   const scorer = escalationHandled({ emptyContextThreshold: 80 })
 *   const r = scorer.score({
 *     context: ragSnippet,
 *     output: agent.response,
 *   })
 *   if (!r.passed) console.error('failed to escalate:', r.reason)
 */

const DEFAULT_ESCALATION_PATTERNS: RegExp[] = [
  // English
  /\bescalat(e|ed|ing)\b/i,
  /\bi don'?t have (that|this|enough) (info|information|data)\b/i,
  /\bnot in (my |the )?(context|knowledge|database|records)\b/i,
  /\blet me check with (the |my )?(team|operator|colleague)\b/i,
  /\bi'?ll (need to |have to )?(forward|escalate|pass) (this|that)\b/i,
  // Spanish
  /\bescal(ar|o|amos)\b/i,
  /\bno tengo (esa |la )?(info|información|data)\b/i,
  /\bpaso (esto )?al equipo\b/i,
  /\bte (lo )?paso (con|al) (sam|operador|equipo|alguien)\b/i,
  /\bdéjame (consultar|chequear|verificar)\b/i,
  /\bvoy a (consultar|chequear|verificar)\b/i,
]

export interface EscalationHandledOptions {
  /**
   * Context length (in chars, after trim) below which we expect escalation.
   * Default: 100. Tune to your RAG chunk shape — if your chunks are tiny,
   * lower this; if they're huge, raise it.
   */
  emptyContextThreshold?: number
  /** Patterns that count as proper escalation. Defaults cover common en/es phrases. */
  escalationPatterns?: RegExp[]
}

export interface EscalationHandledResult {
  score: 0 | 1
  passed: boolean
  reason: string
}

export function escalationHandled(opts: EscalationHandledOptions = {}) {
  const threshold = opts.emptyContextThreshold ?? 100
  const patterns = opts.escalationPatterns ?? DEFAULT_ESCALATION_PATTERNS

  return {
    name: 'escalation_handled',
    description:
      'When the provided context is sparse, the output must explicitly escalate (cannot answer from knowledge) instead of improvising. Iron Law 4 complement.',
    score(args: { context: string; output: string }): EscalationHandledResult {
      const ctx = (args.context ?? '').trim()
      const out = (args.output ?? '').trim()

      if (ctx.length >= threshold) {
        return {
          score: 1,
          passed: true,
          reason: `context sufficient (${ctx.length} ≥ ${threshold}) — no escalation expected`,
        }
      }

      const escalated = patterns.some((re) => re.test(out))
      if (escalated) {
        return {
          score: 1,
          passed: true,
          reason: `sparse context (${ctx.length} chars), agent escalated`,
        }
      }
      return {
        score: 0,
        passed: false,
        reason: `sparse context (${ctx.length} chars) but output did not escalate — fabrication risk`,
      }
    },
  }
}
