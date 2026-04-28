#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import pc from 'picocolors'
import { newAgent, newCompany } from './commands.js'

const HERE = dirname(fileURLToPath(import.meta.url))
// dist/cli/index.js → ../../package.json
const PKG = JSON.parse(readFileSync(resolve(HERE, '../../package.json'), 'utf-8')) as {
  version: string
}

const program = new Command()
program
  .name('agentstack')
  .description('agentstack CLI — multi-tenant agent workflow')
  .version(PKG.version)

const newCmd = program.command('new').description('Scaffold a new company or agent')

newCmd
  .command('company <slug>')
  .description('Create a new company workspace under companies/<slug>/')
  .action(async (slug: string) => {
    try {
      await newCompany(slug)
    } catch (err) {
      console.error(pc.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

newCmd
  .command('agent <path>')
  .description('Create a new agent. path = <company>/<agent-slug>')
  .action(async (path: string) => {
    try {
      const parts = path.split('/')
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error('Expected path format: <company>/<agent-slug>')
      }
      await newAgent({ company: parts[0], agent: parts[1] })
    } catch (err) {
      console.error(pc.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

program.parseAsync()
