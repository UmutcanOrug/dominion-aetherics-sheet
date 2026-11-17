import test from "node:test";
import assert from "node:assert/strict";
import { ID } from "../scripts/constants.js";
import { aetherRuleIssue, aetherStatus, resolveActiveAethers } from "../scripts/services/aether-rules.js";
import { Actor, Power, Effect, setup, element, source, configure } from "./helpers.mjs";

const aether = (id, level, ids = null, mode = "all", effects = []) => ({ ...element(id, effects), level, prerequisites: ids === null ? null : { mode, ids } });

test("legacy definitions default to level 1 without prerequisites or flag/recipe changes", async () => {
  const { registry, selections, requirements } = setup(); const actor = new Actor(); const item = new Power(actor);
  await configure(item, [["H", "O"]]); await selections.set(actor, ["H", "O"]);
  const flags = structuredClone(actor.flags), rules = structuredClone(item.flags);
  assert.ok(registry.get().every(e => e.level === 1 && e.prerequisites === null));
  assert.deepEqual(selections.get(actor), ["H", "O"]); assert.equal(requirements.evaluate(actor, item).available, true);
  assert.deepEqual(actor.flags, flags); assert.deepEqual(item.flags, rules);
});

test("level 2 AND prerequisites require all lower-level selections to be active", async () => {
  const definitions = [aether("H", 1), aether("O", 1), aether("C", 2, ["H", "O"])];
  const { registry, selections } = setup(definitions); const actor = new Actor();
  await selections.set(actor, ["H"]);
  assert.equal(aetherStatus(registry.get().find(e => e.id === "C"), selections.get(actor), registry.get()).available, false);
  await assert.rejects(selections.toggle(actor, "C"), /AetherPrerequisitesNotMet/);
  await selections.toggle(actor, "O"); await selections.toggle(actor, "C");
  assert.deepEqual(selections.get(actor), ["H", "O", "C"]);
  assert.deepEqual(actor.system.powerPoints.general, { value: 10, max: 20 });
});

test("level 3 can require levels 1 and 2, and level 4 can require all preceding levels", () => {
  const defs = [aether("H", 1), aether("C", 2, ["H"]), aether("Fe", 3, ["H", "C"]), aether("X", 4, ["H", "C", "Fe"])];
  assert.deepEqual(resolveActiveAethers(["H", "C", "Fe", "X"], defs), ["H", "C", "Fe", "X"]);
  assert.deepEqual(resolveActiveAethers(["H", "Fe", "X"], defs), ["H"]);
  assert.deepEqual(resolveActiveAethers(["C", "Fe", "X"], defs), []);
});

test("higher levels can explicitly have no prerequisites and activate without lower selections", async () => {
  const { selections } = setup([aether("H", 1), aether("Fe", 3), aether("X", 4)]);
  const actor = new Actor("Actor.NoRequirements", { assigned: ["H", "Fe", "X"] });
  await selections.set(actor, ["Fe", "X"]); assert.deepEqual(selections.get(actor), ["Fe", "X"]);
});

test("OR prerequisites retain a higher level while any other required selection remains", async () => {
  const { selections } = setup([aether("H", 1), aether("O", 1), aether("C", 2, ["H", "O"], "any")]); const actor = new Actor();
  await selections.set(actor, ["H", "O", "C"]); await selections.toggle(actor, "H");
  assert.deepEqual(selections.get(actor), ["O", "C"]);
  await selections.toggle(actor, "O"); assert.deepEqual(selections.get(actor), []);
});

test("deactivation cascades through higher levels and removes only no-longer-provided passives", async () => {
  const shared = source("Effect.Shared"), upper = source("Effect.Upper");
  const defs = [aether("H", 1), aether("O", 1, null, "all", [shared]), aether("C", 2, ["H"], "all", [shared]), aether("Fe", 3, ["C"], "all", [upper])];
  const { selections } = setup(defs); const actor = new Actor(); const unrelated = new Effect({ id: "original" }); actor.effects.push(unrelated);
  await selections.set(actor, ["H", "O", "C", "Fe"]); assert.equal(actor.effects.length, 3);
  await selections.toggle(actor, "H");
  assert.deepEqual(selections.get(actor), ["O"]); assert.deepEqual(actor.getFlag(ID, "activeElements"), ["O"]);
  assert.equal(actor.effects.length, 2); assert.ok(actor.effects.get("original"));
  assert.deepEqual(actor.effects.find(e => e.getFlag(ID, "managed")).getFlag(ID, "providers"), ["O"]);
  await selections.toggle(actor, "O"); assert.equal(actor.effects.length, 1); assert.equal(actor.effects[0], unrelated);
});

