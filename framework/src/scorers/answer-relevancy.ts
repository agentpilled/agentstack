/**
 * answer_relevancy — heuristic check that the agent produced a substantive response.
 *
 * v0.1 catches the cheap failure modes: empty output, output below a length
 * threshold, output that matches a "non-answer" pattern (refusals, single
 * affirmations, stock evasions). It does NOT measure semantic relevance to
 * the question — that requires an LLM judge and lives in v0.2.
 *
 * Use this as one of your three Iron Law 2 scorers. It catches "the agent
 * gave up" without needing an LLM in the loop.
 *
 * @example
 *   const scorer = answerRelevancy({ minLength: 30 })
 *   const r = scorer.score({ output: agent.response })
 *   if (!r.passed) console.error('non-answer:', r.reason)
 */

const DEFAULT_NON_ANSWER_PATTERNS: RegExp[] = [
  // English
  /^\s*i (don'?t |do not )?(know|understand)\s*\.?\s*$/i,
  /^\s*i can'?t help\s*\.?\s*$/i,
  /^\s*sorry,? i can'?t\s*\.?\s*$/i,
  // Spanish
  /^\s*no (lo )?(sé|se|entiendo)\s*\.?\s*$/i,
  /^\s*no puedo (ayudarte)?\s*\.?\s*$/i,
  /^\s*no tengo (esa )?(info|información)\s*\.?\s*$/i,
  // single-word affirmations as full responses
  /^\s*(yes|no|sí|si|ok|okay|claro)\s*\.?\s*$/i,
]

export interface AnswerRelevancyOptions {
  /** Minimum output length in characters. Below this counts as non-substantive. Default: 20 */
  minLength?: number
  /** Patterns whose match means a non-answer. Defaults cover common refusals (en/es). */
  nonAnswerPatterns?: RegExp[]
}

export interface AnswerRelevancyResult {
  score: 0 | 1
  passed: boolean
  reason: string
}

export function answerRelevancy(opts: AnswerRelevancyOptions = {}) {
  const minLength = opts.minLength ?? 20
  const patterns = opts.nonAnswerPatterns ?? DEFAULT_NON_ANSWER_PATTERNS

  return {
    name: 'answer_relevancy',
    description:
      'Heuristic check that the output is a substantive response (non-empty, not a stock refusal, above minimum length). v0.1 is heuristic-only; semantic relevance scoring requires an LLM judge (v0.2).',
    score(args: { output: string }): AnswerRelevancyResult {
      const out = (args.output ?? '').trim()

      if (out.length === 0) {
        return { score: 0, passed: false, reason: 'empty output' }
      }
      if (out.length < minLength) {
        return {
          score: 0,
          passed: false,
          reason: `output below minLength (${out.length} < ${minLength}): "${out.slice(0, 80)}"`,
        }
      }
      for (const re of patterns) {
        if (re.test(out)) {
          return {
            score: 0,
            passed: false,
            reason: `output matches non-answer pattern ${re}`,
          }
        }
      }
      return { score: 1, passed: true, reason: 'substantive response' }
    },
  }
}
