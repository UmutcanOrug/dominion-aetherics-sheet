# v0.2.0 validation report

Date: 2026-11-15. Target: Foundry V13 Build 351, SWADE 5.1.0, swade-tools-fix 2.2.4, Forge hosting.

## Executed

Node 24.22.1 automated tests: **31 passed, 0 failed**. Service tests use mocked Foundry documents/permissions. DOM tests render the actual distributed SWADE 5.1.0 Powers partial with Handlebars/jsdom, a mocked superclass and documents. The Tools contract test executes the real pinned `scripts/st.js` wrapper, mocking only imported dialog/roll boundaries. These tests do not execute a licensed Foundry server or all of SWADE Tools' runtime code.

- Inclusive AND combinations, OR recipes, forbidden elements, exact matching.
- Explicit AND/OR editor selectors, live preview, add/remove groups and OR persistence. Old mixed recipes retain their availability semantics on editor round-trip; no migration.
- Unconfigured versus explicit empty/always-available recipes; invalid/removed IDs fail closed.
- Item flag persistence without replacing system data.
- Independent Actor/base/token state; selection-only updates preserve PP data.
- Rapid local toggles, configured selection limits, permission checks and foreign Item rejection.
- Multiple descriptive and mechanical passives, shared-source provider tracking, repeated-sync idempotency, duplicate repair and unrelated effect preservation.
- Copied Actor adoption without mutating the original.
- One-client authority and owner fallback when no GM is active.
- GM source snapshots retain changes/other-module flags and strip identity/duration/transfer state.
- Registry read cloning, serialized local saves and validation.
- Separate non-default character-only sheet registration; later SWADE versions refused.
- Original PP pools, PP refresh, Add Power, other tab DOM and inherited header/template retention.
- Powers tab insertion on a fresh character with no powers.
- Available node invokes `game.swadetools.item` once without calling `item.show()`; a stale now-locked node is blocked.
- Missing/disabled/not-ready Tools fails clearly without a native card fallback. Foreign Items/tokens and unowned Actors are rejected before Tools dispatch.
- The pinned swade-tools-fix 2.2.4 wrapper opens its `ItemDialog` boundary with the correct Actor, embedded Power ID and source TokenDocument; opening the dialog does not change PP in the adapter.
- Read-only graph controls, no added Actor form fields, listener cleanup across rerenders.
- Power and element editor structured form submission.
- Incompatible-template fallback to the original system form.

`node tools/check.mjs` validates manifest URLs/version, required files, JavaScript syntax, template compilation and both language key sets. The build validates the ZIP root manifest and excludes references, dependencies, tests and local publishing helpers. Public release assets are verified separately after publishing.

## Not executed in a live world

The user supplied live screenshots and reported that 0.1.0 works in their world at a basic level. This is a **user-reported baseline smoke test**, not a full acceptance run. The manifest now records `verified: 13.351` based on that report. The developer did not access a live server. The new Tools casting workflow, PP spending, templates, multiplayer, Forge access and detailed integration remain **unverified in live runtime**.

References are pinned by `tools/fetch-reference.mjs`: official SWADE 5.1.0 ZIP SHA256 `df631eab4e09d6309d8ffe7a9966407c00ecd1b6c0a6987beab4e6bc51d157b3`; Tools Fix commit `24de3c15f7b9de79c0114862bd519706b58f7197`, normalized API-source SHA256 `240041f8effbfb94b793380005372e47356539a41d77b3c78a10738bf74f58b3`.

## A–J acceptance run on fresh test Actors

Keep a reference character on the official sheet. Make a second new character and assign only that Actor to Dominion Aetherics Sheet; leave Make Default unchecked. Record Item count, PP and existing effects before testing.

| Test | Procedure and expected result | Live status |
| --- | --- | --- |
| A: independent sheet | Open both Actors; only the test Actor has the graph. World defaults remain official. | Pending |
| B: original tabs | Use Traits, Edges/Hindrances, Gear, Effects, Actions and About; edit a field, roll a trait, drop an Item, reopen. | Pending |
| C: selection | Define H/O/Fe/C. Water needs H+O, Burst needs O. Select H, then O, then remove H; unlock states update immediately. | Pending |
| D: many elements | Select H/O/Fe/C simultaneously with limit 0. Each Actor keeps its own selections; a second Actor is unaffected. | Pending |
| E: AND/OR | Choose Water/Earth with AND: both required. Switch to OR: either alone or both unlock in inclusive mode. Save/reopen retains OR. Also test alternative groups, forbidden Fe and exact mode. | Pending |
| F: passives | Assign one known valid permanent AE to H and O. Select both: one managed copy, two providers. Remove H: copy remains. Remove O: copy disappears, unrelated effects remain. Repeat quickly and in two browsers. | Pending |
| G: persistence | Close/reopen, reload both GM/player, then restart the world. Definitions, recipes and selections survive. Repeat with an unlinked token and confirm base Actor unchanged. | Pending |
| H: Tools workflow | Use an unlocked power: the private SWADE Tools casting dialog opens without an initial system item card. Test activation, cancel, modifiers, PP spending, AoE/templates and Tools result cards. Locked nodes stay blocked. Repeat with an unlinked token and confirm correct origin. | Pending |
| I: sheet switching | Switch the test Actor back to the official sheet. Same Items, PP and effects remain. Switch again; selections persist. Clear elements to remove managed passives. | Pending |
| J: integration | Check usual modules, header buttons, drops, other tabs and Forge. Disable Tools: graph explains the missing dependency and never opens the system card. Check the compatibility badge after updating. | Pending |

Also test a removed element, an unconfigured power, an explicit always-available power, GM-only configuration, an owner player, an observer, and disconnection of the current effect authority. If another module rewrites power rows, inspect its integration separately. Clear selected elements before disabling this module if you want its passive copies removed.

## Known alpha limitations

- Exactly SWADE 5.1.0 and Foundry 13 only; no 5.2+/V14 adapter.
- Tools 2.2.4 API inspected and contract-tested; full live Tools casting/PP/AoE still needs acceptance.
- Graph gating is checked when opening the dialog; already-open Tools dialogs are not globally intercepted.
- Availability gates this graph, while macros and original Item sheets follow normal SWADE behavior.
- Source effect snapshots refresh when the GM removes/re-adds the source in the element editor.
- Automatic related-status cascades are rejected; use independent passive components.
- Identical effect data under different source UUIDs count as distinct sources.
- Cross-client concurrent selection updates follow Foundry's last-write semantics; local clicks are queued. Multi-client authority handoff has not been live-tested.
- Modules that depend on the old Powers rows or inject additional automation into effects need live testing.
