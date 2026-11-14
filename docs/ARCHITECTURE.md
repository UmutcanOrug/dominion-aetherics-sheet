# Integration evidence and architecture

## Source examined

No installed SWADE 5.1.0 system or live Foundry server was present in this workspace. Instead, the official exact-version source archive and the **actual distributed 5.1.0 runtime ZIP** were downloaded into ignored `.reference/` for inspection and tests. The text request was the only attachment; no screenshot was available to inspect.

- [SWADE source tag v5.1.0](https://gitlab.com/peginc/swade/-/tree/v5.1.0), commit prefix `f7d20d61`.
- [Official v5.1.0 distribution](https://gitlab.com/peginc/swade/-/releases/v5.1.0/downloads/swade-v5.1.0.zip).
- Distribution SHA256: `df631eab4e09d6309d8ffe7a9966407c00ecd1b6c0a6987beab4e6bc51d157b3`.
- The distribution's `system.json` declares exactly `5.1.0`; the source manifest contains a development version and is not used to infer the distributed version.
- [Foundry V13 sheet registration API](https://foundryvtt.com/api/v13/classes/foundry.applications.apps.DocumentSheetConfig.html#registerSheet).
- [Foundry V13 init hook](https://foundryvtt.com/api/v13/functions/hookEvents.init.html).

## Verified source paths

| Responsibility | SWADE 5.1.0 source |
| --- | --- |
| Official Actor sheet | `src/module/sheets/CharacterSheet.ts`, extends `foundry.appv1.sheets.ActorSheet` |
| Public sheet export and registration | `src/swade.ts`: `game.swade.sheets.CharacterSheet`, registered for character/npc as `swade.CharacterSheet` |
| Full character template | `src/templates/actors/character/sheet.hbs` |
| Powers partial | `src/templates/actors/character/tabs/powers.hbs`, registered as `swade.character-tab-powers` |
| Power grouping and PP path preparation | `CharacterSheet.#getPowers()` |
| Power Item preparation | `src/module/data/item/power.ts` and `CharacterSheet.getData()` |
| Official use handler | `CharacterSheet.activateListeners()`: `.item-show` calls `item.show()` |
| Inline roll/PP/template handler | `CharacterSheet._handleItemActions()` delegates to `ItemChatCardHelper`, adjusts original system PP, or places `SwadeMeasuredTemplate` |
| Chat card generation | `src/module/documents/item/SwadeItem.ts`: `show()` creates the original SWADE item-card ChatMessage |
| Active Effect behavior | `src/module/documents/active-effect/SwadeActiveEffect.ts` |
| Nullable SWADE turn expiration | `src/module/data/effect/base.ts`: `system.expiration` |

These are source observations, not a claim that Foundry runtime tests passed.

## Replacement boundary

`createDominionSheet` constructs a subclass with the stable class name `DominionActorSheet`. It inherits the official template getter, form submission, header controls, item drops, all non-Powers listeners, all Actor preparation and normal system behavior. Registration happens at `init` after the system init listener, with `makeDefault: false` and `types: ["character"]`. It never unregisters a class or changes world sheet defaults.

The only template-related override is ApplicationV1's `_renderInner`. It first obtains the complete rendered system form from `super`, then replaces the contents of `span.powers` on that instance. Existing section-header nodes (Add Power and all PP pools) are moved intact into the new section. `super.activateListeners` runs afterwards, so SWADE binds its real handlers to these retained controls. Other modules' render hooks see the resulting sheet as usual.

New Actors without powers or an Arcane Background do not get a Powers tab from SWADE. On this optional sheet only, the renderer adds its nav/section and renders the installed official Powers partial to obtain Add Power and applicable PP controls. The partial is never registered globally, modified or copied into the module. A limited Actor view is left untouched. An incompatible template restores a full original system render with a visible error.

Graph buttons contain no named Actor form inputs. Existing Powers stay embedded SWADE Items. A fresh availability check precedes each `item.show()` call; the system owns its ensuing chat-card, modifiers, PP, rolls, Active Effects and templates. Original Item sheets remain available even for locked/unconfigured powers. There is no global power-rule interception.

## State and effects

- Registry: world setting `dominion-aetherics-sheet.elements`, `{ schemaVersion: 1, elements: [...] }`.
- Selection: Actor flags `activeElements` and `schemaVersion` in the module namespace; stable IDs only.
- Recipes: Item flag `requirements`, structured AND/OR arrays plus `forbidden` and `exact`.
- Module-managed effect flags: `managed`, `schemaVersion`, `actorUuid`, `sourceUuid`, `providers`, `signature`.
- GM-approved source snapshots contain existing Active Effect data, not invented SWADE property names. Copies are Actor-owned, non-transferring, enabled, and indefinite while selected. `duration` is reset and the verified nullable `system.expiration` is cleared. Source documents are never mutated.
- The same source UUID has one desired copy per Actor with a provider list. Removing one provider retains it. Unrelated effects without the module's marker are never removed, even if their name/origin matches.
- Background reconciliation elects one active GM, falling back to the first active owner. Queues serialize local changes and effect reconciliation. No untrusted socket command or executable user expression is used.
- Reconciliation scans only Actors already containing selection state or managed effects. Official-sheet Actors with no module data receive no updates. Base Actors and unlinked synthetic Actors are kept separate by UUID.
- Duplicate Actors' managed copies are adopted into the new Actor's tracking; original Actors remain untouched.

## Compatibility limits

Other modules can add Actor header buttons as before because no header method is overridden. A module that expects the original vertical power rows inside the Powers tab will need explicit integration. Other modules' power workflows, chat cards and macros remain outside this graph's gating.

SWADE sources that automatically spawn related status effects are rejected as passive templates: the system creates those children outside the module's tracking. Assign independent components instead. Active Effects with unrelated third-party automation hooks need live testing; those hooks can have side effects beyond ordinary SWADE Active Effect data.

Switching sheets preserves selections and passive effects. Disabling the module cannot run cleanup code; clear active selections first if you want to remove its managed passives. Client takeover, cross-browser simultaneous edits, synthetic Actor persistence and real game resource handling require the manual acceptance run.
