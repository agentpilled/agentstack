import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { LeadStateSchema } from './get-lead.js'

export const upsertLead = createTool({
  id: 'acme-creators.upsert_lead',
  description:
    'Create or update a lead row in Notion. Sets state, summary, and timestamps. Append-only: previous state is preserved in event log.',
  inputSchema: z.object({
    igUserId: z.string(),
    igUsername: z.string().optional(),
    state: LeadStateSchema,
    source: z.enum(['cold', 'comment_to_dm', 'story_reply']).optional(),
    discoverySummary: z.string().optional(),
    qualificationVerdict: z.enum(['fit', 'not_fit', 'unclear']).optional(),
    eventNote: z
      .string()
      .describe('One-line description of what changed in this turn (logged on the row)'),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    leadId: z.string().describe('Notion page ID of the upserted row'),
  }),
  // Side effect: writes to Notion
  requireApproval: true,
  execute: async ({ context }) => {
    // TODO: implement Notion DB upsert.
    // Required env: NOTION_API_KEY, NOTION_LEADS_DB_ID
    // Behavior:
    //   - If row exists for ig_user_id: update state + last_active + append eventNote to events log
    //   - Else: create row with first_seen = now, state = context.state, etc.
    throw new Error('upsert_lead: not implemented yet — wire Notion in your agency repo')
  },
})
