import { ID, SCHEMA, assertGM, clone, safeImage, t, queueFor } from "../constants.js";
import { aetherLevel, aetherRuleIssue, withAetherDefaults } from "./aether-rules.js";

export function validateElement(raw) {
  if (!raw || typeof raw.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(raw.id)) throw new Error(t("InvalidElement"));
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 100) throw new Error(t("ElementNameRequired"));
  const descriptions = raw.passives ?? [];
  if (!Array.isArray(descriptions) || descriptions.length > 50 || descriptions.some(p => typeof p.title !== "string" || !p.title.trim() || p.title.length > 200 || typeof p.description !== "string" || p.description.length > 10000)) throw new Error(t("InvalidPassive"));
  const effects = raw.effects ?? [];
  if (!Array.isArray(effects) || effects.length > 50 || effects.some(e => typeof e.uuid !== "string" || !e.uuid || !e.data || !Array.isArray(e.data.changes))) throw new Error(t("InvalidEffect"));
  return {
    id: raw.id, name: raw.name.trim(), symbol: String(raw.symbol ?? "").slice(0,12),
    icon: safeImage(raw.icon), description: String(raw.description ?? "").slice(0,10000),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    passives: descriptions.map(p => ({ title: p.title.trim(), description: p.description })),
    effects: clone(effects), level: raw.level ?? 1, prerequisites: clone(raw.prerequisites ?? null)
  };
}

export class ElementRegistry {
  #queue = new Map();
  get() {
    const data = game.settings.get(ID, "elements");
    if (data.schemaVersion !== SCHEMA || !Array.isArray(data.elements)) throw new Error(t("InvalidSchema"));
    return clone(data.elements).map(withAetherDefaults).sort((a,b) => aetherLevel(a) - aetherLevel(b) || a.order - b.order || a.name.localeCompare(b.name));
  }
  save(element) {
    assertGM();
    const normalized = validateElement(element);
    return queueFor(this.#queue, "registry", async () => {
      const elements = this.get();
      const index = elements.findIndex(e => e.id === normalized.id);
      const previous = elements[index];
      if (index < 0) elements.push(normalized); else elements[index] = normalized;
      const issue = aetherRuleIssue(normalized, elements);
      if (issue) throw new Error(t(issue));
      if (previous && previous.level !== normalized.level && elements.some(entry => Array.isArray(entry.prerequisites?.ids) && entry.prerequisites.ids.includes(normalized.id) && aetherRuleIssue(entry, elements))) throw new Error(t("AetherLevelInUse"));
      return game.settings.set(ID, "elements", { schemaVersion: SCHEMA, elements });
    });
  }
  remove(id) {
    assertGM();
    return queueFor(this.#queue, "registry", async () => game.settings.set(ID, "elements", { schemaVersion: SCHEMA, elements: this.get().filter(e => e.id !== id) }));
  }
  /** Resolve as GM, snapshot approved AE data so owners never need access to the source Actor. */
  async resolveEffect(uuid) {
    assertGM();
    const effect = await fromUuid(uuid.trim());
    if (effect?.documentName !== "ActiveEffect") throw new Error(t("InvalidEffect"));
    if (effect.getFlag(ID, "managed")) throw new Error(t("ManagedSource"));
    const raw = effect.toObject();
    if (raw.statuses?.length && Object.keys(raw.flags?.swade?.related ?? {}).length) throw new Error(t("RelatedEffectSource"));
    const data = {};
    for (const key of ["name", "img", "type", "changes", "statuses", "flags", "system", "description", "tint"]) {
      if (raw[key] !== undefined) data[key] = clone(raw[key]);
    }
    // Passives last while selected. Do not copy timers, parent identity, origin or transfer state.
    data.duration = {}; data.disabled = false; data.transfer = false;
    // Verified SWADE 5.1.0 nullable expiration field: selection, not turn timing, owns a passive.
    if (data.system && Object.hasOwn(data.system, "expiration")) data.system.expiration = null;
    if (data.flags) delete data.flags[ID];
    return { uuid: effect.uuid, name: effect.name, data };
  }
}
