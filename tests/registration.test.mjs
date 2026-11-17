import test from "node:test";
import assert from "node:assert/strict";
import { setup, Actor, Effect, element, source } from "./helpers.mjs";
import { ID } from "../scripts/constants.js";

async function boot(tag, definitions) {
  const { values }=setup(definitions); const callbacks=new Map(), registrations=[], settings=new Map(), menus=new Map(), events=new Map();
  globalThis.Hooks={ once:(name,fn)=>callbacks.set(name,fn), on:(name,fn)=>events.set(name,fn) };
  class ActorSheet {};
  class CharacterSheet extends ActorSheet {};
  class App { render(force) { this.rendered = force; return this; } };
  globalThis.foundry={appv1:{api:{Application:App,FormApplication:App},sheets:{ActorSheet}},applications:{apps:{DocumentSheetConfig:{registerSheet:(...args)=>registrations.push(args)}}}};
  const officialDefaults={character:"swade.CharacterSheet",npc:"swade.SwadeNPCSheet"};
  globalThis.CONFIG={Actor:{documentClass:Actor,sheetClasses:officialDefaults}};
  globalThis.ui={notifications:{error:()=>{}},windows:{}};
  const module={}; game.modules=new Map([["dominion-aetherics-sheet",module]]); game.swade={sheets:{CharacterSheet}}; game.system={id:"swade",version:"5.1.0"}; game.release={generation:13};
  game.actors=[]; game.scenes=[];
  game.settings.register=(_id,key,options)=>{ settings.set(key,options); if(!values.has(key)) values.set(key,options.default); };
  game.settings.registerMenu=(_id,key,options)=>menus.set(key,options);
  await import(`../scripts/main.js?test=${tag}`);
  callbacks.get("init")();
  return {values,callbacks,registrations,settings,menus,events,module,CharacterSheet,officialDefaults};
}

async function until(predicate) {
  for(let i=0;i<100;i++) {
    if(predicate())return;
    await new Promise(resolve=>setTimeout(resolve,5));
  }
  assert.ok(predicate(),"Background NPC reconciliation did not finish");
}

test("registration is opt-in for characters and NPCs and preserves all official defaults", async () => {
  const {registrations,callbacks,module,CharacterSheet,officialDefaults}=await boot("registration");
  assert.equal(registrations.length,1);
  const [document,scope,Sheet,options]=registrations[0];
  assert.equal(document,Actor); assert.equal(scope,"dominion-aetherics-sheet"); assert.ok(Sheet.prototype instanceof CharacterSheet);
  assert.deepEqual(options.types,["character","npc"]); assert.equal(options.makeDefault,false);
  assert.deepEqual(CONFIG.Actor.sheetClasses,{character:"swade.CharacterSheet",npc:"swade.SwadeNPCSheet"});
  assert.equal(CONFIG.Actor.sheetClasses,officialDefaults);
  assert.ok(Object.isFrozen(module.api)); assert.equal(typeof module.api.setActiveElements,"function");
  assert.equal(typeof module.api.openGlobalLibrary,"function");assert.equal(typeof module.api.setAssignedElements,"function");
  const actor=new Actor("Actor.Fresh",{assigned:[]});actor.flags={};
  assert.deepEqual(module.api.getAssignedElements(actor),[]);
  await module.api.setAssignedElements(actor,["H"]);await module.api.setActiveElements(actor,["H"]);
  assert.deepEqual(module.api.getActiveElements(actor),["H"]);
  await assert.rejects(module.api.setActiveElements(actor,["O"]),/ElementNotAssigned/);
  game.user.isGM=false;assert.throws(()=>module.api.setAssignedElements(actor,["O"]),/GMOnly/);game.user.isGM=true;
  game.system.version="5.2.0"; callbacks.get("init")(); assert.equal(registrations.length,1);
});

