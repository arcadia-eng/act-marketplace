# Act MCP server

Drive Act from any MCP host over Streamable HTTP. The server is a separate process in front of Act's loopback API. Sign-in for people uses OAuth 2.1. Local use takes a raw operator Bearer.

## Quickstart (self-hosted, raw Bearer)

You need a running Act desktop app or `act` server on the machine (the server talks to it over loopback).

```bash
git clone https://github.com/arcadia-eng/act-marketplace.git
cd act-marketplace/servers/act-mcp

# Operator token: generate once, keep in a private file. This value is the
# Bearer your client sends below. Never commit it (.mcp-token is gitignored).
openssl rand -hex 32 > .mcp-token && chmod 600 .mcp-token

ACT_MCP_TOKEN="$(cat .mcp-token)" bun src/main.ts   # :8792
```

From the packed package (no checkout), the same entry runs as a bin. The executable carries a Bun shebang, so it runs wherever Bun is installed:

```bash
ACT_MCP_TOKEN="$(cat .mcp-token)" bunx @arcadia/act-mcp   # = bunx act-mcp; same env vars
```

Point any MCP client at `http://127.0.0.1:8792/mcp`, authenticating with the token you generated:

```
Authorization: Bearer <contents of .mcp-token>
```

Or connect from the [MCP Inspector](https://github.com/modelcontextprotocol/inspector): run `bunx @modelcontextprotocol/inspector`, choose Streamable HTTP, URL `http://127.0.0.1:8792/mcp`, and Bearer `$(cat .mcp-token)`. `initialize` answers with the 22 tools.

For remote access, put the port behind an HTTPS reverse proxy or tunnel (cloudflared, ngrok, Caddy, or anything that terminates TLS and forwards to `127.0.0.1:8792`) and set `ACT_MCP_PUBLIC_URL` to the public origin. The server binds `127.0.0.1` only.

### OAuth account consent

The raw Bearer above is the operator credential for local development and tests. Human sign-in uses OAuth 2.1 with the consent step delegated to an Act accounts origin. Besides `ACT_MCP_TOKEN`, OAuth needs:

- `ACT_MCP_ORIGIN_URL`: the accounts origin (consent pages and server-to-server grant calls)
- `ACT_MCP_BRIDGE_TOKEN`: the bridge credential that origin accepts

Self-hosting consent means running that origin too. Without both, the raw Bearer still works and `/authorize` answers 503 (browser consent unavailable). Codes, access tokens, refresh tokens and pending consents are held in memory. **A restart ends every live session, while the client's registration survives** (`ACT_MCP_CLIENTS_FILE` below), so reauth takes one authorize and consent hop instead of a fresh dynamic registration.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `ACT_MCP_TOKEN` | - (required) | raw Bearer for local Inspector and tests; always the full tool surface |
| `ACT_URL` | `http://127.0.0.1:8789` | the Act server to drive (loopback) |
| `ACT_MCP_PORT` | `8792` | listen port (host `127.0.0.1`) |
| `ACT_MCP_PUBLIC_URL` | `http://127.0.0.1:<port>` | the origin hosts reach (drives OAuth redirects and icon URLs) |
| `ACT_MCP_ROOTS` | - (empty) | comma-separated canonical roots `act_delegate` and `act_create_project` may create workspaces under; empty means existing projects only |
| `ACT_MCP_ORIGIN_URL` | `https://act.arcadia.is` | accounts origin for consent and grant checks |
| `ACT_MCP_BRIDGE_TOKEN` | - | bridge-to-origin credential; unset disables browser consent (503), raw Bearer unaffected |
| `ACT_MCP_BRIDGE_LABEL` | hostname | shown on the consent screen and in Sessions |
| `ACT_MCP_CLIENTS_FILE` | `$XDG_CONFIG_HOME/act/mcp/clients.json` (`~/.config/act/mcp/clients.json` without XDG) | durable dynamic-client registry: 0600 file, atomic writes, strictly revalidated on load; delete to reset all registrations |

## Transport and auth

- Streamable HTTP at `/mcp` via the official MCP TS SDK. Stateless: each request gets a fresh transport with no session affinity and plain JSON request and response. Tools are request/response by design (`act_delegate` returns a thread id immediately and progress is polled with `act_check`), so there is no SSE streaming and no server-initiated progress.
- OAuth 2.1 authorization server (RFC 8414 discovery, dynamic registration, S256 PKCE code flow, rotating refresh). Every refresh revalidates the grant against the origin. Revoking the connection refuses the next refresh, so a revoked connector dies with its live access token, at most 5 minutes (`ACCESS_TOKEN_TTL_SEC`) after revoke. Refresh lifetime is 30 days (`REFRESH_TTL_MS`). A refresh during an origin outage answers 503 without consuming the token.
- Per-connection tool scopes: a consented grant can carry a subset of the 22 tools. `tools/list` filters to the scope. `tools/call` outside it is refused before the Act server is reached, with an error naming the scope. The raw operator Bearer always sees the full surface.

## Tool surface

| MCP tool | What it does |
|---|---|
| `act_status` | server load, models, plan usage per provider, projects, running chats; call before delegating |
| `act_models` | curated model rows with effort ladders |
| `act_usage` / `act_usage_local` | provider plan windows / this machine's turns |
| `act_delegate` | one call: project + chat + prompt; returns the thread id immediately (omit prompt for an empty chat) |
| `act_check` | poll a chat: `statusLine` (working/needs-you/done), bounded entry tail with cursors, todos, pending question, background tasks |
| `act_list` / `act_projects` | recent chats / project rows |
| `act_steer` / `act_stop` | follow-up message / stop the turn and background runs |
| `act_rewind` / `act_restore` | edit and resend from a seq / reset files to a checkpoint |
| `act_compact` | compact a chat's context now |
| `act_answer` | answer the chat's pending question so a waiting turn continues |
| `act_configure` / `act_configure_project` | retune a chat / a project's defaults |
| `act_create_project` / `act_delete_project` / `act_delete_thread` | empty project shells / deletions |
| `act_tasks` / `act_cancel_task` / `act_task_transcript` | background Task runs |

Follow-ups reuse the same thread id (never a fresh delegate). Coding outlasts an MCP call: poll `act_check` every ~30s and read `statusLine` first.

## Safety

- `ACT_MCP_TOKEN` is the raw Bearer for local Inspector and tests. No human flow asks for it. The server binds `127.0.0.1`; a public URL must come from your own TLS proxy. Rotate by restarting.
- OAuth registration is open, with redirects limited to https (or http loopback). Codes are single-use PKCE and refresh tokens rotate. Registrations persist at `ACT_MCP_CLIENTS_FILE` and are strictly revalidated on load. A file that fails validation is preserved byte-for-byte and DCR answers 503 until it is repaired or removed.
- `ACT_MCP_ROOTS` gates workspace creation: `act_delegate` may create workspaces only under these canonicalized roots. Unset means existing projects only.
- No credential handling: the server never touches provider token stores and only drives the local API.
- A message starting with `#` is Act's memory shortcut; the bridge escapes it so it runs as a turn, and notes it in the result.

## Deploy

See [docs/deploy.md](docs/deploy.md) for the runbook shape: process supervisor (launchd or systemd), token file handling, TLS proxy fronting and rollback. No secrets are included.

## Development

```bash
bun install
bun test          # oauth, tools and branding suites
bun run typecheck
```

`src/` layout: `main.ts` executable entry, `index.ts` side-effect-free package surface, `app.ts` Hono wiring, `client.ts` loopback API client, `tools.ts` the 22 tools, `oauth.ts` the OAuth 2.1 AS, `branding.ts` + `icon-180.png`/`favicon.ico` the connector identity, `paths.ts` the canonical-path utility.

## License

MIT. See LICENSE.
