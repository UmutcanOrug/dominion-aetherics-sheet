# Integration evidence and architecture

## Source examined

No installed SWADE 5.1.0 system or live Foundry server was present in this workspace. The official exact-version source archive and the **actual distributed 5.1.0 runtime ZIP** are used as ignored test references. For 0.2.0 the user supplied screenshots and reported that the baseline graph works in their world. The user's current SWADE Tools Fix repository was also inspected through GitHub.

- [SWADE source tag v5.1.0](https://gitlab.com/peginc/swade/-/tree/v5.1.0), commit prefix `f7d20d61`.
- [Official v5.1.0 distribution](https://gitlab.com/peginc/swade/-/releases/v5.1.0/downloads/swade-v5.1.0.zip).
- Distribution SHA256: `df631eab4e09d6309d8ffe7a9966407c00ecd1b6c0a6987beab4e6bc51d157b3`.
- The distribution's `system.json` declares exactly `5.1.0`; the source manifest contains a development version and is not used to infer the distributed version.
- [Foundry V13 sheet registration API](https://foundryvtt.com/api/v13/classes/foundry.applications.apps.DocumentSheetConfig.html#registerSheet).
- [Foundry V13 init hook](https://foundryvtt.com/api/v13/functions/hookEvents.init.html).
- [SWADE Tools Fix 2.2.4 API wrapper](https://github.com/UmutcanOrug/swade-tools-fix/blob/24de3c15f7b9de79c0114862bd519706b58f7197/scripts/st.js), pinned commit `24de3c15f7b9de79c0114862bd519706b58f7197`.
- `scripts/start.js` exposes `game.swadetools = st` at ready. `st.item(actor, itemId, operator, options)` opens `new ItemDialog(...)` for a Power. `scripts/class/SheetControl.js` uses this same helper; `scripts/class/ItemDialog.js` owns the casting UI.

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

`createDominionSheet` constructs a subclass with the stable class name `DominionActorSheet`. It inherits the official template getter, form submission, header controls, item drops, all non-Powers listeners, all Actor preparation and normal system behavior. Registration happens at `init` after the system init listener, with `makeDefault: false` and `types: ["character", "npc"]`. It never unregisters a class or changes world sheet defaults.

SWADE 5.1.0 already registers this same official `CharacterSheet` class for both character and NPC Actors. Dominion uses that supported layout for both; it does not patch the separate Community NPC sheet. An NPC Wild Card is still an `npc` Actor with its Wild Card setting enabled, not a different Actor type. A shared `isSupportedActor` predicate is used by validation, background reconciliation and sheet registration. Wild Card status is not used as an eligibility check. World NPCs and unlinked synthetic NPCs are included in ready/registry-change reconciliation; untouched official-sheet Actors receive no writes.

The only template-related override is ApplicationV1's `_renderInner`. It first obtains the complete rendered system form from `super`, then replaces the contents of `span.powers` on that instance. Existing section-header nodes (Add Power and all PP pools) are moved intact into the new section. `super.activateListeners` runs afterwards, so SWADE binds its real handlers to these retained controls. Other modules' render hooks see the resulting sheet as usual.

New Actors without powers or an Arcane Background do not get a Powers tab from SWADE. On this optional sheet only, the renderer adds its nav/section and renders the installed official Powers partial to obtain Add Power and applicable PP controls. The partial is never registered globally, modified or copied into the module. A limited Actor view is left untouched. An incompatible template restores a full original system render with a visible error.

Graph buttons contain no named Actor form inputs. Existing Powers stay embedded SWADE Items. `PowerUseService` checks ownership, Item ownership, availability and the active Tools API, then calls `game.swadetools.item(actor, item.id, null, { token })`. The exact Actor and source TokenDocument are retained, including synthetic Actors. SWADE Tools owns the casting dialog, modifiers, PP, rolls, effects and templates. If Tools is absent, disabled or not initialized, the graph reports an actionable error and never calls `item.show()` as a fallback. Original Item sheets remain accessible; there is no global rule interception or prototype patch.

Each requirement-editor group has an AND/OR selector. AND compiles to one existing recipe; OR compiles to singleton alternatives. Reopening groups singleton alternatives for clarity. Mixed AND/OR groups remain an OR of AND recipes under the original schema, so old flags and recipe semantics remain compatible. Actor assignments are initialized separately as described below. Empty OR groups are rejected; empty AND is explicitly always available subject to forbidden/exact rules.

## Global library, assignments and cleanup (0.3.0)

`GlobalLibraryApp` is a GM-only world catalog, opened beside Element Manager in Powers or through `api.openGlobalLibrary(actor?)`. Its elements use the existing registry. Power templates are native world SWADE Item documents. `PowerLibraryService` creates templates, copies embedded/compendium sources by UUID, and copies a template only to the contextual Actor on explicit request. UUID flags prevent repeat import/grant duplicates. Actor Items are independent of later template edits/deletion.

`ElementManagerApp` is now a contextual GM FormApplication that writes only the selected Actor's `assignedElements`. Graph nodes and selection validation enforce this subset. Assignment and selection mutations share one Actor queue; revoked active assignments reconcile only module-managed passives. New global definitions never grant themselves to an Actor.

The requirements schema remains version 1. A missing assignment flag uses only that Actor's saved valid active IDs as a legacy initial set. Ready reconciliation or the first selection mutation persists that set, so later deactivation does not erase the grant. Actors without module flags remain untouched. A wholly new Actor has no assigned elements. This initializes assignments without changing SWADE data or existing Power recipes.

`PowerGraphRenderer.dispose()` is asynchronous. It aborts listeners/disconnects the observer, then closes only its own open menu with `close({animate:false,target})`, awaiting completion before DOM replacement. Never-opened, already-closed and other-window targets are skipped. This follows the [V13 ContextMenu close API](https://foundryvtt.com/api/v13/classes/foundry.applications.ux.ContextMenu.html#close) and removes the reported animation access to a missing menu element.

The bundled original SVG supplies the default icon. Legacy atom paths and failed image loads get a display-only fallback. The full Dominion form's image error listener includes its retained portrait, while source document paths stay unchanged. Failed custom paths are cached per client session; reloading retries repaired assets. A missing Forge image can still log its first 404 and must be repaired in Asset Library.

## Active Aether tiers and prerequisites (0.4.0)

User-facing element terminology is now **Active Aether**. Registry/API/flag names are retained for compatibility. Each definition adds `level` (integer 1–4, legacy default 1) and `prerequisites` (`null` by default, or `{ mode: "all" | "any", ids: [...] }`). The registry validates references against the whole catalog inside its serialized save. References must point to strictly lower tiers, preventing self-reference and cycles. A tier change that would invalidate an existing dependent is rejected. Deleting a reference locks dependents until the GM repairs their rules.

`resolveActiveAethers` evaluates only requested IDs in ascending tier order and preserves the caller's ID order. A higher tier with no prerequisites is independently selectable. AND requires every referenced ID to be active; OR needs any one. There is no implicit grant or activation. Missing, malformed or unsatisfied dependencies fail closed. Selection mutations reject newly requested invalid activations, but prune already-active dependents when a lower selection is removed. Assignment revocation, registry-change reconciliation, passive synchronization and Power availability all use this effective set. Cascades operate only on the affected base/synthetic Actor. Restoring a prerequisite does not automatically restore dependent selections.

The editor supports an optional prerequisite switch, AND/OR and a dynamically filtered lower-tier picker. Selected references that become invalid during a level edit remain visible with a warning so they can be deliberately removed. They are not silently rewritten. Global catalog and assignment rows show level badges.

The graph renders four fixed tier columns (orange, navy, purple, cyan), compact Aether buttons and a separate green Power area on the right. Narrow sheets scroll horizontally while preserving tier order. Tooltips include full names and prerequisite descriptions. Hover/focus connections include prerequisite links. The original PP/Add Power controls, SWADE Tools adapter, optional character/NPC registration and other sheet tabs keep their previous boundaries. No system-document conversion or schema reset is required.

## Visual global library and Settings entry (0.5.0)

The global catalog now shares the character graph's scoped layout/CSS: four compact Aether columns and a right-hand Power grid. `buildLibraryGraph` derives the full catalog from the registry and native world Power templates, independently of Actor assignments or active selections. Required Aether-to-Aether, Aether-to-Power and forbidden Aether-to-Power edges have distinct kinds. Namespaced node keys prevent an Aether and Power with the same document ID from colliding. AND/OR, forbidden and exact semantics remain in the existing rule descriptions; a drawn edge does not assert sufficient availability on its own.

`LibraryGraphController` handles hover/focus links, pinned inspection, clickable incoming/outgoing entries and an optional all-links view. It never calls selection/passive/casting services. New catalog renders preserve the pinned ID and all-links preference, discard deleted selections, abort old DOM listeners and disconnect the ResizeObserver. SVG marker IDs include the library's world/Actor context to avoid cross-window conflicts. Rendering/editing the catalog does not create a synthetic preview Actor or modify real Actors.

The restricted `globalLibrary` submenu uses [Foundry V13 `ClientSettings.registerMenu`](https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html#registerMenu). Its FormApplication adapter opens the same cached `services.openLibrary()` world instance used by the public API, with GM authorization checked again. It has no Actor context and therefore no copy-to-Actor buttons. Actor-sheet entry points retain their exact contextual Actor, including unlinked tokens. Registration is still limited to the supported Foundry/SWADE versions.

## Confirmed prerequisite activation (0.5.2)

Editable Actor graph nodes remain clickable when their prerequisites are inactive or invalid, so they can explain activation requirements. `planAetherActivation` recursively follows strictly lower-tier references using the Actor's existing grants, producing either a complete proposed addition list or named missing/invalid entries. AND includes every needed branch. OR reuses active alternatives or selects a feasible branch, preferring fewer new selections and preserving configured order on ties. This is a branch heuristic, not a global minimum-set solver. Existing malformed/deleted registry references still fail closed.

`toggleAetherWithPrompt` previews inactive prerequisite names/levels using an escaped Handlebars template and [Foundry V13 DialogV2.confirm](https://foundryvtt.com/api/v13/classes/foundry.applications.api.DialogV2.html#confirm). Cancellation/close does not write. A per-Actor pending guard prevents duplicate dialogs. Missing grants are reported by name and never auto-granted. No-prerequisite/already-satisfied activation and normal cascading deactivation remain direct actions.

After confirmation, `ElementSelectionService.activate` recomputes the plan inside the existing Actor queue, rejects newly required additions outside the approved list and retains fresh unrelated active selections. Ownership, assignments, schema and max-active limits are checked before one Actor selection update; passive synchronization follows the existing service path. This preserves base/synthetic Actor isolation and existing shared-source cleanup. The public `setActiveElements` API remains strict and never opens UI or fills prerequisites implicitly.

## State fields

- Registry: world setting `dominion-aetherics-sheet.elements`, `{ schemaVersion: 1, elements: [...] }`.
- Selection: Actor flags `activeElements` and `schemaVersion` in the module namespace; stable IDs only.
- Assignments: `assignedElements`, independently stored on each base or synthetic Actor; GM APIs only grant valid registry IDs.
- Recipes: Item flag `requirements`, structured AND/OR arrays plus `forbidden` and `exact`.
- Module-managed effect flags: `managed`, `schemaVersion`, `actorUuid`, `sourceUuid`, `providers`, `signature`.
- GM-approved source snapshots contain existing Active Effect data, not invented SWADE property names. Copies are Actor-owned, non-transferring, enabled, and indefinite while selected. `duration` is reset and the verified nullable `system.expiration` is cleared. Source documents are never mutated.
- The same source UUID has one desired copy per Actor with a provider list. Removing one provider retains it. Unrelated effects without the module's marker are never removed, even if their name/origin matches.
- Background reconciliation elects one active GM, falling back to the first active owner. Queues serialize local changes and effect reconciliation. No untrusted socket command or executable user expression is used.
- Reconciliation scans only Actors already containing assignments, selection state or managed effects. Official-sheet Actors with no module data receive no updates. Base Actors and unlinked synthetic Actors are kept separate by UUID.
- Duplicate Actors' managed copies are adopted into the new Actor's tracking; original Actors remain untouched.

## Compatibility limits

Other modules can add Actor header buttons as before because no header method is overridden. A module that expects the original vertical power rows inside the Powers tab will need explicit integration. Other modules' power workflows, chat cards and macros remain outside this graph's gating.

SWADE sources that automatically spawn related status effects are rejected as passive templates: the system creates those children outside the module's tracking. Assign independent components instead. Active Effects with unrelated third-party automation hooks need live testing; those hooks can have side effects beyond ordinary SWADE Active Effect data.

Switching sheets preserves selections and passive effects. Disabling the module cannot run cleanup code; clear active selections first if you want to remove its managed passives. Client takeover, cross-browser simultaneous edits, synthetic Actor persistence and real game resource handling require the manual acceptance run.
