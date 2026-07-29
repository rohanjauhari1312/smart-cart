import 'dotenv/config'
import { runGroceryPipeline } from '../src/pipeline.js'

const REQUEST = 'Order groceries: noodles, ramen, dumplings, under $100.'
const USER = { userId: 'test-user-123', diet: 'nonveg' }

const result = await runGroceryPipeline(REQUEST, USER)

console.log(`\nRequest: "${REQUEST}"`)
console.log(`Session ID: ${result.sessionId}\n`)

console.log('CART:')
for (const item of result.cart) {
  console.log(
    `  [${item.category}] ${item.brand ? item.brand + ' ' : ''}${item.description} — $${item.price.toFixed(2)} | Nutri-Score ${item.nutriScore ?? 'unknown'} | NOVA ${item.novaGroup ?? 'unknown'}`
  )
}

if (result.skipped.length) {
  console.log('\nSKIPPED:')
  for (const s of result.skipped) console.log(`  [${s.category}] ${s.reason}`)
}

console.log(`\nRunning total: $${result.total.toFixed(2)}${result.budget != null ? ` / budget $${result.budget}` : ''}`)
console.log(`Free delivery minimum: $${result.freeDeliveryMinimum} — ${result.metFreeDeliveryMinimum ? 'met' : 'NOT met'}`)

console.log('\nREASONING TRAIL:')
for (const line of result.reasoning) console.log(`  - ${line}`)
