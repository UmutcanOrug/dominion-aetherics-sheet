import { t } from "../constants.js";
import { aetherRuleIssue, resolveActiveAethers } from "./aether-rules.js";

/** Plan against grants, never grant missing entries or perform partial activation. */
export function planAetherActivation(id, activeIds, assignedIds, definitions) {
  const byId = new Map(definitions.map(entry => [entry.id, entry])), assigned = new Set(assignedIds);
  const active = new Set(resolveActiveAethers(activeIds.filter(key => assigned.has(key)), definitions));
  const failure = (missing = [], invalid = []) => ({ ok: false, missing, invalid });
  const mergeFailures = failures => failure([...new Set(failures.flatMap(result => result.missing))], [...new Set(failures.flatMap(result => result.invalid))]);
  const visit = (key, selected) => {
    const definition = byId.get(key);
    if (!definition || !assigned.has(key)) return failure([key]);
    const issue = aetherRuleIssue(definition, definitions);
    if (issue) {
      const ids = definition.prerequisites?.ids;
      const missing = Array.isArray(ids) ? ids.filter(required => !byId.has(required)) : [];
      return failure(missing, missing.length ? [] : [key]);
    }
    if (selected.has(key)) return { ok: true, selected: new Set(selected) };
    let next = new Set(selected);
    const rule = definition.prerequisites;
    if (rule?.mode === "any") {
      // Prefer an already-active alternative; otherwise preview one feasible branch.
      if (!rule.ids.some(required => next.has(required))) {
        const choices = rule.ids.map(required => visit(required, next));
        const viable = choices.filter(result => result.ok).sort((a, b) => a.selected.size - b.selected.size);
        if (!viable.length) return mergeFailures(choices);
        next = viable[0].selected;
      }
    } else if (rule) {
      const failures = [];
      for (const required of rule.ids) {
        const result = visit(required, next);
        if (result.ok) next = result.selected; else failures.push(result);
      }
      if (failures.length) return mergeFailures(failures);
    }
    next.add(key); return { ok: true, selected: next };
  };
  const result = visit(id, active);
  const additions = result.ok ? [...result.selected].filter(key => !active.has(key)) : [];
  return { id, ok: result.ok, additions, prerequisites: additions.filter(key => key !== id), missing: result.missing ?? [], invalid: result.invalid ?? [] };
}

export function activationFailureMessage(plan, definitions) {
  const names = new Map(definitions.map(entry => [entry.id, entry.name]));
  const messages = [];
  if (plan.missing.length) messages.push(t("ActivationMissingPrerequisites", { names: plan.missing.map(id => names.get(id) ?? id).join(", ") }));
  if (plan.invalid.length) messages.push(t("ActivationInvalidPrerequisites", { names: plan.invalid.map(id => names.get(id) ?? id).join(", ") }));
  return messages.join(" ");
}
