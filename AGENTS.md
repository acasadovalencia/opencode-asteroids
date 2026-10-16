# AGENTS.md

## Project shape

- Single-file vanilla JS game: all logic lives in `game.js` (~420 lines), loaded as a plain (non-module) `<script>` from `index.html`. No bundler, no dependencies, no `package.json`. 
- Everything is global-scope top-level code (`class Ship`, `function update(dt)`, …). Do not add `import`/`export`, npm tooling, or a build step — that constraint is deliberate (see `README.md`).
- Sections in `game.js` are marked with `// ── Nombre ──` comment dividers: Input, Utils, Bullet, Asteroid, Ship, Partículas, Estado del juego, Update, Draw, Loop principal. Put new code in the matching section.
- Comments, UI strings, and `README.md` are in Spanish. Match that language for in-game text and docs.

## Run / verify

- There is no build, lint, typecheck, or test suite. Verification is manual: open `index.html` directly in a browser, or `npx serve .` and visit `http://localhost:3000`.
- After changing gameplay, play-test the core loop: move, shoot, split asteroids (large → medium → small), die, and reach game-over/restart.

## Gotchas

- Fixed canvas 800×600 (`index.html` sets `W`/`H` in `game.js` too) — keep them in sync if you change size.
- Input uses two maps: `keys[code]` (held) and `justPressed[code]` (one-frame edge). Use `pressed(code)` for single-trigger actions (fire, restart); using `keys` directly will auto-repeat.
- `dt` is seconds (clamped in `loop`); speeds in `SPEEDS`, radii in `RADII`, score in `POINTS` are all indexed by asteroid size 1–3 (index 0 unused). Update all three together when adding a size.
- World wraps toroidally via `wrap()`; new entities must use it or they'll vanish off-screen.
