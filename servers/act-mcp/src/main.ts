#!/usr/bin/env bun
import { hostname, homedir } from "node:os";
import { join } from "node:path";
import { canonicalPath } from "./paths.js";
import { createMcpApp } from "./app.js";

const port = Number(process.env.ACT_MCP_PORT ?? 8792);
const token = process.env.ACT_MCP_TOKEN ?? "";
if (!token) {
  console.error("ACT_MCP_TOKEN is required (raw Bearer for local dev and tests).");
  process.exit(1);
}
const bridgeToken = process.env.ACT_MCP_BRIDGE_TOKEN ?? "";
if (!bridgeToken)
  console.error("ACT_MCP_BRIDGE_TOKEN is unset: browser consent is unavailable until it is set (raw Bearer still works).");
const publicUrl = (process.env.ACT_MCP_PUBLIC_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
const originUrl = (process.env.ACT_MCP_ORIGIN_URL ?? "https://act.arcadia.is").replace(/\/$/, "");
const bridgeLabel = process.env.ACT_MCP_BRIDGE_LABEL?.trim() || hostname();
const roots = (process.env.ACT_MCP_ROOTS ?? "").split(",").map(s => s.trim()).filter(Boolean).map(canonicalPath);
const clientsFile = process.env.ACT_MCP_CLIENTS_FILE?.trim()
  || join(process.env.XDG_CONFIG_HOME?.trim() || join(homedir(), ".config"), "act", "mcp", "clients.json");
const actUrl = process.env.ACT_URL ?? "http://127.0.0.1:8789";

const { app } = createMcpApp({
  actUrl, publicUrl, token, originUrl, bridgeToken, bridgeLabel, roots, clientsFile,
});

export default { port, hostname: "127.0.0.1", fetch: app.fetch };
console.log(`act-mcp on :${port} -> ${actUrl} (public ${publicUrl}, origin ${originUrl}, bridge "${bridgeLabel}", clients ${clientsFile}, roots: ${roots.join(", ") || "(projects only)"})`);
