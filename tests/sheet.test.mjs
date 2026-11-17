import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import Handlebars from "handlebars";
import { Actor, Power, setup, configure } from "./helpers.mjs";
import { DEFAULT_ICON, ID } from "../scripts/constants.js";
import { imagePath } from "../scripts/images.js";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.document = dom.window.document;
globalThis.AbortController = dom.window.AbortController;
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
let listenerCalls = 0, closed = 0;
class BaseApplication { activateListeners() {} get element() { return this._element; } static get defaultOptions() { return { classes: ["swade-official","sheet","actor"], tabs: [{ initial: "summary" }], width: 700 }; } }
class BaseForm extends BaseApplication {}
globalThis.foundry = { appv1: { api: { Application: BaseApplication, FormApplication: BaseForm }, sheets: { ActorSheet: class {} } }, utils: { mergeObject: (a,b) => ({...a,...b}) }, applications: { handlebars: {}, ux: { ContextMenu: { implementation: class { close() {} } } } } };
const { createDominionSheet } = await import("../scripts/sheet.js");
const { PowerGraphRenderer } = await import("../scripts/graph.js");
const { PowerRequirementApp } = await import("../scripts/apps/power-requirements.js");
const { ElementEditorApp } = await import("../scripts/apps/element-manager.js");
const { ElementManagerApp } = await import("../scripts/apps/element-manager.js");
const { GlobalLibraryApp } = await import("../scripts/apps/global-library.js");
const { buildLibraryGraph } = await import("../scripts/library-graph.js");
const english = JSON.parse(await fs.readFile(new URL("../lang/en.json",import.meta.url),"utf8"));
const translate = key => key.split(".").reduce((obj,part) => obj?.[part],english) ?? key;
Handlebars.registerHelper("localize",translate);
Handlebars.registerHelper("checked",value => value ? "checked" : "");
Handlebars.registerHelper("concat",(...args) => args.slice(0,-1).join(""));
Handlebars.registerHelper("eq",(a,b) => a === b);
Handlebars.registerHelper("ifThen",(value,a,b) => value ? a : b);
Handlebars.registerPartial("swade.npc-action-card","<div class='system-action-card'>system-owned actions</div>");
foundry.applications.handlebars.renderTemplate = async (path,data) => {
  const local = path.startsWith("systems/swade/") ? `.reference/runtime/${path.slice("systems/swade/".length)}` : path.replace("modules/dominion-aetherics-sheet/","");
  return Handlebars.compile(await fs.readFile(local,"utf8"))(data);
};
const { report } = await import("../scripts/constants.js");
const errors = [];
globalThis.ui = { notifications: { error: msg => errors.push(msg), warn: msg => errors.push(msg), info: () => {} } };

async function original(data) {
  const html = document.createElement("form"); html.className = "main-grid";
  html.innerHTML = `<header data-header-control="other-module"><input name="name" value="Original character"></header><nav class="tabs" data-group="primary"><a data-tab="summary"></a><a data-tab="powers"></a><a data-tab="effects"></a></nav><main class="sheet-body"><section class="tab" data-tab="summary"><button data-other-module="traits">Trait</button></section><section class="tab powers" data-tab="powers"></section><section class="tab" data-tab="effects">Original effects</section><section class="tab" data-tab="inventory">Original inventory</section></main>`;
  html.querySelector('section[data-tab="powers"]').innerHTML = await foundry.applications.handlebars.renderTemplate("systems/swade/templates/actors/character/tabs/powers.hbs",data);
  return html;
}
function dataFor(actor) {
  return { actor, powers: { showGeneral: true, hasPowersWithoutArcane: true, arcaneBackgrounds: { general: { powers: [...actor.items] }, Magic: { valuePath: "system.powerPoints.Magic.value", maxPath:"system.powerPoints.Magic.max",value:5,max:10,powers:[] } } }, settingrules:{ noPowerPoints:false } };
}
function setupDOM() {
  const services = setup(); game.i18n.localize = translate;
  const actor = new Actor(); actor.name = "Original character";
  return { services, actor };
}
class OfficialSheet extends BaseApplication {
  constructor(actor) { super(); this.actor = actor; this.isEditable = true; }
  get template() { return "systems/swade/templates/actors/character/sheet.hbs"; }
  _getHeaderButtons() { return ["system-tweak","other-module-control"]; }
  async _renderInner(data) { return [await original(data)]; }
  activateListeners() { listenerCalls++; }
  async close() { closed++; }
}

