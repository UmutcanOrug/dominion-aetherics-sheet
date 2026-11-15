# Changelog

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
