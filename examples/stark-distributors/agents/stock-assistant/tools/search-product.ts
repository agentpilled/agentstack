import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const searchProduct = createTool({
  id: 'stark-distributors.search_product',
  description:
    "Fuzzy search the catalog by partial SKU, family code, descriptive keyword, or measurement. Returns up to 5 matches ordered by relevance.",
  inputSchema: z.object({
    query: z.string().describe('Free-text query: partial SKU, keyword, or size'),
    family: z
      .enum(['BLT', 'NUT', 'WSH', 'LWS', 'SCR', 'STD', 'THR'])
      .optional()
      .describe('Restrict results to this product family'),
  }),
  outputSchema: z.object({
    matches: z
      .array(
        z.object({
          sku: z.string(),
          description: z.string(),
          family: z.string(),
          inStock: z.boolean(),
        }),
      )
      .max(5),
    truncated: z.boolean().describe('True if more matches existed beyond the cap'),
  }),
  // Read-only: no requireApproval needed
  execute: async ({ context }) => {
    // TODO: implement.
    // Required env: WAREHOUSE_API_URL, WAREHOUSE_API_KEY
    // GET ${WAREHOUSE_API_URL}/skus?q=${context.query}${context.family ? `&family=${context.family}` : ''}
    // Map response to matches array, cap at 5, set truncated=true if API reported more.
    throw new Error(
      'search_product: not implemented yet — wire the warehouse API in your agency repo',
    )
  },
})
