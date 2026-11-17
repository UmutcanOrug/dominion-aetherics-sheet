import { ID, SCHEMA, assertActor, t } from "../constants.js";
import { resolveActiveAethers } from "./aether-rules.js";

export class ElementSelectionService {
  constructor(registry, assignments) { this.registry = registry; this.assignments = assignments; }
  get(actor) {
    assertActor(actor);
    const version = actor.getFlag(ID, "schemaVersion");
    if (version !== undefined && version !== SCHEMA) throw new Error(t("InvalidSchema"));
    const known = new Set(this.assignments.getIds(actor));
    const raw = actor.getFlag(ID, "activeElements");
    return Array.isArray(raw) ? resolveActiveAethers(raw.filter(id => known.has(id)), this.registry.get()) : [];
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
    return this.assignments.queue(actor, async () => {
      assertActor(actor, true);
      const ids = read(), known = new Set(this.registry.get().map(e => e.id));
      if (ids.some(id => !known.has(id))) throw new Error(t("InvalidSelection"));
      const assigned = this.assignments.getIds(actor);
      if (ids.some(id => !assigned.includes(id))) throw new Error(t("ElementNotAssigned"));
      const current = new Set(this.get(actor));
      const effective = resolveActiveAethers(ids, this.registry.get());
      if (ids.some(id => !current.has(id) && !effective.includes(id))) throw new Error(t("AetherPrerequisitesNotMet"));
      const limit = game.settings.get(ID, "maxActive");
      if (limit > 0 && effective.length > limit) throw new Error(t("SelectionLimit", { count: limit }));
      const update = { [`flags.${ID}.activeElements`]: effective, [`flags.${ID}.schemaVersion`]: SCHEMA };
      if (actor.getFlag(ID, "assignedElements") === undefined) update[`flags.${ID}.assignedElements`] = assigned;
      await actor.update(update);
      await this.passives?.sync(actor);
      return this.get(actor);
    });
  }
}
