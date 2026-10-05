# Repository Guidelines

## Structure and package output

Trace is a TypeScript interpreter used by Antistatic and `trace-sandbox`.
Source lives under `src/`; tests use Vitest; compiled files under `dist/` are
tracked and shipped in immutable Git-tag archives. Keep the core library
browser-compatible and isolate Node-only behavior in the CLI entry point.

## Environment and validation

Linux development supports Basaltwater-managed CachyOS workstations and Debian
hosts. Use a supported Node release (20.19+ on Node 20 or 22.12+); `.nvmrc`
selects the development major without changing the published runtime minimum.
Keep primary checkouts beside one another under `~/repos` or the configured
`--agent-workspace` root; locate primary checkouts with `git worktree list` when
using isolated worktrees. See Antistatic's
[workspace guide](https://github.com/bluehexagons/antistatic/blob/main/docs/sister-repositories.md).
Use the actual OS's Basaltwater guidance for host diagnosis; package validation
and CI work independently of Basaltwater or sibling source checkouts.

Select `.nvmrc` with `nvm use` before npm commands. On Basaltwater,
`basaltw node exec -- npm run check` selects the project runtime without
changing the host default; `basaltw node install` installs a missing pin and
prepares NVM on demand on CachyOS. Ordinary NVM or compatible system Node also
works. Install locked dependencies independently in each checkout/worktree.

- `npm ci`: install dependencies.
- `npm run check`: build, type-check, lint, check formatting, and run Vitest.
- `npm run build`: refresh tracked `dist/` output.
- `npm pack --dry-run`: inspect the release payload.

Run `npm run check` before pushing source changes, and include intentional
`dist/` updates in the same commit. Test behavior changes
in `../trace-sandbox` when they affect browser integration. Keep task evidence
under ignored `local-artifacts/`.

## Releases

Follow Antistatic's `sister-repository-maintenance` guidance. Never move a
published tag or point a consumer at a local path or unpublished branch.
AI-assisted commits append `w/llm`.
