import { assertActor, assertPower, t } from "../constants.js";

/** The graph opens the installed SWADE Tools UI; Tools owns casting and resource use. */
export class PowerUseService {
  constructor(requirements) { this.requirements = requirements; }
  isReady() {
    return game.modules.get("swade-tools")?.active === true && typeof game.swadetools?.item === "function";
  }
  async use(actor, item, { token } = {}) {
    assertActor(actor, true);
    assertPower(item);
    if (!this.requirements.evaluate(actor, item).available) throw new Error(t("PowerLocked"));
    if (!this.isReady()) throw new Error(t("ToolsRequired"));
    const sourceToken = token?.document ?? token ?? (actor.isToken ? actor.token : undefined);
    if (sourceToken?.actor?.uuid && sourceToken.actor.uuid !== actor.uuid) throw new Error(t("WrongActor"));
    return game.swadetools.item(actor, item.id, null, { token: sourceToken });
  }
}
