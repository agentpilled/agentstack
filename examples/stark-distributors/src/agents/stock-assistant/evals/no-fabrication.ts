/**
 * Custom scorer: no_fabrication
 *
 * Iron Law 4 enforcement at the output layer. The agent must not invent SKUs,
 * lot numbers, or shipment IDs. If the underlying tool calls returned no
 * results, the agent says "no record found" — it does not synthesize one.
 *
 * v0.1 implementation: detects SKU-like patterns in the output and verifies
 * each was either present in the user's input or in the eval's `known_skus`
 * array. Tightened rules can layer on later.
 */

const SKU_RE = /\b(BLT|NUT|WSH|LWS|SCR|STD|THR)-[A-Za-z0-9./-]+\b/g
const SHIPMENT_RE = /\bSHP-\d{4,6}\b/g
const LOT_RE = /\blot[\s#:]+(\d{3,6})\b/gi

export interface NoFabricationResult {
  score: 0 | 1
  passed: boolean
  findings: string[]
}

export function noFabrication() {
  return {
    name: 'no_fabrication',
    description:
      'Iron Law 4: flags SKUs / shipment IDs / lot numbers in output that did not appear in input or in known_skus.',
    score(args: {
      input: string
      output: string
      knownSkus?: string[]
      knownShipments?: string[]
      knownLots?: string[]
    }): NoFabricationResult {
      const findings: string[] = []
      const input = args.input ?? ''
      const output = args.output ?? ''

      const allowedSkus = new Set([
        ...Array.from(input.matchAll(SKU_RE)).map((m) => m[0]),
        ...(args.knownSkus ?? []),
      ])
      for (const m of output.matchAll(SKU_RE)) {
        if (!allowedSkus.has(m[0])) findings.push(`fabricated SKU: ${m[0]}`)
      }

      const allowedShipments = new Set([
        ...Array.from(input.matchAll(SHIPMENT_RE)).map((m) => m[0]),
        ...(args.knownShipments ?? []),
      ])
      for (const m of output.matchAll(SHIPMENT_RE)) {
        if (!allowedShipments.has(m[0])) findings.push(`fabricated shipment ID: ${m[0]}`)
      }

      const allowedLots = new Set(args.knownLots ?? [])
      for (const m of output.matchAll(LOT_RE)) {
        const lotNum = m[1]!
        if (!allowedLots.has(lotNum)) findings.push(`fabricated lot number: ${lotNum}`)
      }

      const passed = findings.length === 0
      return { score: passed ? 1 : 0, passed, findings }
    },
  }
}
