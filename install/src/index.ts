#!/usr/bin/env node
/**
 * agentstack-skills — one-line installer for the agentstack Claude Code skills.
 *
 * Default behavior (no args, or `install`):
 *   1. Resolve the latest released tag of agentpilled/agentstack on GitHub
 *   2. Download a tarball of that ref to a temp dir
 *   3. Extract just the skill folders (any sibling dir with a SKILL.md)
 *   4. Copy each into ~/.claude/skills/agentstack-<name>/
 *   5. Bundle the root SKILL.md + foundation docs as ~/.claude/skills/agentstack/
 *
 * Flags:
 *   --ref <tag-or-branch>   Pin to a specific tag (e.g. `v0.1.2`) or branch (e.g. `main`).
 *                           Default: latest GitHub release.
 *   --skills-dir <path>     Override the install target. Default: ~/.claude/skills
 *   --no-confirm            Skip the "found N skills, continue?" prompt (currently unused —
 *                           the installer never prompts. Reserved for future use).
 *   --dry-run               Resolve + download + list what would be installed, but don't write.
 *
 * Subcommands:
 *   install    (default) — install/upgrade
 *   uninstall  — remove ~/.claude/skills/agentstack* (everything this installer puts down)
 *   version    — print the installer version
 */

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'

const REPO = 'agentpilled/agentstack'

// Folders that exist in the repo but are NOT skills — must be excluded
// when iterating sibling dirs looking for SKILL.md.
const NON_SKILL_DIRS = new Set([
  'framework',
  'create-agentstack',
  'install',
  'examples',
  'lenses',
  'bin',
  'setup',
  'scripts',
  'docs',
  'node_modules',
  '.git',
  '.github',
  'dist',
])

interface Options {
  ref?: string
  skillsDir: string
  dryRun: boolean
  subcommand: 'install' | 'uninstall' | 'version'
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    ref: undefined,
    skillsDir: join(homedir(), '.claude', 'skills'),
    dryRun: false,
    subcommand: 'install',
  }
  const args = argv.slice(2)
  let i = 0

  // Optional first positional: subcommand
  if (args[0] && !args[0].startsWith('-')) {
    const cmd = args[0]
    if (cmd === 'install' || cmd === 'uninstall' || cmd === 'version') {
      opts.subcommand = cmd
      i = 1
    } else {
      throw new Error(`Unknown subcommand: ${cmd}. Try 'install', 'uninstall', or 'version'.`)
    }
  }

  for (; i < args.length; i++) {
    const a = args[i]
    if (a === '--ref') {
      opts.ref = args[++i]
      if (!opts.ref) throw new Error('--ref requires a value')
    } else if (a === '--skills-dir') {
      const v = args[++i]
      if (!v) throw new Error('--skills-dir requires a value')
      opts.skillsDir = resolve(v.replace(/^~/, homedir()))
    } else if (a === '--dry-run') {
      opts.dryRun = true
    } else if (a === '--help' || a === '-h') {
      printHelp()
      process.exit(0)
    } else if (a === '--no-confirm') {
      // reserved for future use; accept silently
    } else {
      throw new Error(`Unknown option: ${a}. Try --help.`)
    }
  }
  return opts
}

function printHelp(): void {
  console.log(`
${pc.bold('agentstack-skills')} — install Claude Code skills for agentstack.

${pc.bold('Usage:')}
  npx agentstack-skills [install]            Install latest released skills
  npx agentstack-skills install --ref main   Install from main branch (bleeding edge)
  npx agentstack-skills install --ref v0.1.2 Pin to a specific tag
  npx agentstack-skills uninstall            Remove all agentstack* skills
  npx agentstack-skills version              Print installer version

${pc.bold('Options:')}
  --ref <tag|branch>     Resolve from this git ref. Default: latest GitHub release.
  --skills-dir <path>    Where to install. Default: ~/.claude/skills
  --dry-run              Show what would happen without writing files.

${pc.bold('Source:')}
  https://github.com/${REPO}
`)
}

