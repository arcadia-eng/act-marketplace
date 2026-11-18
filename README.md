<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/arcadia-mark-white.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/brand/arcadia-mark-black.svg">
    <img alt="Arcadia" src=".github/brand/arcadia-mark-black.svg" width="80">
  </picture>
  <h1>Act Marketplace</h1>
  <p>The official marketplace for Act: what connects your tools to Act, and Act to the tools you already use.</p>
  <p><a href="#what-is-here">What is here</a> | <a href="#connectors">Connectors</a> | <a href="#act-in-claude-code">Claude Code</a> | <a href="#repository-layout">Layout</a> | <a href="#development">Development</a> | <a href="https://act.arcadia.is/marketplace">Marketplace</a></p>
</div>

[![Act Marketplace](https://act.arcadia.is/og/marketplace.png)](https://act.arcadia.is/marketplace)

[Act](https://act.arcadia.is) is an agent harness across your model subscriptions, in any codebase, on any machine. This repository is its official marketplace: the Act app and the [Marketplace](https://act.arcadia.is/marketplace) on Act's site read their listings from here.

> [!NOTE]
> An Act account needs an invitation. Everything here works with one.

## What is here

| Listing | What it is | What it does |
|---|---|---|
| [Gmail](connectors/gmail/) | A connector for Act, in preview | Search, read, draft and organize your mail from an Act chat |
| [Act MCP](servers/act-mcp/) | An MCP server | Drive Act from any MCP host: start, steer, watch and stop Act sessions |
| [Act for Claude Code](plugins/act/) | A plugin for Claude Code | Hand tasks to Act agents from a Claude Code session, steer their chats, read your machines and usage |

## Connectors

A connector brings one of your tools into an Act chat. You add it inside Act, and Act signs you in to the tool itself. [Connectors and skills](https://act.arcadia.is/docs/connectors-and-skills) says how, and each connector's page says what it can read, what it can write and what it can't do.

## Act over MCP

[`servers/act-mcp/`](servers/act-mcp/README.md) is a standalone MCP server for an Act on the same machine, over Streamable HTTP with OAuth 2.1. Any MCP host can use it to run Act sessions.

## Act in Claude Code

The plugin lets a Claude Code session hand tasks to Act agents. You need Claude Code, and the Act Mac app or the `act` command on the same machine. The plugin runs on Bun: yours, or the copy Act ships.

```sh
claude plugin marketplace add arcadia-eng/act-marketplace   # add the marketplace
claude plugin install act@act-marketplace                   # install the plugin
```

Inside an open session, type the same two lines with `/plugin` in place of `claude plugin`. While Act is not running, each call says so, and the first call after it starts works. A machine without Act connects another way, described in [How it connects](https://act.arcadia.is/docs/other-apps#claude-code-connect).

| Part | What it does |
|---|---|
| `/act:delegate <brief>` | Hands a task to an Act agent and returns its result |
| `/act:steer <threadId> <message>` | Sends a follow-up into a chat |
| `/act:status` | Your chats, machines and provider quotas |
| `/act:machines [name]` | Lists your machines, and picks one |
| `/act:login` | Signs the plugin in to your account, on a machine without Act |
| `act:worker` | A subagent that hands a bounded task to an Act agent, waits, and returns the result |
| Skills | Run a fleet of chats (`orchestrate`), review what a chat changed (`review`), pick a model by quota (`models`), pick a machine (`machines`), run chats on a VPS (`vps-workers`) |
| MCP server `act` | The same tools as Act's own MCP server |
| Monitor, hook, status line | Tell a session when a chat it follows settles, asks or lands, and how many chats are running |

## Repository layout

| Path | What it holds |
|---|---|
| `listings.json` | The listings feed the Act app reads |
| `listings.schema.json`, `scripts/` | The feed's schema and its validator |
| `connectors/` | Connectors Act adds itself: today [Gmail](connectors/gmail/) |
| `servers/act-mcp/` | The Act MCP server |
| `plugins/act/` | The Claude Code plugin |
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
- The Claude Code plugin is built in Act's own repository and published here by Act's release, as a commit `feat: act X.Y.Z` and a tag `vX.Y.Z`. Report a problem with it as an issue.
- The steps and the checklist are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [Marketplace](https://act.arcadia.is/marketplace): the official connectors, with what each can and can't do
- [Connectors and skills](https://act.arcadia.is/docs/connectors-and-skills): connectors in Act
- [Claude Code plugin](https://act.arcadia.is/docs/other-apps#claude-code): install, how it connects, every part
- [`connectors/gmail/`](connectors/gmail/README.md): what the Gmail connector reads and writes, and what it can't do
- [`servers/act-mcp/`](servers/act-mcp/README.md): run the MCP server, its settings and its tools
- [`CONTRIBUTING.md`](CONTRIBUTING.md): add or change a listing

## Security

Report a vulnerability privately, from this repository's Security tab, as [SECURITY.md](SECURITY.md) says. Never put one in a public issue, and never paste a credential such as `LOOKOUT_MCP_TOKEN`.

## License

MIT, see [LICENSE](LICENSE). Act and the Arcadia mark are Arcadia's; Gmail and its logo are Google's.