test("uses actual distributed SWADE 5.1.0 template, keeps PP/add/header/other tabs unchanged", async () => {
  const manifest = JSON.parse(await fs.readFile(".reference/runtime/system.json","utf8")); assert.equal(manifest.version,"5.1.0");
  const { services, actor } = setupDOM(); const item = new Power(actor); const data = dataFor(actor), before = await original(data);
  const OriginalClass = createDominionSheet(OfficialSheet, services); const sheet = new OriginalClass(actor); const root = (await sheet._renderInner(data))[0];
  assert.equal(sheet.template,new OfficialSheet(actor).template);
  assert.deepEqual(sheet._getHeaderButtons(),["system-tweak","other-module-control"]);
  for (const selector of ['[data-header-control]', 'section[data-tab="summary"]', 'section[data-tab="inventory"]', 'section[data-tab="effects"]']) assert.equal(root.querySelector(selector).outerHTML,before.querySelector(selector).outerHTML);
  const controlSelectors = [".item-create",'[name="system.powerPoints.general.value"]','[name="system.powerPoints.general.max"]','[name="system.powerPoints.Magic.value"]','[name="system.powerPoints.Magic.max"]','.adjust-counter[data-arcane="general"]'];
  for (const selector of controlSelectors) assert.equal(root.querySelector(selector).outerHTML,before.querySelector(selector).outerHTML);
  assert.equal(root.querySelectorAll(".da-power").length,1); assert.equal(root.querySelectorAll('li.power.item').length,0);
  assert.ok(root.querySelector('.da-unconfigured .da-power-icon').disabled);
  assert.equal(OfficialSheet.defaultOptions.classes.includes("dominion-aetherics-sheet"),false);
  assert.ok(OriginalClass.defaultOptions.classes.includes("swade-official"));
  sheet.activateListeners([root]); assert.equal(listenerCalls,1);
  await sheet.close(); assert.equal(closed,1);
});
test("new character without SWADE powers tab gets a local Powers tab using the installed partial", async () => {
  const { services, actor } = setupDOM(); const data = dataFor(actor); const root = await original(data);
  root.querySelector('section[data-tab="powers"]').remove(); root.querySelector('nav [data-tab="powers"]').remove();
  const graph = new PowerGraphRenderer({ actor, isEditable:true },services); await graph.prepare(root,data);
  assert.equal(root.querySelectorAll('section[data-tab="powers"]').length,1); assert.equal(root.querySelectorAll('nav [data-tab="powers"]').length,1);
  assert.ok(root.querySelector('.item-create[data-type="power"]')); assert.ok(root.querySelector('.da-graph'));
});
test("available node opens SWADE Tools once without a system card; stale locked nodes cannot cast", async () => {
  const { services, actor } = setupDOM(); const item = new Power(actor); await configure(item,[["H"]]); await services.selections.set(actor,["H"]);
  let shows = 0, dialogs = 0; item.show = async () => { shows++; };
  game.modules.set("swade-tools", {active:true});
  game.swadetools={item:async (receivedActor,id)=>{assert.equal(receivedActor,actor);assert.equal(id,item.id);dialogs++;}};
  const Sheet = createDominionSheet(OfficialSheet,services); const sheet = new Sheet(actor); const root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
  const use = root.querySelector('[data-da-action="use"]'); assert.equal(use.disabled,false);
  use.click(); await new Promise(resolve => setTimeout(resolve,5)); assert.equal(dialogs,1); assert.equal(shows,0);
  await services.selections.set(actor,[]); use.click(); await new Promise(resolve => setTimeout(resolve,5)); assert.equal(dialogs,1); assert.equal(shows,0);
  await sheet.close();
});
for (const wildcard of [false, true]) {
  test(`NPC ${wildcard ? "Wild Card" : "Extra"} renders the graph and retains official controls`, async () => {
    const { services, actor } = setupDOM(); actor.type = "npc"; actor.system.wildcard = wildcard;
    const systemBefore = structuredClone(actor.system), item = new Power(actor);
    await configure(item, [["H"]]); await services.selections.set(actor, ["H"]);
    const data = dataFor(actor), before = await original(data);
    const Sheet = createDominionSheet(OfficialSheet, services), sheet = new Sheet(actor);
    const root = (await sheet._renderInner(data))[0];
    assert.ok(root.querySelector(".da-graph"));
    assert.equal(root.querySelectorAll(".da-power").length, 1);
    for (const selector of ['.item-create[data-type="power"]', '[name="system.powerPoints.general.value"]', '[name="system.powerPoints.general.max"]', 'section[data-tab="effects"]', '[data-header-control]']) {
      assert.equal(root.querySelector(selector).outerHTML, before.querySelector(selector).outerHTML);
    }
    let dialogs = 0;
    game.modules.set("swade-tools", { active: true });
    game.swadetools = { item: (sourceActor, id) => { assert.equal(sourceActor, actor); assert.equal(id, item.id); dialogs++; } };
    item.show = () => { throw new Error("System card must not open"); };
    sheet.activateListeners([root]); root.querySelector('[data-da-action="use"]').click();
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(dialogs, 1); assert.equal(actor.type, "npc"); assert.deepEqual(actor.system, systemBefore);
    await sheet.close();
  });
}
test("owners can select elements, read-only viewers cannot and no new Actor form fields are introduced", async () => {
  const { services, actor } = setupDOM(); const root = await original(dataFor(actor)); const graph = new PowerGraphRenderer({ actor,isEditable:false },services); await graph.prepare(root,dataFor(actor)); graph.bind();
  assert.ok([...root.querySelectorAll('.da-element')].every(button => button.disabled));
  assert.equal(root.querySelectorAll('.da-graph [name]').length,0);
  graph.dispose();
});
test("repeated renders do not accumulate event listeners", async () => {
  const { services,actor } = setupDOM(); const Sheet = createDominionSheet(OfficialSheet,services); const sheet = new Sheet(actor);
  let previous;
  for (let i=0;i<4;i++) {
    const root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
    if (previous) { previous.querySelector('[data-element-id="H"]').click(); await new Promise(resolve=>setTimeout(resolve,5)); assert.equal(actor.updates.length,0); }
    previous = root;
  }
  previous.querySelector('[data-element-id="H"]').click(); await new Promise(resolve=>setTimeout(resolve,20)); assert.equal(actor.updates.length,1);
  await sheet.close();
});
test("requirement editor reads OR recipes, forbidden and exact controls without JSON", async () => {
  const { services,actor } = setupDOM(); const item = new Power(actor); const app = new PowerRequirementApp(services,item);
  const rendered = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/power-requirements.hbs",app.getData());
  const host = document.createElement("div"); host.innerHTML=rendered; app.form=host.querySelector("form");
  app.form.querySelector('[name="configured"]').checked=true;
  app.form.querySelector('[data-element-id="H"]').checked=true;
  app.form.querySelector('[data-element-id="O"]').checked=true;
  app.form.querySelector('[data-forbidden-id="Fe"]').checked=true;
  app.form.querySelector('[name="exact"]').checked=true;
  await app._updateObject();
  assert.deepEqual(services.requirements.get(item),{schemaVersion:1,recipes:[["H","O"]],forbidden:["Fe"],exact:true});
});
test("editor exposes AND/OR with a live preview and persists either element as an alternative", async () => {
  const {services,actor}=setupDOM(); const item=new Power(actor); const app=new PowerRequirementApp(services,item);
  const rendered=await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/power-requirements.hbs",app.getData());
  const root=document.createElement("div"); root.innerHTML=rendered; app.form=root.querySelector("form"); app.activateListeners([root]);
  const change=()=>root.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
  app.form.querySelector('[name="configured"]').checked=true;
  for(const id of ["H","O"])app.form.querySelector(`[data-element-id="${id}"]`).checked=true;
  change(); assert.match(root.querySelector('[data-requirement-preview]').textContent,/H AND O/);
  app.form.querySelector('[data-recipe-mode]').value="any"; change();
  assert.match(root.querySelector('[data-requirement-preview]').textContent,/H OR O/);
  await app._updateObject(); assert.deepEqual(services.requirements.get(item).recipes,[["H"],["O"]]);
  await services.selections.set(actor,["H"]); assert.equal(services.requirements.evaluate(actor,item).available,true);
  await services.selections.set(actor,["O"]); assert.equal(services.requirements.evaluate(actor,item).available,true);
  await services.selections.set(actor,[]); assert.equal(services.requirements.evaluate(actor,item).available,false);
  const reopened=new PowerRequirementApp(services,item); assert.equal(reopened.getData().recipes[0].isAny,true);
  root.querySelector('[data-add-recipe]').click(); assert.equal(root.querySelectorAll('[data-recipe]').length,2);
  root.querySelectorAll('[data-remove-recipe]')[1].click(); assert.equal(root.querySelectorAll('[data-recipe]').length,1);
});
test("element editor saves structured descriptions and preserves the Application.element getter", async () => {
  const { services } = setupDOM(); game.actors=[]; game.items=[]; foundry.utils.randomID=()=>"NewElement";
  const app=new ElementEditorApp(services);
  const rendered=await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/element-editor.hbs",app.getData());
  const host=document.createElement("div"); host.innerHTML=rendered; app.form=host.querySelector("form");
  app.activateListeners=ElementEditorApp.prototype.activateListeners;
  const row=app.form.querySelector('template[data-passive-template]').content.cloneNode(true);
  row.querySelector('[data-passive-title]').value="Resistance"; row.querySelector('[data-passive-description]').value="Cold";
  app.form.querySelector('[data-passive-list]').append(row);
  await app._updateObject(null,{name:"Hydrogen",icon:"icons/svg/atom.svg",symbol:"H",description:"Chemical element",order:2});
  const saved=services.registry.get().find(e=>e.id==="NewElement");
  assert.equal(saved.name,"Hydrogen"); assert.deepEqual(saved.passives,[{title:"Resistance",description:"Cold"}]);
  assert.equal(app.element,undefined);
});
test("incompatible Powers DOM restores the full original render", async () => {
  const { services,actor } = setupDOM(); let calls=0;
  class BrokenTemplate extends OfficialSheet { async _renderInner() { calls++; const form=document.createElement("form"); form.innerHTML='<nav class="tabs" data-group="primary"></nav><main class="sheet-body"><section data-tab="powers" class="tab">Unexpected third-party markup</section></main>'; return [form]; } }
  const Sheet=createDominionSheet(BrokenTemplate,services); const sheet=new Sheet(actor);
  const originalConsole=console.error; console.error=()=>{};
  try { const root=(await sheet._renderInner(dataFor(actor)))[0]; assert.match(root.textContent,/Unexpected third-party markup/); assert.equal(calls,2); assert.equal(root.querySelector('.da-graph'),null); }
  finally { console.error=originalConsole; }
});

