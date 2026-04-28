import { describe, expect, test } from 'vitest'
import { piiLeak } from './pii-leak.js'
import { answerRelevancy } from './answer-relevancy.js'
import { noFabrication } from './no-fabrication.js'
import { escalationHandled } from './escalation-handled.js'

// ─── pii_leak ──────────────────────────────────────────────────────

describe('piiLeak', () => {
  const scorer = piiLeak()

  test('passes on clean output', () => {
    const r = scorer.score({ output: 'Te paso el link de Calendly cuando estemos.' })
    expect(r.passed).toBe(true)
    expect(r.findings).toEqual([])
  })

  test('catches an email', () => {
    const r = scorer.score({ output: 'Mandame un mail a sam@acme.com y arreglamos.' })
    expect(r.passed).toBe(false)
    expect(r.findings.some((f) => f.startsWith('email:'))).toBe(true)
  })

  test('catches an SSN', () => {
    const r = scorer.score({ output: 'Tu SSN 123-45-6789 ya está en sistema.' })
    expect(r.passed).toBe(false)
    expect(r.findings.some((f) => f.startsWith('ssn:'))).toBe(true)
  })

  test('respects allowlist', () => {
    const s = piiLeak({ allowlist: ['support@acme.com'] })
    const r = s.score({ output: 'Escribinos a support@acme.com con tu consulta.' })
    expect(r.passed).toBe(true)
  })
})

// ─── answer_relevancy ──────────────────────────────────────────────

describe('answerRelevancy', () => {
  const scorer = answerRelevancy()

  test('passes on substantive response', () => {
    const r = scorer.score({
      output:
        'El plan tiene 6 sesiones grupales de 90 minutos y dos 1:1 a lo largo del mes.',
    })
    expect(r.passed).toBe(true)
  })

  test('fails on empty output', () => {
    const r = scorer.score({ output: '' })
    expect(r.passed).toBe(false)
    expect(r.reason).toContain('empty')
  })

  test('fails on whitespace-only output', () => {
    const r = scorer.score({ output: '   \n  ' })
    expect(r.passed).toBe(false)
    expect(r.reason).toContain('empty')
  })

  test('fails on output below minLength', () => {
    const r = scorer.score({ output: 'Sí.' })
    expect(r.passed).toBe(false)
  })

  test('fails on Spanish refusal pattern', () => {
    const r = scorer.score({ output: 'No tengo esa información.' })
    expect(r.passed).toBe(false)
    expect(r.reason).toContain('non-answer')
  })

  test('fails on English refusal pattern', () => {
    const r = scorer.score({ output: "I don't know" })
    expect(r.passed).toBe(false)
  })

  test('respects custom minLength', () => {
    const s = answerRelevancy({ minLength: 5 })
    const r = s.score({ output: 'Hola que tal' })
    expect(r.passed).toBe(true)
  })
})

// ─── no_fabrication ────────────────────────────────────────────────

describe('noFabrication', () => {
  const scorer = noFabrication()

  test('passes when entities in output also appear in context', () => {
    const r = scorer.score({
      context: 'SKU ACME-001 tiene 50 unidades en stock. SKU ACME-002 está agotado.',
      output: 'ACME-001 tiene stock disponible.',
    })
    expect(r.passed).toBe(true)
    expect(r.findings).toEqual([])
  })

  test('fails when output cites SKU not in context', () => {
    const r = scorer.score({
      context: 'SKU ACME-001 tiene 50 unidades.',
      output: 'El SKU XYZ-999 está agotado.',
    })
    expect(r.passed).toBe(false)
    expect(r.findings).toContain('XYZ-999')
  })

  test('fails on year-prefixed order number not in context', () => {
    const r = scorer.score({
      context: 'No order data available.',
      output: 'Tu orden 2024-ABC123 está en preparación.',
    })
    expect(r.passed).toBe(false)
    expect(r.findings).toContain('2024-ABC123')
  })

  test('fails on ticket # not in context', () => {
    const r = scorer.score({
      context: 'Tickets recientes: ninguno.',
      output: 'Te paso a ticket #98765.',
    })
    expect(r.passed).toBe(false)
    expect(r.findings).toContain('#98765')
  })

  test('respects allowlist', () => {
    const s = noFabrication({ allowlist: ['ACME-DEFAULT'] })
    const r = s.score({
      context: '',
      output: 'Plan ACME-DEFAULT incluido.',
    })
    expect(r.passed).toBe(true)
  })

  test('deduplicates findings', () => {
    const r = scorer.score({
      context: '',
      output: 'XYZ-999 y XYZ-999 otra vez.',
    })
    expect(r.findings.length).toBe(1)
  })
})

// ─── escalation_handled ────────────────────────────────────────────

describe('escalationHandled', () => {
  const scorer = escalationHandled()

  test('passes when context is sufficient', () => {
    const r = scorer.score({
      context:
        'El cliente Sam tiene plan Pro contratado en 2024 e incluye 3 sesiones grupales por mes más una 1:1. Calendly está conectado para agendar.',
      output: 'Tu plan Pro incluye 3 sesiones por mes.',
    })
    expect(r.passed).toBe(true)
    expect(r.reason).toContain('sufficient')
  })

  test('passes when context is sparse but agent escalated (English)', () => {
    const r = scorer.score({
      context: '',
      output: "I don't have that information. Let me escalate this to the team.",
    })
    expect(r.passed).toBe(true)
  })

  test('passes when context is sparse but agent escalated (Spanish)', () => {
    const r = scorer.score({
      context: '',
      output: 'No tengo esa info. Te paso al equipo.',
    })
    expect(r.passed).toBe(true)
  })

  test('fails when context is sparse and agent did NOT escalate', () => {
    const r = scorer.score({
      context: '',
      output: 'Tu pedido fue despachado el martes y llega el viernes.',
    })
    expect(r.passed).toBe(false)
    expect(r.reason).toContain('did not escalate')
  })

  test('respects custom emptyContextThreshold', () => {
    const s = escalationHandled({ emptyContextThreshold: 10 })
    const r = s.score({
      context: 'context_x_y',
      output: 'Hola.',
    })
    // 11 chars context, threshold 10 → considered sufficient → pass even without escalation
    expect(r.passed).toBe(true)
  })
})
