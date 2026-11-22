# Deploying the Act MCP server

This is the runbook shape for running the bridge as a service on a machine with the Act app or server running locally. Nothing here carries a secret; fill in your own values.

## Process

Run `bun src/main.ts` under a supervisor that starts at boot and restarts unconditionally on exit. Use a small wrapper so the token never appears in `ps` output, mode 600 and owned by the service user:

```sh
#!/bin/sh
# /opt/act-mcp/run.sh  (chmod 700, owner-only)
set -a
. /opt/act-mcp/env        # chmod 600: ACT_MCP_TOKEN=..., ACT_MCP_ROOTS=...
set +a
exec /usr/local/bin/bun /opt/act-mcp/src/main.ts
```

macOS launchd sketch:

```xml
<!-- ~/Library/LaunchAgents/com.example.act-mcp.plist -->
<dict>
  <key>Label</key><string>com.example.act-mcp</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/act-mcp/run.sh</string>
  </array>
  <key>StandardOutPath</key><string>/var/log/act-mcp.log</string>
  <key>StandardErrorPath</key><string>/var/log/act-mcp.log</string>
</dict>
```

On Linux, run the same wrapper under systemd with `Restart=always`.

Dynamic client registrations persist across restarts in the `ACT_MCP_CLIENTS_FILE` registry. Tokens, codes and pending consents live in memory only, so a restart ends live sessions and clients re-consent on their saved registration. Treat restarts as routine.

## Network

The server binds `127.0.0.1:8792`. Hosts on the internet need an HTTPS front:

- **Reverse SSH tunnel** to a small VPS running Caddy or nginx with automatic TLS, proxying to the forwarded port. An SSM-proxied session (`ProxyCommand aws ssm start-session ...`) reaches hosts with no inbound firewall rule, so nothing depends on the host's public IP.
- **cloudflared / ngrok**: `cloudflared tunnel --url http://127.0.0.1:8792` (Streamable HTTP works over quick tunnels).

Set `ACT_MCP_PUBLIC_URL` to the public origin. OAuth redirects, protected-resource metadata and icon URLs derive from it. Long-lived connections should avoid proxies with aggressive idle timeouts; plain JSON request/response keeps this mostly moot.

## Rollback

Deploy a new checkout alongside, flip the supervisor's program path, restart, then remove the old path. Verify with `GET /health` and one `initialize` plus `act_status` round trip from a real MCP client (the Inspector with the raw token is enough). Rollback flips the path back, and clients re-consent on their persisted registration.
