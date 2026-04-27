import { type CompanyContext, loadCompanyContext } from './context.js'

export interface BuildAgentConfigOptions {
  /** Company slug — must match an existing companies/<slug>/ */
  company: string
  /** Short agent id, unique within the company (e.g. "ig-setter") */
  id: string
  /** Display name shown in dashboards / logs */
  name: string
  /** Role-specific instructions. Composed ON TOP of the company's CONTEXT.md. */
  role: string
  /** Mastra model identifier, e.g. "anthropic/claude-sonnet-4-6" */
  model: string
  /** Override the resolved company directory (useful in tests) */
  baseDir?: string
}

export interface AgentConfig {
  /** Full agent ID, prefixed with company slug: "<slug>.<id>" */
  id: string
  /** Display name */
  name: string
  /** Composed system prompt = company CONTEXT + agent role + cross-cutting rules */
  instructions: string
  /** Mastra model identifier */
  model: string
}

/**
 * Build a Mastra-compatible agent configuration with the company's CONTEXT.md
 * automatically composed into the system prompt.
 *
 * This is convention 4 codified: agents compose CONTEXT, they don't paste it.
 *
 * @example
 *   const config = await buildAgentConfig({
 *     company: 'acme-creators',
 *     id: 'ig-setter',
 *     name: 'acme-creators · IG Setter',
 *     role: readFileSync('role.md', 'utf-8'),
 *     model: 'anthropic/claude-sonnet-4-6',
 *   })
 *   export const igSetterAgent = new Agent({ ...config, memory, tools })
 */
export async function buildAgentConfig(
  opts: BuildAgentConfigOptions,
): Promise<AgentConfig> {
  const ctx = await loadCompanyContext(opts.company, opts.baseDir)
  return {
    id: `${ctx.slug}.${opts.id}`,
    name: opts.name,
    instructions: composePrompt(ctx, opts.role),
    model: opts.model,
  }
}

function composePrompt(ctx: CompanyContext, role: string): string {
  return [
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
  ].join('\n')
}
