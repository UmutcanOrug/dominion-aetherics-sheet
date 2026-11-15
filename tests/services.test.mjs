import test from "node:test";
import assert from "node:assert/strict";
import { ID, DEFAULT_ICON, safeImage } from "../scripts/constants.js";
import { evaluateRequirements, normalizeRequirements, compileRecipeGroups, requirementsToGroups } from "../scripts/services/requirements.js";
import { Actor, Power, Effect, setup, element, source, configured, configure } from "./helpers.mjs";

test("AND recipes are inclusive; alternatives, forbidden and exact modes", () => {
  const req = configured([["H", "O"], ["H", "C"]]);
  assert.equal(evaluateRequirements(req, []).available, false);
  assert.equal(evaluateRequirements(req, ["O"]).available, false);
  assert.equal(evaluateRequirements(req, ["H","O"]).available, true);
  assert.equal(evaluateRequirements(req, ["H","C"]).available, true);
  assert.equal(evaluateRequirements(req, ["H","C","Fe"]).available, true);
  assert.equal(evaluateRequirements({ ...req, forbidden: ["Fe"] }, ["H","C","Fe"]).available, false);
  assert.equal(evaluateRequirements({ ...req, exact: true }, ["H","O","C"]).available, false);
  assert.equal(evaluateRequirements({ ...req, exact: true }, ["H","O"]).available, true);
});
test("explicit AND/OR groups compile to compatible recipes without changing old mixed rules", () => {
  setup();
  assert.deepEqual(compileRecipeGroups([{mode:"all",elements:["H","O"]}]),[["H","O"]]);
  assert.deepEqual(compileRecipeGroups([{mode:"any",elements:["H","O"]}]),[["H"],["O"]]);
  assert.throws(()=>compileRecipeGroups([{mode:"any",elements:[]}]));
  assert.throws(()=>compileRecipeGroups([{mode:"script",elements:["H"]}]));
  for (const recipes of [[["H","O"]],[["H"],["O"]],[["H","O"],["C"],["Fe"]],[[]]]) {
    const original=configured(recipes), roundTrip=configured(compileRecipeGroups(requirementsToGroups(original)));
    for (const active of [[],["H"],["O"],["H","O"],["C"],["Fe"],["H","C"],["H","O","Fe"]]) {
      assert.deepEqual(evaluateRequirements(roundTrip,active),evaluateRequirements(original,active));
      assert.deepEqual(evaluateRequirements({...roundTrip,exact:true},active),evaluateRequirements({...original,exact:true},active));
    }
  }
});
test("unconfigured, explicit always-available, and malformed data differ", () => {
  setup(); const known = new Set(["H", "O"]);
  assert.deepEqual(evaluateRequirements(null, []), { available: false, state: "unconfigured" });
  assert.equal(evaluateRequirements(configured([[]]), []).available, true);
  for (const raw of [configured([]), configured([["deleted"]]), configured([["H","H"]]), configured([["H"]], { forbidden: ["H"] }), { schemaVersion: 2 }, { recipes: "evil()" }]) {
    assert.equal(evaluateRequirements(normalizeRequirements(raw, known), ["H"]).state, "invalid");
    assert.throws(() => normalizeRequirements(raw, known, { strict: true }));
  }
  assert.equal(evaluateRequirements(configured([[]], { forbidden: ["H"] }), ["H"]).available, false);
});
test("power rules are Item flags; power system data is never replaced", async () => {
  const { requirements } = setup(); const actor = new Actor(); const item = new Power(actor);
  item.system = { pp: 4, description: "Original SWADE power" }; const before = structuredClone(item.system);
  await requirements.save(item, configured([["H","O"]]));
  assert.equal(item.getFlag(ID,"requirements").schemaVersion, 1);
  assert.deepEqual(item.system, before);
  await requirements.save(item, null); assert.equal(requirements.get(item), null);
});
test("selections are persistent and independent per Actor and synthetic token", async () => {
  const { selections, requirements } = setup(); const a = new Actor(), b = new Actor("Actor.B"), token = new Actor("Scene.X.Token.T.Actor.A");
  const power = new Power(a); await configure(power, [["H","O"]]);
  await selections.set(a, ["H","O"]); await selections.set(b, ["Fe"]); await selections.set(token, ["C"]);
  assert.deepEqual(selections.get(a), ["H","O"]); assert.deepEqual(selections.get(b), ["Fe"]); assert.deepEqual(selections.get(token), ["C"]);
  assert.equal(requirements.evaluate(a, power).available, true);
  await selections.toggle(a,"H"); assert.equal(requirements.evaluate(a,power).available, false);
  assert.deepEqual(b.flags[ID].activeElements, ["Fe"]); assert.deepEqual(token.flags[ID].activeElements, ["C"]);
  assert.deepEqual(a.system.powerPoints.general, { value: 10, max: 20 });
  assert.ok(a.updates.every(data => Object.keys(data).every(key => key.startsWith(`flags.${ID}.`))));
});
test("rapid simultaneous local toggles serialize without losing state", async () => {
  const { selections } = setup(); const actor = new Actor();
  await Promise.all([selections.toggle(actor,"H"), selections.toggle(actor,"O"), selections.toggle(actor,"C"), selections.toggle(actor,"H")]);
  assert.deepEqual(selections.get(actor), ["O","C"]);
});
test("GM-configured selection limit and unknown IDs reject writes", async () => {
  const { selections, values } = setup(); const actor = new Actor();
  assert.throws(() => selections.set(actor, "H"));
  await assert.rejects(selections.set(actor,["unknown"]));
  values.set("maxActive", 1); await assert.rejects(selections.set(actor,["H","O"]));
  assert.equal(actor.updates.length, 0);
  values.set("maxActive",0); await selections.set(actor,["H","O","C","Fe"]); assert.equal(selections.get(actor).length,4);
  actor.flags[ID].schemaVersion=2; assert.throws(()=>selections.get(actor));
});
test("players can select their own Actors, but cannot configure world definitions or recipes", async () => {
  const { selections, registry, requirements } = setup(); const actor = new Actor(); const power = new Power(actor);
  game.user.isGM = false;
  await selections.set(actor,["H"]);
  assert.throws(() => registry.save(element("new")));
  assert.throws(() => registry.remove("H"));
  await assert.rejects(requirements.save(power,configured([["H"]])));
  game.user.owner = false; assert.throws(() => selections.set(actor,["O"]));
  actor.allowed = false; assert.throws(() => selections.get(actor)); assert.throws(() => requirements.get(power));
});
test("foreign power Items cannot be evaluated against a different Actor", () => {
  const { requirements } = setup(); const actor = new Actor(), power = new Power(new Actor("Actor.B"));
  assert.throws(() => requirements.evaluate(actor,power));
});
test("shared mechanical passive uses one managed effect with multiple providers", async () => {
  const effectSource = source(); const { selections, passives } = setup([element("H",[effectSource]), element("O",[effectSource])]); const actor = new Actor();
  const unrelated = new Effect({ name: "Blessing", flags: { other: { enabled: true } } }); actor.effects.push(unrelated);
  await selections.set(actor,["H","O"]);
  assert.equal(actor.effects.length,2);
  let managed = actor.effects.find(e => e.getFlag(ID,"managed")); const effectId = managed.id;
  assert.deepEqual(managed.getFlag(ID,"providers"),["H","O"]);
  await Promise.all([passives.sync(actor),passives.sync(actor),passives.sync(actor)]); assert.equal(actor.effects.length,2);
  await selections.toggle(actor,"H");
  managed = actor.effects.get(effectId); assert.ok(managed); assert.deepEqual(managed.getFlag(ID,"providers"),["O"]);
  await selections.toggle(actor,"O"); assert.deepEqual(Array.from(actor.effects, e => e.id), [unrelated.id]);
  assert.deepEqual(unrelated.flags,{ other: { enabled: true } });
});
test("different passive sources coexist and descriptive passives only display", async () => {
  const { selections, passives } = setup([element("H",[source("Effect.A")]), element("O",[source("Effect.B")]), element("C")]); const actor = new Actor();
  await selections.set(actor,["H","O","C"]); assert.equal(actor.effects.length,2); assert.equal(passives.descriptions(actor).length,5);
  await selections.set(actor,["O"]); assert.equal(actor.effects.length,1); assert.equal(actor.effects[0].getFlag(ID,"sourceUuid"),"Effect.B");
});
test("existing duplicate module effects are repaired, unrelated matching source remains", async () => {
  const effectSource = source(); const { selections, passives } = setup([element("H",[effectSource])]); const actor = new Actor();
  await selections.set(actor,["H"]);
  const duplicate = new Effect(actor.effects[0].toObject()); duplicate.id = "duplicate"; actor.effects.push(duplicate);
  actor.effects.push(new Effect({ id: "unrelated", origin: effectSource.uuid, name: effectSource.name }));
  await passives.sync(actor); assert.equal(actor.effects.length,2); assert.ok(actor.effects.get("unrelated"));
});
test("copied Actor managed effect is adopted without touching the source Actor", async () => {
  const { selections, passives } = setup([element("H",[source()])]); const original = new Actor();
  await selections.set(original,["H"]);
  const copy = new Actor("Actor.Copy"); copy.flags = structuredClone(original.flags); copy.effects.push(new Effect(original.effects[0].toObject()));
  await passives.sync(copy);
  assert.equal(copy.effects.length,1); assert.equal(copy.effects[0].getFlag(ID,"actorUuid"),copy.uuid);
  assert.equal(original.effects[0].getFlag(ID,"actorUuid"),original.uuid);
});
test("only one active client reconciles effects; owner takes over when GM is absent", async () => {
  const { selections, passives } = setup([element("H",[source()])]); const actor = new Actor();
  const gm = { ...game.user }; game.users = [gm, { id: "player", isGM: false, active: true, owner: true }]; game.user = game.users[1];
  await selections.set(actor,["H"]); assert.equal(actor.effects.length,0);
  game.user = gm; await passives.sync(actor); assert.equal(actor.effects.length,1);
  gm.active = false; game.user = game.users[1]; assert.equal(passives.isAuthority(actor),true);
  await selections.set(actor,[]); assert.equal(actor.effects.length,0);
});
test("removed definitions invalidate powers instead of silently turning them always-on", async () => {
  const { registry, selections, requirements } = setup(); const actor = new Actor(); const power = new Power(actor); await configure(power,[["H"]]);
  await selections.set(actor,["H","O"]); await registry.remove("H");
  assert.deepEqual(selections.get(actor),["O"]); assert.equal(requirements.evaluate(actor,power).state,"invalid");
});
test("GM effect snapshot preserves real paths but strips identity and timing", async () => {
  const { registry } = setup();
  const effect = new Effect({ _id: "source", name: "Configured", uuid: "Actor.Source.ActiveEffect.A", changes: [{ key: "system.actualPath", value: "2", mode: 2 }], duration: { rounds: 1, startRound: 5 }, system:{expiration:0}, transfer: true, origin: "Item.Source", flags: { anotherModule: { mark: true } } });
  globalThis.fromUuid = async () => effect;
  const snapshot = await registry.resolveEffect(effect.uuid);
  assert.deepEqual(snapshot.data.changes,effect.changes); assert.deepEqual(snapshot.data.duration,{});
  assert.equal(snapshot.data.transfer,false); assert.equal(snapshot.data._id,undefined); assert.equal(snapshot.data.origin,undefined);
  assert.deepEqual(snapshot.data.flags,{ anotherModule: { mark: true } });
  assert.equal(snapshot.data.system.expiration,null); assert.equal(effect.system.expiration,0);
  effect.statuses=["shaken"]; effect.flags.swade={related:{distracted:{}}}; await assert.rejects(registry.resolveEffect(effect.uuid));
  game.user.isGM = false; await assert.rejects(registry.resolveEffect(effect.uuid));
});
test("registry clones reads, serializes saves, and validates definitions", async () => {
  const { registry } = setup(); const read = registry.get(); read[0].name = "changed"; assert.notEqual(registry.get()[0].name,"changed");
  await Promise.all([registry.save(element("X")),registry.save(element("Y"))]); assert.equal(registry.get().length,6);
  assert.throws(() => registry.save({ ...element("Z"), name: "" }));
  for (const bad of ["javascript:alert(1)","data:image/svg+xml,evil",'https://example.com/" onerror="bad']) assert.throws(() => safeImage(bad));
  assert.equal(safeImage("icons/svg/atom.svg"),DEFAULT_ICON);
});
