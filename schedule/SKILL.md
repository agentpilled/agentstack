---
name: schedule
preamble-tier: 2
version: 0.1.0
description: |
  Schedule an agentstack runner to fire on a recurring cadence (every N minutes,
  daily at HH:MM, hourly). Generates the platform-native config — launchd plist
  on macOS, systemd user units on Linux — plus a wrapper that handles .env
  loading, locking against overlapping runs, and a window-of-operation gate.
  Also generates pause / resume / logs / uninstall helpers.
  Use after `/agentstack-new-agent` and `/agentstack-qa`, when the agent is
  ready to run on its own.
  Voice triggers: "schedule this agent", "make it run every 10 minutes", "set up cron for X", "agendalo cada N".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
triggers:
  - schedule
  - schedule this agent
  - run every
  - cron
  - agendalo cada
  - corralo cada
benefits-from: [new-agent, qa]
---

## Mission

Take a runner script the user already wrote (typically in `scripts/run-*.ts`) and put it on a recurring schedule via the OS's native job scheduler — `launchd` on macOS, `systemd` user timers on Linux. **Generate everything**: the platform config, a wrapper that handles the four things the scheduler can't (cwd, .env, window gate, locking), and four helper scripts (pause / resume / logs / uninstall). **Activate it**, verify it ran once, and report the install paths so the user can find / inspect / modify later.

You are not writing an agent loop in Node. You are wiring an existing script into the OS scheduler **correctly** — which means getting the four-things-the-scheduler-can't-do right. Most "my cron job doesn't work" stories are one of those four.

## When NOT to use this skill

- The user wants cloud-side scheduling (Cloudflare Workers cron, Render cron, GitHub Actions cron). That's a separate concern — point them at the v0.2 cloud doc. This skill is laptop / on-prem only.
- The user has no runner script yet. Point them at `/agentstack-new-agent` first; come back here once they have a `scripts/run-*.ts`.
- The runner needs to react to events (webhooks, messages, file watches). That's not scheduling — point them at the (future) `/agentstack-watch` skill.
- The user is on Windows. Tell them: WSL2 with systemd works (Tier 1), native Windows Task Scheduler we don't support yet.

## Preamble

```bash
# ─── Locate the agency repo root ──────────────────────────────────
# An agentstack agency repo has pnpm-workspace.yaml + companies/ + scripts/.
ROOT="$(pwd)"
while [ "$ROOT" != "/" ]; do
  if [ -f "$ROOT/pnpm-workspace.yaml" ] && [ -d "$ROOT/companies" ]; then
    break
  fi
  ROOT="$(dirname "$ROOT")"
done

if [ ! -f "$ROOT/pnpm-workspace.yaml" ]; then
  echo "✗ Not in an agentstack agency repo (no pnpm-workspace.yaml + companies/ found by walking up)."
  echo "  Run: pnpm create agentstack <name>  to scaffold one first."
  exit 1
fi

cd "$ROOT"
echo "→ Agency root: $ROOT"

# ─── Detect platform ──────────────────────────────────────────────
case "$(uname -s)" in
  Darwin) PLATFORM=macos ;;
  Linux)  PLATFORM=linux ;;
  *)
    echo "✗ Unsupported platform: $(uname -s). This skill supports macOS and Linux only."
    exit 1
    ;;
esac

# Linux: confirm systemd is the init AND user instance is available.
if [ "$PLATFORM" = "linux" ]; then
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "✗ Linux without systemd is unsupported. Try cron manually: crontab -e"
    exit 1
  fi
  if ! systemctl --user --version >/dev/null 2>&1; then
    echo "✗ systemd user instance unavailable. Likely a server / SSH session without lingering."
    echo "  Fix: loginctl enable-linger \$USER  (then re-login)"
    exit 1
  fi
fi

echo "→ Platform: $PLATFORM"

# ─── Discover candidate runner scripts ─────────────────────────────
# Convention: runners live in scripts/run-*.ts at the agency root.
RUNNERS=$(ls scripts/run-*.ts 2>/dev/null || true)
if [ -z "$RUNNERS" ]; then
  echo "ℹ No scripts/run-*.ts found. Either:"
  echo "  - User has a runner with a different name → ask them"
  echo "  - User hasn't written one yet              → point them at /agentstack-new-agent"
fi
echo ""
echo "Candidate runners:"
echo "$RUNNERS"

# ─── Locate this skill's templates dir ────────────────────────────
# When installed via npx agentstack-skills, the skill lives at:
#   ~/.claude/skills/agentstack-schedule/
# Templates are at templates/ inside that.
SKILL_DIR="${HOME}/.claude/skills/agentstack-schedule"
if [ ! -d "$SKILL_DIR/templates" ]; then
  echo "✗ Skill templates not found at $SKILL_DIR/templates"
  echo "  Reinstall: npx agentstack-skills"
  exit 1
fi
echo "→ Templates: $SKILL_DIR/templates"
```

