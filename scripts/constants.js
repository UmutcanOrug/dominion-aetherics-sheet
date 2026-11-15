export const ID = "dominion-aetherics-sheet";
export const SCHEMA = 1;
export const ROOT = `modules/${ID}`;
export const SUPPORTED_ACTOR_TYPES = Object.freeze(["character", "npc"]);
export const t = (key, data) => data ? game.i18n.format(`DA.${key}`, data) : game.i18n.localize(`DA.${key}`);
export const clone = value => structuredClone(value);
export function assertGM() {
  if (!game.user?.isGM) throw new Error(t("GMOnly"));
}
export function isSupportedActor(actor) {
  return actor?.documentName === "Actor" && SUPPORTED_ACTOR_TYPES.includes(actor.type);
}
export function assertActor(actor, write = false) {
  if (!isSupportedActor(actor)) throw new Error(t("InvalidActor"));
  if (!actor.testUserPermission(game.user, write ? "OWNER" : "OBSERVER")) throw new Error(t("NoPermission"));
}
export function assertPower(item) {
  if (item?.documentName !== "Item" || item.type !== "power") throw new Error(t("InvalidPower"));
  const document = item.actor ?? item;
  if (!document.testUserPermission(game.user, "OBSERVER")) throw new Error(t("NoPermission"));
}
export function report(error) {
  console.error(`${ID} |`, error);
  ui.notifications.error(`${t("Title")}: ${error.message}`);
}
export function queueFor(map, key, operation) {
  const previous = map.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(operation);
  map.set(key, next);
  void next.finally(() => { if (map.get(key) === next) map.delete(key); }).catch(() => {});
  return next;
}
export function safeImage(value) {
  const path = String(value ?? "").trim();
  if (!path) return "icons/svg/atom.svg";
  if (/^(?:https?:\/\/|[^:/\\]+[\/\\])/i.test(path) && !/["'<>\x00-\x1f]/.test(path)) return path;
  throw new Error(t("InvalidImage"));
}
