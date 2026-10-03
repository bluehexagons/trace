# Repository Guidelines

## Structure and package output

Trace is a TypeScript interpreter used by Antistatic and `trace-sandbox`.
Source lives under `src/`; tests use Vitest; compiled files under `dist/` are
tracked and shipped in immutable Git-tag archives. Keep the core library
browser-compatible and isolate Node-only behavior in the CLI entry point.

## Environment and validation

The standard Linux host is a Basaltwater-managed agent VM. Use a supported
Node release (20.19+ on Node 20 or 22.12+) and keep related repositories beside
this checkout below `~/repos`.

Select `.nvmrc` with `nvm use` before npm commands. On Basaltwater,
`basaltw node exec -- npm run check` selects the project runtime without
changing the host default; `basaltw node install` installs a missing pin.

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
