import { ID, report } from "./constants.js";
import { PowerGraphRenderer } from "./graph.js";

export function createDominionSheet(BaseSheet, services) {
  return class DominionActorSheet extends BaseSheet {
    static get defaultOptions() {
      const options = super.defaultOptions;
      return { ...options, classes: [...options.classes, ID] };
    }
    async _renderInner(data) {
      this._dominionGraph?.dispose();
      const html = await super._renderInner(data);
      if (this.actor.limited) return html;
      try {
        this._dominionGraph = new PowerGraphRenderer(this, services);
        await this._dominionGraph.prepare(html[0], data);
      } catch (error) {
        // Restore a complete official render if a future template or another module is incompatible.
        this._dominionGraph?.dispose(); this._dominionGraph = null;
        report(error);
        return super._renderInner(data);
      }
      return html;
    }
    activateListeners(html) {
      super.activateListeners(html);
      this._dominionGraph?.bind();
    }
    async close(options) {
      this._dominionGraph?.dispose();
      return super.close(options);
    }
  };
}
