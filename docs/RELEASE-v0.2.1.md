# Dominion Aetherics Sheet v0.2.1 — NPC support

Fixes the sheet being available only for `character` Actors. **NPC Extras and NPC Wild Cards** can now select **Dominion Aetherics Sheet** as well.

- NPC support covers the Powers graph, AND/OR recipes, element selections, descriptive/mechanical passives, ownership checks and SWADE Tools casting.
- NPCs and unlinked NPC tokens are included in selection validation and background passive reconciliation. Token updates keep the correct synthetic Actor and never redirect to its base NPC.
- Uses the same official SWADE 5.1.0 sheet superclass, already supported by that system for both character and NPC Actors.
- Existing official and Community NPC sheets stay registered. The update does not change an Actor's selected sheet or any world default.
- Existing recipes, selections and system data require no migration.

## Update and select

Update Dominion to **0.2.1** through Foundry's normal module updater, then reload clients. On the NPC, open **Sheet Configuration** and choose **Dominion Aetherics Sheet** for that Actor. Leave **Make Default** unchecked. Both enabled and disabled Wild Card states are supported.

Manifest URL is unchanged:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

**Validation:** 39 automated tests passed, including NPC Extra/Wild Card rendering and service tests, passive hook reconciliation, Tools dispatch and unlinked-token isolation. These use mocked Foundry documents plus the actual SWADE 5.1.0 Powers partial and the pinned Tools API wrapper. The developer did not access a live Foundry server; the NPC update still needs live acceptance.

Target remains Foundry V13 Build 351 / SWADE exactly 5.1.0, with swade-tools-fix 2.2.4. Assets: `module.json`, `module.zip`, `SHA256SUMS.txt`.
