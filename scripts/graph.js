import { ROOT, report, t } from "./constants.js";
import { PowerRequirementApp } from "./apps/power-requirements.js";

export class PowerGraphRenderer {
  constructor(sheet, services) { this.sheet = sheet; this.services = services; }
  async prepare(root, data) {
    // Work on this sheet's newly rendered DOM, BEFORE SWADE attaches its listeners.
    // Reuse the installed Powers partial even for a new Actor without an arcane background.
    let tab = root.querySelector('section.tab[data-tab="powers"]');
    if (!tab) {
      const nav = root.querySelector('nav.tabs[data-group="primary"]');
      const body = root.querySelector(".sheet-body");
      if (!nav || !body) return;
      const link = document.createElement("a"); link.className = "item"; link.dataset.tab = "powers"; link.dataset.group = "primary"; link.textContent = game.i18n.localize("SWADE.Pow");
      nav.insertBefore(link, nav.querySelector('[data-tab="effects"]'));
      tab = document.createElement("section"); tab.className = "tab powers"; tab.dataset.tab = "powers"; tab.dataset.group = "primary";
      tab.innerHTML = await foundry.applications.handlebars.renderTemplate("systems/swade/templates/actors/character/tabs/powers.hbs", data);
      body.insertBefore(tab, body.querySelector('[data-tab="effects"]'));
    }
    const original = tab.querySelector("span.powers");
    if (!original) throw new Error(t("UnsupportedTemplate"));
    const controls = document.createElement("div"); controls.className = "da-system-controls";
    for (const child of [...original.children]) if (child.classList.contains("section-header")) controls.append(child);
    const actor = this.sheet.actor;
    const active = new Set(this.services.selections.get(actor));
    const powers = actor.items.filter(i => i.type === "power").sort((a,b) => a.sort - b.sort || a.name.localeCompare(b.name)).map(item => {
      const result = this.services.requirements.evaluate(actor, item);
      return { id: item.id, name: item.name, img: item.img, state: result.state, available: result.available,
        tooltip: `${item.name} — ${this.services.requirements.describe(item)} — ${t(result.state)}` };
    });
    const separate = game.settings.get("dominion-aetherics-sheet", "separateUnconfigured");
    const groups = [{ title: t("Powers"), powers: separate ? powers.filter(p => p.state !== "unconfigured") : powers }];
    if (separate && powers.some(p => p.state === "unconfigured")) groups.push({ title: t("Unconfigured"), powers: powers.filter(p => p.state === "unconfigured") });
    const elementData = this.services.registry.get().map(e => ({ ...e, active: active.has(e.id), tooltip: `${e.name}${e.description ? ` — ${e.description}` : ""}` }));
    original.replaceChildren(controls);
    original.insertAdjacentHTML("beforeend", await foundry.applications.handlebars.renderTemplate(`${ROOT}/templates/power-graph.hbs`, {
      gm: game.user.isGM, editable: this.sheet.isEditable, elements: elementData, groups,
      passives: this.services.passives.descriptions(actor), showNames: game.settings.get("dominion-aetherics-sheet", "showNames")
    }));
    this.root = original.querySelector(".da-graph");
  }
  bind() {
    if (!this.root) return;
    const root = this.root, actor = this.sheet.actor;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    root.addEventListener("click", async event => {
      const button = event.target.closest("[data-da-action]");
      if (!button) return;
      event.preventDefault();
      try {
        const action = button.dataset.daAction;
        if (action === "manager") return this.services.openManager();
        if (action === "toggle") {
          if (!this.sheet.isEditable) return;
          button.disabled = true;
          try { await this.services.selections.toggle(actor, button.dataset.elementId); }
          finally { button.disabled = false; }
          return;
        }
        const item = actor.items.get(button.closest("[data-power-id]").dataset.powerId);
        if (!item || !this.sheet.isEditable) return;
        if (action === "edit") return item.sheet.render(true);
        if (action === "configure") return new PowerRequirementApp(this.services, item).render(true);
        if (action === "use") {
          if (!this.services.requirements.evaluate(actor, item).available) return ui.notifications.warn(t("PowerLocked"));
          // The official sheet's .item-show handler calls this exact SWADE method.
          button.disabled = true;
          try { await item.show(); } finally { button.disabled = false; }
        }
      } catch (error) { report(error); }
    }, options);
    root.querySelectorAll("[data-power-id]").forEach(node => {
      if (!this.sheet.isEditable) return;
      node.draggable = true;
      node.addEventListener("dragstart", event => {
        const item = actor.items.get(node.dataset.powerId);
        if (item) event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
      }, options);
    });
    const itemFromNode = node => actor.items.get(node.dataset.powerId);
    if (this.sheet.isEditable) {
      this.menu = new foundry.applications.ux.ContextMenu.implementation(root, ".da-power", [
        { name: t("OpenItem"), icon: '<i class="fas fa-edit"></i>', callback: node => itemFromNode(node)?.sheet.render(true) },
        { name: game.i18n.localize("SWADE.Favorite"), icon: '<i class="fas fa-star"></i>', callback: async node => {
          try { const item=itemFromNode(node); if(item) await item.update({"system.favorite": !item.system.favorite}); } catch(error) { report(error); }
        } },
        { name: game.i18n.localize("SWADE.Del"), icon: '<i class="fas fa-trash"></i>', callback: node => itemFromNode(node)?.deleteDialog() },
        { name: t("ConfigureElements"), icon: '<i class="fas fa-atom"></i>', condition: () => game.user.isGM, callback: node => new PowerRequirementApp(this.services, itemFromNode(node)).render(true) }
      ], { jQuery: false, fixed: true });
    }
    root.addEventListener("pointerover", event => { this.focus = event.target.closest("[data-element-id], [data-power-id]"); this.draw(); }, options);
    root.addEventListener("focusin", event => { this.focus = event.target.closest("[data-element-id], [data-power-id]"); this.draw(); }, options);
    root.addEventListener("pointerleave", () => { this.focus = null; this.draw(); }, options);
    root.addEventListener("focusout", event => { if (!root.contains(event.relatedTarget)) { this.focus = null; this.draw(); } }, options);
    this.resize = new ResizeObserver(() => this.draw()); this.resize.observe(root);
    root.addEventListener("scroll", () => this.draw(), { ...options, capture: true });
  }
  draw() {
    const svg = this.root?.querySelector(".da-connections");
    if (!svg) return;
    svg.replaceChildren();
    if (!this.focus || !game.settings.get("dominion-aetherics-sheet", "connections")) return;
    const bounds = this.root.querySelector(".da-network").getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const active = new Set(this.services.selections.get(this.sheet.actor));
    for (const node of this.root.querySelectorAll("[data-power-id]")) {
      if (this.focus.dataset.powerId && this.focus.dataset.powerId !== node.dataset.powerId) continue;
      const req = this.services.requirements.get(this.sheet.actor.items.get(node.dataset.powerId));
      if (!req || req.invalid) continue;
      for (const id of new Set(req.recipes.flat())) {
        if (!active.has(id) || (this.focus.dataset.elementId && this.focus.dataset.elementId !== id)) continue;
        const element = [...this.root.querySelectorAll("[data-element-id]")].find(e => e.dataset.elementId === id);
        if (!element) continue;
        const a = element.getBoundingClientRect(), b = node.getBoundingClientRect();
        const x1 = a.right - bounds.left, y1 = a.top + a.height / 2 - bounds.top, x2 = b.left - bounds.left, y2 = b.top + b.height / 2 - bounds.top;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${x1},${y1} C ${x1+30},${y1} ${x2-30},${y2} ${x2},${y2}`);
        path.classList.toggle("da-path-available", node.dataset.state === "available"); svg.append(path);
      }
    }
  }
  dispose() { this.abort?.abort(); this.resize?.disconnect(); this.menu?.close(); this.root = null; }
}
