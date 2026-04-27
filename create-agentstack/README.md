# create-agentstack

Scaffolder for new [agentstack](https://github.com/agentpilled/agentstack) agency repos.

## Usage

```bash
pnpm create agentstack my-agency
cd my-agency
pnpm install
```

That gives you a multi-tenant agency repo: workspace-ready, `@agentstack/framework` wired in, `companies/` empty and waiting for `/agentstack-new-company`.

## What's in the box

- `package.json` — workspace root with `@agentstack/framework`, `@mastra/core`, `@mastra/memory`
- `pnpm-workspace.yaml` — `packages: ["companies/*"]`
- `tsconfig.json` — strict, ESM, NodeNext
- `.env.example` — provider keys + database URL
- `.gitignore` — node_modules, dist, .env, Mastra runtime, local DBs
- `README.md` + `CLAUDE.md` — agency repo conventions

## Options

```
create-agentstack <target> [--force]
```

- `<target>` — directory to create (must be empty or non-existent unless `--force`)
- `-f, --force` — scaffold into a non-empty directory (overwrites file collisions)

## License

MIT.
