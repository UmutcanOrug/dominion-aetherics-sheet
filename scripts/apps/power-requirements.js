import { ROOT, SCHEMA, assertGM, assertPower, report, t } from "../constants.js";

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
    const recipes = req && !req.invalid ? req.recipes : [[]];
    return { configured: !!req && !req.invalid, invalid: req?.invalid, exact: req?.exact ?? false, elements,
      recipes: recipes.map(recipe => ({ elements: elements.map(e => ({ ...e, selected: recipe.includes(e.id) })) })),
      forbidden: elements.map(e => ({ ...e, selected: req?.forbidden?.includes(e.id) ?? false })) };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0];
    root.querySelector("[data-add-recipe]").addEventListener("click", () => root.querySelector("[data-recipes]").append(root.querySelector("template[data-recipe-template]").content.cloneNode(true)));
    root.addEventListener("click", event => { const button = event.target.closest("[data-remove-recipe]"); if (button) button.closest("[data-recipe]").remove(); });
  }
  async _updateObject() {
    try {
      assertGM();
      const form = this.form;
      if (!form.querySelector("[name=configured]").checked) return await this.services.requirements.save(this.item, null);
      const recipes = [...form.querySelectorAll("[data-recipe]")].map(row => [...row.querySelectorAll("[data-element-id]:checked")].map(input => input.dataset.elementId));
      const forbidden = [...form.querySelectorAll("[data-forbidden-id]:checked")].map(input => input.dataset.forbiddenId);
      await this.services.requirements.save(this.item, { schemaVersion: SCHEMA, recipes, forbidden, exact: form.querySelector("[name=exact]").checked });
    } catch (error) { report(error); throw error; }
  }
}
