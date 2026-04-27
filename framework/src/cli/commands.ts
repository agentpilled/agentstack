import { existsSync } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'

const HERE = dirname(fileURLToPath(import.meta.url))
// dist/cli/commands.js → ../../templates
const TPL_DIR = resolve(HERE, '../../templates')

const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/

/**
 * Walk up from cwd to find the agency repo root (directory with
 * `pnpm-workspace.yaml` and `companies/`).
 */
function findAgencyRoot(): string {
  let dir = process.cwd()
  while (dir !== '/' && dir !== '') {
    if (
      existsSync(resolve(dir, 'pnpm-workspace.yaml')) &&
      existsSync(resolve(dir, 'companies'))
    ) {
      return dir
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

const AGENCY_ROOT = findAgencyRoot()

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function renderTemplate(name: string, vars: Record<string, string>): Promise<string> {
  const raw = await readFile(resolve(TPL_DIR, name), 'utf-8')
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`)
}

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

export async function newCompany(slug: string): Promise<void> {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid slug "${slug}". Use kebab-case (a-z, 0-9, -, _).`)
  }
  const root = resolve(AGENCY_ROOT, 'companies', slug)
  if (await exists(root)) throw new Error(`companies/${slug} already exists`)

  await mkdir(resolve(root, 'src/shared/tools'), { recursive: true })
  await mkdir(resolve(root, 'src/shared/prompts'), { recursive: true })
  await mkdir(resolve(root, 'src/shared/schemas'), { recursive: true })
  await mkdir(resolve(root, 'src/shared/rag'), { recursive: true })
  await mkdir(resolve(root, 'src/agents'), { recursive: true })

  const vars = { slug }
  await Promise.all([
    writeFile(resolve(root, 'CONTEXT.md'), await renderTemplate('company/CONTEXT.md.tpl', vars)),
    writeFile(
      resolve(root, 'INTEGRATIONS.md'),
      await renderTemplate('company/INTEGRATIONS.md.tpl', vars),
    ),
    writeFile(resolve(root, '.env.example'), await renderTemplate('company/env.example.tpl', vars)),
    writeFile(
      resolve(root, '.gitignore'),
      '.env\n.env.local\n.env.production\n.mastra/\ndist/\nnode_modules/\n',
    ),
    writeFile(
      resolve(root, 'package.json'),
      await renderTemplate('company/package.json.tpl', vars),
    ),
    writeFile(
      resolve(root, 'tsconfig.json'),
      await renderTemplate('company/tsconfig.json.tpl', vars),
    ),
    writeFile(resolve(root, 'src/main.ts'), await renderTemplate('company/main.ts.tpl', vars)),
    writeFile(
      resolve(root, 'src/shared/tools/.gitkeep'),
      '# Tools reused across all agents of this company\n',
    ),
    writeFile(
      resolve(root, 'src/shared/prompts/.gitkeep'),
      '# Prompt fragments (voice, formatting) shared by this company\n',
    ),
    writeFile(
      resolve(root, 'src/shared/schemas/.gitkeep'),
      '# Zod schemas for this company domain entities\n',
    ),
    writeFile(resolve(root, 'src/shared/rag/.gitkeep'), '# Source docs for RAG ingestion\n'),
  ])

  console.log(pc.green(`✔ Created companies/${slug}/`))
  console.log(pc.dim('  Next steps:'))
  console.log(pc.dim(`    1. Fill companies/${slug}/CONTEXT.md and INTEGRATIONS.md`))
  console.log(pc.dim(`    2. cp companies/${slug}/.env.example companies/${slug}/.env`))
  console.log(pc.dim(`    3. agentstack new agent ${slug}/<agent-name>`))
}

export async function newAgent(opts: {
  company: string
  agent: string
}): Promise<void> {
  if (!SLUG_RE.test(opts.agent)) {
    throw new Error(`Invalid agent slug "${opts.agent}". Use kebab-case.`)
  }
  const companyRoot = resolve(AGENCY_ROOT, 'companies', opts.company)
  if (!(await exists(companyRoot))) {
    throw new Error(
      `companies/${opts.company} does not exist. Create it: agentstack new company ${opts.company}`,
    )
  }
  const agentRoot = resolve(companyRoot, 'src/agents', opts.agent)
  if (await exists(agentRoot)) throw new Error(`${agentRoot} already exists`)

  await mkdir(resolve(agentRoot, 'tools'), { recursive: true })
  await mkdir(resolve(agentRoot, 'evals'), { recursive: true })
  await mkdir(resolve(agentRoot, 'evals/golden'), { recursive: true })

  const vars = {
    company: opts.company,
    agent: opts.agent,
    varName: toCamelCase(opts.agent),
  }
  await Promise.all([
    writeFile(resolve(agentRoot, 'agent.ts'), await renderTemplate('agent/agent.ts.tpl', vars)),
    writeFile(resolve(agentRoot, 'role.md'), await renderTemplate('agent/role.md.tpl', vars)),
    writeFile(resolve(agentRoot, 'README.md'), await renderTemplate('agent/README.md.tpl', vars)),
    writeFile(resolve(agentRoot, 'tools/.gitkeep'), ''),
    writeFile(resolve(agentRoot, 'evals/.gitkeep'), ''),
    writeFile(
      resolve(agentRoot, 'evals/golden/.gitkeep'),
      '# Golden inputs for /agentstack-qa\n# Each file: { input, expected?, must_not?, context? }\n',
    ),
  ])

  console.log(pc.green(`✔ Created companies/${opts.company}/src/agents/${opts.agent}/`))
  console.log(pc.dim('  Next steps:'))
  console.log(pc.dim('    1. Edit role.md with the agent\'s role'))
  console.log(pc.dim('    2. Add tools (prefer reusing from src/shared/tools/)'))
  console.log(
    pc.dim(
      `    3. Register in src/main.ts: import { ${vars.varName}Agent } from './agents/${opts.agent}/agent.js'`,
    ),
  )
  console.log(pc.dim(`    4. /agentstack-validate --agent ${opts.company}/${opts.agent}`))
}
