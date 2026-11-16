<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/arcadia-mark-white.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/brand/arcadia-mark-black.svg">
    <img alt="Arcadia" src=".github/brand/arcadia-mark-black.svg" width="80">
  </picture>
  <h1>Lookout Marketplace</h1>
  <p>The official marketplace for Lookout: what connects your tools to Lookout, and Lookout to the tools you already use.</p>
  <p><a href="#what-is-here">What is here</a> | <a href="#connectors">Connectors</a> | <a href="#lookout-in-claude-code">Claude Code</a> | <a href="#repository-layout">Layout</a> | <a href="#development">Development</a> | <a href="https://lookout.arcadia.is/marketplace">Marketplace</a></p>
</div>

[![Lookout Marketplace](https://lookout.arcadia.is/og/marketplace.png)](https://lookout.arcadia.is/marketplace)

[Lookout](https://lookout.arcadia.is) is an agent harness across your model subscriptions, in any codebase, on any machine. This repository is its official marketplace: the Lookout app and the [Marketplace](https://lookout.arcadia.is/marketplace) on Lookout's site read their listings from here.

> [!NOTE]
> A Lookout account needs an invitation. Everything here works with one.

## What is here

| Listing | What it is | What it does |
|---|---|---|
| [Gmail](connectors/gmail/) | A connector for Lookout, in preview | Search, read, draft and organize your mail from a Lookout chat |
| [Lookout MCP](servers/lookout-mcp/) | An MCP server | Drive Lookout from any MCP host: start, steer, watch and stop Lookout sessions |
| [Lookout for Claude Code](plugins/lookout/) | A plugin for Claude Code | Hand tasks to Lookout agents from a Claude Code session, steer their chats, read your machines and usage |

## Connectors

A connector brings one of your tools into a Lookout chat. You add it inside Lookout, and Lookout signs you in to the tool itself. [Connectors and skills](https://lookout.arcadia.is/docs/connectors-and-skills) says how, and each connector's page says what it can read, what it can write and what it can't do.

## Lookout over MCP

[`servers/lookout-mcp/`](servers/lookout-mcp/README.md) is a standalone MCP server for a Lookout on the same machine, over Streamable HTTP with OAuth 2.1. Any MCP host can use it to run Lookout sessions.

## Lookout in Claude Code

The plugin lets a Claude Code session hand tasks to Lookout agents. You need Claude Code, and the Lookout Mac app or the `lookout` command on the same machine. The plugin runs on Bun: yours, or the copy Lookout ships.

```sh
claude plugin marketplace add arcadia-eng/lookout-marketplace   # add the marketplace
claude plugin install lookout@lookout-marketplace               # install the plugin
```

Inside an open session, type the same two lines with `/plugin` in place of `claude plugin`. While Lookout is not running, each call says so, and the first call after it starts works. A machine without Lookout connects another way, described in [How it connects](https://lookout.arcadia.is/docs/other-apps#claude-code-connect).

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
| `listings.json` | The listings feed the Lookout app reads |
| `listings.schema.json`, `scripts/` | The feed's schema and its validator |
| `connectors/` | Connectors Lookout adds itself: today [Gmail](connectors/gmail/) |
| `servers/lookout-mcp/` | The Lookout MCP server |
| `plugins/lookout/` | The Claude Code plugin |
| `.claude-plugin/marketplace.json` | The marketplace index Claude Code reads |
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

- A listing, a connector or the MCP server changes through a pull request, one listing at a time. CI runs validate, test and typecheck, and the request lands as a merge commit.
- The Claude Code plugin is built in Lookout's own repository and published here by Lookout's release, as a commit `feat: lookout X.Y.Z` and a tag `vX.Y.Z`. Report a problem with it as an issue.
- The steps and the checklist are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [Marketplace](https://lookout.arcadia.is/marketplace): the official connectors, with what each can and can't do
- [Connectors and skills](https://lookout.arcadia.is/docs/connectors-and-skills): connectors in Lookout
- [Claude Code plugin](https://lookout.arcadia.is/docs/other-apps#claude-code): install, how it connects, every part
- [`connectors/gmail/`](connectors/gmail/README.md): what the Gmail connector reads and writes, and what it can't do
- [`servers/lookout-mcp/`](servers/lookout-mcp/README.md): run the MCP server, its settings and its tools
- [`CONTRIBUTING.md`](CONTRIBUTING.md): add or change a listing

## Security

Report a vulnerability privately, from this repository's Security tab, as [SECURITY.md](SECURITY.md) says. Never put one in a public issue, and never paste a credential such as `LOOKOUT_MCP_TOKEN`.

## License

MIT, see [LICENSE](LICENSE). Lookout and the Arcadia mark are Arcadia's; Gmail and its logo are Google's.
