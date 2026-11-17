import { ID, SCHEMA, assertActor, assertGM, queueFor, t } from "../constants.js";
import { resolveActiveAethers } from "./aether-rules.js";

export class ElementAssignmentService {
  #queues = new WeakMap();
  constructor(registry) { this.registry = registry; }
  getIds(actor) {
    assertActor(actor);
    const version = actor.getFlag(ID, "schemaVersion");
    if (version !== undefined && version !== SCHEMA) throw new Error(t("InvalidSchema"));
    const known = new Set(this.registry.get().map(e => e.id));
    const raw = actor.getFlag(ID, "assignedElements");
    if (raw !== undefined && !Array.isArray(raw)) throw new Error(t("InvalidAssignment"));
    // Older versions had no assignment list. Preserve only this Actor's saved active IDs.
    const legacy = actor.getFlag(ID, "activeElements");
    const ids = raw ?? (Array.isArray(legacy) ? legacy : []);
    return [...new Set(ids.filter(id => known.has(id)))];
  }
  get(actor) {
    const assigned = new Set(this.getIds(actor));
    return this.registry.get().filter(element => assigned.has(element.id));
  }
  queue(actor, operation) { return queueFor(this.#queues, actor, operation); }
  set(actor, ids) {
    assertGM(); assertActor(actor, true);
    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) throw new Error(t("InvalidAssignment"));
    const requested = [...new Set(ids)];
    return this.queue(actor, async () => {
      assertGM(); assertActor(actor, true);
      const known = new Set(this.registry.get().map(e => e.id));
      if (requested.some(id => !known.has(id))) throw new Error(t("InvalidAssignment"));
      const active = actor.getFlag(ID, "activeElements");
      const retained = Array.isArray(active) ? resolveActiveAethers(active.filter(id => requested.includes(id)), this.registry.get()) : [];
      await actor.update({ [`flags.${ID}.assignedElements`]: requested, [`flags.${ID}.activeElements`]: retained, [`flags.${ID}.schemaVersion`]: SCHEMA });
      await this.passives?.sync(actor);
      return this.getIds(actor);
    });
  }
}
