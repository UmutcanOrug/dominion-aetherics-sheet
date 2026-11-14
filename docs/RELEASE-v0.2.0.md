# Dominion Aetherics Sheet v0.2.0 — AND/OR & SWADE Tools

- Each Power element group now has an explicit **AND / OR** selector and a live preview. Water AND Earth requires both; Water OR Earth accepts either. Alternative groups, forbidden elements and exact mode remain available.
- Existing 0.1.0 recipes and Actor/token selections are preserved in the same flag schema. No migration or reset is performed.
- Unlocked power icons open **SWADE Tools' casting dialog** using `game.swadetools.item(actor, itemId, null, { token })`, inspected against the user's `swade-tools-fix` **2.2.4**.
- No initial SWADE system item chat card is opened. Tools retains its normal casting, roll, PP, effects, modifier and template behavior. Tools-generated result chat messages still work normally.
- If Tools is absent/disabled or its API is not ready, the graph shows a clear explanation; it does not fall back to the system card.
- Foundry compatibility metadata now specifies 13.351, following the user's report that the baseline module works in their live world.

**Validation:** 31 automated tests passed, including the real pinned Tools API wrapper with mocked dialog boundaries. The developer did not access a live Foundry server. The new casting workflow still needs live acceptance; see `docs/TEST-REPORT.md`.

## Update

Use Foundry's normal module update, then reload clients. Manifest URL is unchanged:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

Enable the user's SWADE Tools fork (2.2.4 or a compatible version):

https://github.com/UmutcanOrug/swade-tools-fix/releases/latest/download/module.json

In a Power's **Configure Elements** window, select Water and Earth and choose **AND** or **OR**. Existing characters retain their selected sheet; Dominion stays non-default. Do not enable Make Default for individual-character testing.

Assets: `module.json`, `module.zip`, `SHA256SUMS.txt`. This testing update is listed as a normal latest release so the stable manifest installation URL works.
