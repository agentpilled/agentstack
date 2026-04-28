import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { buildAgentConfig } from './agent.js'

let baseDir: string

function setupFixture(): void {
  baseDir = mkdtempSync(join(tmpdir(), 'agentstack-agent-test-'))
  const companyDir = join(baseDir, 'companies', 'acme-test')
  mkdirSync(join(companyDir, 'src', 'shared', 'rag'), { recursive: true })
  writeFileSync(
    join(companyDir, 'CONTEXT.md'),
    '# acme-test\n\n## Voice\nDirect, casual, no-corporate.',
  )
  writeFileSync(
    join(companyDir, 'src', 'shared', 'rag', 'voice-samples.md'),
    '# Voice samples\n\n- "Hey, what are you trying to ship?"',
  )
  writeFileSync(
    join(companyDir, 'src', 'shared', 'rag', 'glossary.md'),
    '# Glossary\n\n- Lead: a person who replied to outreach.',
  )
}

describe('buildAgentConfig', () => {
  beforeEach(setupFixture)
  afterEach(() => rmSync(baseDir, { recursive: true, force: true }))

  test('composes CONTEXT + role with no references', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'You qualify leads.',
      baseDir,
    })
    expect(config.id).toBe('acme-test.setter')
    expect(config.name).toBe('acme-test · setter')
    expect(config.instructions).toContain('## Company context')
    expect(config.instructions).toContain('Direct, casual, no-corporate.')
    expect(config.instructions).toContain('## Your role')
    expect(config.instructions).toContain('You qualify leads.')
    expect(config.instructions).toContain('## Cross-cutting rules')
    expect(config.instructions).not.toContain('# Reference')
  })

  test('model is optional and undefined when not passed', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'You qualify leads.',
      baseDir,
    })
    expect(config.model).toBeUndefined()
  })

  test('model passes through when provided', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'r',
      model: 'anthropic/claude-sonnet-4-6',
      baseDir,
    })
    expect(config.model).toBe('anthropic/claude-sonnet-4-6')
  })

  test('references via path are read from companies/<slug>/<path>', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'r',
      baseDir,
      references: [
        { label: 'Voice samples', path: 'src/shared/rag/voice-samples.md' },
      ],
    })
    expect(config.instructions).toContain('# Reference — Voice samples')
    expect(config.instructions).toContain('"Hey, what are you trying to ship?"')
  })

  test('references via content are inlined as-is', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'r',
      baseDir,
      references: [{ label: 'Inline rules', content: '- Always be casual.' }],
    })
    expect(config.instructions).toContain('# Reference — Inline rules')
    expect(config.instructions).toContain('Always be casual.')
  })

  test('multiple references render in order separated by ---', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'r',
      baseDir,
      references: [
        { label: 'Voice samples', path: 'src/shared/rag/voice-samples.md' },
        { label: 'Glossary', path: 'src/shared/rag/glossary.md' },
      ],
    })
    const ix1 = config.instructions.indexOf('# Reference — Voice samples')
    const ix2 = config.instructions.indexOf('# Reference — Glossary')
    expect(ix1).toBeGreaterThan(0)
    expect(ix2).toBeGreaterThan(ix1)
    // They're separated by an `---` rule
    expect(config.instructions.slice(ix1, ix2)).toMatch(/\n---\n/)
  })

  test('throws when reference has both path and content', async () => {
    await expect(
      buildAgentConfig({
        company: 'acme-test',
        id: 'setter',
        name: 'acme-test · setter',
        role: 'r',
        baseDir,
        references: [{ label: 'X', path: 'a.md', content: 'b' }],
      }),
    ).rejects.toThrow(/both 'path' and 'content'/)
  })

  test('throws when reference has neither path nor content', async () => {
    await expect(
      buildAgentConfig({
        company: 'acme-test',
        id: 'setter',
        name: 'acme-test · setter',
        role: 'r',
        baseDir,
        references: [{ label: 'X' }],
      }),
    ).rejects.toThrow(/needs either 'path' or 'content'/)
  })

  test('throws when reference path does not exist', async () => {
    await expect(
      buildAgentConfig({
        company: 'acme-test',
        id: 'setter',
        name: 'acme-test · setter',
        role: 'r',
        baseDir,
        references: [{ label: 'X', path: 'src/shared/rag/missing.md' }],
      }),
    ).rejects.toThrow()
  })

  test('reference content is trimmed (no trailing newlines)', async () => {
    const config = await buildAgentConfig({
      company: 'acme-test',
      id: 'setter',
      name: 'acme-test · setter',
      role: 'r',
      baseDir,
      references: [{ label: 'X', content: '\n\nbody\n\n\n' }],
    })
    // The reference section should contain "body" with surrounding whitespace trimmed
    expect(config.instructions).toMatch(/# Reference — X\n\nbody/)
  })
})