test("revoking a prerequisite grant cascades only on the contextual Actor", async () => {
  const { assignments, selections } = setup([aether("H", 1), aether("C", 2, ["H"])]);
  const a = new Actor("Actor.A"), b = new Actor("Scene.S.Token.T.Actor.A"); b.type = "npc";
  await selections.set(a, ["H", "C"]); await selections.set(b, ["H", "C"]);
  await assignments.set(b, ["C"]);
  assert.deepEqual(selections.get(b), []); assert.deepEqual(assignments.getIds(b), ["C"]); assert.deepEqual(selections.get(a), ["H", "C"]);
});

test("removing a required definition fails closed even for an OR rule with another remaining ID", async () => {
  const { registry, selections, passives } = setup([aether("H", 1), aether("O", 1), aether("C", 2, ["H", "O"], "any", [source()])]); const actor = new Actor();
  await selections.set(actor, ["H", "O", "C"]); await registry.remove("H"); await passives.sync(actor);
  assert.deepEqual(selections.get(actor), ["O"]); assert.equal(actor.effects.length, 0);
  const rule = registry.get().find(e => e.id === "C"); assert.equal(aetherStatus(rule, ["O"], registry.get()).state, "invalid");
});

test("GM configuration rejects invalid levels, missing/self/same/higher references and empty rules", async () => {
  const { registry } = setup([aether("H", 1), aether("C", 2), aether("Fe", 3)]);
  for (const level of [0, 5, 1.5, "2"]) await assert.rejects(registry.save(aether("X", level)), /InvalidAetherLevel/);
  for (const entry of [aether("X", 2, ["X"]), aether("X", 2, ["C"]), aether("X", 2, ["Fe"])]) await assert.rejects(registry.save(entry), /AetherLowerLevelsOnly/);
  await assert.rejects(registry.save(aether("X", 2, ["missing"])), /MissingAetherPrerequisite/);
  await assert.rejects(registry.save(aether("X", 2, [])), /InvalidAetherPrerequisites/);
  await assert.rejects(registry.save(aether("X", 2, ["H", "H"])), /InvalidAetherPrerequisites/);
  await assert.rejects(registry.save(aether("X", 2, ["H"], "eval")), /InvalidAetherPrerequisites/);
});

test("changing a referenced lower level is rejected without modifying world definitions", async () => {
  const { registry } = setup([aether("H", 1), aether("C", 2, ["H"])]); const before = registry.get();
  await assert.rejects(registry.save(aether("H", 2)), /AetherLevelInUse/); assert.deepEqual(registry.get(), before);
  await registry.save(aether("C", 2)); await registry.save(aether("H", 2));
  assert.equal(registry.get().find(e => e.id === "H").level, 2);
});

test("atomic activation resolves unordered inputs and rejects a new invalid selection before any write", async () => {
  const { selections } = setup([aether("H", 1), aether("C", 2, ["H"]), aether("Fe", 3, ["C"])]); const actor = new Actor();
  await assert.rejects(selections.set(actor, ["Fe"]), /AetherPrerequisitesNotMet/); assert.equal(actor.updates.length, 0);
  await selections.set(actor, ["Fe", "C", "H"]); assert.deepEqual(selections.get(actor), ["Fe", "C", "H"]);
  await selections.set(actor, ["Fe", "C"]); assert.deepEqual(selections.get(actor), []);
});

test("malformed stored prerequisites never activate or throw during availability preparation", () => {
  for (const prerequisites of [{ mode: "all", ids: "H" }, { mode: "any", ids: [] }, "script()"]){
    const defs = [aether("H", 1), { ...aether("C", 2), prerequisites }];
    assert.equal(aetherRuleIssue(defs[1], defs), "InvalidAetherPrerequisites");
    assert.deepEqual(resolveActiveAethers(["H", "C"], defs), ["H"]);
  }
});

test("dependent Power availability and Tools dispatch follow effective higher-level state", async () => {
  const { selections, requirements, powerUse } = setup([aether("H", 1), aether("C", 2, ["H"])]);
  const actor = new Actor(), power = new Power(actor); await configure(power, [["C"]]);
  let casts = 0; game.modules.set("swade-tools", { active: true }); game.swadetools = { item: () => { casts++; } };
  await selections.set(actor, ["H", "C"]); assert.equal(requirements.evaluate(actor, power).available, true); await powerUse.use(actor, power);
  await selections.toggle(actor, "H"); assert.equal(requirements.evaluate(actor, power).available, false);
  await assert.rejects(powerUse.use(actor, power), /PowerLocked/); assert.equal(casts, 1);
});
