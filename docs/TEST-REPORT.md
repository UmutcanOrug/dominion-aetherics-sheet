# v0.1.0 validation report

Date: 2026-11-14. Target: Foundry V13 Build 351, SWADE 5.1.0, Forge hosting.

## Executed

Node 24.22.1 automated tests: **25 passed, 0 failed**. The service tests use mocked Foundry documents/permissions. DOM tests render the **actual distributed SWADE 5.1.0 Powers partial** with Handlebars/jsdom, using a mocked superclass and documents. They do not execute a licensed Foundry server or all of SWADE's runtime code.

- Inclusive AND combinations, OR recipes, forbidden elements, exact matching.
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
- Available node invokes `item.show()` once; a stale now-locked node is blocked.
- Read-only graph controls, no added Actor form fields, listener cleanup across rerenders.
- Power and element editor structured form submission.
- Incompatible-template fallback to the original system form.

`node tools/check.mjs` validates manifest URLs/version, required files, JavaScript syntax, template compilation and both language key sets. The build validates the ZIP root manifest and excludes references, dependencies, tests and local publishing helpers. Public release assets are verified separately after publishing.

## Not executed in a live world

No running Foundry/Forge world, installed licensed Foundry build or screenshot was supplied. Actual installation, rolls, PP deductions via chat cards, full tab behavior, simultaneous browser sessions, Forge asset browsing and third-party module compatibility remain **unverified**. The manifest intentionally omits Foundry's `verified` claim. System compatibility is restricted to the exact source version examined.

## A–J acceptance run on fresh test Actors

Keep a reference character on the official sheet. Make a second new character and assign only that Actor to Dominion Aetherics Sheet; leave Make Default unchecked. Record Item count, PP and existing effects before testing.

| Test | Procedure and expected result | Live status |
| --- | --- | --- |
| A: independent sheet | Open both Actors; only the test Actor has the graph. World defaults remain official. | Pending |
| B: original tabs | Use Traits, Edges/Hindrances, Gear, Effects, Actions and About; edit a field, roll a trait, drop an Item, reopen. | Pending |
| C: selection | Define H/O/Fe/C. Water needs H+O, Burst needs O. Select H, then O, then remove H; unlock states update immediately. | Pending |
| D: many elements | Select H/O/Fe/C simultaneously with limit 0. Each Actor keeps its own selections; a second Actor is unaffected. | Pending |
| E: alternatives | Configure H+O OR H+C. Either unlocks. Add forbidden Fe, then test exact mode with an extra active element. | Pending |
| F: passives | Assign one known valid permanent AE to H and O. Select both: one managed copy, two providers. Remove H: copy remains. Remove O: copy disappears, unrelated effects remain. Repeat quickly and in two browsers. | Pending |
| G: persistence | Close/reopen, reload both GM/player, then restart the world. Definitions, recipes and selections survive. Repeat with an unlinked token and confirm base Actor unchanged. | Pending |
| H: original workflow | Use an unlocked power. Its SWADE chat card opens. Roll activation, adjust/use PP, test modifiers, damage/templates and relevant Item effects. A locked graph icon cannot open a use card; original Item editing remains accessible. | Pending |
| I: sheet switching | Switch the test Actor back to the official sheet. Same Items, PP and effects remain. Switch again; selections persist. Clear elements to remove managed passives. | Pending |
| J: integration | Enable the world's usual modules. Check header buttons, drops, other tabs, chat behavior and browser console. Test Forge manifest installation and source image browsing. | Pending |

Also test a removed element, an unconfigured power, an explicit always-available power, GM-only configuration, an owner player, an observer, and disconnection of the current effect authority. If another module rewrites power rows, inspect its integration separately. Clear selected elements before disabling this module if you want its passive copies removed.

## Known alpha limitations

- Exactly SWADE 5.1.0 and Foundry 13 only; no 5.2+/V14 adapter.
- Availability gates this graph, while macros and original Item sheets follow normal SWADE behavior.
- Source effect snapshots refresh when the GM removes/re-adds the source in the element editor.
- Automatic related-status cascades are rejected; use independent passive components.
- Identical effect data under different source UUIDs count as distinct sources.
- Cross-client concurrent selection updates follow Foundry's last-write semantics; local clicks are queued. Multi-client authority handoff has not been live-tested.
- Modules that depend on the old Powers rows or inject additional automation into effects need live testing.
