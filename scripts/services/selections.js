import { ID, SCHEMA, assertActor, queueFor, t } from "../constants.js";

export class ElementSelectionService {
  #queues = new WeakMap();
  constructor(registry) { this.registry = registry; }
  get(actor) {
    assertActor(actor);
    const version = actor.getFlag(ID, "schemaVersion");
    if (version !== undefined && version !== SCHEMA) throw new Error(t("InvalidSchema"));
    const known = new Set(this.registry.get().map(e => e.id));
    const raw = actor.getFlag(ID, "activeElements");
    return Array.isArray(raw) ? [...new Set(raw.filter(id => known.has(id)))] : [];
  }
  set(actor, ids) {
    assertActor(actor, true);
    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) throw new Error(t("InvalidSelection"));
    const requested = [...new Set(ids)];
    return this.#change(actor, () => requested);
  }
  toggle(actor, id) {
    assertActor(actor, true);
    return this.#change(actor, () => {
      const current = this.get(actor);
      return current.includes(id) ? current.filter(e => e !== id) : [...current, id];
    });
  }
  #change(actor, read) {
    return queueFor(this.#queues, actor, async () => {
      assertActor(actor, true);
      const ids = read(), known = new Set(this.registry.get().map(e => e.id));
      if (ids.some(id => !known.has(id))) throw new Error(t("InvalidSelection"));
      const limit = game.settings.get(ID, "maxActive");
      if (limit > 0 && ids.length > limit) throw new Error(t("SelectionLimit", { count: limit }));
      await actor.update({ [`flags.${ID}.activeElements`]: ids, [`flags.${ID}.schemaVersion`]: SCHEMA });
      await this.passives?.sync(actor);
      return this.get(actor);
    });
  }
}
