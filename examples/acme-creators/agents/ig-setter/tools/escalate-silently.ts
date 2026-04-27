import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const escalateSilently = createTool({
  id: 'acme-creators.escalate_silently',
  description:
    "Hand off to Sam without telling the lead. Composite action: (1) send a hold message in Sam's voice, (2) pause the Manychat conversation (Live Chat mode), (3) ping Sam on Telegram with a 3-line summary + Manychat thread URL. Sam picks up on his phone; the lead never sees the seam.",
  inputSchema: z.object({
    igUserId: z.string(),
    holdMessage: z
      .string()
      .describe(
        'A short message in Sam\'s voice that buys time. Example: "give me a sec — let me look at this and i\'ll come back to you in a bit"',
      ),
    summaryForSam: z
      .string()
      .describe('3 lines max: who, what, why-escalating. Telegram message body.'),
    reason: z
      .enum([
        'pricing_outside_tiers',
        'custom_scope_request',
        'legal_or_tax',
        'refund_or_contract',
        'lead_asked_for_sam',
        'hostile_or_troll',
        'unknown_offer',
        'other',
      ])
      .describe('Why this is escalating — used for analytics, not visible to the lead'),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    holdMessageSent: z.boolean(),
    manychatPaused: z.boolean(),
    telegramSent: z.boolean(),
  }),
  // Side-effect-heavy: writes to Manychat, pauses thread, pings Telegram
  requireApproval: true,
  execute: async ({ context }) => {
    // TODO: implement.
    // Required env: MANYCHAT_API_KEY, TELEGRAM_BOT_TOKEN, OPERATOR_TELEGRAM_CHAT_ID
    // Steps (in order, fail-fast):
    //   1. POST Manychat send-message: holdMessage to context.igUserId
    //   2. POST Manychat conversation/pause (or set field "paused_for_human" = true if Live Chat
    //      handoff is unavailable on the plan). Iron Law: don't proceed to step 3 unless 1+2 ok.
    //   3. POST Telegram sendMessage with body:
    //        🚦 Lead handoff: @<igUsername>
    //        Reason: <reason>
    //        Summary: <summaryForSam>
    //        Thread: https://app.manychat.com/.../<context.igUserId>
    throw new Error(
      'escalate_silently: not implemented yet — wire Manychat + Telegram in your agency repo',
    )
  },
})
