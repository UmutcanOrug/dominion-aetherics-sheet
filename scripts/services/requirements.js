import { ID, SCHEMA, assertGM, assertActor, assertPower, clone, t } from "../constants.js";

/** Pure structured evaluator. Missing element IDs fail closed, including exact/forbidden rules. */
export function normalizeRequirements(raw, knownIds, { strict = false } = {}) {
  if (raw == null) return null;
  const invalid = () => { if (strict) throw new Error(t("InvalidRequirements")); return { invalid: true }; };
  if (raw.schemaVersion !== SCHEMA || !Array.isArray(raw.recipes) || !raw.recipes.length || raw.recipes.length > 50 ||
      typeof raw.exact !== "boolean" || !Array.isArray(raw.forbidden)) return invalid();
  const validList = list => Array.isArray(list) && list.length <= 200 && list.every(id => typeof id === "string" && knownIds.has(id)) && new Set(list).size === list.length;
  if (!validList(raw.forbidden) || !raw.recipes.every(validList)) return invalid();
  if (raw.recipes.some(recipe => recipe.some(id => raw.forbidden.includes(id)))) return invalid();
  return { schemaVersion: SCHEMA, recipes: raw.recipes.map(r => [...r]), forbidden: [...raw.forbidden], exact: raw.exact };
}

export function evaluateRequirements(requirements, activeIds) {
  if (!requirements) return { available: false, state: "unconfigured" };
  if (requirements.invalid) return { available: false, state: "invalid" };
  const active = new Set(activeIds);
  const forbidden = requirements.forbidden.some(id => active.has(id));
  const match = requirements.recipes.some(recipe => recipe.every(id => active.has(id)) && (!requirements.exact || active.size === recipe.length));
  return { available: !forbidden && match, state: !forbidden && match ? "available" : "locked" };
}

/** UI groups compile to the existing OR-of-AND recipes; no flag migration is needed. */
export function compileRecipeGroups(groups) {
  if (!Array.isArray(groups) || !groups.length) throw new Error(t("InvalidRequirements"));
  return groups.flatMap(group => {
    if (!["all", "any"].includes(group.mode) || !Array.isArray(group.elements)) throw new Error(t("InvalidRequirements"));
    if (group.mode === "any") {
      if (!group.elements.length) throw new Error(t("AnyRequiresElement"));
      return group.elements.map(id => [id]);
    }
    return [[...group.elements]];
  });
}

export function requirementsToGroups(requirements) {
  const recipes = requirements && !requirements.invalid ? requirements.recipes : [[]];
  const singletons = recipes.filter(recipe => recipe.length === 1);
  let addedAny = false;
  return recipes.flatMap(recipe => {
    if (recipe.length !== 1 || singletons.length < 2) return [{ mode: "all", elements: [...recipe] }];
    if (addedAny) return [];
    addedAny = true;
    return [{ mode: "any", elements: [...new Set(singletons.flat())] }];
  });
}

export class PowerRequirementService {
  constructor(registry, selections) { this.registry = registry; this.selections = selections; }
  get(item) {
    assertPower(item);
    return normalizeRequirements(item.getFlag(ID, "requirements"), new Set(this.registry.get().map(e => e.id)));
  }
  evaluate(actor, item) {
    assertActor(actor); assertPower(item);
    if (item.actor?.uuid !== actor.uuid) throw new Error(t("WrongActor"));
    return evaluateRequirements(this.get(item), this.selections.get(actor));
  }
  available(actor) { assertActor(actor); return actor.items.filter(i => i.type === "power" && this.evaluate(actor, i).available); }
  async save(item, requirements) {
    assertGM(); assertPower(item);
    if (requirements === null) return item.unsetFlag(ID, "requirements");
    const normalized = normalizeRequirements(requirements, new Set(this.registry.get().map(e => e.id)), { strict: true });
    return item.setFlag(ID, "requirements", clone(normalized));
  }
  describe(item) {
    const req = this.get(item);
    if (!req) return t("Unconfigured");
    if (req.invalid) return t("InvalidRecipe");
    const names = new Map(this.registry.get().map(e => [e.id, e.name]));
    let text = req.recipes.map(r => r.length ? r.map(id => names.get(id)).join(" + ") : t("AlwaysAvailable")).join(` ${t("Or")} `);
    if (req.forbidden.length) text += `; ${t("Forbidden")}: ${req.forbidden.map(id => names.get(id)).join(", ")}`;
    if (req.exact) text += `; ${t("Exact")}`;
    return text;
  }
}