## Procedure

You'll do this in seven steps. Each step has explicit checkpoints — do not skip ahead.

### Step 1 — Resolve the runner

Three cases:

- **User passed a script name as argument** (`/agentstack-schedule run-triage.ts` or `triage`): resolve to `scripts/run-triage.ts`. If not found, surface as error.
- **User passed nothing**: list candidate `scripts/run-*.ts`. If exactly one, confirm. If multiple, ask. If zero, refuse and point at `/agentstack-new-agent`.
- **The script exists but doesn't actually run an agent**: do a 5-second `head -50` sanity check — does it import from `agentstack-framework`? Does it call `.generate()` somewhere? If neither, ask the user: "this script doesn't look like an agent runner — schedule it anyway? (it'll work, but make sure it's idempotent)"

Once resolved, the runner has:
- `target_script` — relative path from agency root, e.g. `scripts/run-triage.ts`
- `name` — short slug derived from filename, e.g. `run-triage.ts` → `triage`. Confirm with user before proceeding (the slug shows up in launchctl labels and journalctl).
- `slug` — the company slug if the script targets one company; otherwise the name. Best effort — grep the script for `companies/<x>/`.

### Step 2 — Interview (5 questions max)

Ask the user the five questions below. Pose them all at once if the user seems comfortable; ask one-by-one if they're unsure. **Do not ask anything else** — these five are sufficient.

1. **Cadence** — accept one of:
   - `every Nm` (every N minutes, N ≥ 1)
   - `every Nh` (every N hours, N ≥ 1)
   - `hourly`
   - `daily HH:MM` (24-hour, e.g. `daily 09:00`)
   - Anything else: ask user to pick from the list. **Do not invent your own cron syntax** — the supported set above is what the templates handle correctly.

2. **Window of operation** — `always` or `HH-HH` (e.g. `09-21` for 9am-9pm). Default: `always`.

3. **(macOS only) Wake from sleep** — yes/no. Default: no. If yes, warn:
   > Wake-from-sleep only works when plugged in to power, and the Mac must allow it (System Settings → Lock Screen → Allow scheduled apps to wake from sleep). Without those, this flag is silently ignored.

4. **Overlap policy** — always `skip` in v0.1 (the wrapper enforces this with `flock`). Mention it but don't ask — the alternatives (queue / kill-previous) aren't worth the complexity at v0.1. If user explicitly asks for queue, tell them: "v0.1 supports skip-on-overlap only; queue would need work."

5. **Activate now** — yes/no. Default: yes. If no, write files but skip the `launchctl bootstrap` / `systemctl enable` step.

### Step 3 — Translate cadence → schedule block

Compute the schedule block for both platforms. The template uses a `{{schedule_block}}` placeholder that you fill in based on the user's cadence.

**macOS launchd `schedule_block`:**

| User cadence | XML to inject |
|---|---|
| `every 10m` | `<key>StartInterval</key><integer>600</integer>` |
| `every 2h`  | `<key>StartInterval</key><integer>7200</integer>` |
| `hourly`    | `<key>StartInterval</key><integer>3600</integer>` |
| `daily 09:00` | `<key>StartCalendarInterval</key><dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>` |

**Linux systemd timer `schedule_block`:**

| User cadence | INI to inject |
|---|---|
| `every Nm`   | `OnUnitActiveSec=Nmin\nOnBootSec=2min` |
| `every Nh`   | `OnUnitActiveSec=Nh\nOnBootSec=2min` |
| `hourly`     | `OnCalendar=hourly\nOnBootSec=2min` |
| `daily HH:MM`| `OnCalendar=*-*-* HH:MM:00` |

