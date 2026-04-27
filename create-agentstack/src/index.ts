#!/usr/bin/env node
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import pc from 'picocolors'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = resolve(HERE, '../template')

interface Options {
  force: boolean
}

const program = new Command()
  .name('create-agentstack')
  .description('Scaffold a new agentstack agency repo.')
  .argument('<target>', 'directory to create (e.g. my-agency)')
  .option('-f, --force', 'create even if target exists and is not empty', false)
  .action(async (target: string, opts: Options) => {
    try {
      await scaffold(target, opts)
    } catch (err) {
      console.error(pc.red('✖'), err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program.parse()

async function scaffold(target: string, opts: Options): Promise<void> {
  const projectName = target.replace(/^.*\//, '').replace(/[^a-zA-Z0-9-_]/g, '-')
  if (!projectName) throw new Error(`Invalid target name: ${target}`)

  const targetDir = resolve(process.cwd(), target)
  await ensureWritableTarget(targetDir, opts.force)

  console.log()
  console.log(pc.bold(`Creating agentstack agency in ${pc.cyan(relative(process.cwd(), targetDir) || '.')}…`))
  console.log()

  await copyTemplate(TEMPLATE_DIR, targetDir, { projectName })

  console.log(pc.green('✔'), 'Scaffold complete.')
  console.log()
  console.log(pc.bold('Next steps:'))
  console.log()
  console.log(`  ${pc.cyan('cd')} ${target}`)
  console.log(`  ${pc.cyan('pnpm install')}`)
  console.log(`  ${pc.cyan('cp .env.example .env')}        ${pc.dim('# add your provider keys')}`)
  console.log()
  console.log(pc.bold('Then in Claude Code:'))
  console.log()
  console.log(`  ${pc.cyan('/agentstack-new-company')} <slug>`)
  console.log(`  ${pc.cyan('/agentstack-new-agent')} <company>/<agent>`)
  console.log()
  console.log(pc.dim('Docs:'), pc.dim('https://github.com/agentpilled/agentstack#readme'))
  console.log()
}

async function ensureWritableTarget(dir: string, force: boolean): Promise<void> {
  let entries: string[] = []
  try {
    const s = await stat(dir)
    if (!s.isDirectory()) {
      throw new Error(`${dir} exists and is not a directory.`)
    }
    entries = await readdir(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await mkdir(dir, { recursive: true })
      return
    }
    throw err
  }
  if (entries.length > 0 && !force) {
    throw new Error(
      `${dir} is not empty. Pass --force to scaffold into a non-empty directory.`,
    )
  }
}

interface CopyContext {
  projectName: string
}

async function copyTemplate(src: string, dest: string, ctx: CopyContext): Promise<void> {
  await mkdir(dest, { recursive: true })
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name)
    const destName = renameOnCopy(entry.name)
    const destPath = join(dest, destName)

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath, ctx)
      continue
    }

    const raw = await readFile(srcPath, 'utf-8')
    const out = entry.name === 'package.json' ? renderPackageJson(raw, ctx) : raw
    await writeFile(destPath, out)
  }
}

// npm strips `.gitignore` and `.env*` from published packages, so the template
// ships them as `_gitignore` / `_env.example`. Rename on copy so the scaffolded
// repo lands with the conventional names.
function renameOnCopy(name: string): string {
  if (name === '_gitignore') return '.gitignore'
  if (name === '_env.example') return '.env.example'
  return name
}

function renderPackageJson(raw: string, ctx: CopyContext): string {
  const pkg = JSON.parse(raw) as Record<string, unknown>
  pkg.name = ctx.projectName
  return JSON.stringify(pkg, null, 2) + '\n'
}
