import test from "node:test";
import assert from "node:assert/strict";
import { ID } from "../scripts/constants.js";
import { planAetherActivation } from "../scripts/services/activation-plan.js";
import { Actor, Effect, setup, element, source } from "./helpers.mjs";

const aether = (id, level, ids = null, mode = "all", effects = []) => ({ ...element(id, effects), level, prerequisites: ids ? { mode, ids } : null });
const chain = () => [aether("H", 1), aether("O", 1), aether("C", 2, ["H", "O"]), aether("Fe", 3, ["H", "C"])];

test("activation preview expands the complete lower-level chain once without writes", () => {
  const { selections } = setup(chain()), actor = new Actor();
  const plan = selections.planActivation(actor, "Fe");
  assert.equal(plan.ok, true); assert.deepEqual(plan.prerequisites, ["H", "O", "C"]); assert.deepEqual(plan.additions, ["H", "O", "C", "Fe"]);
  assert.equal(actor.updates.length, 0); assert.equal(actor.effects.length, 0);
});

test("missing direct and nested Actor grants are named and no partial plan is returned", () => {
  const { selections } = setup(chain()), actor = new Actor("Actor.Missing", { assigned: ["O", "C", "Fe"] });
  const plan = selections.planActivation(actor, "Fe");
  assert.equal(plan.ok, false); assert.deepEqual(plan.missing, ["H"]); assert.deepEqual(plan.additions, []);
  actor.flags[ID].assignedElements = ["Fe"];
  assert.deepEqual(selections.planActivation(actor, "Fe").missing, ["H", "C"]);
  assert.equal(actor.updates.length, 0);
});

test("OR activation previews one feasible assigned branch rather than all alternatives", () => {
  const defs = [aether("H", 1), aether("O", 1), aether("C", 2, ["H"]), aether("Fe", 3, ["C", "O"], "any")];
  assert.deepEqual(planAetherActivation("Fe", [], ["O", "C", "Fe"], defs).additions, ["O", "Fe"]);
  assert.deepEqual(planAetherActivation("Fe", [], ["H", "O", "C", "Fe"], defs).additions, ["O", "Fe"]);
  const missing = planAetherActivation("Fe", [], ["C", "Fe"], defs);
  assert.equal(missing.ok, false); assert.deepEqual(missing.missing, ["H", "O"]);
});

test("already-active OR alternatives and prerequisites are not listed for reactivation", () => {
  const defs = [aether("H", 1), aether("O", 1), aether("C", 2, ["H", "O"], "any")];
  const plan = planAetherActivation("C", ["O"], ["H", "O", "C"], defs);
  assert.deepEqual(plan.prerequisites, []); assert.deepEqual(plan.additions, ["C"]);
});

test("removed global references and invalid dependency rules fail closed", () => {
  const missing = planAetherActivation("C", [], ["C"], [aether("C", 2, ["deleted"])]);
  assert.equal(missing.ok, false); assert.deepEqual(missing.missing, ["deleted"]);
  for (const rule of [{ mode: "all", ids: ["C"] }, { mode: "script", ids: ["H"] }]) {
    const plan = planAetherActivation("C", [], ["H", "C"], [aether("H", 1), { ...aether("C", 2), prerequisites: rule }]);
    assert.equal(plan.ok, false); assert.deepEqual(plan.invalid, ["C"]);
  }
});

for (const [type, wildcard] of [["character", true], ["npc", false], ["npc", true]]) {
  test(`confirmed ${type} wildcard=${wildcard} activation writes the chain once and keeps other Actors untouched`, async () => {
    const shared = source(); const defs = chain().map(entry => ({ ...entry, effects: entry.id === "C" || entry.id === "Fe" ? [shared] : [] }));
    const { selections } = setup(defs), base = new Actor("Actor.Base"), actor = new Actor("Scene.S.Token.T.Actor.Base");
    actor.type = type; actor.system.wildcard = wildcard; const original = new Effect({ id: "unrelated" }); actor.effects.push(original);
    const baseBefore = structuredClone(base.flags), systemBefore = structuredClone(actor.system);
    const plan = selections.planActivation(actor, "Fe"); await selections.activate(actor, "Fe", plan.additions);
    assert.deepEqual(selections.get(actor), ["H", "O", "C", "Fe"]); assert.equal(actor.updates.length, 1);
    assert.equal(actor.effects.length, 2); assert.ok(actor.effects.includes(original));
    assert.deepEqual(actor.effects.find(effect => effect.getFlag(ID, "managed")).getFlag(ID, "providers"), ["C", "Fe"]);
    assert.deepEqual(base.flags, baseBefore); assert.equal(base.updates.length, 0); assert.deepEqual(actor.system, systemBefore);
  });
}

test("confirmation rechecks prerequisites and rejects unapproved additions before writing", async () => {
  const { registry, selections } = setup([aether("H", 1), aether("O", 1), aether("C", 2, ["H"])]), actor = new Actor();
  const plan = selections.planActivation(actor, "C");
  await registry.save(aether("C", 2, ["H", "O"]));
  await assert.rejects(selections.activate(actor, "C", plan.additions), /ActivationPlanChanged/);
  assert.equal(actor.updates.length, 0); assert.deepEqual(selections.get(actor), []);
});

test("grant revocation while the dialog is open reports the now-missing prerequisite", async () => {
  const { selections } = setup(chain()), actor = new Actor(); const plan = selections.planActivation(actor, "Fe");
  actor.flags[ID].assignedElements = ["H", "C", "Fe"];
  await assert.rejects(selections.activate(actor, "Fe", plan.additions), error => error.activationPlan?.missing.includes("O"));
  assert.equal(actor.updates.length, 0); assert.equal(actor.effects.length, 0);
});

test("confirmed activation preserves unrelated selections changed after the preview", async () => {
  const { selections } = setup([aether("H", 1), aether("O", 1), aether("C", 2, ["H"])]), actor = new Actor();
  const plan = selections.planActivation(actor, "C"); await selections.set(actor, ["O"]);
  await selections.activate(actor, "C", plan.additions); assert.deepEqual(selections.get(actor), ["O", "H", "C"]);
});

test("selection limits and ownership still reject the entire confirmed activation", async () => {
  const { selections, values } = setup(chain()), actor = new Actor(); const plan = selections.planActivation(actor, "Fe");
  values.set("maxActive", 3); await assert.rejects(selections.activate(actor, "Fe", plan.additions), /SelectionLimit/);
  assert.equal(actor.updates.length, 0); assert.equal(actor.effects.length, 0);
  game.user.isGM = false; game.user.owner = false;
  assert.throws(() => selections.planActivation(actor, "Fe"), /NoPermission/);
  assert.throws(() => selections.activate(actor, "Fe", plan.additions), /NoPermission/);
});
