/**
 * Custom scorer: tone_matches_acme
 *
 * Iron Law 7 satisfied: ships with N≥3 golden samples in `shared/rag/voice-samples.md`.
 *
 * v0.1 implementation: regex-based detection of the loud anti-patterns explicitly
 * called out in CONTEXT.md "Avoid". This catches obvious voice violations without
 * needing an embedding model.
 *
 * v0.2+ planned: embedding-based similarity vs. voice-samples.md + LLM-judge for
 * subtler drift. Until then, this stub catches the violations that account for
 * ~80% of complaints in early review passes.
 */

interface AntiPattern {
  re: RegExp
  finding: string
}

const ANTI_PATTERNS: AntiPattern[] = [
  // Banned openers
  { re: /^\s*hello[!\s,]/i, finding: '"Hello" opener (CONTEXT: avoid)' },
  { re: /^\s*hi there/i, finding: '"Hi there" opener (CONTEXT: avoid)' },
  { re: /^\s*greetings/i, finding: '"Greetings" opener (corporate)' },

  // Filler greetings
  { re: /\bi hope you'?re doing well\b/i, finding: 'filler greeting (CONTEXT: avoid)' },
  { re: /\bthanks for reaching out\b/i, finding: 'corporate filler (CONTEXT: avoid)' },
  { re: /\bthank you for your message\b/i, finding: 'corporate filler' },

  // Hedging adverbs (CONTEXT explicitly bans these)
  { re: /\bdefinitely\b/i, finding: 'hedging adverb "definitely" (CONTEXT: avoid)' },
  { re: /\babsolutely\b/i, finding: 'hedging adverb "absolutely" (CONTEXT: avoid)' },

  // Motivational language
  { re: /\bamazing\b/i, finding: 'motivational adjective "amazing" (CONTEXT: avoid)' },
  { re: /\bawesome\b/i, finding: 'motivational adjective "awesome" (CONTEXT: avoid)' },
  { re: /\byou got this\b/i, finding: 'motivational filler (CONTEXT: avoid)' },

  // Generic CTAs
  {
    re: /\blet me know if you have any questions\b/i,
    finding: 'soulless closing (CONTEXT: avoid)',
  },

  // Em-dash overuse: more than 2 em dashes in a single output
  // (handled below in the score function — RegExp .test counts is awkward)
]

export interface ToneScorerResult {
  score: 0 | 1
  passed: boolean
  findings: string[]
}

export function toneMatchesAcme() {
  return {
    name: 'tone_matches_acme',
    description:
      "Voice fidelity scorer for acme-creators. Iron Law 7 satisfied via voice-samples.md (N=4). v0.1: regex-based anti-pattern detection.",
    score(args: { output: string }): ToneScorerResult {
      const findings: string[] = []
      const out = args.output ?? ''

      for (const { re, finding } of ANTI_PATTERNS) {
        if (re.test(out)) findings.push(finding)
      }

      // Em-dash overuse: more than 2 em dashes
      const emDashCount = (out.match(/—/g) ?? []).length
      if (emDashCount > 2) {
        findings.push(`em-dash overuse (${emDashCount} found, max 2)`)
      }

      // Length: replies over 4 sentences are usually too long for Sam's voice
      const sentenceCount = (out.match(/[.!?]+(\s|$)/g) ?? []).length
      if (sentenceCount > 4) {
        findings.push(`reply too long (${sentenceCount} sentences, max ~3)`)
      }

      const passed = findings.length === 0
      return { score: passed ? 1 : 0, passed, findings }
    },
  }
}
