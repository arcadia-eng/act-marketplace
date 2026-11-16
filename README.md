<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/arcadia-mark-white.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/brand/arcadia-mark-black.svg">
    <img alt="Arcadia" src=".github/brand/arcadia-mark-black.svg" width="80">
  </picture>
  <h1>Lookout Marketplace</h1>
  <p>The Lookout plugin for Claude Code, and the connectors that bring your tools into a Lookout chat.</p>
  <p><a href="#install-the-claude-code-plugin">Install</a> | <a href="#what-the-plugin-adds">What it adds</a> | <a href="#repository-layout">Layout</a> | <a href="#development">Development</a> | <a href="https://lookout.arcadia.is/marketplace">Marketplace</a></p>
</div>

[![Lookout Marketplace](https://lookout.arcadia.is/og/marketplace.png)](https://lookout.arcadia.is/marketplace)

[Lookout](https://lookout.arcadia.is) is an agent harness across your model subscriptions, in any codebase, on any machine. This repository is its official marketplace.

If you work in Claude Code, the Lookout plugin from here lets a session hand tasks to Lookout agents, steer their chats, and read your machines and plan usage. The Lookout app reads its official connectors from here too, and so does the [Marketplace](https://lookout.arcadia.is/marketplace) on Lookout's site.

> [!NOTE]
> A Lookout account needs an invitation. Everything here works with one.

## Install the Claude Code plugin

You need Claude Code, and the Lookout Mac app or the `lookout` command on the same machine. The plugin runs on Bun: yours, or the copy Lookout ships.

```sh
claude plugin marketplace add arcadia-eng/lookout-marketplace   # add the marketplace
claude plugin install lookout@lookout-marketplace               # install the plugin
```

Inside an open session, type the same two lines with `/plugin` in place of `claude plugin`. While Lookout is not running, each call says so, and the first call after it starts works. A machine without Lookout connects another way, described in [How it connects](https://lookout.arcadia.is/docs/other-apps#claude-code-connect).

## What the plugin adds

| Part | What it does |
|---|---|
| `/lookout:delegate <brief>` | Hands a task to a Lookout agent and returns its result |
| `/lookout:steer <threadId> <message>` | Sends a follow-up into a chat |
| `/lookout:status` | Your chats, machines and provider quotas |
| `/lookout:machines [name]` | Lists your machines, and picks one |
| `/lookout:login` | Signs the plugin in to your account, on a machine without Lookout |
| `lookout:worker` | A subagent that hands a bounded task to a Lookout agent, waits, and returns the result |
| Skills | Run a fleet of chats (`orchestrate`), review what a chat changed (`review`), pick a model by quota (`models`), pick a machine (`machines`), run chats on a VPS (`vps-workers`) |
| MCP server `lookout` | The same tools as Lookout's own MCP server |
| Monitor, hook, status line | Tell a session when a chat it follows settles, asks or lands, and how many chats are running |

## Repository layout

| Path | What it holds |
|---|---|
| `plugins/lookout/` | The Claude Code plugin |
| `.claude-plugin/marketplace.json` | The marketplace index Claude Code reads |
| `listings.json` | The listings feed the Lookout app reads |
| `listings.schema.json`, `scripts/` | The feed's schema and its validator |
| `connectors/` | Connectors Lookout adds itself: today [Gmail](connectors/gmail/), in preview |
| `servers/lookout-mcp/` | A standalone MCP server for a Lookout on the same machine, over Streamable HTTP with OAuth 2.1 |
| `assets/` | Listing icons, each pinned to a tag |

## Development

```sh
bun install                        # dependencies, the MCP server's included
bun run validate                   # listings.json against its schema, versions and tags
bun test                           # the feed, the marketplace index and the MCP server
bun run typecheck                  # the MCP server's types
claude plugin validate --strict .  # the marketplace as Claude Code reads it
```

## How a change lands

- The plugin is built in Lookout's own repository and published here by Lookout's release, as a commit `feat: lookout X.Y.Z` and a tag `vX.Y.Z`. Report a problem with it as an issue.
- A listing, a connector or the MCP server changes through a pull request, one listing at a time. CI runs validate, test and typecheck, and the request lands as a merge commit.
- The steps and the checklist are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [Claude Code plugin](https://lookout.arcadia.is/docs/other-apps#claude-code): install, how it connects, every part
- [Connectors and skills](https://lookout.arcadia.is/docs/connectors-and-skills): connectors in Lookout
- [Marketplace](https://lookout.arcadia.is/marketplace): the official connectors, with what each can and can't do
- [`servers/lookout-mcp/`](servers/lookout-mcp/README.md): run the MCP server, its settings and its tools
- [`connectors/gmail/`](connectors/gmail/README.md): what the Gmail connector reads and writes, and what it can't do
- [`CONTRIBUTING.md`](CONTRIBUTING.md): add or change a listing

## Security

Report a vulnerability privately, from this repository's Security tab, as [SECURITY.md](SECURITY.md) says. Never put one in a public issue, and never paste a credential such as `LOOKOUT_MCP_TOKEN`.

## License

MIT, see [LICENSE](LICENSE). Lookout and the Arcadia mark are Arcadia's; Gmail and its logo are Google's.