test("rerender skips unopened context menus and awaits an open menu's non-animated close exactly once", async () => {
  const { services, actor } = setupDOM(); new Power(actor);
  let closes = 0, closeFinished = false;
  const previous = foundry.applications.ux.ContextMenu.implementation;
  foundry.applications.ux.ContextMenu.implementation = class {
    async close(options) {
      closes++;
      assert.equal(options.animate, false); assert.equal(options.target, this.target);
      if (!this.element) throw new TypeError("Cannot read properties of undefined (reading getBoundingClientRect)");
      await new Promise(resolve => setTimeout(resolve, 5)); this.element.remove(); closeFinished = true;
    }
  };
  const Sheet = createDominionSheet(OfficialSheet, services), sheet = new Sheet(actor);
  try {
    let root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
    root = (await sheet._renderInner(dataFor(actor)))[0]; assert.equal(closes, 0); sheet.activateListeners([root]);
    const graph = sheet._dominionGraph; graph.menu.target = root.querySelector("[data-power-id]"); graph.menu.element = document.createElement("menu"); document.body.append(graph.menu.element);
    await sheet._renderInner(dataFor(actor)); assert.equal(closes, 1); assert.equal(closeFinished, true);
    await graph.dispose(); assert.equal(closes, 1);
  } finally { await sheet.close(); foundry.applications.ux.ContextMenu.implementation = previous; }
});

