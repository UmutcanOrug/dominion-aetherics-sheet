import { ROOT, SCHEMA, assertGM, assertPower, report, t } from "../constants.js";
import { compileRecipeGroups, requirementsToGroups } from "../services/requirements.js";

export class PowerRequirementApp extends foundry.appv1.api.FormApplication {
  constructor(services, item, options = {}) { super({}, options); assertGM(); assertPower(item); this.services = services; this.item = item; }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, { classes: ["da-config"], template: `${ROOT}/templates/power-requirements.hbs`, width: 620, height: "auto", resizable: true, closeOnSubmit: true, submitOnChange: false, submitOnClose: false });
  }
  get title() { return `${t("ConfigureElements")} — ${this.item.name}`; }
  getData() {
    assertGM();
    const req = this.services.requirements.get(this.item);
    const elements = this.services.registry.get();
    return { configured: !!req && !req.invalid, invalid: req?.invalid, exact: req?.exact ?? false, elements,
      recipes: requirementsToGroups(req).map(group => ({ isAny: group.mode === "any", elements: elements.map(e => ({ ...e, selected: group.elements.includes(e.id) })) })),
      forbidden: elements.map(e => ({ ...e, selected: req?.forbidden?.includes(e.id) ?? false })) };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0];
    root.querySelector("[data-add-recipe]").addEventListener("click", () => {
      root.querySelector("[data-recipes]").append(root.querySelector("template[data-recipe-template]").content.cloneNode(true));
      this.updatePreview(root);
    });
    root.addEventListener("click", event => {
      const button = event.target.closest("[data-remove-recipe]");
      if (button) { button.closest("[data-recipe]").remove(); this.updatePreview(root); }
    });
    root.addEventListener("change", () => this.updatePreview(root));
    this.updatePreview(root);
  }
  readGroups(root) {
    return [...root.querySelectorAll("[data-recipe]")].map(row => ({
      mode: row.querySelector("[data-recipe-mode]").value,
      elements: [...row.querySelectorAll("[data-element-id]:checked")].map(input => input.dataset.elementId)
    }));
  }
  updatePreview(root) {
    const target = root.querySelector("[data-requirement-preview]");
    const names = new Map(this.services.registry.get().map(e => [e.id, e.name]));
    target.textContent = this.readGroups(root).map(group => {
      if (!group.elements.length) return group.mode === "any" ? t("AnyRequiresElement") : t("AlwaysAvailable");
      return `(${group.elements.map(id => names.get(id)).join(` ${t(group.mode === "any" ? "Or" : "And")} `)})`;
    }).join(` ${t("Or")} `) || t("InvalidRequirements");
  }
  async _updateObject() {
    try {
      assertGM();
      const form = this.form;
      if (!form.querySelector("[name=configured]").checked) return await this.services.requirements.save(this.item, null);
      const recipes = compileRecipeGroups(this.readGroups(form));
      const forbidden = [...form.querySelectorAll("[data-forbidden-id]:checked")].map(input => input.dataset.forbiddenId);
      await this.services.requirements.save(this.item, { schemaVersion: SCHEMA, recipes, forbidden, exact: form.querySelector("[name=exact]").checked });
    } catch (error) { report(error); throw error; }
  }
}
