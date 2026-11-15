import { ID, report } from "./constants.js";
import { PowerGraphRenderer } from "./graph.js";
import { prepareImageSources } from "./images.js";

export function createDominionSheet(BaseSheet, services) {
  return class DominionActorSheet extends BaseSheet {
    static get defaultOptions() {
      const options = super.defaultOptions;
      return { ...options, classes: [...options.classes, ID] };
    }
    async _renderInner(data) {
      await this._dominionGraph?.dispose();
      const html = await super._renderInner(data);
      if (this.actor.limited) return html;
      try {
        this._dominionGraph = new PowerGraphRenderer(this, services);
        await this._dominionGraph.prepare(html[0], data);
        prepareImageSources(html[0]);
      } catch (error) {
        // Restore a complete official render if a future template or another module is incompatible.
        await this._dominionGraph?.dispose(); this._dominionGraph = null;
        report(error);
        return super._renderInner(data);
      }
      return html;
    }
    activateListeners(html) {
      super.activateListeners(html);
      this._dominionGraph?.bind(html[0]);
    }
    async close(options) {
      await this._dominionGraph?.dispose();
      return super.close(options);
    }
  };
}