test("dispose never closes a different window's context menu and handles close rejection", async () => {
  const { services, actor } = setupDOM(); const graph = new PowerGraphRenderer({ actor }, services);
  graph.root = document.createElement("div"); let calls = 0;
  graph.menu = { target: document.createElement("button"), element: document.createElement("menu"), close: () => { calls++; } };
  await graph.dispose(); assert.equal(calls, 0);
  graph.root = document.createElement("div"); const target = document.createElement("button"); graph.root.append(target);
  graph.menu = { target, element: document.createElement("menu"), close: async () => { throw new Error("custom-menu-rejected"); } };
  const previous = console.error, before = errors.length; console.error = () => {};
  try { await assert.doesNotReject(graph.dispose()); assert.equal(errors.length, before + 1); }
  finally { console.error = previous; }
});

test("graph displays only the Actor's assigned elements and provides separate library/assignment buttons", async () => {
  const { services, actor } = setupDOM(); actor.flags[ID].assignedElements = ["H"];
  let managerActor, libraryActor; services.openManager = actor => { managerActor = actor; }; services.openLibrary = actor => { libraryActor = actor; };
  const Sheet = createDominionSheet(OfficialSheet, services), sheet = new Sheet(actor);
  const root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
  assert.deepEqual([...root.querySelectorAll(".da-element")].map(button => button.dataset.elementId), ["H"]);
  root.querySelector('[data-da-action="manager"]').click(); root.querySelector('[data-da-action="library"]').click();
  assert.equal(managerActor, actor); assert.equal(libraryActor, actor);
  await sheet.close();
});

