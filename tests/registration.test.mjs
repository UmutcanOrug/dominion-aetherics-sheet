import test from "node:test";
import assert from "node:assert/strict";
import { setup, Actor } from "./helpers.mjs";

test("registration is opt-in, character-only and does not touch system defaults or unregister sheets", async () => {
  const { values }=setup(); const callbacks=new Map(), registrations=[];
  globalThis.Hooks={ once:(name,fn)=>callbacks.set(name,fn), on:()=>{} };
  class ActorSheet {};
  class CharacterSheet extends ActorSheet {};
  class App {};
  globalThis.foundry={appv1:{api:{Application:App,FormApplication:App},sheets:{ActorSheet}},applications:{apps:{DocumentSheetConfig:{registerSheet:(...args)=>registrations.push(args)}}}};
  globalThis.CONFIG={Actor:{documentClass:Actor}};
  globalThis.ui={notifications:{error:()=>{}},windows:{}};
  const module={}; game.modules=new Map([["dominion-aetherics-sheet",module]]); game.swade={sheets:{CharacterSheet}}; game.system={id:"swade",version:"5.1.0"}; game.release={generation:13};
  game.settings.register=(_id,key,options)=>{ if(!values.has(key)) values.set(key,options.default); };
  await import("../scripts/main.js");
  callbacks.get("init")();
  assert.equal(registrations.length,1);
  const [document,scope,Sheet,options]=registrations[0];
  assert.equal(document,Actor); assert.equal(scope,"dominion-aetherics-sheet"); assert.ok(Sheet.prototype instanceof CharacterSheet);
  assert.deepEqual(options.types,["character"]); assert.equal(options.makeDefault,false);
  assert.ok(Object.isFrozen(module.api)); assert.equal(typeof module.api.setActiveElements,"function");
  game.system.version="5.2.0"; callbacks.get("init")(); assert.equal(registrations.length,1);
});
