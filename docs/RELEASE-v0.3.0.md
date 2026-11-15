# Dominion Aetherics Sheet v0.3.0 — Global Library & Actor Elements

## Fixes

- Fixes the reported `ContextMenu._animate → getBoundingClientRect` error during sheet rerenders. Unopened menus are skipped; the graph's own open menu closes without animation and is awaited before DOM replacement.
- Includes a real bundled default element SVG instead of the missing `icons/svg/atom.svg`. Missing custom images get a display-only fallback without changing their stored source paths.
- A remote `disciple.jpg` returning 404 still needs its correct Forge Asset Library path. The module cannot restore that absent file; its first failed request may still appear in the console.

## New workflow

1. In Powers, open **Global Library**, beside **Element Manager**. Create/edit shared element definitions there. Adding a definition does **not** grant it to all Actors.
2. Open **Element Manager** on the chosen Actor, check its allowed elements and save. Only those elements appear in its graph; owners activate only granted elements.
3. The library's Powers tab contains real world SWADE Power templates. Create one, import an existing Actor Power from the picker or a compendium Power by UUID, configure requirements, and use **Add to this Actor** to copy it only to the contextual Actor.

Repeated import/grant does not duplicate the same source. Actor Power copies stay independent of later global edits/deletion. Removing an active element assignment cleans up that Actor's no-longer-provided managed passives, preserving other Actors and unrelated effects.

## Existing data

Existing definitions, Power Items and recipes remain intact. For Actors with no assignment flag, **only their previously saved active element IDs** become initial assignments. Other elements must be granted through Element Manager. A new Actor starts with no assigned elements. Untouched official-sheet Actors remain untouched. Downgrading to a version before 0.3.0 will ignore assignment filtering and may show all global elements again.

The module remains optional for character/NPC Actors, including NPC Wild Cards. It does not change sheet defaults. Foundry V13 Build 351, SWADE exactly 5.1.0 and the existing SWADE Tools Fix 2.2.4 API remain the targets.

**Validation:** 53 automated tests passed with mocked Foundry documents/menu boundaries, actual SWADE 5.1.0 Powers partials and the pinned Tools API wrapper. Live Foundry/Forge acceptance remains pending; see `docs/TEST-REPORT.md`.

Update normally and reload clients. Manifest URL is unchanged:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

Release assets: `module.json`, `module.zip`, `SHA256SUMS.txt`.