test("Element Manager saves grants only to its target and Global Library keeps all definitions", async () => {
  const { services, actor } = setupDOM(); actor.flags[ID].assignedElements = [];
  const other = new Actor("Actor.Other"); const before = structuredClone(other.flags);
  const app = new ElementManagerApp(services, actor);
  const markup = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/element-manager.hbs", app.getData());
  const root = document.createElement("div"); root.innerHTML = markup; app.form = root.querySelector("form");
  app.form.querySelector('[data-assigned-id="H"]').checked = true; await app._updateObject();
  assert.deepEqual(services.assignments.getIds(actor), ["H"]); assert.deepEqual(other.flags, before);
  const library = new GlobalLibraryApp(services, actor); const data = library.getData();
  assert.equal(data.elements.length, 4); assert.equal(data.hasActor, true);
  const rendered = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/global-library.hbs", data);
  assert.match(rendered, /data-library-action="create-element"/); assert.match(rendered, /data-library-action="create-power"/);
});

test("legacy atom icon and missing images get a bundled display fallback without editing document data", async () => {
  const { services, actor } = setupDOM(); const item = new Power(actor); item.img = "assets/dominion/direktuvar/disciple-test.jpg";
  const before = item.img, Sheet = createDominionSheet(OfficialSheet, services), sheet = new Sheet(actor);
  const root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
  assert.equal(root.querySelector(".da-element img").getAttribute("src"), DEFAULT_ICON);
  const image = root.querySelector(".da-power img"); image.dispatchEvent(new dom.window.Event("error"));
  assert.equal(image.getAttribute("src"), DEFAULT_ICON); assert.equal(item.img, before); assert.equal(imagePath(before), DEFAULT_ICON);
  image.dispatchEvent(new dom.window.Event("error")); assert.equal(image.getAttribute("src"), DEFAULT_ICON);
  await sheet.close();
});

test("Global Library controls create global Powers and add them only to the contextual Actor", async () => {
  const { services, actor } = setupDOM(); const app = new GlobalLibraryApp(services, actor);
  let createName, addedActor, addedPower, renders = 0;
  const power = { id: "global-power", name: "Global Water", documentName: "Item", type: "power", img: DEFAULT_ICON, actor: null, getFlag: () => undefined, testUserPermission: () => true };
  game.items.push(power);
  services.powerLibrary.create = async name => { createName = name; return { sheet: { render: () => { renders++; } } }; };
  services.powerLibrary.addToActor = async (target, item) => { addedActor = target; addedPower = item; };
  app.render = () => { renders++; return app; };
  const markup = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/global-library.hbs", app.getData());
  const root = document.createElement("div"); root.innerHTML = markup; app.activateListeners([root]);
  root.querySelector("[data-power-name]").value = "Water Template";
  root.querySelector('[data-library-action="create-power"]').click();
  await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(createName, "Water Template");
  root.querySelector('[data-library-action="add-power"]').click();
  await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(addedActor, actor); assert.equal(addedPower, power);
  assert.ok(root.querySelector('.da-network .da-power-groups')); assert.ok(renders >= 2);
  app.graph.dispose();
});

