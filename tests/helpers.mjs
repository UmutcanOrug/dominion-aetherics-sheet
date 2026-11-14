import { ID } from "../scripts/constants.js";
import { ElementRegistry } from "../scripts/services/registry.js";
import { ElementSelectionService } from "../scripts/services/selections.js";
import { PowerRequirementService } from "../scripts/services/requirements.js";
import { PassiveEffectService } from "../scripts/services/passives.js";

export class Collection extends Array { get(id) { return this.find(item => item.id === id); } }
function apply(document, data) {
  for (const [path, value] of Object.entries(data)) {
    const keys = path.split("."); let target = document;
    for (const key of keys.slice(0,-1)) { target[key] ??= {}; target = target[key]; }
    target[keys.at(-1)] = structuredClone(value);
  }
}
export class Effect {
  documentName = "ActiveEffect";
  constructor(data = {}) { Object.assign(this, { id: Math.random().toString(36).slice(2), flags: {}, changes: [], disabled: false }, structuredClone(data)); }
  getFlag(namespace, key) { return this.flags?.[namespace]?.[key]; }
  toObject() { return structuredClone({ ...this }); }
}
export class Actor {
  documentName = "Actor"; type = "character"; flags = {}; effects = new Collection(); items = new Collection(); system = { powerPoints: { general: { value: 10, max: 20 } } }; updates = []; allowed = true;
  constructor(uuid = "Actor.A") { this.uuid = uuid; this.id = uuid; }
  testUserPermission(user, level) { return user.isGM || (this.allowed && (level !== "OWNER" || user.owner !== false)); }
  getFlag(namespace, key) { return this.flags?.[namespace]?.[key]; }
  async update(data) { this.updates.push(structuredClone(data)); await new Promise(resolve => setTimeout(resolve, 1)); apply(this, data); return this; }
  async createEmbeddedDocuments(type, documents) { if (type !== "ActiveEffect") throw new Error(type); const created = documents.map(d => new Effect(d)); this.effects.push(...created); return created; }
  async deleteEmbeddedDocuments(type, ids) { if (type !== "ActiveEffect") throw new Error(type); this.effects = this.effects.filter(e => !ids.includes(e.id)); }
  async updateEmbeddedDocuments(type, documents) { if (type !== "ActiveEffect") throw new Error(type); for (const data of documents) apply(this.effects.get(data._id), data); }
}
export class Power {
  documentName = "Item"; type = "power"; flags = {}; sort = 0; name = "Test Power"; img = "icons/svg/item-bag.svg";
  constructor(actor, id = "power") { this.actor = actor; this.id = id; this.uuid = `${actor.uuid}.Item.${id}`; actor.items.push(this); }
  testUserPermission(user, level) { return this.actor.testUserPermission(user, level); }
  getFlag(namespace, key) { return this.flags?.[namespace]?.[key]; }
  async setFlag(namespace, key, value) { this.flags[namespace] ??= {}; this.flags[namespace][key] = structuredClone(value); }
  async unsetFlag(namespace, key) { delete this.flags[namespace]?.[key]; }
  toDragData() { return { type: "Item", uuid: this.uuid }; }
}
export const element = (id, effects = []) => ({ id, name: id, icon: "icons/svg/atom.svg", symbol: id, order: 0, description: "Description", passives: [{ title: `Passive ${id}`, description: "Descriptive only" }], effects });
export const source = (uuid = "Actor.Source.ActiveEffect.cold") => ({ uuid, name: "Cold resistance", data: { name: "Cold resistance", changes: [{ key: "system.test.path", mode: 2, value: "1" }], disabled: false, transfer: false, duration: {} } });
export function setup(elements = [element("H"), element("O"), element("C"), element("Fe")]) {
  const values = new Map([["elements", { schemaVersion: 1, elements: structuredClone(elements) }], ["maxActive", 0], ["separateUnconfigured", true], ["showNames", true], ["connections", true]]);
  const user = { id: "gm", active: true, isGM: true, owner: true };
  globalThis.game = { user, users: [user], i18n: { localize: key => key, format: (key, data) => `${key} ${JSON.stringify(data)}` }, settings: { get: (_id,key) => values.get(key), set: async (_id,key,value) => { values.set(key, structuredClone(value)); return value; } } };
  const registry = new ElementRegistry(), selections = new ElementSelectionService(registry), requirements = new PowerRequirementService(registry, selections), passives = new PassiveEffectService(registry, selections);
  selections.passives = passives;
  return { registry, selections, requirements, passives, values };
}
export const configured = (recipes, extra = {}) => ({ schemaVersion: 1, recipes, forbidden: [], exact: false, ...extra });
export async function configure(power, recipes, extra) { await power.setFlag(ID, "requirements", configured(recipes, extra)); }
