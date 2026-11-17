import { ID, ROOT, DEFAULT_ICON, assertActor, assertGM, clone, report, t } from "../constants.js";
import { bindImageFallbacks, imagePath } from "../images.js";
import { AETHER_LEVELS, aetherLevel, aetherRuleIssue, describeAetherPrerequisites, withAetherDefaults } from "../services/aether-rules.js";

export class ElementManagerApp extends foundry.appv1.api.FormApplication {
  constructor(services, actor, options = {}) {
    assertGM(); assertActor(actor, true);
    super(actor, { ...options, id: `${ID}-assign-${actor.uuid.replace(/[^A-Za-z0-9_-]/g, "-")}` });
    this.services = services; this.actor = actor;
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, { classes: ["da-config"], title: "Dominion Aetherics", template: `${ROOT}/templates/element-manager.hbs`, width: 640, height: "auto", resizable: true, closeOnSubmit: true, submitOnChange: false, submitOnClose: false });
  }
  get title() { return `${t("ElementManager")} — ${this.actor.name}`; }
  getData() {
    assertGM(); assertActor(this.actor, true);
    const assigned = new Set(this.services.assignments.getIds(this.actor));
    const definitions = this.services.registry.get();
    return { actorName: this.actor.name, elements: definitions.map(e => ({ ...e, level: aetherLevel(e), prerequisiteText: describeAetherPrerequisites(e, definitions), icon: imagePath(e.icon), assigned: assigned.has(e.id) })) };
  }
  activateListeners(html) {
    super.activateListeners(html);
    bindImageFallbacks(html[0]);
    html[0].querySelector("[data-open-library]").addEventListener("click", () => this.services.openLibrary(this.actor));
  }
  async _updateObject() {
    try {
      const ids = [...this.form.querySelectorAll("[data-assigned-id]:checked")].map(input => input.dataset.assignedId);
      await this.services.assignments.set(this.actor, ids);
      ui.notifications.info(t("AssignmentsSaved"));
    } catch (error) { report(error); throw error; }
  }
}

export class ElementEditorApp extends foundry.appv1.api.FormApplication {
  constructor(services, element, options = {}) {
    super({}, options); this.services = services;
    this.definition = withAetherDefaults(clone(element ?? { id: foundry.utils.randomID(), name: "", icon: DEFAULT_ICON, symbol: "", description: "", order: services.registry.get().length, passives: [], effects: [] }));
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
    const definitions = this.services.registry.get(), selected = this.definition.prerequisites?.ids;
    return { element: this.definition, sources: this.sources, candidates,
      levels: AETHER_LEVELS.map(level => ({ level, selected: this.definition.level === level })),
      hasPrerequisites: this.definition.prerequisites != null, anyPrerequisite: this.definition.prerequisites?.mode === "any",
      prerequisiteIssue: aetherRuleIssue(this.definition, [...definitions.filter(e => e.id !== this.definition.id), this.definition]),
      prerequisiteCandidates: definitions.filter(e => e.id !== this.definition.id).map(e => ({ id: e.id, name: e.name, level: aetherLevel(e), selected: Array.isArray(selected) && selected.includes(e.id) })) };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0];
    const updatePrerequisites = () => this.updatePrerequisiteChoices(root);
    root.querySelector('[name="level"]').addEventListener("change", updatePrerequisites);
    root.querySelector('[name="hasPrerequisites"]').addEventListener("change", updatePrerequisites);
    root.querySelector("[data-prerequisite-options]").addEventListener("change", updatePrerequisites);
    updatePrerequisites();
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
  updatePrerequisiteChoices(root) {
    const level = Number(root.querySelector('[name="level"]').value);
    const enabled = root.querySelector('[name="hasPrerequisites"]').checked;
    root.querySelector("[data-prerequisite-options]").hidden = !enabled;
    for (const label of root.querySelectorAll("[data-prerequisite-choice]")) {
      const input = label.querySelector("input"), lower = Number(label.dataset.level) < level;
      label.hidden = !lower && !input.checked;
      label.classList.toggle("da-invalid-choice", !lower && input.checked);
      input.disabled = !enabled || (!lower && !input.checked);
    }
  }
  async _updateObject(_event, data) {
    try {
      assertGM();
      const passives = [...this.form.querySelectorAll("[data-passive-row]")].map(row => ({ title: row.querySelector("[data-passive-title]").value.trim(), description: row.querySelector("[data-passive-description]").value }));
      const hasPrerequisites = this.form.querySelector('[name="hasPrerequisites"]').checked;
      const prerequisites = hasPrerequisites ? { mode: this.form.querySelector('[name="prerequisiteMode"]').value, ids: [...this.form.querySelectorAll("[data-prerequisite-id]:checked")].map(input => input.dataset.prerequisiteId) } : null;
      await this.services.registry.save({ id: this.definition.id, name: data.name, icon: data.icon, symbol: data.symbol, description: data.description, order: data.order, level: Number(data.level ?? this.definition.level), prerequisites, passives, effects: this.sources });
      ui.notifications.info(t("Saved"));
    } catch (error) { report(error); throw error; }
  }
}
