import { ROOT, t } from "../constants.js";
import { aetherLevel } from "../services/aether-rules.js";
import { activationFailureMessage } from "../services/activation-plan.js";

const pending = new WeakSet();
const escapeText = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export async function toggleAetherWithPrompt(services, actor, id) {
  if (pending.has(actor)) return;
  let ownsPending = false;
  const notifyFailure = plan => ui.notifications.warn(escapeText(activationFailureMessage(plan, services.registry.get())));
  try {
    if (services.selections.get(actor).includes(id)) return await services.selections.toggle(actor, id);
    const plan = services.selections.planActivation(actor, id);
    if (!plan.ok) { notifyFailure(plan); return; }
    if (plan.prerequisites.length) {
      pending.add(actor); ownsPending = true;
      const definitions = new Map(services.registry.get().map(entry => [entry.id, entry]));
      const content = await foundry.applications.handlebars.renderTemplate(`${ROOT}/templates/activate-aether.hbs`, {
        target: definitions.get(id).name,
        prerequisites: plan.prerequisites.map(key => ({ name: definitions.get(key).name, level: aetherLevel(definitions.get(key)) }))
      });
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: t("ActivationConfirmTitle") }, content, modal: true, rejectClose: false,
        yes: { label: t("ActivationConfirmYes"), default: false }, no: { label: t("ActivationConfirmNo"), default: true }
      });
      if (confirmed !== true) return;
    }
    return await services.selections.activate(actor, id, plan.additions);
  } catch (error) {
    if (error.activationPlan) { notifyFailure(error.activationPlan); return; }
    throw error;
  } finally { if (ownsPending) pending.delete(actor); }
}