async function libraryFixture(actorContext = true) {
  const { services, actor } = setupDOM(); actor.flags[ID].assignedElements = [];
  await services.registry.save({ id: "C", name: "Clay", level: 2, prerequisites: { mode: "any", ids: ["H", "O"] }, passives: [], effects: [] });
  await services.registry.save({ id: "Fe", name: "Warden", level: 3, prerequisites: { mode: "all", ids: ["H", "C"] }, passives: [], effects: [] });
  const power = new Power(actor, "H"); power.actor = null; power.name = "Clay Power"; power.testUserPermission = () => true; game.items.push(power);
  await configure(power, [["C"]], { forbidden: ["O"], exact: false });
  const app = new GlobalLibraryApp(services, actorContext ? actor : null), root = document.createElement("div");
  root.innerHTML = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/global-library.hbs", app.getData());
  app.activateListeners([root]);
  root.querySelector(".da-network").getBoundingClientRect = () => ({ width: 1100, height: 400, left: 0, top: 0 });
  return { services, actor, power, app, root };
}

test("library graph includes the whole catalog in tier columns and world Powers with required/forbidden links", async () => {
  const { services, actor, app, root } = await libraryFixture();
  assert.deepEqual([...root.querySelectorAll('[data-aether-level]')].map(node => node.dataset.aetherLevel), ["1", "2", "3", "4"]);
  assert.equal(root.querySelectorAll('.da-tier [data-library-node]').length, 4);
  assert.equal(root.querySelectorAll('.da-power-groups [data-library-node]').length, 1);
  assert.deepEqual(services.assignments.getIds(actor), []);
  const graph = buildLibraryGraph(services);
  assert.ok(graph.edges.some(edge => edge.from === "aether:C" && edge.to === "power:H" && edge.kind === "required"));
  assert.ok(graph.edges.some(edge => edge.from === "aether:O" && edge.to === "power:H" && edge.kind === "forbidden"));
  assert.ok(graph.edges.some(edge => edge.from === "aether:C" && edge.to === "aether:Fe"));
  assert.match(graph.elements.find(node => node.id === "C").rule, /H OR O/);
  assert.match(graph.elements.find(node => node.id === "Fe").rule, /H AND Clay/);
  assert.equal(root.querySelectorAll('[data-library-action="add-power"]').length, 1);
  app.graph.dispose();
});

test("library inspection pins incoming/outgoing links including inactive Aethers without mutating any Actor", async () => {
  const { actor, power, app, root } = await libraryFixture();
  const before = structuredClone({ flags: actor.flags, system: actor.system, powerFlags: power.flags });
  root.querySelector('[data-library-node="aether:C"] [data-library-select]').click();
  assert.equal(app.selectedKey, "aether:C");
  assert.match(root.querySelector('[data-library-rule]').textContent, /H OR O/);
  assert.match(root.querySelector('[data-library-outgoing]').textContent, /Warden/);
  assert.match(root.querySelector('[data-library-outgoing]').textContent, /Clay Power/);
  assert.equal(root.querySelectorAll('path[data-link-kind]').length, 4);
  root.querySelector('[data-library-outgoing] [data-library-select="power:H"]').click();
  assert.equal(app.selectedKey, "power:H"); assert.match(root.querySelector('[data-library-incoming]').textContent, /Forbidden: O/);
  assert.equal(root.querySelectorAll('path[data-link-kind="forbidden"]').length, 1);
  assert.equal(root.querySelector('[data-library-node="power:H"] [data-library-select]').getAttribute("aria-pressed"), "true");
  assert.equal(actor.updates.length, 0); assert.equal(actor.effects.length, 0);
  assert.deepEqual({ flags: actor.flags, system: actor.system, powerFlags: power.flags }, before);
  app.graph.dispose();
});

