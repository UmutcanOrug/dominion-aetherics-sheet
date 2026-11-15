import { ID, assertActor, assertGM, assertPower, clone, queueFor, t } from "../constants.js";

export class PowerLibraryService {
  #queues = new Map();
  list() {
    assertGM();
    return game.items.filter(item => item.type === "power").sort((a, b) => a.name.localeCompare(b.name));
  }
  async create(name) {
    assertGM();
    if (typeof name !== "string" || !name.trim() || name.length > 100) throw new Error(t("PowerNameRequired"));
    return CONFIG.Item.documentClass.create({ name: name.trim(), type: "power" });
  }
  import(uuid) {
    assertGM();
    if (typeof uuid !== "string" || !uuid.trim()) throw new Error(t("InvalidPower"));
    return queueFor(this.#queues, "import", async () => {
      assertGM();
      const source = await fromUuid(uuid.trim()); assertPower(source);
      if (game.items.get(source.id) === source) return source;
      const existing = this.list().find(item => item.getFlag(ID, "libraryOriginalUuid") === source.uuid);
      if (existing) return existing;
      const data = this.#copy(source);
      data.flags[ID] ??= {}; data.flags[ID].libraryOriginalUuid = source.uuid;
      return CONFIG.Item.documentClass.create(data);
    });
  }
  addToActor(actor, source) {
    assertGM(); assertActor(actor, true); assertPower(source);
    if (game.items.get(source.id) !== source) throw new Error(t("UseLibraryPower"));
    return queueFor(this.#queues, actor.uuid, async () => {
      assertGM(); assertActor(actor, true);
      const originalUuid = source.getFlag(ID, "libraryOriginalUuid");
      const existing = actor.items.find(item => item.type === "power" && (item.getFlag(ID, "librarySourceUuid") === source.uuid || item.uuid === originalUuid));
      if (existing) return existing;
      const data = this.#copy(source);
      data.flags[ID] ??= {}; data.flags[ID].librarySourceUuid = source.uuid;
      const [item] = await actor.createEmbeddedDocuments("Item", [data]);
      return item;
    });
  }
  #copy(source) {
    const raw = source.toObject(), data = {};
    for (const key of ["name", "type", "img", "system", "flags", "effects"]) if (raw[key] !== undefined) data[key] = clone(raw[key]);
    data.flags ??= {};
    return data;
  }
}
