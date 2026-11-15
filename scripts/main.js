import { ID, SCHEMA, SUPPORTED_ACTOR_TYPES, isSupportedActor, assertGM, report, t } from "./constants.js";
import { ElementRegistry } from "./services/registry.js";
import { ElementSelectionService } from "./services/selections.js";
import { PowerRequirementService } from "./services/requirements.js";
import { PassiveEffectService } from "./services/passives.js";
import { PowerUseService } from "./services/power-use.js";
import { ElementManagerApp } from "./apps/element-manager.js";
import { PowerRequirementApp } from "./apps/power-requirements.js";
import { createDominionSheet } from "./sheet.js";

let services, SheetClass, manager;
function refresh() {
  for (const app of Object.values(ui.windows)) if ((SheetClass && app instanceof SheetClass) || app instanceof ElementManagerApp) app.render(false);
}
function relevantActors() {
  const actors = new Map();
  for (const actor of game.actors) if (isSupportedActor(actor)) actors.set(actor.uuid, actor);
  for (const scene of game.scenes) for (const token of scene.tokens) {
    if (!token.actorLink && isSupportedActor(token.actor)) actors.set(token.actor.uuid, token.actor);
  }
  return [...actors.values()];
}
async function reconcile(actor) {
  if (!services || !isSupportedActor(actor) || !services.passives.isAuthority(actor)) return;
  const raw = actor.getFlag(ID, "activeElements");
  const hasManaged = actor.effects.some(e => e.getFlag(ID, "managed"));
  if (raw === undefined && !hasManaged) return;
  try {
    const valid = services.selections.get(actor);
    if (JSON.stringify(raw) !== JSON.stringify(valid)) {
      await actor.update({ [`flags.${ID}.activeElements`]: valid, [`flags.${ID}.schemaVersion`]: SCHEMA });
    }
    await services.passives.sync(actor);
  } catch (error) { report(error); }
}

Hooks.once("init", () => {
  game.settings.register(ID, "elements", { scope: "world", config: false, type: Object, default: { schemaVersion: SCHEMA, elements: [] }, onChange: () => {
    refresh(); for (const actor of relevantActors()) void reconcile(actor);
  } });
  game.settings.register(ID, "maxActive", { name: "DA.MaxActive", hint: "DA.MaxActiveHelp", scope: "world", config: true, type: Number, default: 0, range: { min: 0, max: 200, step: 1 } });
  game.settings.register(ID, "separateUnconfigured", { name: "DA.SeparateUnconfigured", scope: "world", config: true, type: Boolean, default: true, onChange: refresh });
  game.settings.register(ID, "connections", { name: "DA.Connections", scope: "client", config: true, type: Boolean, default: true, onChange: refresh });
  game.settings.register(ID, "showNames", { name: "DA.ShowNames", scope: "client", config: true, type: Boolean, default: true, onChange: refresh });
  registerSheet();
});

function registerSheet() {
  if (game.system.id !== "swade" || game.system.version !== "5.1.0" || String(game.release.generation) !== "13") {
    Hooks.once("ready", () => ui.notifications.error(t("UnsupportedVersion"), { permanent: true })); return;
  }
  const Base = game.swade?.sheets?.CharacterSheet;
  if (!Base || !(Base.prototype instanceof foundry.appv1.sheets.ActorSheet)) {
    Hooks.once("ready", () => ui.notifications.error(t("UnsupportedVersion"), { permanent: true })); return;
  }
  const registry = new ElementRegistry(), selections = new ElementSelectionService(registry);
  const requirements = new PowerRequirementService(registry, selections), passives = new PassiveEffectService(registry, selections);
  const powerUse = new PowerUseService(requirements);
  selections.passives = passives;
  services = { registry, selections, requirements, passives, powerUse, openManager: () => {
    assertGM(); manager ??= new ElementManagerApp(services); return manager.render(true);
  } };
  SheetClass = createDominionSheet(Base, services);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, ID, SheetClass, { types: [...SUPPORTED_ACTOR_TYPES], makeDefault: false, label: "DA.Title" });
  game.modules.get(ID).api = Object.freeze({
    openElementManager: services.openManager,
    getElements: () => registry.get().map(e => {
      // Source snapshots may contain source document flags; the public read API returns metadata only.
      const { effects, ...element } = e;
      return { ...element, effects: effects.map(f => ({ uuid: f.uuid, name: f.name })) };
    }),
    getActiveElements: actor => selections.get(actor),
    setActiveElements: (actor, ids) => selections.set(actor, ids),
    getAvailablePowers: actor => requirements.available(actor),
    getPowerRequirements: item => requirements.get(item),
    isPowerAvailable: (actor, item) => requirements.evaluate(actor, item).available,
    openPowerRequirements: item => { assertGM(); return new PowerRequirementApp(services, item).render(true); }
  });
}

Hooks.once("ready", () => { if (services) for (const actor of relevantActors()) void reconcile(actor); });
Hooks.on("updateActor", (actor, change) => {
  if (change.flags?.[ID] || Object.keys(change).some(key => key.startsWith(`flags.${ID}`))) void reconcile(actor);
});
Hooks.on("updateToken", token => { if (!token.actorLink && token.actor) void reconcile(token.actor); });
Hooks.on("createActor", actor => { void reconcile(actor); });
Hooks.on("createToken", token => { if (!token.actorLink && token.actor) void reconcile(token.actor); });
Hooks.on("updateUser", () => { if (services) for (const actor of relevantActors()) void reconcile(actor); });
Hooks.on("userConnected", () => { if (services) for (const actor of relevantActors()) void reconcile(actor); });