test("world library has no copy-to-Actor action; all-links preference survives rerender and stale listeners stop", async () => {
  const { app, root } = await libraryFixture(false);
  assert.equal(root.querySelectorAll('[data-library-action="add-power"]').length, 0);
  const all = root.querySelector('[data-library-all-links]'); all.checked = true; all.dispatchEvent(new dom.window.Event("change"));
  assert.equal(app.showAllConnections, true); assert.equal(root.querySelectorAll('path[data-link-kind]').length, 6);
  assert.equal(app.getData().showAllConnections, true);
  app.graph.dispose();
  root.querySelector('[data-library-node="aether:C"] [data-library-select]').click(); assert.equal(app.selectedKey, null);
});

test("four ordered Active Aether columns retain the separate Power area and gate higher nodes", async () => {
  const { services, actor } = setupDOM();
  await services.registry.save({ id: "C", name: "Clay", icon: DEFAULT_ICON, level: 2, prerequisites: { mode: "all", ids: ["H"] }, passives: [], effects: [] });
  await services.registry.save({ id: "Fe", name: "Armor", icon: DEFAULT_ICON, level: 3, prerequisites: null, passives: [], effects: [] });
  new Power(actor);
  const Sheet = createDominionSheet(OfficialSheet, services), sheet = new Sheet(actor);
  let root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
  assert.deepEqual([...root.querySelectorAll("[data-aether-level]")].map(column => column.dataset.aetherLevel), ["1", "2", "3", "4"]);
  assert.ok(root.querySelector('[data-aether-level="2"] [data-element-id="C"]'));
  assert.equal(root.querySelector('[data-element-id="C"]').disabled, true);
  assert.equal(root.querySelector('[data-element-id="Fe"]').disabled, false);
  assert.equal(root.querySelector(".da-network").lastElementChild.className, "da-power-groups");
  assert.equal(root.querySelectorAll('.da-tier [data-power-id]').length, 0);
  await services.selections.set(actor, ["H"]);
  root = (await sheet._renderInner(dataFor(actor)))[0]; sheet.activateListeners([root]);
  assert.equal(root.querySelector('[data-element-id="C"]').disabled, false);
  await sheet.close();
});

test("Active Aether editor saves level and optional lower-level AND/OR prerequisites", async () => {
  const { services } = setupDOM();
  await services.registry.save({ id: "C", name: "Clay", level: 2, prerequisites: null, passives: [], effects: [] });
  const definition = { id: "Upper", name: "Upper", icon: DEFAULT_ICON, level: 3, prerequisites: null, passives: [], effects: [] };
  const app = new ElementEditorApp(services, definition);
  const markup = await foundry.applications.handlebars.renderTemplate("modules/dominion-aetherics-sheet/templates/element-editor.hbs", app.getData());
  const root = document.createElement("div"); root.innerHTML = markup; app.form = root.querySelector("form"); app.activateListeners([root]);
  const enabled = root.querySelector('[name="hasPrerequisites"]'); enabled.checked = true; enabled.dispatchEvent(new dom.window.Event("change"));
  for (const id of ["H", "C"]) root.querySelector(`[data-prerequisite-id="${id}"]`).checked = true;
  root.querySelector('[name="prerequisiteMode"]').value = "all";
  await app._updateObject(null, { name: "Upper", icon: DEFAULT_ICON, level: "3", order: 0 });
  assert.deepEqual(services.registry.get().find(e => e.id === "Upper").prerequisites, { mode: "all", ids: ["H", "C"] });
  root.querySelector('[name="prerequisiteMode"]').value = "any";
  await app._updateObject(null, { name: "Upper", icon: DEFAULT_ICON, level: "3", order: 0 });
  assert.equal(services.registry.get().find(e => e.id === "Upper").prerequisites.mode, "any");
  enabled.checked = false;
  await app._updateObject(null, { name: "Upper", icon: DEFAULT_ICON, level: "4", order: 0 });
  const saved = services.registry.get().find(e => e.id === "Upper"); assert.equal(saved.level, 4); assert.equal(saved.prerequisites, null);
});
