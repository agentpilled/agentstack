# stark-distributors — Integrations checklist

## Internal warehouse API

- **Base URL:** `WAREHOUSE_API_URL` (in `.env`) — points at the internal inventory service
- **Auth:** `WAREHOUSE_API_KEY` (bearer token)
- **Endpoints we use:**
  - `GET /skus?q=<query>` — fuzzy search by SKU prefix or descriptive keyword
  - `GET /skus/<sku>/stock` — warehouse on-hand + lot breakdown
  - `GET /shipments?customer=<name>&open=true` — open shipments by customer
- **Rate limit:** 60 req/min — agent must coalesce by SKU when answering multi-item queries
- **Owner:** Warehouse engineering team

## Slack (channel for queries + notifications)

- **Bot user:** `@stockbot`
- **Auth:** `SLACK_BOT_TOKEN` (chat:write, channels:read scopes)
- **Channels:** `#sales-stock` (sales rep queries), `#ops-stock` (warehouse staff)
- **Owner:** Internal IT

## Postgres (query result cache)

- **Connection:** `DATABASE_URL` (in `.env`)
- **Schema:** `agentstack_stark` (per-company namespace per Iron Law 3 cousin)
- **Tables used:**
  - `query_cache` — caches expensive warehouse API responses for 60 seconds
  - `query_log` — every agent query for debugging (30-day retention per CONTEXT)

## CRM / Ticketing / Email / Calendar / Voice / WhatsApp
- [ ] Not applicable. This agent is internal-only, single-channel (Slack).

## Knowledge base / RAG sources

| File | Content | Status |
|---|---|---|
| `src/shared/rag/glossary.md` | SKU naming conventions, abbreviations, customer aliases | Filled in this example |

- **Ingest strategy:** One-time, manual. Re-ingest when warehouse adds a new product family.
- **Sensitive data:** No. Glossary is operational-only.
