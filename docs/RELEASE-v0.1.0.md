# Dominion Aetherics Sheet v0.1.0 — Initial Alpha

Optional, non-default **character** sheet for Foundry V13 and **SWADE exactly 5.1.0**. The official ApplicationV1 sheet supplies all standard tabs and controls; only Powers receives the elemental graph. Actor selections and Item requirements live in module flags. No official templates, art or compendia are distributed.

Includes world element editing, configurable AND/OR/exact/forbidden recipes, 56px power icons, SWADE chat-card use, original Power Point/Add Power controls, descriptive passives, shared-source managed Active Effects, owner permissions, English/Turkish localization and macro API.

**Testing alpha:** 25 automated service/DOM tests passed against the actual SWADE 5.1.0 Powers partial with mocked Foundry documents. Live Foundry Build 351, Forge installation, multiplayer, rolls and other-module acceptance remain unverified. Read `docs/TEST-REPORT.md` in the repository/ZIP before interpreting automated tests as live validation. The Foundry manifest's `verified` field is intentionally omitted.

## Install

Paste this manifest into Foundry Setup → Install Module:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

Enable the module. Create a **new character**, open its Sheet Configuration and select **Dominion Aetherics Sheet for that Actor only**. Leave **Make Default** unchecked. Other characters retain their chosen sheets. Use Element Manager in Powers, then configure each existing SWADE Power's requirements with the atom button or right-click menu.

Switching back to the official sheet preserves Items, resources, selections and effects. Element selections do not consume PP. Clear selections before disabling the module to remove its managed passive copies.

## Assets

- `module.json`: public install/update manifest.
- `module.zip`: installable module; `module.json` is at the ZIP root.
- `SHA256SUMS.txt`: checksums of both assets.

This alpha is listed as a normal/latest GitHub release so `/releases/latest/download/module.json` resolves. It remains an initial testing alpha, with the limitations above.
