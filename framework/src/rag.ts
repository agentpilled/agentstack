const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/

/**
 * Build a RAG vector namespace scoped to a company. Format: `rag_<company>`.
 *
 * Convention 5 enforced for RAG: every company's vectors live in their own
 * namespace, no cross-tenant retrieval.
 *
 * @example
 *   const namespace = companyRagNamespace('acme-creators') // "rag_acme-creators"
 */
export function companyRagNamespace(company: string): string {
  if (!SLUG_RE.test(company)) {
    throw new Error(`Invalid company slug "${company}". Use kebab-case.`)
  }
  return `rag_${company}`
}
