import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface CompanyContext {
  /** Slug of the company, e.g. "acme-creators" */
  slug: string
  /** Raw markdown content of CONTEXT.md */
  context: string
  /** Raw markdown content of INTEGRATIONS.md, if present */
  integrations?: string
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/

/**
 * Load a company's CONTEXT.md (and optionally INTEGRATIONS.md) from disk.
 *
 * Looks for `companies/<slug>/CONTEXT.md` relative to baseDir (default: cwd).
 * Throws if CONTEXT.md is missing — Iron Law 1: nothing ships without CONTEXT.
 */
export async function loadCompanyContext(
  slug: string,
  baseDir?: string,
): Promise<CompanyContext> {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid company slug "${slug}". Use kebab-case (a-z, 0-9, -, _).`)
  }

  const root = resolve(baseDir ?? process.cwd(), 'companies', slug)
  const contextPath = resolve(root, 'CONTEXT.md')

  if (!existsSync(contextPath)) {
    throw new Error(
      `Missing ${contextPath}. ` +
        `Run /agentstack-new-company ${slug} or create the file before loading.`,
    )
  }

  const context = readFileSync(contextPath, 'utf-8')

  const integrationsPath = resolve(root, 'INTEGRATIONS.md')
  const integrations = existsSync(integrationsPath)
    ? readFileSync(integrationsPath, 'utf-8')
    : undefined

  return { slug, context, integrations }
}
