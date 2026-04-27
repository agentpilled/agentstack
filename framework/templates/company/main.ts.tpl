import { Hono } from 'hono'

// Register agents below as you add them.
// import { someAgent } from './agents/some-agent/agent.js'

const app = new Hono()

app.get('/', (c) => c.text('{{slug}} agents service'))

app.get('/health', (c) =>
  c.json({ status: 'ok', company: '{{slug}}' }),
)

// Wire each agent's routes here.

const port = Number(process.env.PORT ?? 3000)
console.log(`{{slug}} listening on http://localhost:${port}`)

export default { port, fetch: app.fetch }
