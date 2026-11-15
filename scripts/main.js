import { ID, SCHEMA, SUPPORTED_ACTOR_TYPES, isSupportedActor, assertGM, report, t } from "./constants.js";
import { ElementRegistry } from "./services/registry.js";
import { ElementAssignmentService } from "./services/assignments.js";
import { ElementSelectionService } from "./services/selections.js";
import { PowerRequirementService } from "./services/requirements.js";
import { PassiveEffectService } from "./services/passives.js";
import { PowerUseService } from "./services/power-use.js";
import { PowerLibraryService } from "./services/power-library.js";
import { ElementManagerApp } from "./apps/element-manager.js";
import { PowerRequirementApp } from "./apps/power-requirements.js";
import { GlobalLibraryApp } from "./apps/global-library.js";
import { createDominionSheet } from "./sheet.js";

let services, SheetClass;
const managers = new Map(), libraries = new Map();
function refresh() {
  for (const app of Object.values(ui.windows)) if ((SheetClass && app instanceof SheetClass) || app instanceof ElementManagerApp || app instanceof GlobalLibraryApp) app.render(false);
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
  const rawAssigned = actor.getFlag(ID, "assignedElements");
  const hasManaged = actor.effects.some(e => e.getFlag(ID, "managed"));
  if (raw === undefined && rawAssigned === undefined && !hasManaged) return;
  try {
    await services.assignments.queue(actor, async () => {
      const assigned = services.assignments.getIds(actor), valid = services.selections.get(actor), update = {};
      if (JSON.stringify(actor.getFlag(ID, "assignedElements")) !== JSON.stringify(assigned)) update[`flags.${ID}.assignedElements`] = assigned;
      if (JSON.stringify(actor.getFlag(ID, "activeElements")) !== JSON.stringify(valid)) update[`flags.${ID}.activeElements`] = valid;
      if (Object.keys(update).length) await actor.update({ ...update, [`flags.${ID}.schemaVersion`]: SCHEMA });
      await services.passives.sync(actor);
    });
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
  const registry = new ElementRegistry(), assignments = new ElementAssignmentService(registry), selections = new ElementSelectionService(registry, assignments);
  const requirements = new PowerRequirementService(registry, selections), passives = new PassiveEffectService(registry, selections);
  const powerUse = new PowerUseService(requirements);
  const powerLibrary = new PowerLibraryService();
  selections.passives = passives;
  assignments.passives = passives;
  services = { registry, assignments, selections, requirements, passives, powerUse, powerLibrary,
    openLibrary: (actor = null) => {
      assertGM(); const key = actor?.uuid ?? "world";
      let app = libraries.get(key);
      if (!app || app.actor !== actor) { app = new GlobalLibraryApp(services, actor); libraries.set(key, app); }
      return app.render(true);
    },
    openManager: actor => {
      assertGM(); if (!actor) return services.openLibrary();
      let app = managers.get(actor.uuid);
      if (!app || app.actor !== actor) { app = new ElementManagerApp(services, actor); managers.set(actor.uuid, app); }
      return app.render(true);
    }
  };
  SheetClass = createDominionSheet(Base, services);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, ID, SheetClass, { types: [...SUPPORTED_ACTOR_TYPES], makeDefault: false, label: "DA.Title" });
  game.modules.get(ID).api = Object.freeze({
    openElementManager: services.openManager,
    openGlobalLibrary: services.openLibrary,
    getAssignedElements: actor => assignments.getIds(actor),
    setAssignedElements: (actor, ids) => assignments.set(actor, ids),
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
for (const hook of ["createItem", "updateItem", "deleteItem"]) Hooks.on(hook, item => {
  if (!item.actor && item.type === "power") for (const app of Object.values(ui.windows)) if (app instanceof GlobalLibraryApp) app.render(false);
});
