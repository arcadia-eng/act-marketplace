import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ActClient } from "./client.js";
import { buildMcpServer, ACT_MCP_TOOL_NAMES, type ToolOptions } from "./tools.js";
import { authorized, bearerToken, installOAuth, OAuthStore, secretsEqual } from "./oauth.js";
import {
  APPLE_TOUCH_ICON_PATH, FAVICON_ICO_PATH, FAVICON_PNG_PATH,
  faviconIco, iconPng, landingPage,
} from "./branding.js";

export interface McpAppConfig {
  actUrl: string;
  publicUrl: string;
  token: string;
  originUrl: string;
  bridgeToken: string;
  bridgeLabel: string;
  roots: string[];
  clientsFile?: string;
  fetchFn?: typeof fetch;
  originFetch?: (path: string, init?: RequestInit) => Promise<Response>;
  buildServer?: (client: ActClient, opts: ToolOptions) => McpServer;
}

function scopeRefused(name: string, scope: readonly string[]): string {
  return `Tool "${name}" is outside this connection's tool scope ` +
    `(${scope.length} of ${ACT_MCP_TOOL_NAMES.length} tools allowed). ` +
    `Widen it in Settings > App access; the host's own toggles stay advisory.`;
}

export function createMcpApp(cfg: McpAppConfig): { app: Hono; oauth: OAuthStore } {
  const app = new Hono();
  const grantScopes = new Map<string, string[] | null>();
  const rawOriginFetch = cfg.originFetch
    ?? ((path: string, init?: RequestInit) => fetch(cfg.originUrl.replace(/\/$/, "") + path, init));
  const originFetch = async (path: string, init?: RequestInit): Promise<Response> => {
    const res = await rawOriginFetch(path, init);
    if (init?.method === "POST" && res.ok) {
      const check = /^\/api\/auth\/mcp\/grants\/([^/]+)\/check$/.exec(path);
      const redeem = !check && /^\/api\/auth\/mcp\/requests\/[^/]+\/redeem$/.test(path);
      try {
        if (check || redeem) {
          const data = await res.clone().json() as { grant?: { id?: unknown; toolScope?: unknown } };
          const id = check ? check[1]!
            : typeof data.grant?.id === "string" ? data.grant.id : null;
          if (id) {
            const ts = data.grant?.id === id ? data.grant.toolScope : undefined;
            const scope = ts === null ? null
              : Array.isArray(ts) && ts.length <= 64 && ts.every(t => typeof t === "string")
                ? [...new Set(ts as string[])].filter(t => ACT_MCP_TOOL_NAMES.includes(t)) : [];
            grantScopes.set(id, scope);
          }
        }
      } catch {
        if (check) grantScopes.set(check[1]!, []);
      }
    }
    return res;
  };
  const oauth = installOAuth(app, {
    publicUrl: cfg.publicUrl, token: cfg.token,
    originUrl: cfg.originUrl, bridgeToken: cfg.bridgeToken, bridgeLabel: cfg.bridgeLabel,
    clientsFile: cfg.clientsFile,
    originFetch,
  });
  const client = new ActClient(cfg.actUrl, cfg.fetchFn);
  const build = cfg.buildServer ?? buildMcpServer;

  app.get("/health", c => c.json({ ok: true, service: "act-mcp" }));
  app.all("/mcp/", c => c.redirect("/mcp", 307));

  const iconCache = { "cache-control": "public, max-age=86400" };
  app.get(FAVICON_PNG_PATH, () => new Response(iconPng(), { headers: { "content-type": "image/png", ...iconCache } }));
  app.get(APPLE_TOUCH_ICON_PATH, () => new Response(iconPng(), { headers: { "content-type": "image/png", ...iconCache } }));
  app.get(FAVICON_ICO_PATH, () => new Response(faviconIco(), { headers: { "content-type": "image/x-icon", ...iconCache } }));
  app.get("/", c => c.html(landingPage(cfg.publicUrl)));

  app.all("/mcp", async c => {
    if (!authorized(c.req.raw, oauth, cfg.token)) {
      return c.json({ error: "missing or invalid bearer token" }, 401, {
        "WWW-Authenticate": `Bearer resource_metadata="${cfg.publicUrl.replace(/\/$/, "")}/.well-known/oauth-protected-resource"`,
      });
    }
    const bearer = bearerToken(c.req.raw) ?? "";
    const raw = bearer !== "" && secretsEqual(bearer, cfg.token);
    const grantId = raw ? null : oauth.access.get(bearer)?.grantId ?? null;
    const scope = raw ? null : grantId && grantScopes.has(grantId) ? grantScopes.get(grantId)! : [];
    let body: { method?: unknown; id?: unknown; params?: { name?: unknown } } | null = null;
    try {
      const parsed: unknown = await c.req.raw.clone().json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        body = parsed as { method?: unknown; id?: unknown; params?: { name?: unknown } };
    } catch {}
    if (scope && body?.method === "tools/call") {
      const name = body.params?.name;
      if (typeof name === "string" && !scope.includes(name)) {
        return c.json({
          jsonrpc: "2.0",
          id: body.id ?? null,
          result: {
            content: [{ type: "text", text: JSON.stringify({ error: scopeRefused(name, scope) }) }],
            isError: true,
          },
        });
      }
    }
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const server = build(client, { roots: cfg.roots, publicUrl: cfg.publicUrl, allowedTools: scope });
    await server.connect(transport);
    try {
      return await transport.handleRequest(c.req.raw);
    } finally {
      await transport.close().catch(() => {});
      await server.close().catch(() => {});
    }
  });

  return { app, oauth };
}
