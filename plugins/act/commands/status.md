---
description: Fleet, machines, and provider quotas for this Arcadia account
---

Show Act's fleet, machines, and quotas.

Run this and return its stdout as the report. Do not paraphrase it.

```bash
sh "${CLAUDE_PLUGIN_ROOT}/scripts/bun.sh" "${CLAUDE_PLUGIN_ROOT}/scripts/status.ts"
```

If the report says the local app is not answering, call the `act` MCP tools instead, once each, and report those:

- `act_status`
- `act_machines`
- `act_usage`
- `act_fleet` with `states: ["running", "needs_input", "failed", "quota", "background"]`

Do not poll. One call each.
