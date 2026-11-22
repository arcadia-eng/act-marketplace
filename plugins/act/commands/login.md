---
description: Sign this plugin in to your Arcadia account, on a machine without the Act app
---

Sign the Act plugin in to Act's hosted MCP. A machine with the Act app needs no sign-in: the plugin uses the app.

Run this with a 10 minute timeout. It opens the browser at Act's sign-in page and waits until the person signs in there:

```bash
CLAUDE_PLUGIN_DATA="${CLAUDE_PLUGIN_DATA}" sh "${CLAUDE_PLUGIN_ROOT}/scripts/bun.sh" "${CLAUDE_PLUGIN_ROOT}/scripts/login.ts"
```

If the browser does not open, give the person the address the script printed. Once it says `signed in`, the `act` tools work on their next call. If `/mcp` shows the `act` server as failed, reconnect it there.

The script never prints a token. Do not read or print the file it names.
