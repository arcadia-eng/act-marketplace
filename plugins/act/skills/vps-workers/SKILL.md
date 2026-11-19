---
name: vps-workers
description: Run Act chats on the user's Linux VPSs instead of this Mac, to spread CPU and memory. Enroll a VPS as an Act machine, get a repository onto it, place chats by load, wait, collect, push and merge their work, and clean up. Use when the user wants Act agents on a VPS, more parallel agents than this Mac should carry, or load balanced across machines.
---

# Act agents on a VPS

A VPS is a worker of the user's Arcadia account: it runs whole Act chats (loop, tools, subscriptions) and reports its load. This Mac is the control plane: you place work from here. This skill puts coding chats on a VPS. Act Agents (the app's orchestrator agents) live on the Mac unless the user makes a machine an agents host (`act_configure_machine {machine, agentsHost: true}`, only when the user asks) and moves an agent there or creates one on it.

## 1. Enroll a fresh VPS (once)

0. `act_machines` first: a box already listed is enrolled (go to 3; `outdated` means upgrade, never re-enroll). A box already running an Act node as the user `act` for something else: add `ACT_USER=<another name>` to the line below, since the line takes over whatever runs as its user.
1. `act_install_line {name: "vps-2"}` gives the line. It names the user's account (not a secret), so the request to join reaches only their devices.
2. Run it as root over ssh: `ssh root@HOST '<line>'`. As root it creates the user `act` and installs everything as that user, with a lingering systemd user service. On a box shared with CI, add `ACT_MEMORY_MAX=6G ACT_CPU_WEIGHT=20` before `sh`. It never prompts: it prints a code and an `act://add/...` link and exits; the service finishes the join once it is approved (`ssh root@HOST 'sudo -iu act act status --json'` shows `state: "waiting"`, `code`, `addLink`). Then `act_open_add_link {link}` brings the request up in Act on this Mac with the code already checked, and tell the user: "Approve vps-2 in Act." That click is the one step that needs them, by design (the vault is zero-knowledge: only a member device can add a machine). `act_machines` lists it under `waiting` until then.
3. `act_machines`: the new machine is `online` with a `capacity` block and no `outdated`.
4. `act_doctor {machine: "vps-2"}`: `providers.connected` lists the vault's providers; read `problems`. Provider sign-ins reach a VPS only this way, through the vault sync: never copy an auth file, a token or a copy of a sign-in there (scp, a heredoc, a project's `setup`, a chat's prompt). `act_models {machine: "vps-2"}` lists the model ids that run there.
5. Git, when the work clones private repositories or pushes. Ask the user for a token (a fine-grained one scoped to the repositories), then:
   `printf %s "$TOKEN" | ssh root@HOST 'sudo -iu act act git setup --host github.com --token-stdin'`
   `ssh root@HOST 'sudo -iu act act git setup --name "NAME" --email EMAIL'`
   (`--host` is the forge's host; `--user` defaults to `x-access-token`). A missing credential shows up as `git_auth` with this command in `fix`.
6. Toolchains the projects build with (cargo, bun, node, a Postgres client): install them as the `act` user the usual way (`ssh root@HOST 'sudo -iu act sh -c "curl --proto =https -sSf https://sh.rustup.rs | sh -s -- -y"'`, bun's or nvm's installer, `apt-get install -y postgresql-client` as root), then restart the service: `ssh root@HOST 'systemctl --user -M act@ restart lookout.service'`. Act adopts the login shell's PATH and env at start (`~/.cargo/bin`, `~/.bun/bin`, nvm/fnm shims), so never edit the unit, symlink binaries or hand-wire PATH. Declare what a project needs with `act_configure_project {projectId, requires: ["cargo", "bun", "psql"]}` (and `path: ["~/.foundry/bin"]` or `env: {...}` for anything no login shell sets; committed in `.act/worktree.json`, so no secrets), then `act_doctor {machine: "vps-2"}`: `toolchains[].missing` and `problems` name what is still absent; `shellEnv.source` is `login-shell` when the adoption worked.
7. Optional caps, only when the user wants one (nothing is capped by default): `act_configure_machine {machine: "vps-2", perMachine: 2}`. On a box shared with CI, `holdPaths` (absolute paths there: new delegated turns wait while one is a file or a folder with an entry, such as CI's run marker and queue) and the service's slice limits (`memoryMax`, `memoryHigh`, `cpuWeight`, `ioWeight`: the first one set restarts the service into its slice at a safe point) keep CI first; the answer's `service` has the slice's limits as `systemctl show` prints them.

A provider "held back" on the VPS (`act_doctor` problems and `providers.heldBack`, or `act status` on the box): it refused an older copy than it already had from the account (a rollback guard). The line names the command; run `ssh root@HOST 'sudo -iu act act providers use-account <provider>'` only when the account's copy is the one to keep (the user reset or re-signed it), else `keep <provider>`. A reset or re-created vault no longer trips it.

A machine with `autoUpdate.on` installs each new signed release by itself within about an hour. To update one listed `outdated` now, from this Mac: `act_configure_machine {machine: "vps-2", upgrade: true}` (or `act upgrade --on vps-2`). It parks running chats, installs the latest signed release and restarts; the parked chats resume. `ssh root@HOST 'sudo -iu act act upgrade'` is the same install when you are already on the box. Waiting starts survive.

## 2. Place work

- Keep on this Mac: work on the user's own checkout, anything needing a process running here, quick iterations.
- Put on a VPS: independent, CPU-heavy or parallel work.
- `act_delegate {machine: "auto", repo: "https://github.com/acme/app", worktree: true, lane: "<key>", model: "<id>", prompt}`. Always pass `model`: a project cloned on a VPS starts on the catalog default, which may not run there (refused as `model_unavailable` with the ids that do). `auto` picks the machine with the most headroom that runs the model. The result's `placement` says where and why (and why not the others). Name a machine instead when the user did.
- Several chats in one repository: `worktree: true` on every delegate, so each works on its own branch. A project's `.act/worktree.json` (`act_configure_project {setup, teardown, path, env, requires}`, or Project settings) runs on the machine that creates the worktree: `setup` before the chat starts (install dependencies, copy `.env`), `teardown` when the worktree is removed. A failed setup fails the start and the chat shows the output. A machine runs a file it did not write only once approved there: read `worktree` in `act_projects {machine}` (what it runs, `trust`, `fingerprint`), then `act_configure_project {machine, projectId, approveWorktree: <fingerprint>}`; until then its setup, teardown, path and env are skipped and `act_doctor` names it. After the first clone, `projectId` from the result reuses the project on that machine; pass that machine too (`projectId` names a project on one machine; `auto` refuses it).
- `no_machine` means nothing can take it now. Read each `rejected[].reason`: `at_capacity`, `memory_pressure`, `high_load`, `memory_low` or `hold_path` means a limit the user set on that machine holds it: wait or name a machine (it queues there); `outdated` means upgrade it; `model_unavailable` means another model; `cordoned` means that machine is not taking new placements (running chats there continue; `act_configure_machine {cordon: false}` lifts it); `draining` means it is parking live chats for a restart.
- `delivered: "queued"` (state `queued`): a limit the user set holds it (`reason` and `limit` name it; `hint` names the call that lifts it); it starts on its own when the limit allows. Never retry or re-delegate it.
- A chat stays on its machine. Follow-ups (`act_steer`, `act_check`, `act_answer`) need no `machine`.

## 3. Wait and collect

- `act_fleet {machines: "*", waitSeconds: 900, cursor}` sleeps until any chat on any machine changes (pass back each answer's `cursor` so a change between calls answers at once); it answers at once with `waited.idle` when nothing is working or queued. A remote machine's wait rides relayed long-polls of up to 55 s, looped for you. `act_check {threadId, waitSeconds: 600}` for one.
- `needs_input`: `act_answer` with the user's answer. `quota`: `act_retry {threadId, model}`, or `{threadId, wait: true}` to go on at the reset (`onQuota: "wait"` on the delegate avoids the stop). `interrupted` (the machine crashed or restarted mid-turn): `act_retry {threadId}`.
- The report: `act_check` `reply.text`. Its `reply.git` is the branch: `ahead`, `dirty`, `pushed`, `merged`. The diff: `act_changes {threadId, scope: "chat"}`.
- A relay `timeout` (`retry: check_first`) may have run: check before you retry. A VPS cut off from the account keeps working; its chats read normally once it is back.

## 4. Integrate

- `act_push_worktree {threadId}` lands the chat's work on the remote's tip of main and pushes it, never forced, with the VPS's credential. Then on this Mac: `git fetch origin`.
- The act repo, whose main moves only through `ship.ts`, is never landed with these tools: steer the chat to push its branch (`git push -u origin HEAD` in its worktree), then run `bun scripts/ship.ts --branch <branch>` from any checkout on this Mac (the lead's or a Mac-side chat's). It fetches the branch, checks it in a throwaway worktree and queues it through the merge queue, so the work lands without the VPS again. One line and a nonzero exit when origin has no such branch, the tip is already on main, or the check is red, and exit 2 when it does not merge into main (merge origin/main into the branch, push, run it again); `bun scripts/ship.ts --status <id>` reads the outcome.
- `act_merge_worktree {threadId}` lands it in the VPS checkout instead, to stack several chats there; the last one with `push: true` pushes them all. A `needs_repair` leaves the checkout unchanged and tells that chat, with the hunks: it merges main in and resolves; land it again once it says so. A later clone result's `ahead` counts what landed there and was not pushed.
- A worktree's uncommitted work is committed by the landing itself.

## 5. Clean up

- `act_archive {threadIds, removeWorktree: true}` removes worktrees whose commits are merged or pushed and says why it kept any.
- `act_delete_project {machine, projectId}` for scratch projects. Its chats' clean, merged or pushed worktrees go with it; `worktreesKept` names any holding unpushed work. A cloned checkout stays on disk (reused next time); remove it on the box if it was scratch. Leave the user's own repositories.
