# Changelog

## 0.5.2 — 2026-11-17

- Make higher-level Actor Aether nodes clickable even with inactive prerequisites. Preview the complete required chain by name/level and ask before activating it with the target.
- Name missing Actor grants or broken definitions and block the whole activation; never grant prerequisites implicitly. OR reuses an active alternative or previews one feasible assigned branch.
- Cancel/close makes no changes. Revalidate inside the Actor queue after confirmation, preserve unrelated selections, enforce ownership/limits and reject unapproved additions after rule changes.
- Keep cascading deactivation, shared passives, character/NPC/token isolation and strict public activation APIs.
- 91 automated tests passed; real module flow/planner/template verified in an isolated browser fixture with fake Actors and a DialogV2 host adapter. Live Foundry acceptance remains pending.

## 0.5.1 — 2026-11-17

- Fix the global Power creation row under Foundry's full-width button defaults: the name input expands and the create button uses its content width. Narrow windows can wrap the row.
- Scope the sizing fix to that row; no Actor, Power or rule data changes.

## 0.5.0 — 2026-11-17

- Replace the global library's separate lists with the character Powers layout: four colored Active Aether levels and world Power icons on the right, sharing the same scoped CSS.
- Add hover/focus arrows, pinned node inspection, direct incoming/outgoing navigation and an all-connections view. Required and forbidden edges remain distinct; rule descriptions retain AND/OR/exact semantics.
- Add GM-only Global Library access in Configure Settings using the existing cached world catalog. Actor-context copy controls remain available only from Actor entry points.
- Keep creation/import, editing, configuration, deletion and explicit Power copying in the graph. Catalog inspection never activates Aethers, casts Powers or changes Actor/passive/PP state.
- 73 automated tests passed. Wide/compact Turkish library layouts and real relationship-controller behavior visually checked in an isolated browser fixture; live Foundry/Forge acceptance remains pending.

## 0.4.0 — 2026-11-17

- Rename user-facing elements to Active Aethers and arrange compact buttons in four fixed level columns: orange, navy, purple and cyan. Powers retain a separate green area on the right; narrow sheets scroll horizontally.
- Add levels 1–4 and optional lower-level activation prerequisites to the global editor, with AND/OR choices and lower-only validation. Higher levels can also have no prerequisite.
- Cascade deactivation and managed-passive cleanup when a prerequisite is removed, revoked or no longer valid. Power availability and SWADE Tools dispatch use the effective active set; nothing is auto-granted or auto-activated.
- Add level badges to the global catalog/Actor manager and prerequisite tooltips/graph links. Keep grants and active selections specific to each Actor/token.
- Preserve stable IDs, existing recipes, sheet defaults, Items and PP. Legacy definitions default to level 1 with no prerequisites; internal API/flag names stay compatible.
- 69 automated tests passed; wide/compact layout and editor visually checked in an isolated browser fixture. Live Foundry/Forge acceptance remains pending.

## 0.3.0 — 2026-11-15

- Fix V13 ContextMenu cleanup on sheet rerender: skip unopened menus, close only the current graph's menu without animation and await its Promise.
- Bundle an original element SVG; replace legacy atom paths in the view and show cached fallbacks for missing custom images without changing document paths.
- Add a GM Global Library beside Element Manager in Powers, with element definitions and native world Power templates, creation/import/editing and explicit copy-to-Actor.
- Change Element Manager to per-Actor element assignments. New definitions do not appear on every sheet; owners activate only granted IDs.
- Preserve only legacy saved active elements as initial assignments; new Actors start empty. Grant revocation reconciles only the target Actor's managed effects.
- Retain NPC/Wild Card support, AND/OR rules, original sheet controls and SWADE Tools dispatch.
- 53 automated tests, including menu regression, images, assignments, library copies and contextual UI wiring.

## 0.2.1 — 2026-11-15

- Fix optional sheet registration for NPCs, including both NPC Extras and NPC Wild Cards.
- Extend Actor validation and background passive reconciliation to NPCs and unlinked NPC tokens.
- Keep the same official SWADE superclass, stable sheet ID, ownership checks and non-default registration.
- Existing PC/NPC sheet choices, recipes, selections and system data are preserved; no migration.
- 39 automated tests, including NPC rendering, permissions, passives, Tools dispatch and token/base isolation.

## 0.2.0 — 2026-11-15

- Explicit AND/OR selection per element group with a live requirement preview.
- Existing recipe flags and Actor/token selections remain unchanged; no data migration.
- Power icons open `swade-tools-fix`'s existing SWADE Tools casting dialog through `game.swadetools.item`, retaining the exact Actor and source token.
- Missing/disabled Tools or an unavailable API shows an error; no system chat-card fallback.
- SWADE Tools 2.2.4 recommendation and pinned upstream API contract test.
- Foundry compatibility metadata updated to 13.351 following the user's live baseline smoke-test report. The new Tools integration still needs live acceptance.
- 31 automated tests, including AND/OR editor and SWADE Tools dispatch coverage.

## 0.1.0 — 2026-11-14

- Initial testing alpha for Foundry V13 and SWADE exactly 5.1.0.
- Optional character-only sheet inherited from the official ApplicationV1 sheet.
- Local Powers graph, original Add Power and Power Point controls, SWADE chat-card use.
- World element editor, OR/AND recipes, forbidden and exact combinations.
- Persistent Actor/token selections, descriptive passives, tracked mechanical passives.
- GM controls, ownership checks, English/Turkish localization and documented macro API.
- Automated service/DOM tests, source inspection notes and live acceptance checklist.
