import { t } from "./constants.js";
import { imagePath } from "./images.js";
import { AETHER_LEVELS, aetherLevel, aetherRuleIssue, describeAetherPrerequisites } from "./services/aether-rules.js";

/** Catalog relationships only: never evaluate or mutate an Actor's selections. */
export function buildLibraryGraph(services) {
  const definitions = services.registry.get();
  const elements = definitions.map(definition => {
    const level = aetherLevel(definition), issue = aetherRuleIssue(definition, definitions);
    const rule = describeAetherPrerequisites(definition, definitions);
    return { ...definition, key: `aether:${definition.id}`, type: "aether", level, icon: imagePath(definition.icon), invalid: !!issue,
      rule, tooltip: `${definition.name} — ${t("Level")} ${level} — ${rule}` };
  });
  const powers = services.powerLibrary.list().map(item => {
    const requirements = services.requirements.get(item), rule = services.requirements.describe(item);
    return { id: item.id, key: `power:${item.id}`, type: "power", name: item.name, img: imagePath(item.img), requirements, rule,
      state: !requirements ? "unconfigured" : requirements.invalid ? "invalid" : "configured", tooltip: `${item.name} — ${rule}` };
  });
  const nodes = [...elements, ...powers], keys = new Set(nodes.map(node => node.key)), edges = [];
  const edge = (from, to, kind = "required") => { if (keys.has(from) && keys.has(to)) edges.push({ from, to, kind }); };
  for (const element of elements) {
    const ids = element.prerequisites?.ids;
    if (Array.isArray(ids)) for (const id of new Set(ids)) edge(`aether:${id}`, element.key);
  }
  for (const power of powers) {
    if (!power.requirements || power.requirements.invalid) continue;
    for (const id of new Set(power.requirements.recipes.flat())) edge(`aether:${id}`, power.key);
    for (const id of power.requirements.forbidden) edge(`aether:${id}`, power.key, "forbidden");
  }
  return { elements, powers, nodes, edges, tiers: AETHER_LEVELS.map(level => ({ level, elements: elements.filter(element => element.level === level) })),
    groups: [{ title: t("Powers"), powers: powers.filter(power => power.state !== "unconfigured") },
      ...(powers.some(power => power.state === "unconfigured") ? [{ title: t("Unconfigured"), powers: powers.filter(power => power.state === "unconfigured") }] : [])] };
}

export class LibraryGraphController {
  constructor(app, root, graph) { this.app = app; this.root = root; this.graph = graph; this.nodes = new Map(graph.nodes.map(node => [node.key, node])); }
  bind() {
    this.abort = new AbortController(); const options = { signal: this.abort.signal };
    const inspect = target => target?.closest?.("[data-library-node]")?.dataset.libraryNode ?? null;
    this.root.addEventListener("click", event => {
      const select = event.target.closest("[data-library-select]");
      if (select) { event.preventDefault(); this.select(select.dataset.librarySelect); }
    }, options);
    this.root.addEventListener("pointerover", event => { this.hoverKey = inspect(event.target); this.draw(); }, options);
    this.root.addEventListener("pointerleave", () => { this.hoverKey = null; this.draw(); }, options);
    this.root.addEventListener("focusin", event => { this.focusKey = inspect(event.target); this.draw(); }, options);
    this.root.addEventListener("focusout", event => { this.focusKey = inspect(event.relatedTarget); this.draw(); }, options);
    this.root.querySelector("[data-library-all-links]").addEventListener("change", event => { this.app.showAllConnections = event.target.checked; this.draw(); }, options);
    this.root.addEventListener("scroll", () => this.draw(), { ...options, capture: true });
    this.resize = new ResizeObserver(() => this.draw()); this.resize.observe(this.root.querySelector(".da-network"));
    if (!this.nodes.has(this.app.selectedKey)) this.app.selectedKey = null;
    this.updateDetails(); this.draw();
  }
  select(key) {
    if (!this.nodes.has(key)) return;
    this.app.selectedKey = key; this.updateDetails(); this.draw();
  }
  updateDetails() {
    const node = this.nodes.get(this.app.selectedKey), root = this.root;
    root.querySelector("[data-library-inspect-help]").hidden = !!node;
    root.querySelector("[data-library-details]").hidden = !node;
    if (!node) return;
    root.querySelector("[data-library-selected-name]").textContent = node.type === "aether" ? `${node.name} · ${t("Level")} ${node.level}` : node.name;
    root.querySelector("[data-library-rule]").textContent = node.rule;
    const list = (selector, edges, incoming) => {
      const host = root.querySelector(selector); host.replaceChildren();
      for (const edge of edges) {
        const target = this.nodes.get(incoming ? edge.from : edge.to), button = document.createElement("button");
        button.type = "button"; button.dataset.librarySelect = target.key;
        button.className = edge.kind === "forbidden" ? "da-forbidden-link" : "";
        button.textContent = `${edge.kind === "forbidden" ? `${t("LibraryForbiddenLink")}: ` : ""}${target.name}`;
        host.append(button);
      }
      if (!edges.length) { const empty = document.createElement("span"); empty.textContent = t("LibraryNoLinks"); host.append(empty); }
    };
    list("[data-library-incoming]", this.graph.edges.filter(edge => edge.to === node.key), true);
    list("[data-library-outgoing]", this.graph.edges.filter(edge => edge.from === node.key), false);
    for (const button of root.querySelectorAll("[data-library-node] [data-library-select]")) button.setAttribute("aria-pressed", String(button.dataset.librarySelect === node.key));
  }
  draw() {
    const root = this.root, svg = root?.querySelector(".da-connections"); if (!svg) return;
    svg.querySelectorAll("path[data-link-kind]").forEach(path => path.remove());
    const key = this.hoverKey ?? this.focusKey ?? this.app.selectedKey;
    const edges = this.graph.edges.filter(edge => this.app.showAllConnections || edge.from === key || edge.to === key);
    const related = new Set(edges.flatMap(edge => [edge.from, edge.to]));
    const domNodes = new Map([...root.querySelectorAll("[data-library-node]")].map(node => [node.dataset.libraryNode, node]));
    for (const [id, node] of domNodes) {
      node.classList.toggle("da-library-selected", id === this.app.selectedKey);
      node.classList.toggle("da-library-related", related.has(id));
      node.classList.toggle("da-library-dim", !!key && !this.app.showAllConnections && id !== key && !related.has(id));
    }
    const bounds = root.querySelector(".da-network").getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    for (const edge of edges) {
      const source = domNodes.get(edge.from)?.querySelector("[data-library-select]"), target = domNodes.get(edge.to)?.querySelector("[data-library-select]");
      if (!source || !target) continue;
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x1 = a.right - bounds.left, y1 = a.top + a.height / 2 - bounds.top, x2 = b.left - bounds.left, y2 = b.top + b.height / 2 - bounds.top;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1},${y1} C ${x1+24},${y1} ${x2-24},${y2} ${x2},${y2}`);
      path.dataset.linkKind = edge.kind; path.dataset.from = edge.from; path.dataset.to = edge.to;
      const marker = edge.kind === "forbidden" ? "da-library-block" : "da-library-arrow";
      path.setAttribute("marker-end", `url(#${this.app.linkId}-${marker})`); svg.append(path);
    }
  }
  dispose() { this.abort?.abort(); this.resize?.disconnect(); this.root = null; }
}
