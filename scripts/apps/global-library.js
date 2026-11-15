import { ID, ROOT, assertActor, assertGM, report, t } from "../constants.js";
import { bindImageFallbacks, imagePath } from "../images.js";
import { ElementEditorApp } from "./element-manager.js";
import { PowerRequirementApp } from "./power-requirements.js";

export class GlobalLibraryApp extends foundry.appv1.api.Application {
  constructor(services, actor = null, options = {}) {
    assertGM(); if (actor) assertActor(actor, true);
    super({ ...options, id: `${ID}-library-${(actor?.uuid ?? "world").replace(/[^A-Za-z0-9_-]/g, "-")}` });
    this.services = services; this.actor = actor; this.libraryTab = "elements";
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, { classes: ["da-config"], template: `${ROOT}/templates/global-library.hbs`, width: 760, height: 640, resizable: true });
  }
  get title() { return t("GlobalLibrary"); }
  getData() {
    assertGM();
    const candidates = [];
    for (const actor of game.actors) for (const item of actor.items) if (item.type === "power") candidates.push({ uuid: item.uuid, label: `${actor.name} / ${item.name}` });
    return { actorName: this.actor?.name, hasActor: !!this.actor, elementsTab: this.libraryTab === "elements", powersTab: this.libraryTab === "powers",
      elements: this.services.registry.get().map(e => ({ ...e, icon: imagePath(e.icon) })), powers: this.services.powerLibrary.list().map(item => ({ id: item.id, name: item.name, img: imagePath(item.img) })), candidates };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0]; bindImageFallbacks(root);
    root.querySelectorAll("[data-library-tab]").forEach(button => button.addEventListener("click", () => { this.libraryTab = button.dataset.libraryTab; this.render(false); }));
    root.addEventListener("click", async event => {
      const button = event.target.closest("[data-library-action]");
      if (!button) return;
      event.preventDefault();
      try {
        assertGM(); button.disabled = true;
        const action = button.dataset.libraryAction;
        if (action === "create-element") return new ElementEditorApp(this.services).render(true);
        if (action === "edit-element") return new ElementEditorApp(this.services, this.services.registry.get().find(e => e.id === button.dataset.id)).render(true);
        if (action === "delete-element") {
          if (await foundry.applications.api.DialogV2.confirm({ window: { title: t("DeleteElement") }, content: `<p>${t("DeleteElementConfirm")}</p>`, rejectClose: false })) await this.services.registry.remove(button.dataset.id);
          return;
        }
        if (action === "create-power") {
          const item = await this.services.powerLibrary.create(root.querySelector("[data-power-name]").value);
          await item?.sheet?.render(true); this.render(false); return;
        }
        if (action === "import-power") {
          const uuid = root.querySelector("[data-power-uuid]").value.trim() || root.querySelector("[data-power-choice]").value;
          const item = await this.services.powerLibrary.import(uuid);
          await item?.sheet?.render(true); this.render(false); return;
        }
        const item = game.items.get(button.dataset.id);
        if (!item || item.type !== "power") return;
        if (action === "edit-power") return await item.sheet?.render(true);
        if (action === "configure-power") return new PowerRequirementApp(this.services, item).render(true);
        if (action === "delete-power") return await item.deleteDialog();
        if (action === "add-power" && this.actor) {
          await this.services.powerLibrary.addToActor(this.actor, item); ui.notifications.info(t("PowerAdded"));
        }
      } catch (error) { report(error); }
      finally { button.disabled = false; }
    });
  }
}
