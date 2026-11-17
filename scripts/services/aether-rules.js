import { t } from "../constants.js";

export const AETHER_LEVELS = Object.freeze([1, 2, 3, 4]);
export const validAetherLevel = level => Number.isInteger(level) && AETHER_LEVELS.includes(level);
export const aetherLevel = definition => validAetherLevel(definition.level ?? 1) ? definition.level ?? 1 : 1;
export const withAetherDefaults = definition => ({ ...definition, level: definition.level ?? 1, prerequisites: definition.prerequisites ?? null });

/** References always point strictly leftward, so cycles cannot be introduced. */
export function aetherRuleIssue(definition, definitions) {
  if (!validAetherLevel(definition.level ?? 1)) return "InvalidAetherLevel";
  const rule = definition.prerequisites;
  if (rule == null) return null;
  if (!["all", "any"].includes(rule.mode) || !Array.isArray(rule.ids) || !rule.ids.length || rule.ids.length > 200 ||
      rule.ids.some(id => typeof id !== "string" || !id) || new Set(rule.ids).size !== rule.ids.length) return "InvalidAetherPrerequisites";
  const byId = new Map(definitions.map(entry => [entry.id, entry]));
  for (const id of rule.ids) {
    const required = byId.get(id);
    if (!required) return "MissingAetherPrerequisite";
    if (id === definition.id || !validAetherLevel(required.level ?? 1) || aetherLevel(required) >= aetherLevel(definition)) return "AetherLowerLevelsOnly";
  }
  return null;
}

function matches(definition, active) {
  const rule = definition.prerequisites;
  if (rule == null) return true;
  return rule.mode === "any" ? rule.ids.some(id => active.has(id)) : rule.ids.every(id => active.has(id));
}

/** Evaluate in level order, then preserve the caller's ID order. Nothing is auto-activated. */
export function resolveActiveAethers(ids, definitions) {
  const requested = new Set(ids), accepted = new Set();
  for (const definition of [...definitions].sort((a, b) => aetherLevel(a) - aetherLevel(b))) {
    if (requested.has(definition.id) && !aetherRuleIssue(definition, definitions) && matches(definition, accepted)) accepted.add(definition.id);
  }
  return [...requested].filter(id => accepted.has(id));
}

export function aetherStatus(definition, activeIds, definitions) {
  const issue = aetherRuleIssue(definition, definitions);
  if (issue) return { available: false, state: "invalid", issue };
  const effective = new Set(resolveActiveAethers(activeIds, definitions));
  const available = matches(definition, effective);
  return { available, state: available ? "available" : "locked", issue: null };
}

export function describeAetherPrerequisites(definition, definitions) {
  const issue = aetherRuleIssue(definition, definitions);
  if (issue) return t(issue);
  if (definition.prerequisites == null) return t("NoPrerequisites");
  const names = new Map(definitions.map(entry => [entry.id, entry.name]));
  const separator = t(definition.prerequisites.mode === "any" ? "Or" : "And");
  return `${t("Prerequisites")}: ${definition.prerequisites.ids.map(id => names.get(id)).join(` ${separator} `)}`;
}