test("ready and registry changes reconcile NPC Extras and unlinked NPC Wild Cards independently",async()=>{
  const {values,callbacks,settings,events}=await boot("npc-reconciliation",[element("H",[source()]),element("O")]);
  const npc=new Actor("Actor.NPC");npc.type="npc";npc.system.wildcard=false;
  const base=new Actor("Actor.BaseNPC");base.type="npc";base.system.wildcard=true;
  const synthetic=new Actor("Scene.S.Token.T.Actor.BaseNPC");synthetic.type="npc";synthetic.system.wildcard=true;synthetic.isToken=true;
  const untouched=new Actor("Actor.UntouchedNPC");untouched.type="npc";untouched.flags={};
  const vehicle=new Actor("Actor.Vehicle");vehicle.type="vehicle";
  const unrelated=new Effect({id:"unrelated",name:"Unrelated"});npc.effects.push(unrelated);
  for(const actor of [npc,synthetic,vehicle])actor.flags[ID]={schemaVersion:1,activeElements:["H","deleted"]};
  base.flags[ID]={schemaVersion:1,assignedElements:["O"],activeElements:["O"]};
  const token={actorLink:false,actor:synthetic};
  game.actors=[npc,base,untouched,vehicle];game.scenes=[{tokens:[token]}];
  callbacks.get("ready")();
  await until(()=>npc.effects.length===2&&synthetic.effects.length===1);
  assert.deepEqual(npc.flags[ID].activeElements,["H"]);assert.deepEqual(synthetic.flags[ID].activeElements,["H"]);
  assert.deepEqual(npc.flags[ID].assignedElements,["H"]);assert.deepEqual(synthetic.flags[ID].assignedElements,["H"]);
  assert.deepEqual(base.flags[ID].activeElements,["O"]);assert.equal(base.updates.length,0);assert.equal(base.effects.length,0);
  assert.equal(untouched.updates.length,0);assert.equal(untouched.getFlag(ID,"activeElements"),undefined);
  assert.equal(vehicle.updates.length,0);assert.deepEqual(vehicle.flags[ID].activeElements,["H","deleted"]);
  values.set("elements",{schemaVersion:1,elements:[element("O")]});settings.get("elements").onChange();
  await until(()=>npc.effects.length===1&&synthetic.effects.length===0);
  assert.equal(npc.effects[0],unrelated);assert.deepEqual(npc.flags[ID].activeElements,[]);assert.deepEqual(synthetic.flags[ID].activeElements,[]);
  values.set("elements",{schemaVersion:1,elements:[element("H",[source()]),element("O")]});
  npc.flags[ID].assignedElements=["H"];npc.flags[ID].activeElements=["H"];events.get("updateActor")(npc,{flags:{[ID]:{activeElements:["H"]}}});
  synthetic.flags[ID].assignedElements=["H"];synthetic.flags[ID].activeElements=["H"];events.get("updateToken")(token);
  await until(()=>npc.effects.length===2&&synthetic.effects.length===1);
  assert.equal(base.effects.length,0);assert.equal(base.updates.length,0);
});

test("world prerequisite edits reconcile stored upper-level selections and effects", async () => {
  const h = { ...element("H"), level: 1 }, o = { ...element("O"), level: 1 };
  const c = { ...element("C", [source()]), level: 2, prerequisites: { mode: "all", ids: ["H"] } };
  const { values, callbacks, settings } = await boot("aether-prerequisite-reconciliation", [h, o, c]);
  const actor = new Actor("Actor.NPC"); actor.type = "npc";
  actor.flags[ID] = { schemaVersion: 1, assignedElements: ["H", "O", "C"], activeElements: ["H", "C"] };
  game.actors = [actor]; callbacks.get("ready")(); await until(() => actor.effects.length === 1);
  values.set("elements", { schemaVersion: 1, elements: [h, o, { ...c, prerequisites: { mode: "all", ids: ["H", "O"] } }] });
  settings.get("elements").onChange();
  await until(() => actor.effects.length === 0 && actor.flags[ID].activeElements.length === 1);
  assert.deepEqual(actor.flags[ID].activeElements, ["H"]); assert.deepEqual(actor.flags[ID].assignedElements, ["H", "O", "C"]);
});

test("Configure Settings opens the GM-only world library through the existing API without Actor context", async () => {
  const { menus, module } = await boot("settings-library");
  const menu = menus.get("globalLibrary"); assert.ok(menu); assert.equal(menu.restricted, true);
  assert.equal(menu.label, "DA.OpenGlobalLibrary");
  const app = new menu.type().render(true);
  assert.equal(app.actor, null); assert.equal(app.rendered, true);
  assert.equal(app, module.api.openGlobalLibrary());
  game.user.isGM = false;
  assert.throws(() => new menu.type().render(true), /GMOnly/);
  game.user.isGM = true;
});
