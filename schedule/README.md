# schedule

Skill that puts an agentstack runner on a recurring schedule using the OS's native job scheduler — `launchd` on macOS, `systemd` user timers on Linux.

Invoked as `/agentstack-schedule` from inside an agentstack agency repo.

## Why a skill, not a framework primitive

Scheduling has a big design space: cron syntax vs interval vs calendar, env loading, locking, log rotation, wake-from-sleep, platform differences (launchd / systemd / Windows / cloud). Different real builds will need different combinations. **Until we see N≥2 real builds with scheduled runners, we don't extract anything to the framework** — speculative primitives age badly.

What stays stable across cases is the *operational checklist*: cd to root, source `.env`, lock against overlap, gate by window, run, log, exit cleanly. That's what the skill encodes — as a wrapper script template plus a platform-specific config (plist or systemd unit). The skill is the human-readable version of "the boring 80% you'd otherwise write yourself per agent."

When N≥2 lands, the framework graduates `defineRunner({ ..., schedule: { every: '10m', ... } })` and this skill reads that metadata instead of asking the user. That's a v0.2 milestone.

## Layout

```
schedule/
├── SKILL.md                          # the instructions Claude follows
├── README.md                         # this file
└── templates/
    ├── wrapper.sh.tpl                # cd + .env + lock + window + run, in bash
    ├── macos.plist.tpl               # launchd job
    ├── linux.service.tpl             # systemd oneshot service
    ├── linux.timer.tpl               # systemd timer
    ├── schedule-pause.sh.tpl         # helper: temporarily disable
    ├── schedule-resume.sh.tpl        # helper: re-enable
    ├── schedule-logs.sh.tpl          # helper: tail logs
    └── schedule-uninstall.sh.tpl     # helper: remove permanently
```

The skill renders these templates by replacing `{{placeholders}}` with values it computed during the interview, and writes them to the right OS locations:

- macOS: `~/Library/LaunchAgents/agentstack.<slug>.<name>.plist`
- Linux: `~/.config/systemd/user/<name>.{service,timer}`
- Wrapper: `<agency>/scripts/_<name>-wrapper.sh`
- Helpers: `<agency>/scripts/<name>-{pause,resume,logs,uninstall}.sh`
- Logs: `~/Library/Logs/...` (macOS) or `~/.local/state/agentstack/...` (Linux)

## Supported cadences

| Form | Example | macOS | Linux |
|---|---|---|---|
| `every Nm` | `every 10m` | `StartInterval=600` | `OnUnitActiveSec=10min` |
| `every Nh` | `every 2h` | `StartInterval=7200` | `OnUnitActiveSec=2h` |
| `hourly` | `hourly` | `StartInterval=3600` | `OnCalendar=hourly` |
| `daily HH:MM` | `daily 09:00` | `StartCalendarInterval` | `OnCalendar=*-*-* 09:00:00` |

For arbitrary cron expressions, edit the generated plist or `.timer` by hand. The skill explicitly does NOT support `cron <expr>` because launchd has no equivalent — half the cron expressions don't translate, and silent partial-translations are worse than refusing.

## What the wrapper does (the four things schedulers can't)

The wrapper script is the load-bearing piece of this skill. Every scheduled job goes through it because cron / launchd / systemd contexts are missing four things the script needs:

1. **Working directory** — cron runs from `/` or `$HOME`. The wrapper `cd`s to the agency root.
2. **Shell environment** — cron has a sterile env. The wrapper sources `.env` so API keys and DB URLs are present.
3. **Window of operation** — most schedulers can't easily say "every 10m, but only 09:00-21:00." The wrapper checks the hour and exits early outside the window.
4. **Lock against overlap** — if a run takes longer than the interval, you don't want the next tick stepping on it. The wrapper uses `flock -n` on a lockfile under `.mastra/`.

Edit the wrapper if you need to change any of those — re-running the skill regenerates it, so save your changes elsewhere or commit them.

## When NOT to use this skill

- Cloud scheduling (Cloudflare Workers cron, Render cron, GitHub Actions cron) — different problem, different solution. v0.2 doc.
- Event-driven runs (webhooks, file watches, message queues) — that's a future `/agentstack-watch` skill, not this one.
- Windows native — only WSL2 with systemd is supported.

## License

MIT.
