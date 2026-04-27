# acme-creators — Integrations checklist

## Manychat (Instagram DMs)

- **Plan:** Pro ($15/mo) — required for Live Chat handoff (silent escalation)
- **Auth:** `MANYCHAT_API_KEY` (in `.env`)
- **Integration model:** Dynamic Block — Manychat calls our webhook; we return the message synchronously
- **Webhook:** `POST /webhook/manychat` (registered in `src/main.ts`)
- **Owner:** Operator-on-duty + Sam

### Events we handle

| Trigger | `entry_source` | Initial agent action |
|---|---|---|
| Cold DM | `cold` | Greet, identify intent |
| Comment-to-DM | `comment_to_dm` | Greet contextualized to the post (`post_id`, `comment_text` in metadata) |
| Story reply | `story_reply` | Treat as discovery starter |

## Calendly (booking)

- **URL:** Sam's discovery-call Calendly (30 min slot type) — value in `.env` as `CALENDLY_BOOKING_URL`
- **Webhook:** `POST /webhook/calendly` to detect bookings → moves lead to `booked`
- **Auth:** `CALENDLY_SIGNING_KEY` (webhook signature verification)
- **Owner:** Sam

## Notion (lead store, visible to Sam)

- **Workspace:** Sam's Notion
- **Database ID:** `NOTION_LEADS_DB_ID` (in `.env`)
- **Auth:** `NOTION_API_KEY` (Notion integration token, DB shared with the integration)

### Lead DB schema

| Column | Type | Notes |
|---|---|---|
| `ig_username` | title | Display name |
| `ig_user_id` | text | Effective primary key |
| `state` | select | `cold` / `greeted` / `discovering` / `qualified` / `unqualified` / `booked` / `ghosted` |
| `source` | select | `cold` / `comment_to_dm` / `story_reply` |
| `first_seen` | date | First DM received |
| `last_active` | date | Last in/out message |
| `discovery_summary` | rich text | What they do, problem, momentum |
| `qualification_verdict` | select | `fit` / `not_fit` / `unclear` |
| `calendly_event` | url | Set after booking |
| `sam_notes` | rich text | Operator notes, post-call notes |
| `tags` | multi-select | `hot`, `cohort-q3`, `referral`, etc. |

## Telegram (operator alerts)

- **Bot:** `@acme_creators_setter_bot` (created via @BotFather)
- **Auth:** `TELEGRAM_BOT_TOKEN` + `OPERATOR_TELEGRAM_CHAT_ID`
- **Triggers:**
  - Lead `qualified` and Calendly link sent → resume + booking link
  - Silent handoff invoked → resume of state + deep link to Manychat thread
  - Hot lead asks something only Sam can answer
- **Format:** 3-line summary + Manychat thread URL

## CRM
- [ ] Not applicable. Notion DB serves as mini-CRM in v1.

## Email
- [ ] Not applicable for v1. Possible v2: nurturing emails for `unqualified` leads.

## Voice / Calendar / WhatsApp
- [ ] Not applicable.

## Internal APIs
- [ ] None.

## Knowledge base / RAG sources

| File | Content | Status |
|---|---|---|
| `src/shared/rag/voice-samples.md` | 3+ DMs Sam wrote himself. Used as golden inputs for the voice scorer. | Filled in this example |
| `src/shared/rag/offerings.md` | Cohort + advisory tiers, pricing, what's included | Filled |
| `src/shared/rag/objections.md` | Top 5 objections with a response in Sam's voice | Filled |

- **Ingest strategy:** One-time, manual. Re-ingest when Sam updates pricing or offerings.
- **Sensitive data:** No — these are public-facing materials.
