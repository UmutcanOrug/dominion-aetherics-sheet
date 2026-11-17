import { ROOT, report, t } from "./constants.js";
import { PowerRequirementApp } from "./apps/power-requirements.js";
import { bindImageFallbacks, imagePath } from "./images.js";
import { AETHER_LEVELS, aetherLevel, aetherStatus, describeAetherPrerequisites } from "./services/aether-rules.js";

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
      return { id: item.id, name: item.name, img: imagePath(item.img), state: result.state, available: result.available,
        tooltip: `${item.name} — ${this.services.requirements.describe(item)} — ${t(result.state)}` };
    });
    const separate = game.settings.get("dominion-aetherics-sheet", "separateUnconfigured");
    const groups = [{ title: t("Powers"), powers: separate ? powers.filter(p => p.state !== "unconfigured") : powers }];
    if (separate && powers.some(p => p.state === "unconfigured")) groups.push({ title: t("Unconfigured"), powers: powers.filter(p => p.state === "unconfigured") });
    const definitions = this.services.registry.get();
    const elementData = this.services.assignments.get(actor).map(e => {
      const status = aetherStatus(e, [...active], definitions), level = aetherLevel(e), selected = active.has(e.id);
      return { ...e, level, icon: imagePath(e.icon), active: selected, available: status.available, state: status.state,
        disabled: !this.sheet.isEditable || (!selected && !status.available),
        tooltip: `${e.name} — ${t("Level")} ${level} — ${describeAetherPrerequisites(e, definitions)}${e.description ? ` — ${e.description}` : ""}` };
    });
    const tiers = AETHER_LEVELS.map(level => ({ level, elements: elementData.filter(e => e.level === level) }));
    original.replaceChildren(controls);
    original.insertAdjacentHTML("beforeend", await foundry.applications.handlebars.renderTemplate(`${ROOT}/templates/power-graph.hbs`, {
      gm: game.user.isGM, editable: this.sheet.isEditable, tiers, groups,
      passives: this.services.passives.descriptions(actor), showNames: game.settings.get("dominion-aetherics-sheet", "showNames"), toolsReady: this.services.powerUse.isReady()
    }));
    this.root = original.querySelector(".da-graph");
  }
  bind(sheetRoot = this.root) {
    if (!this.root) return;
    const root = this.root, actor = this.sheet.actor;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    bindImageFallbacks(sheetRoot, options);
    root.addEventListener("click", async event => {
      const button = event.target.closest("[data-da-action]");
      if (!button) return;
      event.preventDefault();
      try {
        const action = button.dataset.daAction;
        if (action === "manager") return this.services.openManager(actor);
        if (action === "library") return this.services.openLibrary(actor);
        if (action === "toggle") {
          if (!this.sheet.isEditable) return;
          button.disabled = true;
          try { await this.services.selections.toggle(actor, button.dataset.elementId); }
          finally { button.disabled = false; }
          return;
        }
        const item = actor.items.get(button.closest("[data-power-id]").dataset.powerId);
        if (!item || !this.sheet.isEditable) return;
        if (action === "edit") return await item.sheet.render(true);
        if (action === "configure") return new PowerRequirementApp(this.services, item).render(true);
        if (action === "use") {
          if (!this.services.requirements.evaluate(actor, item).available) return ui.notifications.warn(t("PowerLocked"));
          button.disabled = true;
          try { await this.services.powerUse.use(actor, item, { token: this.sheet.token }); } finally { button.disabled = false; }
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
    const connect = (source, target, available) => {
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x1 = a.right - bounds.left, y1 = a.top + a.height / 2 - bounds.top, x2 = b.left - bounds.left, y2 = b.top + b.height / 2 - bounds.top;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1},${y1} C ${x1+20},${y1} ${x2-20},${y2} ${x2},${y2}`);
      path.classList.toggle("da-path-available", available); svg.append(path);
    };
    const nodes = new Map([...this.root.querySelectorAll("[data-element-id]")].map(node => [node.dataset.elementId, node]));
    const definitions = this.services.registry.get();
    if (this.focus.dataset.elementId) {
      for (const definition of definitions) for (const id of Array.isArray(definition.prerequisites?.ids) ? definition.prerequisites.ids : []) {
        if (definition.id !== this.focus.dataset.elementId && id !== this.focus.dataset.elementId) continue;
        const source = nodes.get(id), target = nodes.get(definition.id);
        if (source && target) connect(source, target, active.has(id) && aetherStatus(definition, [...active], definitions).available);
      }
    }
    for (const node of this.root.querySelectorAll("[data-power-id]")) {
      if (this.focus.dataset.powerId && this.focus.dataset.powerId !== node.dataset.powerId) continue;
      const req = this.services.requirements.get(this.sheet.actor.items.get(node.dataset.powerId));
      if (!req || req.invalid) continue;
      for (const id of new Set(req.recipes.flat())) {
        if (!active.has(id) || (this.focus.dataset.elementId && this.focus.dataset.elementId !== id)) continue;
        const element = nodes.get(id);
        if (!element) continue;
        connect(element, node, node.dataset.state === "available");
      }
    }
  }
  async dispose() {
    this.abort?.abort(); this.resize?.disconnect();
    const root = this.root, menu = this.menu;
    this.root = null; this.menu = null; this.focus = null;
    // V13 close() animates by default, even when this instance has never opened a menu.
    // Close only our open target, before its DOM is replaced, without layout animation.
    if (!menu?.element || !menu.target || !root?.contains(menu.target)) return;
    try { await menu.close({ animate: false, target: menu.target }); }
    catch (error) { report(error); }
  }
}
