import { DEFAULT_ICON, t } from "./constants.js";

const failedImages = new Set();
export function imagePath(value) {
  const path = String(value ?? "").trim();
  return !path || path === "icons/svg/atom.svg" || failedImages.has(path) ? DEFAULT_ICON : path;
}
export function prepareImageSources(root) {
  for (const img of root.querySelectorAll("img[src]")) {
    const current = img.getAttribute("src"), replacement = imagePath(current);
    if (replacement !== current) img.setAttribute("src", replacement);
  }
}
/** Display fallback only. Never rewrite the Actor, Item or world definition's image path. */
export function bindImageFallbacks(root, options = {}) {
  prepareImageSources(root);
  const onError = event => {
    const img = event.target;
    if (img?.tagName !== "IMG") return;
    const path = img.getAttribute("src");
    if (!path || path === DEFAULT_ICON || img.dataset.daImageFallback) return;
    failedImages.add(path);
    img.dataset.daImageFallback = path;
    img.title = `${t("MissingImage")}: ${path}`;
    img.setAttribute("src", DEFAULT_ICON);
  };
  root.addEventListener("error", onError, { ...options, capture: true });
  for (const img of root.querySelectorAll("img[src]")) {
    if (img.complete && img.naturalWidth === 0) onError({ target: img });
  }
}
