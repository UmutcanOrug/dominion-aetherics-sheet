import test from "node:test";
import assert from "node:assert/strict";
import { ID, assertActor, isSupportedActor } from "../scripts/constants.js";
import { Actor, Power, Effect, setup, configure, element, source } from "./helpers.mjs";

for(const wildcard of [false,true]) {
  test(`NPC ${wildcard?"Wild Card":"Extra"}: selections, requirements, shared passives and Tools casting`,async()=>{
    const shared=source(); const services=setup([element("H",[shared]),element("O",[shared])]);
    const npc=new Actor(`Actor.NPC-${wildcard}`);npc.type="npc";npc.system.wildcard=wildcard;
    const originalSystem=structuredClone(npc.system), power=new Power(npc);
    const unrelated=new Effect({name:"Existing effect"});npc.effects.push(unrelated);
    await services.requirements.save(power,{schemaVersion:1,recipes:[["H","O"]],exact:false,forbidden:[]});
    await services.selections.set(npc,["H","O"]);
    assert.equal(services.requirements.evaluate(npc,power).available,true);
    assert.equal(services.requirements.available(npc)[0],power);
    assert.equal(npc.effects.length,2);
    assert.deepEqual(npc.effects.find(e=>e.getFlag(ID,"managed")).getFlag(ID,"providers"),["H","O"]);
    let calls=0;game.modules.set("swade-tools",{active:true});game.swadetools={item:(actor,id)=>{assert.equal(actor,npc);assert.equal(id,power.id);calls++;return "tools";}};
    power.show=()=>{throw new Error("Native system card must not open");};
    assert.equal(await services.powerUse.use(npc,power),"tools");assert.equal(calls,1);
    await services.selections.toggle(npc,"H");assert.equal(services.requirements.evaluate(npc,power).available,false);assert.equal(npc.effects.length,2);
    await assert.rejects(services.powerUse.use(npc,power),/PowerLocked/);assert.equal(calls,1);
    await services.selections.set(npc,[]);assert.equal(npc.effects.length,1);assert.equal(npc.effects[0],unrelated);
    assert.deepEqual(npc.system,originalSystem);
  });
}

test("unlinked NPC token selections, effects and Tools source never write to its base NPC",async()=>{
  const services=setup([element("H",[source()]),element("O")]);
  const base=new Actor("Actor.BaseNPC");base.type="npc";base.system.wildcard=true;
  const tokenActor=new Actor("Scene.S.Token.T.Actor.BaseNPC");tokenActor.type="npc";tokenActor.system.wildcard=true;tokenActor.isToken=true;
  const token={id:"T",actor:tokenActor};tokenActor.token=token;
  const power=new Power(tokenActor);await configure(power,[["H"]]);
  await services.selections.set(base,["O"]);const before=structuredClone(base.flags),updates=base.updates.length;
  await services.selections.set(tokenActor,["H"]);assert.equal(tokenActor.effects.length,1);assert.equal(base.effects.length,0);
  let sourceToken;game.modules.set("swade-tools",{active:true});game.swadetools={item:(actor,_id,_operator,options)=>{assert.equal(actor,tokenActor);sourceToken=options.token;}};
  await services.powerUse.use(tokenActor,power);assert.equal(sourceToken,token);
  assert.deepEqual(base.flags,before);assert.equal(base.updates.length,updates);
});

test("NPC ownership permissions are enforced for player selection and casting",async()=>{
  const services=setup();const npc=new Actor();npc.type="npc";const power=new Power(npc);await configure(power,[["H"]]);
  game.user.isGM=false;await services.selections.set(npc,["H"]);
  assert.deepEqual(services.selections.get(npc),["H"]);
  game.user.owner=false;assert.throws(()=>services.selections.set(npc,["O"]),/NoPermission/);
  await assert.rejects(services.powerUse.use(npc,power),/NoPermission/);
  npc.allowed=false;assert.throws(()=>services.selections.get(npc),/NoPermission/);
});

test("actor support depends on character/NPC type, not Wild Card status; vehicles/groups stay rejected",()=>{
  setup();
  for(const type of ["character","npc"])for(const wildcard of [false,true]){
    const actor=new Actor();actor.type=type;actor.system.wildcard=wildcard;
    assert.equal(isSupportedActor(actor),true);assert.doesNotThrow(()=>assertActor(actor,true));
  }
  for(const type of ["vehicle","group","npc-wildcard"]){
    const actor=new Actor();actor.type=type;actor.system.wildcard=true;
    assert.equal(isSupportedActor(actor),false);assert.throws(()=>assertActor(actor),/InvalidActor/);
  }
  assert.equal(isSupportedActor(null),false);
  assert.equal(isSupportedActor({documentName:"Item",type:"npc"}),false);
});
