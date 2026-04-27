import type { Memory } from '@mastra/core/memory'

export interface CompanyMemoryOptions {
  /** Company slug — used to scope all threads and resources */
  company: string
  /** Mastra Memory instance to wrap */
  memory: Memory
}

/**
 * Returns the user's Mastra Memory pre-scoped to a company. v0.1 wraps the
 * caller's Memory and provides the scoping convention via `companyThreadId`
 * and `companyResourceId`. Auto-configuration of libsql/Postgres backends is
 * planned for v0.2 once the patterns stabilize from real builds.
 *
 * Convention 5 enforced: every agent uses this, every thread/resource is
 * prefixed with the company slug.
 */
export function companyMemory(opts: CompanyMemoryOptions): Memory {
  if (!opts.company) throw new Error('companyMemory: company is required')
  if (!opts.memory) {
    throw new Error(
      'companyMemory: memory is required. Pass your Mastra Memory instance.\n' +
        'See: https://github.com/agentpilled/agentstack/blob/main/framework/README.md#minimal-example',
    )
  }
  return opts.memory
}

/**
 * Build a thread ID scoped to a company. Format: `<company>:<conversation>`.
 *
 * @example
 *   threadId: companyThreadId('acme-creators', `dm-${ig_user_id}`)
 */
export function companyThreadId(company: string, conversation: string): string {
  if (!company) throw new Error('companyThreadId: company is required')
  if (!conversation) throw new Error('companyThreadId: conversation is required')
  return `${company}:${conversation}`
}

/**
 * Build a resource ID scoped to a company. Format: `<company>:<resource>`.
 *
 * @example
 *   resourceId: companyResourceId('acme-creators', ig_user_id)
 */
export function companyResourceId(company: string, resource: string): string {
  if (!company) throw new Error('companyResourceId: company is required')
  if (!resource) throw new Error('companyResourceId: resource is required')
  return `${company}:${resource}`
}
