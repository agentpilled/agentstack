import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type CompanyContext, loadCompanyContext } from './context.js'

/**
 * A reference document to splice into the agent's system prompt below CONTEXT
 * + role. Useful for classification taxonomies, voice samples, product specs,
 * glossaries — anything the agent must always know but which doesn't belong
 * in CONTEXT.md (which is the company-level brand/voice/policies doc).
 *
 * Pass either `path` (relative to `companies/<company>/`, the framework reads
 * the file at config-build time) or `content` (already-loaded string). Use
 * `path` by default — keeps your agent.ts focused on wiring, not file I/O.
 */
export interface AgentReference {
  /** Section title rendered as `# Reference — <label>` in the system prompt. */
  label: string
  /** Path relative to `companies/<company>/`. Mutually exclusive with `content`. */
  path?: string
  /** Pre-loaded content. Mutually exclusive with `path`. */
  content?: string
}

export interface BuildAgentConfigOptions {
  /** Company slug — must match an existing companies/<slug>/ */
  company: string
  /** Short agent id, unique within the company (e.g. "ig-setter") */
  id: string
  /** Display name shown in dashboards / logs */
  name: string
  /** Role-specific instructions. Composed ON TOP of the company's CONTEXT.md. */
  role: string
  /**
   * Mastra model identifier, e.g. "anthropic/claude-sonnet-4-6". Optional
   * because callers commonly pass a real provider object (e.g. `openai('gpt-4o-mini')`)
   * directly to `new Agent({...config, model: provider})` and override this.
   */
  model?: string
  /** Override the resolved company directory (useful in tests) */
  baseDir?: string
  /**
   * Reference documents (taxonomies, voice samples, pitches, glossaries) that
   * the agent must always have. Composed below CONTEXT + role + cross-cutting
   * rules in the system prompt. Each reference becomes a `# Reference — <label>`
   * section separated by `---`.
   *
   * @example
   *   references: [
   *     { label: 'Classification criteria', path: 'src/shared/rag/classification-criteria.md' },
   *     { label: 'Voice samples', path: 'src/shared/rag/voice-samples.md' },
   *   ]
   */
  references?: AgentReference[]
}

export interface AgentConfig {
  /** Full agent ID, prefixed with company slug: "<slug>.<id>" */
  id: string
  /** Display name */
  name: string
  /** Composed system prompt = company CONTEXT + agent role + cross-cutting rules + references */
  instructions: string
  /** Mastra model identifier (only set if `model` was passed; undefined otherwise) */
  model?: string
}

/**
 * Build a Mastra-compatible agent configuration with the company's CONTEXT.md
 * automatically composed into the system prompt, plus any reference docs from
 * `companies/<slug>/src/shared/rag/` (or wherever you point) the agent always
 * needs to reason well.
 *
 * Convention 4 codified: agents compose CONTEXT (and references), they don't
 * paste them.
 *
 * @example basic
 *   const config = await buildAgentConfig({
 *     company: 'acme-creators',
 *     id: 'ig-setter',
 *     name: 'acme-creators · IG Setter',
 *     role: readFileSync('role.md', 'utf-8'),
 *     model: 'anthropic/claude-sonnet-4-6',
 *   })
 *   export const igSetterAgent = new Agent({ ...config, memory, tools })
 *
 * @example with references
 *   const config = await buildAgentConfig({
 *     company: 'maticarrera',
 *     id: 'email-triager',
 *     name: 'maticarrera · email-triager',
 *     role: readFileSync('role.md', 'utf-8'),
 *     references: [
 *       { label: 'Classification criteria', path: 'src/shared/rag/classification-criteria.md' },
 *       { label: 'Voice samples',           path: 'src/shared/rag/voice-samples.md' },
 *     ],
 *   })
 *   export const triagerAgent = new Agent({ ...config, model: openai('gpt-4o-mini'), memory })
 */
export async function buildAgentConfig(
  opts: BuildAgentConfigOptions,
): Promise<AgentConfig> {
  const ctx = await loadCompanyContext(opts.company, opts.baseDir)
  const refs = resolveReferences(opts.company, opts.baseDir, opts.references)
  return {
    id: `${ctx.slug}.${opts.id}`,
    name: opts.name,
    instructions: composePrompt(ctx, opts.role, refs),
    model: opts.model,
  }
}

interface ResolvedReference {
  label: string
  content: string
}

function resolveReferences(
  company: string,
  baseDir: string | undefined,
  refs: AgentReference[] | undefined,
): ResolvedReference[] {
  if (!refs || refs.length === 0) return []
  const root = resolve(baseDir ?? process.cwd(), 'companies', company)
  return refs.map((r) => {
    if (r.content !== undefined && r.path !== undefined) {
      throw new Error(
        `buildAgentConfig: reference "${r.label}" has both 'path' and 'content'. Pass exactly one.`,
      )
    }
    if (r.content !== undefined) {
      return { label: r.label, content: r.content.trim() }
    }
    if (r.path !== undefined) {
      const filePath = resolve(root, r.path)
      const content = readFileSync(filePath, 'utf-8').trim()
      return { label: r.label, content }
    }
    throw new Error(
      `buildAgentConfig: reference "${r.label}" needs either 'path' or 'content'.`,
    )
  })
}

function composePrompt(
  ctx: CompanyContext,
  role: string,
  refs: ResolvedReference[],
): string {
  const sections: string[] = [
    `# Company: ${ctx.slug}`,
    '',
    '## Company context',
    ctx.context.trim(),
    '',
    '## Your role',
    role.trim(),
    '',
    '## Cross-cutting rules',
    `- You operate exclusively on behalf of ${ctx.slug}. Never expose or reference other clients.`,
    '- Stay within the policies in the Company context above. If asked to act outside them, decline and suggest escalation.',
    '- When unsure, ask for clarification rather than fabricating.',
  ]
  for (const ref of refs) {
    sections.push('', '---', '', `# Reference — ${ref.label}`, '', ref.content)
  }
  return sections.join('\n')
}