async function fetchLatestReleaseTag(): Promise<string> {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'agentstack-skills-installer', Accept: 'application/vnd.github+json' },
  })
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch latest release from GitHub (${resp.status} ${resp.statusText}). ` +
        `Try --ref main as a fallback.`,
    )
  }
  const json = (await resp.json()) as { tag_name?: string }
  if (!json.tag_name) throw new Error('Latest release has no tag_name')
  return json.tag_name
}

function downloadAndExtractTarball(ref: string, destDir: string): string {
  // codeload returns the tarball — branch refs use refs/heads/, tag refs use refs/tags/
  // Try both shapes; codeload accepts both `refs/heads/<branch>` and `refs/tags/<tag>`.
  // Easier: GitHub auto-routes <ref> as either tag or branch via this URL:
  const url = `https://codeload.github.com/${REPO}/tar.gz/${ref}`

  // Stream curl → tar -xz. Universal on macOS / Linux.
  // Windows users running this via npx in WSL or Git Bash will have curl + tar too.
  try {
    execSync(`curl -fsSL "${url}" | tar -xz -C "${destDir}"`, {
      stdio: ['ignore', 'ignore', 'pipe'],
    })
  } catch (err) {
    throw new Error(
      `Failed to download / extract ${url}.\n` +
        `Make sure 'curl' and 'tar' are on PATH. (macOS / Linux ship them by default.)\n` +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // The tarball extracts to a directory named like `agentstack-<sha>` or `agentstack-<branch>`.
  // We expect exactly one top-level directory inside destDir.
  const entries = readdirSync(destDir).filter((n) => statSync(join(destDir, n)).isDirectory())
  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one directory after tarball extract; found ${entries.length}: ${entries.join(', ')}`,
    )
  }
  return join(destDir, entries[0]!)
}

interface SkillEntry {
  name: string // 'agentstack' for root, or 'agentstack-<dir>' for siblings
  source: string // absolute path inside the extracted tarball
  isRoot: boolean
}

function discoverSkills(repoRoot: string): SkillEntry[] {
  const out: SkillEntry[] = []

  // Root SKILL.md → agentstack/ (the dispatcher with foundations bundled)
  if (existsSync(join(repoRoot, 'SKILL.md'))) {
    out.push({ name: 'agentstack', source: repoRoot, isRoot: true })
  }

  // Each sibling dir with a SKILL.md → agentstack-<dir>
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (NON_SKILL_DIRS.has(entry.name)) continue
    const skillPath = join(repoRoot, entry.name, 'SKILL.md')
    if (!existsSync(skillPath)) continue
    out.push({
      name: `agentstack-${entry.name}`,
      source: join(repoRoot, entry.name),
      isRoot: false,
    })
  }

  return out
}

function copySkill(skill: SkillEntry, repoRoot: string, skillsDir: string, dryRun: boolean): void {
  const target = join(skillsDir, skill.name)

  if (dryRun) {
    console.log(`  ${pc.dim('(dry-run)')} would install ${pc.cyan(skill.name)} → ${target}`)
    return
  }

  // Wipe existing target so we don't merge old + new files (e.g. if a skill was renamed).
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })

  if (skill.isRoot) {
    // Root: bundle SKILL.md + foundation docs + lenses/ alongside
    cpSync(join(repoRoot, 'SKILL.md'), join(target, 'SKILL.md'))
    for (const doc of ['ETHOS.md', 'IRON-LAWS.md', 'DECISION-PRINCIPLES.md']) {
      const src = join(repoRoot, doc)
      if (existsSync(src)) cpSync(src, join(target, doc))
    }
    const lenses = join(repoRoot, 'lenses')
    if (existsSync(lenses)) cpSync(lenses, join(target, 'lenses'), { recursive: true })
  } else {
    // Sibling: copy the whole skill folder
    cpSync(skill.source, target, { recursive: true })
  }

  console.log(`  ${pc.green('✔')} ${skill.name}`)
}

async function runInstall(opts: Options): Promise<void> {
  // 1. Verify Claude Code is installed (~/.claude exists). Skip if --skills-dir overrides.
  const claudeRoot = join(homedir(), '.claude')
  if (opts.skillsDir.startsWith(claudeRoot) && !existsSync(claudeRoot)) {
    console.error(pc.red('✗'), `${claudeRoot} not found. Install Claude Code first:`)
    console.error(`  https://docs.anthropic.com/en/docs/claude-code`)
    process.exit(1)
  }

  // 2. Resolve ref
  const ref = opts.ref ?? (await fetchLatestReleaseTag())
  console.log(pc.bold(`→ Installing agentstack skills from ${REPO} @ ${pc.cyan(ref)}`))
  if (opts.dryRun) console.log(pc.yellow('  (dry run — no files will be written)'))

  // 3. Download + extract
  const tmp = mkdtempSync(join(tmpdir(), 'agentstack-skills-'))
  try {
    const repoRoot = downloadAndExtractTarball(ref, tmp)

    // 4. Discover skills
    const skills = discoverSkills(repoRoot)
    if (skills.length === 0) {
      throw new Error(`No skills found in ${repoRoot}. The repo layout may have changed.`)
    }
    console.log(pc.bold(`\n→ Found ${skills.length} skill(s):\n`))

    // 5. Install each
    if (!opts.dryRun) mkdirSync(opts.skillsDir, { recursive: true })
    for (const skill of skills) {
      copySkill(skill, repoRoot, opts.skillsDir, opts.dryRun)
    }

    console.log()
    if (opts.dryRun) {
      console.log(pc.yellow('Dry run complete. Re-run without --dry-run to install.'))
    } else {
      console.log(pc.green(`✓ Installed ${skills.length} skill(s) to ${opts.skillsDir}`))
      console.log()
      console.log(pc.bold('Next:'))
      console.log(`  1. Restart Claude Code (or open a new project window)`)
      console.log(`  2. Verify: ${pc.cyan('/agentstack-validate')} (when in an agentstack repo)`)
      console.log(`  3. Read: ${pc.cyan('https://github.com/' + REPO + '#readme')}`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

function runUninstall(opts: Options): void {
  if (!existsSync(opts.skillsDir)) {
    console.log(pc.dim(`Skills dir ${opts.skillsDir} does not exist; nothing to uninstall.`))
    return
  }
  const entries = readdirSync(opts.skillsDir).filter(
    (n) => n === 'agentstack' || n.startsWith('agentstack-'),
  )
  if (entries.length === 0) {
    console.log(pc.dim(`No agentstack* skills found in ${opts.skillsDir}.`))
    return
  }
  console.log(pc.bold(`→ Removing ${entries.length} skill(s) from ${opts.skillsDir}:\n`))
  for (const name of entries) {
    const target = join(opts.skillsDir, name)
    if (opts.dryRun) {
      console.log(`  ${pc.dim('(dry-run)')} would remove ${pc.cyan(name)}`)
    } else {
      rmSync(target, { recursive: true, force: true })
      console.log(`  ${pc.green('✔')} removed ${name}`)
    }
  }
  console.log()
  if (!opts.dryRun) {
    console.log(pc.green('✓ Uninstalled. Restart Claude Code to clear the skills cache.'))
  }
}

function runVersion(): void {
  const HERE = dirname(fileURLToPath(import.meta.url))
  // dist/index.js → ../package.json
  const pkg = JSON.parse(readFileSync(resolve(HERE, '../package.json'), 'utf-8')) as {
    version: string
  }
  console.log(pkg.version)
}

async function main(): Promise<void> {
  let opts: Options
  try {
    opts = parseArgs(process.argv)
  } catch (err) {
    console.error(pc.red('✗'), err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  try {
    switch (opts.subcommand) {
      case 'install':
        await runInstall(opts)
        break
      case 'uninstall':
        runUninstall(opts)
        break
      case 'version':
        runVersion()
        break
    }
  } catch (err) {
    console.error(pc.red('\n✗'), err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
