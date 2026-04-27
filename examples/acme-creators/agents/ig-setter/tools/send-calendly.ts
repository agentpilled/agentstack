import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const sendCalendly = createTool({
  id: 'acme-creators.send_calendly',
  description:
    "Send Sam's Calendly URL to the lead. Only call when the lead is `qualified` AND a notification has been sent to Sam via Telegram. The Calendly link is the LAST thing in the outgoing message.",
  inputSchema: z.object({
    igUserId: z.string(),
    contextLine: z
      .string()
      .describe(
        'One-sentence in-voice transition from the conversation to the link. Example: "ok let\'s set it up — pick a slot here:"',
      ),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    sent: z.string().describe('The full message text that was sent'),
    calendlyUrl: z.string(),
  }),
  // Side effect: sends a DM via Manychat
  requireApproval: true,
  execute: async ({ context }) => {
    // TODO: implement.
    // Required env: MANYCHAT_API_KEY, CALENDLY_BOOKING_URL
    // Behavior:
    //   - Construct: `${context.contextLine}\n\n${process.env.CALENDLY_BOOKING_URL}`
    //   - Send via Manychat send-message API to context.igUserId
    //   - Return ok + the sent text
    throw new Error('send_calendly: not implemented yet — wire Manychat in your agency repo')
  },
})
