import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOL = {
  name: 'shopping_list',
  description: 'The structured shopping list parsed from the request.',
  input_schema: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'A single grocery category or item, e.g. "ramen"' },
            notes: { type: 'string', description: 'Any constraint mentioned for this category, e.g. "spicy", "instant", empty string if none' },
          },
          required: ['category', 'notes'],
        },
      },
      budget: { type: 'number', description: 'Total budget cap in USD. Use null if none was given.' },
    },
    required: ['categories', 'budget'],
  },
}

/**
 * Parses a natural language grocery request into a structured shopping list.
 * @param {string} request e.g. "Order groceries: noodles, ramen, dumplings, under $100."
 * @returns {Promise<{categories: {category: string, notes: string}[], budget: number|null}>}
 */
export async function runIntentAgent(request) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'shopping_list' },
    messages: [{ role: 'user', content: request }],
  })

  const toolUse = message.content.find(b => b.type === 'tool_use')
  if (!toolUse) throw new Error('Intent Agent did not return a structured shopping list')

  return toolUse.input
}
