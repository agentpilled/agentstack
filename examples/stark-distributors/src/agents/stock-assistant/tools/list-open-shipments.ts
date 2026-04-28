import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const listOpenShipments = createTool({
  id: 'stark-distributors.list_open_shipments',
  description:
    "List open (not-yet-delivered) shipments. Filter by customer name (will be alias-normalized) or by SKU. At least one filter is required.",
  inputSchema: z
    .object({
      customer: z.string().optional().describe('Customer name or alias (will be normalized)'),
      sku: z.string().optional().describe('Filter to a single SKU'),
    })
    .refine((v) => v.customer || v.sku, {
      message: 'Must provide at least one of: customer, sku',
    }),
  outputSchema: z.object({
    shipments: z.array(
      z.object({
        shipmentId: z.string(),
        customer: z.string().describe('Normalized internal name'),
        skuCount: z.number().int().min(0),
        unitCount: z.number().int().min(0),
        plannedShipDate: z.string().describe('ISO 8601 date'),
        status: z.enum(['picked', 'in_transit', 'delayed']),
      }),
    ),
    snapshotAt: z.string(),
  }),
  // Read-only
  execute: async ({ context }) => {
    // TODO: implement.
    // GET ${WAREHOUSE_API_URL}/shipments?open=true
    //   &${context.customer ? `customer=${normalizeCustomer(context.customer)}` : ''}
    //   &${context.sku ? `sku=${context.sku}` : ''}
    //
    // normalizeCustomer reads shared/rag/glossary.md alias table; for v0.1, the
    // mapping should live in code (e.g. a TS const) loaded from the markdown at startup.
    throw new Error('list_open_shipments: not implemented yet')
  },
})
