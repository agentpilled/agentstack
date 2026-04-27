import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const getWarehouseStock = createTool({
  id: 'stark-distributors.get_warehouse_stock',
  description:
    "Look up warehouse on-hand for an exact SKU. Returns total + per-lot breakdown ordered oldest-first.",
  inputSchema: z.object({
    sku: z.string().describe('Exact SKU as returned by search_product'),
  }),
  outputSchema: z.object({
    sku: z.string(),
    found: z.boolean(),
    warehouseTotal: z.number().int().min(0),
    lots: z.array(
      z.object({
        lotNumber: z.string(),
        quantity: z.number().int().min(0),
        receivedAt: z.string().describe('ISO 8601 date'),
        shelfLocation: z.string().nullable(),
      }),
    ),
    snapshotAt: z.string().describe('ISO 8601 timestamp of the data source'),
  }),
  // Read-only
  execute: async ({ context }) => {
    // TODO: implement.
    // GET ${WAREHOUSE_API_URL}/skus/${context.sku}/stock
    // Map response, order lots by receivedAt asc.
    throw new Error('get_warehouse_stock: not implemented yet')
  },
})
