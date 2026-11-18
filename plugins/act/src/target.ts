// Where a Claude Code session should attach. An explicit ACT_URL (a
// hermetic server, a non-default port) always wins, so a test never falls
// through to the app on 8789. Otherwise the stdio bridge whenever this
// machine has one (a checkout or the installed app), whether or not Act is
// running yet: it answers tools/list at once, says "not running" per call,
// and reaches the app the moment it is up, so Claude Code never records a
// failed server. Without a bridge on disk: a bridge already listening, then
// the hosted MCP.

export const LOCAL_APP_URL = "http://127.0.0.1:8789";
export const LOCAL_BRIDGE_ORIGIN = "http://127.0.0.1:8792";
export const LOCAL_BRIDGE_MCP = `${LOCAL_BRIDGE_ORIGIN}/mcp`;
export const REMOTE_MCP_URL = "https://act.arcadia.is/mcp";

export interface Probe {
  /** GET /api/health on the local app answered. */
  appUp: boolean;
  /** The HTTP bridge's /health named act-mcp. */
  bridgeUp: boolean;
}

export type Target =
  | { mode: "stdio"; actUrl: string }
  | { mode: "http"; mcpUrl: string; actUrl: string }
  | { mode: "remote"; mcpUrl: string };

export type Resolved =
  | Target
  | { mode: "missing"; actUrl: string; reason: string };

function clean(value: string | undefined): string {
  const v = value?.trim().replace(/\/$/, "") ?? "";
  return v;
}

/**
 * The first choice. `stdioOnDisk`: this machine has the bridge (a checkout or
 * the installed app); then it is the target, the app up or not, and no probe
 * is needed (`probe` may be null).
 */
export function chooseTarget(env: Record<string, string | undefined>, probe: Probe | null, opts: { stdioOnDisk?: boolean } = {}): Target {
  const explicit = clean(env.ACT_URL);
  if (explicit) return { mode: "stdio", actUrl: explicit };
  if (env.ACT_MCP_REMOTE === "1") {
    return { mode: "remote", mcpUrl: clean(env.ACT_MCP_REMOTE_URL) || REMOTE_MCP_URL };
  }
  if (opts.stdioOnDisk || !probe) return { mode: "stdio", actUrl: LOCAL_APP_URL };
  if (probe.appUp) return { mode: "stdio", actUrl: LOCAL_APP_URL };
  if (probe.bridgeUp) return { mode: "http", mcpUrl: LOCAL_BRIDGE_MCP, actUrl: LOCAL_APP_URL };
  return { mode: "remote", mcpUrl: clean(env.ACT_MCP_REMOTE_URL) || REMOTE_MCP_URL };
}

/**
 * Stdio mode needs the bridge source (`src/mcp/stdio.ts`). When this plugin
 * is installed without the Act checkout, an already-running HTTP bridge
 * is the same server. Neither means the local app is up and we cannot talk
 * to it: say so, instead of silently using the remote account.
 */
export function resolveTarget(target: Target, opts: { stdioEntry: string | null; bridgeUp: boolean }): Resolved {
  if (target.mode !== "stdio") return target;
  if (opts.stdioEntry) return target;
  if (opts.bridgeUp) return { mode: "http", mcpUrl: LOCAL_BRIDGE_MCP, actUrl: target.actUrl };
  return {
    mode: "missing",
    actUrl: target.actUrl,
    reason: `Act is at ${target.actUrl}, but this plugin cannot find src/mcp/stdio.ts and nothing is listening on ${LOCAL_BRIDGE_ORIGIN}. Set ACT_ROOT to an Act checkout, or start the bridge.`,
  };
}
