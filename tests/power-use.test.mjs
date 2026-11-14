import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Actor, Power, setup, configure } from "./helpers.mjs";

test("power use calls the published SWADE Tools API with the actual synthetic Actor and TokenDocument", async()=>{
  const {powerUse,selections}=setup(); const actor=new Actor("Scene.S.Token.T.Actor.A"); actor.isToken=true;
  const token={id:"T",actor}; actor.token=token; const item=new Power(actor); await configure(item,[["O"]]); await selections.set(actor,["O"]);
  let args; game.modules.set("swade-tools",{active:true}); game.swadetools={item:async(...received)=>{args=received;return "tools-dialog";}};
  item.show=()=>{throw new Error("System card must never open");};
  assert.equal(await powerUse.use(actor,item),"tools-dialog");
  assert.equal(args[0],actor); assert.equal(args[1],item.id); assert.equal(args[2],null); assert.equal(args[3].token,token);
  assert.deepEqual(actor.system.powerPoints.general,{value:10,max:20});
});

test("Tools absent, disabled or API not ready fails visibly without a native fallback",async()=>{
  const {powerUse}=setup();const actor=new Actor(),item=new Power(actor);await configure(item,[[]]);
  let nativeCalls=0; item.show=()=>{nativeCalls++;};
  await assert.rejects(powerUse.use(actor,item),/ToolsRequired/);
  game.swadetools={item:()=>{throw new Error("Inactive module must not run");}};
  game.modules.set("swade-tools",{active:false});await assert.rejects(powerUse.use(actor,item),/ToolsRequired/);
  game.modules.set("swade-tools",{active:true});game.swadetools={};await assert.rejects(powerUse.use(actor,item),/ToolsRequired/);
  assert.equal(nativeCalls,0);
});

test("power use rejects locked, unconfigured, foreign or unowned powers before Tools is called",async()=>{
  const {powerUse}=setup();const actor=new Actor(),item=new Power(actor);let calls=0;
  game.modules.set("swade-tools",{active:true});game.swadetools={item:()=>{calls++;}};
  await assert.rejects(powerUse.use(actor,item),/PowerLocked/);
  await configure(item,[["H"]]);await assert.rejects(powerUse.use(actor,item),/PowerLocked/);
  const other=new Power(new Actor("Actor.Other"));await configure(other,[[]]);await assert.rejects(powerUse.use(actor,other),/WrongActor/);
  await configure(item,[[]]);await assert.rejects(powerUse.use(actor,item,{token:{actor:other.actor}}),/WrongActor/);
  game.user.isGM=false;game.user.owner=false;await assert.rejects(powerUse.use(actor,item),/NoPermission/);
  assert.equal(calls,0);
});

test("pinned swade-tools-fix 2.2.4 item API opens its ItemDialog with our Actor, Item and token",async()=>{
  const {powerUse}=setup();const actor=new Actor(),item=new Power(actor);await configure(item,[[]]);
  const token={actor};let received,dialogs=0,systemCards=0;
  item.show=()=>{systemCards++;};
  globalThis.__dominionToolsItemDialog=class {
    constructor(...args){received=args;}
    showDialog(){dialogs++;return "native-tools-dialog";}
  };
  // Execute the real upstream API wrapper; only its imported dialog/roll boundaries are mocked.
  let upstream=await fs.readFile(".reference/swade-tools/st.js","utf8");
  upstream=upstream.replace("import SystemRoll from './class/SystemRoll.js';","const SystemRoll=class {};")
    .replace("import ItemDialog from './class/ItemDialog.js';","const ItemDialog=globalThis.__dominionToolsItemDialog;")
    .replace("import { isAoeItem } from './services/AoeItemFlags.js';","const isAoeItem=()=>false;");
  assert.doesNotMatch(upstream,/^import /m);
  const tools=await import(`data:text/javascript;base64,${Buffer.from(upstream).toString("base64")}`);
  game.modules.set("swade-tools",{active:true});game.swadetools=tools;
  assert.equal(await powerUse.use(actor,item,{token}),"native-tools-dialog");
  assert.equal(received[0],actor);assert.equal(received[1],item.id);assert.equal(received[2],null);assert.equal(received[3].token,token);
  assert.equal(dialogs,1);assert.equal(systemCards,0);
  delete globalThis.__dominionToolsItemDialog;
});
