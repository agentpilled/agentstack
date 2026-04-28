{
  "name": "{{slug}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --experimental-strip-types src/main.ts",
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "agentstack-framework": "^0.1.3",
    "@mastra/core": ">=0.20.0 <2.0.0",
    "@mastra/memory": ">=0.1.0 <2.0.0",
    "hono": "^4.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
