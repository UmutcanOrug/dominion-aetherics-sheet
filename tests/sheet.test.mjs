import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import Handlebars from "handlebars";
import { Actor, Power, setup, configure } from "./helpers.mjs";

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
