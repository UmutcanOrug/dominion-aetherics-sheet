import { ID, SCHEMA, assertActor, clone, queueFor, t } from "../constants.js";

export class PassiveEffectService {
  #queues = new WeakMap();
  constructor(registry, selections) { this.registry = registry; this.selections = selections; }
  /** Exactly one active client owns background reconciliation for a given Actor. */
  isAuthority(actor) {
    const users = [...game.users].filter(u => u.active);
    const authority = users.filter(u => u.isGM).sort((a,b) => a.id.localeCompare(b.id))[0] ??
      users.filter(u => actor.testUserPermission(u, "OWNER")).sort((a,b) => a.id.localeCompare(b.id))[0];
    return authority?.id === game.user.id;
  }
  descriptions(actor) {
    assertActor(actor);
    const active = new Set(this.selections.get(actor));
    return this.registry.get().filter(e => active.has(e.id)).flatMap(e => [
      ...e.passives.map(p => ({ ...p, element: e.name, mechanical: false })),
      ...e.effects.map(f => ({ title: f.name, description: t("MechanicalPassive"), element: e.name, mechanical: true }))
    ]);
  }
  sync(actor) {
    if (!this.isAuthority(actor)) return Promise.resolve();
    assertActor(actor, true);
    return queueFor(this.#queues, actor, async () => {
      // Read selections INSIDE the queue: rapid toggles must converge on current document data.
      const active = new Set(this.selections.get(actor));
      const desired = new Map();
      for (const element of this.registry.get().filter(e => active.has(e.id))) {
        for (const source of element.effects) {
          if (!desired.has(source.uuid)) desired.set(source.uuid, { source, providers: [] });
          desired.get(source.uuid).providers.push(element.id);
        }
      }
      const managed = actor.effects.filter(e => e.getFlag(ID, "managed") === true && e.getFlag(ID, "schemaVersion") === SCHEMA);
      const kept = new Set(), remove = [], update = [], create = [];
      for (const effect of managed) {
        const sourceUuid = effect.getFlag(ID, "sourceUuid");
        const wanted = desired.get(sourceUuid);
        if (!wanted || kept.has(sourceUuid)) { remove.push(effect.id); continue; }
        kept.add(sourceUuid);
        const providers = [...wanted.providers].sort();
        const previous = [...(effect.getFlag(ID, "providers") ?? [])].sort();
        const signature = JSON.stringify(wanted.source.data);
        if (effect.disabled || effect.getFlag(ID, "actorUuid") !== actor.uuid || JSON.stringify(providers) !== JSON.stringify(previous) || effect.getFlag(ID, "signature") !== signature) {
          update.push({ ...clone(wanted.source.data), _id: effect.id, origin: actor.uuid, disabled: false, transfer: false,
            [`flags.${ID}`]: this.#tracking(actor, sourceUuid, providers, signature) });
        }
      }
      for (const [uuid, wanted] of desired) {
        if (kept.has(uuid)) continue;
        const data = clone(wanted.source.data);
        delete data._id;
        data.origin = actor.uuid; data.disabled = false; data.transfer = false;
        data.flags ??= {};
        data.flags[ID] = this.#tracking(actor, uuid, [...wanted.providers].sort(), JSON.stringify(wanted.source.data));
        create.push(data);
      }
      if (remove.length) await actor.deleteEmbeddedDocuments("ActiveEffect", remove);
      if (update.length) await actor.updateEmbeddedDocuments("ActiveEffect", update);
      if (create.length) await actor.createEmbeddedDocuments("ActiveEffect", create);
    });
  }
  #tracking(actor, sourceUuid, providers, signature) {
    return { managed: true, schemaVersion: SCHEMA, actorUuid: actor.uuid, sourceUuid, providers, signature };
  }
}
