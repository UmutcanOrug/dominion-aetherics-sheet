import { ROOT, assertGM, clone, report, t } from "../constants.js";

export class ElementManagerApp extends foundry.appv1.api.Application {
  constructor(services, options = {}) { super(options); this.services = services; }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, { id: "dominion-element-manager", classes: ["da-config"], title: "Dominion Aetherics", template: `${ROOT}/templates/element-manager.hbs`, width: 640, height: "auto", resizable: true });
  }
  get title() { return t("ElementManager"); }
  getData() { assertGM(); return { elements: this.services.registry.get() }; }
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-edit-element]").forEach(button => button.addEventListener("click", () => {
      assertGM();
      const element = this.services.registry.get().find(e => e.id === button.dataset.editElement);
      new ElementEditorApp(this.services, element).render(true);
    }));
    html[0].querySelector("[data-create-element]").addEventListener("click", () => new ElementEditorApp(this.services).render(true));
    html[0].querySelectorAll("[data-delete-element]").forEach(button => button.addEventListener("click", async () => {
      try {
        assertGM();
        const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: t("DeleteElement") }, content: `<p>${t("DeleteElementConfirm")}</p>`, rejectClose: false });
        if (confirmed) await this.services.registry.remove(button.dataset.deleteElement);
      } catch (error) { report(error); }
    }));
  }
}

export class ElementEditorApp extends foundry.appv1.api.FormApplication {
  constructor(services, element, options = {}) {
    super({}, options); this.services = services;
    this.definition = clone(element ?? { id: foundry.utils.randomID(), name: "", icon: "icons/svg/atom.svg", symbol: "", description: "", order: services.registry.get().length, passives: [], effects: [] });
    this.sources = clone(this.definition.effects);
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, { classes: ["da-config"], template: `${ROOT}/templates/element-editor.hbs`, width: 660, height: "auto", resizable: true, closeOnSubmit: true, submitOnChange: false, submitOnClose: false });
  }
  get title() { return t("EditElement"); }
  getData() {
    assertGM();
    const candidates = [];
    const add = (effect, parent) => { if (!effect.getFlag("dominion-aetherics-sheet", "managed")) candidates.push({ uuid: effect.uuid, label: `${parent} / ${effect.name}` }); };
    for (const actor of game.actors) {
      for (const effect of actor.effects) add(effect, actor.name);
      for (const item of actor.items) for (const effect of item.effects) add(effect, `${actor.name} / ${item.name}`);
    }
    for (const item of game.items) for (const effect of item.effects) add(effect, item.name);
    return { element: this.definition, sources: this.sources, candidates };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0];
    root.querySelector("[data-add-passive]").addEventListener("click", async () => {
      const template = root.querySelector("template[data-passive-template]");
      const row = template.content.cloneNode(true);
      root.querySelector("[data-passive-list]").append(row);
    });
    root.addEventListener("click", event => {
      const button = event.target.closest("[data-remove-passive]");
      if (button) button.closest("[data-passive-row]").remove();
      const removeEffect = event.target.closest("[data-remove-effect]");
      if (removeEffect) {
        this.sources = this.sources.filter(s => s.uuid !== removeEffect.dataset.removeEffect);
        removeEffect.closest("[data-effect-row]").remove();
      }
    });
    root.querySelector("[data-add-effect]").addEventListener("click", async () => {
      try {
        const input = root.querySelector("[data-effect-uuid]");
        const uuid = input.value.trim() || root.querySelector("[data-effect-choice]").value;
        const source = await this.services.registry.resolveEffect(uuid);
        if (this.sources.some(s => s.uuid === source.uuid)) return;
        this.sources.push(source);
        const row = document.createElement("div"); row.dataset.effectRow = ""; row.className = "da-effect-row";
        const label = document.createElement("span"); label.textContent = source.name; label.title = source.uuid;
        const button = document.createElement("button"); button.type = "button"; button.dataset.removeEffect = source.uuid; button.textContent = t("Remove");
        row.append(label, button); root.querySelector("[data-effect-list]").append(row); input.value = "";
      } catch (error) { report(error); }
    });
  }
  async _updateObject(_event, data) {
    try {
      assertGM();
      const passives = [...this.form.querySelectorAll("[data-passive-row]")].map(row => ({ title: row.querySelector("[data-passive-title]").value.trim(), description: row.querySelector("[data-passive-description]").value }));
      await this.services.registry.save({ id: this.definition.id, name: data.name, icon: data.icon, symbol: data.symbol, description: data.description, order: data.order, passives, effects: this.sources });
      ui.notifications.info(t("Saved"));
    } catch (error) { report(error); throw error; }
  }
}
