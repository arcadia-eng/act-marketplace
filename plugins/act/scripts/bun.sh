#!/bin/sh
# Runs a plugin script with Bun: the one on PATH, a usual install location,
# or the copy an installed Act ships, so the app alone is enough. It runs in
# the session's folder: no .env, bunfig.toml or tsconfig.json of that folder (a
# bunfig's preload would run first, a tsconfig's paths remap imports), and no
# flags from the environment.
unset BUN_OPTIONS BUN_INSPECT BUN_INSPECT_CONNECT_TO BUN_INSPECT_NOTIFY BUN_INSPECT_PRELOAD NODE_OPTIONS
for b in \
  "$(command -v bun 2>/dev/null)" \
  "$HOME/.bun/bin/bun" \
  /opt/homebrew/bin/bun \
  /usr/local/bin/bun \
  /Applications/Act.app/Contents/Resources/app.asar.unpacked/snapshot/bin/bun \
  "$HOME/Applications/Act.app/Contents/Resources/app.asar.unpacked/snapshot/bin/bun" \
  "$HOME/.act/cli/bun/bin/bun"
do
  if [ -n "$b" ] && [ -x "$b" ]; then exec "$b" --no-env-file --config=/dev/null --tsconfig-override=/dev/null "$@"; fi
done
echo "act: Bun not found. Install Act (it ships Bun) or Bun (https://bun.sh)." >&2
exit 127
