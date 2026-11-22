import { realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export function canonicalPath(absPath: string): string {
  const rest: string[] = [];
  for (let cur = resolve(absPath); ;) {
    try { return join(realpathSync(cur), ...rest); } catch {}
    const parent = dirname(cur);
    if (parent === cur) return resolve(absPath);
    rest.unshift(basename(cur));
    cur = parent;
  }
}
