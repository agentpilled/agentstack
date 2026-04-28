import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const LeadStateSchema = z.enum([
  'cold',
  'greeted',
  'discovering',
  'qualified',
  'unqualified',
  'booked',
  'ghosted',
])
export type LeadState = z.infer<typeof LeadStateSchema>

export const LeadSchema = z.object({
  igUserId: z.string(),
  igUsername: z.string(),
  state: LeadStateSchema,
  source: z.enum(['cold', 'comment_to_dm', 'story_reply']),
  firstSeen: z.string().describe('ISO 8601 datetime'),
  lastActive: z.string().describe('ISO 8601 datetime'),
  discoverySummary: z.string().nullable(),
  qualificationVerdict: z.enum(['fit', 'not_fit', 'unclear']).nullable(),
  calendlyEvent: z.string().nullable(),
  tags: z.array(z.string()),
})
export type Lead = z.infer<typeof LeadSchema>

export const getLead = createTool({
  id: 'acme-creators.get_lead',
  description:
    'Look up a lead by Instagram user ID. Returns null in `lead` when no record exists yet.',
  inputSchema: z.object({
    igUserId: z.string().describe('Instagram numeric user ID'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    lead: LeadSchema.nullable(),
  }),
  // Read-only: no requireApproval needed
  execute: async ({ context }) => {
    // TODO: implement Notion DB query.
    // Required env: NOTION_API_KEY, NOTION_LEADS_DB_ID
    // Query: filter where ig_user_id == context.igUserId, return one row mapped to LeadSchema.
    throw new Error('get_lead: not implemented yet — wire Notion in your agency repo')
  },
})