### Step 4 — Compute paths

Define everything relative to either `$HOME` (per-user, no sudo needed) or the agency root.

```bash
LABEL="agentstack.${slug}.${name}"      # e.g. agentstack.maticarrera.triage
WRAPPER="${ROOT}/scripts/_${name}-wrapper.sh"

# Logs follow OS convention
case "$PLATFORM" in
  macos) LOG_PATH="${HOME}/Library/Logs/${LABEL}.log" ;;
  linux) LOG_PATH="${HOME}/.local/state/agentstack/${LABEL}.log" ;;
esac

# Lock lives next to .mastra/ — easy to find, gitignored
LOCK_PATH="${ROOT}/.mastra/${name}.lock"

case "$PLATFORM" in
  macos)
    CONFIG_PATH="${HOME}/Library/LaunchAgents/${LABEL}.plist"
    ;;
  linux)
    UNITS_DIR="${HOME}/.config/systemd/user"
    SERVICE_PATH="${UNITS_DIR}/${name}.service"
    TIMER_PATH="${UNITS_DIR}/${name}.timer"
    mkdir -p "$UNITS_DIR"
    ;;
esac

mkdir -p "$(dirname "$LOG_PATH")"
mkdir -p "$(dirname "$LOCK_PATH")"
```

### Step 5 — Render templates

For each template under `$SKILL_DIR/templates/`, do a placeholder substitution and write to the right destination. **Use the `Read` tool to read each `.tpl`, do string replacement on the placeholders below, then `Write` to the destination.**

Placeholders to substitute in every template:

| Placeholder | Value |
|---|---|
| `{{slug}}` | the company / agency slug |
| `{{name}}` | the runner short name (e.g. `triage`) |
| `{{label}}` | `agentstack.${slug}.${name}` |
| `{{schedule_human}}` | the user's natural-language cadence (e.g. "every 10m, 09-21h") |
| `{{generated_at}}` | `date -u '+%Y-%m-%dT%H:%M:%SZ'` |
| `{{agency_root}}` | absolute `$ROOT` |
| `{{wrapper_path}}` | absolute `$WRAPPER` |
| `{{target_script}}` | relative `scripts/run-X.ts` |
| `{{log_path}}` | absolute `$LOG_PATH` |
| `{{lock_path}}` | absolute `$LOCK_PATH` |
| `{{window_start}}` / `{{window_end}}` | hour ints, or empty strings if always-on |
| `{{schedule_block}}` | platform-specific from Step 3 |
| `{{wake_block}}` | macOS only — `<key>WakeFromSleep</key><true/>` if user wants it; empty otherwise |
| `{{service_filename}}` | Linux only — `${name}.service` |

Files to render and write:

1. `wrapper.sh.tpl` → `$WRAPPER` (then `chmod +x`)
2. **macOS**: `macos.plist.tpl` → `$CONFIG_PATH`
3. **Linux**: `linux.service.tpl` → `$SERVICE_PATH` AND `linux.timer.tpl` → `$TIMER_PATH`
4. `schedule-pause.sh.tpl`     → `${ROOT}/scripts/${name}-pause.sh`     (chmod +x)
5. `schedule-resume.sh.tpl`    → `${ROOT}/scripts/${name}-resume.sh`    (chmod +x)
6. `schedule-logs.sh.tpl`      → `${ROOT}/scripts/${name}-logs.sh`      (chmod +x)
7. `schedule-uninstall.sh.tpl` → `${ROOT}/scripts/${name}-uninstall.sh` (chmod +x)

### Step 6 — Activate (unless user said no)

```bash
case "$PLATFORM" in
  macos)
    # Bootout first in case it was already loaded — idempotent.
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$CONFIG_PATH"
    echo "✓ launchd registered: $LABEL"
    ;;
  linux)
    systemctl --user daemon-reload
    systemctl --user enable --now "${name}.timer"
    echo "✓ systemd timer enabled: ${name}.timer"
    ;;
esac
```

### Step 7 — Verify with a one-shot run + report

Trigger a one-time run synchronously and confirm it produced log output. This catches `.env` issues, PATH issues, and missing dependencies BEFORE the user notices "the cron isn't running" three days later.

