import test from "node:test";
import assert from "node:assert/strict";
import { ID } from "../scripts/constants.js";
import { Actor, Power, setup, element, source } from "./helpers.mjs";

function worldPower(data = {}, id = Math.random().toString(36).slice(2)) {
  const item = new Power(new Actor("fixture-holder"), id);
  item.actor = null; item.uuid = `Item.${id}`; item.system = {}; Object.assign(item, structuredClone(data));
  item.testUserPermission = user => user.isGM;
  game.items.push(item); return item;
}
function setupLibrary(elements) {
  const services = setup(elements);
  globalThis.CONFIG = { Item: { documentClass: { create: async data => worldPower(data) } } };
  return services;
}

test("new global definitions grant no elements to a fresh Actor or a previously configured Actor", async () => {
  const { registry, assignments } = setupLibrary();
  const fresh = new Actor("Actor.Fresh", { assigned: [] }); fresh.flags = {};
  const configured = new Actor("Actor.Configured", { assigned: ["H"] });
  const before = structuredClone(configured.flags);
  await registry.save(element("NewElement"));
  assert.deepEqual(assignments.getIds(fresh), []); assert.deepEqual(assignments.getIds(configured), ["H"]);
  assert.deepEqual(configured.flags, before); assert.equal(fresh.updates.length, 0);
});

test("only a GM can grant elements; owners activate only elements granted to their own Actor", async () => {
  const { assignments, selections } = setupLibrary();
  const a = new Actor("Actor.A", { assigned: [] }), b = new Actor("Actor.B", { assigned: [] });
  await assignments.set(a, ["H"]); await assignments.set(b, ["O"]);
  game.user.isGM = false;
  await selections.set(a, ["H"]); await selections.set(b, ["O"]);
  await assert.rejects(selections.set(a, ["O"]), /ElementNotAssigned/);
  assert.throws(() => assignments.set(a, ["O"]), /GMOnly/);
  assert.deepEqual(assignments.getIds(a), ["H"]); assert.deepEqual(assignments.getIds(b), ["O"]);
});

test("revoking an active assignment removes only that Actor's no-longer-provided passive", async () => {
  const { assignments, selections } = setupLibrary([element("H", [source()]), element("O", [source()])]);
  const a = new Actor("Actor.A"), b = new Actor("Actor.B");
  await assignments.set(a, ["H", "O"]); await assignments.set(b, ["H"]);
  await selections.set(a, ["H", "O"]); await selections.set(b, ["H"]);
  await assignments.set(a, ["O"]); assert.equal(a.effects.length, 1); assert.deepEqual(selections.get(a), ["O"]);
  await assignments.set(a, []); assert.equal(a.effects.length, 0); assert.equal(b.effects.length, 1);
  assert.deepEqual(selections.get(b), ["H"]);
});

test("legacy assignment inference preserves saved active elements only and survives deactivation", async () => {
  const { assignments, selections } = setupLibrary(); const actor = new Actor();
  actor.flags = { [ID]: { schemaVersion: 1, activeElements: ["H", "deleted"] } };
  assert.deepEqual(assignments.getIds(actor), ["H"]);
  await selections.set(actor, []);
  assert.deepEqual(actor.getFlag(ID, "assignedElements"), ["H"]);
  assert.deepEqual(assignments.getIds(actor), ["H"]);
  await selections.set(actor, ["H"]); assert.deepEqual(selections.get(actor), ["H"]);
});

test("assignment changes serialize with local toggles and synthetic Actor assignments remain separate", async () => {
  const { assignments, selections } = setupLibrary(); const base = new Actor("Actor.NPC"); base.type = "npc";
  const token = new Actor("Scene.S.Token.T.Actor.NPC", { assigned: [] }); token.type = "npc";
  const before = structuredClone(base.flags);
  await assignments.set(token, ["H"]);
  await Promise.all([selections.set(token, ["H"]), assignments.set(token, [])]);
  assert.deepEqual(assignments.getIds(token), []); assert.deepEqual(selections.get(token), []);
  assert.deepEqual(base.flags, before); assert.equal(base.updates.length, 0);
});

test("global Powers are real world Items and creation/import never grants Powers to other Actors", async () => {
  const { powerLibrary } = setupLibrary(); const actor = new Actor("Actor.Source"), other = new Actor("Actor.Other");
  const original = new Power(actor); original.system = { pp: 3, description: "Original" }; await original.setFlag(ID, "requirements", { schemaVersion: 1, recipes: [["H"]], forbidden: [], exact: false });
  const before = structuredClone(original.toObject());
  globalThis.fromUuid = async uuid => uuid === original.uuid ? original : null;
  const created = await powerLibrary.create("Global Power"); assert.equal(created.actor, null);
  const imported = await powerLibrary.import(original.uuid);
  assert.equal(imported.actor, null); assert.deepEqual(imported.system, original.system);
  assert.deepEqual(imported.getFlag(ID, "requirements"), original.getFlag(ID, "requirements"));
  assert.equal((await powerLibrary.import(original.uuid)).id, imported.id);
  assert.equal(powerLibrary.list().length, 2); assert.equal(actor.items.length, 1); assert.equal(other.items.length, 0);
  assert.deepEqual(original.toObject(), before);
  // Importing a Power back to its original Actor reuses that existing Item.
  assert.equal(await powerLibrary.addToActor(actor, imported), original); assert.equal(actor.items.length, 1);
});

test("adding a library Power copies it once to the exact target Actor and keeps later edits independent", async () => {
  const { powerLibrary } = setupLibrary(); const template = worldPower({ name: "Water", system: { pp: 4 } });
  const actor = new Actor("Scene.S.Token.T.Actor.NPC"), other = new Actor("Actor.BaseNPC"); actor.type = other.type = "npc";
  const [a, b] = await Promise.all([powerLibrary.addToActor(actor, template), powerLibrary.addToActor(actor, template)]);
  assert.equal(a, b); assert.equal(actor.items.length, 1); assert.equal(other.items.length, 0);
  assert.notEqual(a.system, template.system); template.system.pp = 7; assert.equal(a.system.pp, 4);
  game.items.splice(game.items.indexOf(template), 1); assert.equal(actor.items.length, 1);
});

test("global Power configuration/import/grants enforce GM permissions and source type", async () => {
  const { powerLibrary, assignments } = setupLibrary(); const actor = new Actor(); const template = worldPower();
  await assert.rejects(powerLibrary.create(""), /PowerNameRequired/);
  globalThis.fromUuid = async () => null; await assert.rejects(powerLibrary.import("missing"), /InvalidPower/);
  await assert.rejects(assignments.set(actor, ["unknown"]), /InvalidAssignment/);
  game.user.isGM = false;
  assert.throws(() => powerLibrary.list(), /GMOnly/); await assert.rejects(powerLibrary.create("Denied"), /GMOnly/);
  assert.throws(() => powerLibrary.import(template.uuid), /GMOnly/); assert.throws(() => powerLibrary.addToActor(actor, template), /GMOnly/);
});
