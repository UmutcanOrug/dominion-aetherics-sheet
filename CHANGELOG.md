# Changelog

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