```bash
case "$PLATFORM" in
  macos)
    launchctl kickstart -p "gui/$(id -u)/${LABEL}"
    ;;
  linux)
    systemctl --user start "${name}.service"
    ;;
esac

# Wait up to 30s for log output. Sleep 2s, check, repeat.
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if [ -s "$LOG_PATH" ]; then break; fi
  sleep 2
done

if [ ! -s "$LOG_PATH" ]; then
  echo "⚠ One-shot test ran but produced no log output in 30s."
  echo "  This could mean: (a) the runner is silent on success, (b) it's stuck, (c) the wrapper crashed before logging."
  echo "  Check: tail -f $LOG_PATH  and run scripts/${name}-logs.sh"
else
  echo "✓ One-shot test produced log output. Tail of $LOG_PATH:"
  tail -10 "$LOG_PATH"
fi
```

Then print the **install report** (see Output Format below). The report tells the user where everything lives so they can find / debug / modify later.

## Output format

End with a structured report:

```
✓ Scheduled: <slug>/<name>
  Cadence:    <human>
  Window:     <e.g. 09-21h, or "always">
  Platform:   <macos | linux>
  Wake:       <yes | no>  (macos only; omit otherwise)
  Overlap:    skip  (held by .mastra/<name>.lock)

  Files written:
    wrapper:    <absolute path>
    config:     <plist or .timer + .service paths>
    log:        <log path>
    helpers:    scripts/<name>-{pause,resume,logs,uninstall}.sh

  First run:   <timestamp from one-shot>  <exit ok | exit N>

  Manage it:
    pause:      ./scripts/<name>-pause.sh
    resume:     ./scripts/<name>-resume.sh
    logs:       ./scripts/<name>-logs.sh
    uninstall:  ./scripts/<name>-uninstall.sh

  Edit the schedule:
    macos:  $EDITOR ~/Library/LaunchAgents/<label>.plist  &&  ./scripts/<name>-resume.sh
    linux:  $EDITOR ~/.config/systemd/user/<name>.timer    &&  systemctl --user daemon-reload
```

## Things you do not do

- **You do not skip the one-shot verification (Step 7).** That step catches 80% of "my cron isn't running" issues at install time, when the user can still adjust. Skipping it pushes those failures into silence.
- **You do not invent cron syntax.** The supported cadences are: `every Nm`, `every Nh`, `hourly`, `daily HH:MM`. If the user wants `0 */2 * * *`, tell them to edit the generated config by hand and re-run `daemon-reload` / `launchctl bootout && bootstrap`.
- **You do not embed secrets in the plist or service file.** The wrapper sources `.env` itself — that's the one place secrets live. If the wrapper can't find `.env`, log a clear error and exit; do not silently degrade.
- **You do not write `requireApproval: true` semantics.** Iron Law 6 lives at the agent level (Mastra tool config), not the schedule level. A scheduled run that triggers side-effect tools must already have those tools gated. If you suspect a scheduled run will fire un-gated side effects, **stop and surface it to the user.**
- **You do not assume the user wants the schedule to run during onboarding.** Step 7 runs ONCE for verification. If the runner makes side effects, the user has been warned in `Step 6 — Activate` and they chose `--activate-now`. If they didn't, you don't run it.
- **You do not generate a schedule for a script you can't see.** If `target_script` doesn't exist in the agency repo, refuse and ask them to create it first.
- **You do not delete the wrapper / log / lock when uninstalling.** The uninstall helper script (which YOU generated) explicitly leaves them so the user can audit history. Stay consistent with that.

## Iron Laws relationship

- **Iron Law 5 — state machines stay legible**: `daily 09:00` is one state, `every 10m, 09-21h` is two. Don't combine cadences in one schedule — split into two scheduled jobs if the user genuinely needs two cadences for the same runner.
- **Iron Law 6 — side-effect tools require approval**: schedules don't bypass this. If a tool has `requireApproval: true` and the schedule fires it, the agent must escalate or no-op. The runner is responsible for handling approval-required tools when running unattended.
- **Iron Law 8 — disclosure decided before role.md**: a scheduled agent that drafts replies inherits the same disclosure stance as its interactive sibling. Don't change the rules just because there's no human in the loop at the moment of generation.
