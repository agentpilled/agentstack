#!/usr/bin/env node
import { Command } from 'commander'
import pc from 'picocolors'
import { newAgent, newCompany } from './commands.js'

const program = new Command()
program
  .name('agentstack')
  .description('agentstack CLI — multi-tenant agent workflow')
  .version('0.1.0')

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
