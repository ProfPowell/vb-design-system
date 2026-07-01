// src/lib/bundle-registry.js
var reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
var components = /* @__PURE__ */ new Map();
function registerComponent(tag, impl, opts = {}) {
  const priority = opts.priority ?? 10;
  const meta = { impl, bundle: opts.bundle, contract: opts.contract, priority };
  const existing = components.get(tag);
  if (customElements.get(tag)) {
    if (!existing || existing.priority >= priority) {
      if (existing && existing.priority === priority && existing.impl !== impl) {
        console.warn(
          `[VB Bundle] Tag <${tag}> already registered by "${existing.bundle}" (priority ${existing.priority}). Skipping "${opts.bundle}".`
        );
      }
      return;
    }
    console.warn(
      `[VB Bundle] Tag <${tag}> defined by "${existing.bundle}" cannot be replaced (customElements.define is permanent). "${opts.bundle}" has higher priority but arrived late.`
    );
    return;
  }
  if (existing && existing.priority >= priority) {
    if (existing.priority === priority) {
      console.warn(
        `[VB Bundle] Tag <${tag}> already registered by "${existing.bundle}". Skipping "${opts.bundle}" (first wins at equal priority).`
      );
    }
    return;
  }
  components.set(tag, meta);
  customElements.define(tag, impl);
}

// src/lib/vb-element.js
var VBElement = class extends HTMLElement {
  #cleanups = [];
  /** @type {ElementInternals | undefined} */
  #internals;
  connectedCallback() {
    if (this.hasAttribute("data-upgraded")) return;
    if (this.setup() === false) return;
    this.setAttribute("data-upgraded", "");
    queueMicrotask(() => {
      this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`, { bubbles: true }));
    });
  }
  disconnectedCallback() {
    for (const fn of this.#cleanups) fn();
    this.#cleanups = [];
    this.removeAttribute("data-upgraded");
    this.teardown();
  }
  /**
   * Track an event listener for automatic cleanup on disconnect.
   * @param {EventTarget} target
   * @param {string} event
   * @param {EventListenerOrEventListenerObject} handler
   * @param {AddEventListenerOptions} [opts]
   */
  listen(target, event, handler, opts) {
    target.addEventListener(event, handler, opts);
    this.#cleanups.push(() => target.removeEventListener(event, handler, opts));
  }
  /**
   * Override in subclass. Return false to abort upgrade.
   * @returns {boolean | void}
   */
  setup() {
  }
  /** Override in subclass for cleanup beyond event listeners. */
  teardown() {
  }
  /**
   * Toggle a CustomStateSet entry targetable via the `:state(name)` CSS selector.
   * Use for component-private flags. For author-facing state, keep using
   * data-* / aria-* attributes — see admin/specs/custom-state-set-research.md.
   *
   * Lazily attaches ElementInternals on first call; subclasses that already
   * attached internals (form-associated components) must hand them over via
   * `_adoptInternals(this.attachInternals())` in their constructor to avoid
   * the double-attach throw.
   *
   * @param {string} name
   * @param {boolean} on
   */
  setState(name, on) {
    if (!this.#internals) this.#internals = this.attachInternals();
    const states = this.#internals.states;
    try {
      if (on) states.add(name);
      else states.delete(name);
    } catch {
      const legacy = `--${name}`;
      if (on) states.add(legacy);
      else states.delete(legacy);
    }
  }
  /**
   * Hand pre-attached ElementInternals to the base class. Form-associated
   * subclasses call this in their constructor right after attachInternals().
   * @param {ElementInternals} internals
   */
  _adoptInternals(internals) {
    if (!this.#internals) this.#internals = internals;
  }
};

// src/utils/copy-init.js
var COPIED_DURATION = 1500;
var ANNOUNCE_DURATION = 1e3;
var SELECTOR = "[data-copy], [data-copy-target], [data-paste-target]";
var DEFAULT_ANNOUNCE = "Copied to clipboard";
var DEFAULT_PASTE_ANNOUNCE = "Pasted from clipboard";
var resetTimers = /* @__PURE__ */ new WeakMap();
async function copyText(text, options = {}) {
  if (text == null || text === "") return false;
  const { button, announceMessage = DEFAULT_ANNOUNCE, duration = COPIED_DURATION } = options;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return false;
  }
  applyFeedback({ button, duration, announceMessage, eventDetail: { text } });
  return true;
}
function applyFeedback({ button, duration, announceMessage, eventDetail, state = "copied", eventName = "copy" }) {
  if (button) {
    button.dataset.state = state;
    const prior = resetTimers.get(button);
    if (prior) clearTimeout(prior);
    resetTimers.set(button, setTimeout(() => {
      delete button.dataset.state;
      resetTimers.delete(button);
    }, duration));
    button.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: eventDetail
    }));
  }
  announce(announceMessage, button ?? document.body);
}
async function pasteFromClipboard(target, options = {}) {
  const { button, announceMessage = DEFAULT_PASTE_ANNOUNCE, duration = COPIED_DURATION } = options;
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    return null;
  }
  if (target) {
    if ("value" in target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      target.value = text;
    } else {
      target.textContent = text;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }
  applyFeedback({
    button,
    duration,
    announceMessage,
    eventDetail: { text },
    state: "pasted",
    eventName: "paste"
  });
  return text;
}
function initCopyButtons(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceButton);
}
function enhanceButton(button) {
  if (button.hasAttribute("data-copy-init")) return;
  button.setAttribute("data-copy-init", "");
  button.addEventListener("click", () => {
    if (button.dataset.pasteTarget) {
      const target = document.querySelector(button.dataset.pasteTarget);
      if (!target) return;
      pasteFromClipboard(target, { button });
      return;
    }
    const text = getText(button);
    if (!text) return;
    copyText(text, { button });
  });
}
function getText(button) {
  if (button.dataset.copy) return button.dataset.copy;
  if (button.dataset.copyTarget) {
    const target = document.querySelector(button.dataset.copyTarget);
    if (!target) return "";
    const attr = button.dataset.copyAttr;
    if (attr) return target.getAttribute(attr) ?? "";
    return target.textContent ?? "";
  }
  return "";
}
function announce(message, context) {
  const el2 = document.createElement("div");
  el2.setAttribute("role", "status");
  el2.setAttribute("aria-live", "polite");
  el2.className = "visually-hidden";
  el2.textContent = message;
  context.appendChild(el2);
  setTimeout(() => el2.remove(), ANNOUNCE_DURATION);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCopyButtons());
} else {
  initCopyButtons();
}
var observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el2 = (
        /** @type {Element} */
        node
      );
      if (el2.matches(SELECTOR)) {
        enhanceButton(
          /** @type {HTMLElement} */
          el2
        );
      }
      el2.querySelectorAll(SELECTOR).forEach((child) => enhanceButton(
        /** @type {HTMLElement} */
        child
      ));
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

// src/web-components/color-palette/logic.js
var ColorPalette = class extends VBElement {
  static observedAttributes = ["colors", "names", "layout", "show-values", "show-names", "size", "editable"];
  /** @type {string[]} */
  #colors = [];
  setup() {
    this.#render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }
  #render() {
    const colorsRaw = this.getAttribute("colors") || "";
    const namesRaw = this.getAttribute("names") || "";
    const layout = this.getAttribute("layout") || "inline";
    const size = this.getAttribute("size") || "md";
    const showValues = this.hasAttribute("show-values");
    const showNames = this.hasAttribute("show-names") || namesRaw.length > 0;
    const editable = this.hasAttribute("editable");
    const colors = this.#parseColorList(colorsRaw);
    this.#colors = colors.slice();
    const names = namesRaw ? namesRaw.split(",").map((n) => n.trim()) : [];
    const sizes = { sm: 48, md: 80, lg: 120 };
    const px = sizes[size] || 80;
    let containerStyle = `display:flex;flex-wrap:wrap;gap:var(--size-xs,0.5rem)`;
    if (layout === "grid") {
      containerStyle = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${px}px,1fr));gap:var(--size-xs,0.5rem)`;
    } else if (layout === "list") {
      containerStyle = `display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)`;
    }
    const swatches = colors.map((color, i) => {
      const name = names[i] || "";
      const contrast = this.#contrastColor(color);
      const wrapStyle = layout === "list" ? `display:flex;flex-direction:row;align-items:center;gap:0.75rem` : `display:flex;flex-direction:column;align-items:center;gap:0.25rem;max-inline-size:${px}px`;
      const boxSize = layout === "list" ? 36 : px;
      const buttonStyle = `background:${color};color:${contrast};width:${boxSize}px;height:${boxSize}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0`;
      if (editable) {
        const hexValue = this.#ensureHex(color);
        return `<div class="swatch-wrap" role="listitem" style="${wrapStyle}">
          <label class="color-box color-box-edit" style="${buttonStyle};cursor:pointer" data-index="${i}" title="Click to edit${name ? ": " + name : ""}" aria-label="${name || "Color " + (i + 1)}: ${color}. Click to edit.">
            <input type="color" class="color-input" value="${hexValue}" data-index="${i}" style="position:absolute;inset:0;opacity:0;cursor:pointer;inline-size:100%;block-size:100%" aria-label="${name || "Color " + (i + 1)} picker">
            <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${showValues ? "1" : "0"};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease;pointer-events:none">${this.#formatValue(color)}</span>
          </label>
          ${showNames && name ? `<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>` : ""}
        </div>`;
      }
      return `<div class="swatch-wrap" role="listitem" style="${wrapStyle}">
        <button type="button" class="color-box" data-index="${i}"
          style="${buttonStyle}"
          title="Click to copy${name ? ": " + name : ""}"
          aria-label="${name || "Color " + (i + 1)}: ${color}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${showValues ? "1" : "0"};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${this.#formatValue(color)}</span>
        </button>
        ${showNames && name ? `<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>` : ""}
      </div>`;
    }).join("");
    this.innerHTML = `<div class="palette ${layout}" role="list" aria-label="Color palette" style="${containerStyle}">${swatches}</div>`;
    if (editable) {
      this.#wireEditable(names);
    } else {
      this.#resolveVarColors(colors, names);
      this.#wireReadonly(colors, names, showValues);
    }
  }
  #wireReadonly(colors, names, showValues) {
    this.querySelectorAll(".color-box").forEach((el2) => {
      const btn = (
        /** @type {HTMLElement} */
        el2
      );
      if (!showValues) {
        btn.addEventListener("pointerenter", () => {
          const val = (
            /** @type {HTMLElement | null} */
            btn.querySelector(".color-value")
          );
          if (val) val.style.opacity = "1";
        });
        btn.addEventListener("pointerleave", () => {
          const val = (
            /** @type {HTMLElement | null} */
            btn.querySelector(".color-value")
          );
          if (val) val.style.opacity = "0";
        });
      }
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.index);
        const color = colors[idx];
        const name = names[idx] || "";
        copyText(color, { button: btn, announceMessage: "Color copied" });
        this.dispatchEvent(new CustomEvent("color-palette:select", {
          bubbles: true,
          detail: { color, name, index: idx }
        }));
        btn.style.outline = "3px solid currentColor";
        btn.style.outlineOffset = "2px";
        setTimeout(() => {
          btn.style.outline = "";
          btn.style.outlineOffset = "";
        }, 600);
      });
    });
  }
  #wireEditable(names) {
    this.querySelectorAll(".color-input").forEach((input) => {
      input.addEventListener("input", () => {
        const idx = Number(input.dataset.index);
        const hex = input.value;
        this.#colors[idx] = hex;
        const label = (
          /** @type {HTMLElement | null} */
          input.parentElement
        );
        if (label) {
          label.style.background = hex;
          label.style.color = this.#contrastColor(hex);
          const valSpan = label.querySelector(".color-value");
          if (valSpan) valSpan.textContent = this.#formatValue(hex);
          label.title = `Click to edit${names[idx] ? ": " + names[idx] : ""} (${hex})`;
          label.setAttribute("aria-label", `${names[idx] || "Color " + (idx + 1)}: ${hex}. Click to edit.`);
        }
        this.setAttribute("colors", this.#colors.join(","));
        this.dispatchEvent(new CustomEvent("color-palette:change", {
          bubbles: true,
          detail: {
            color: hex,
            name: names[idx] || "",
            index: idx,
            colors: this.#colors.slice()
          }
        }));
      });
    });
  }
  /** Public accessor — used by sibling components that need the current palette. */
  get colors() {
    return this.#colors.slice();
  }
  /** Resolve var() references to computed hex after swatches are in the DOM */
  #resolveVarColors(colors, names) {
    this.querySelectorAll(".color-box").forEach((btn) => {
      const idx = Number(btn.dataset.index);
      const raw = colors[idx];
      if (!raw || !raw.includes("var(")) return;
      const computed = getComputedStyle(btn).backgroundColor;
      const hex = this.#rgbToHex(computed) || computed;
      colors[idx] = hex;
      this.#colors[idx] = hex;
      const val = btn.querySelector(".color-value");
      if (val) val.textContent = hex;
      btn.style.color = this.#contrastColor(hex);
      const name = names[idx] || "";
      btn.title = `Click to copy${name ? ": " + name : ""} (${hex})`;
      btn.setAttribute("aria-label", `${name || "Color " + (idx + 1)}: ${hex}`);
    });
  }
  /** Convert rgb(r, g, b) to hex string */
  #rgbToHex(rgb) {
    const m = rgb.match(/rgba?\(\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/);
    if (!m) return null;
    const [, r, g, b] = m;
    const toHex = (n) => Math.round(Number(n)).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  /** Ensure a color string is a #rrggbb hex suitable for input type="color". */
  #ensureHex(color) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(color)) {
      return ("#" + color.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
    }
    if (typeof document === "undefined") return "#000000";
    const probe = document.createElement("span");
    probe.style.color = color;
    probe.style.display = "none";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return this.#rgbToHex(computed) || "#000000";
  }
  /** Shorten oklch values for display */
  #formatValue(color) {
    if (color.startsWith("#")) return color;
    const oklch = color.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
    if (oklch) return `${oklch[1]}% .${oklch[2].replace("0.", "")}`;
    return color.length > 12 ? color.slice(0, 12) + "\u2026" : color;
  }
  /** Parse comma-separated color list, handling oklch() which contains commas */
  #parseColorList(raw) {
    if (!raw) return [];
    const colors = [];
    let depth = 0;
    let current = "";
    for (const ch of raw) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        colors.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) colors.push(current.trim());
    return colors;
  }
  /** Return black or white depending on perceived lightness */
  #contrastColor(color) {
    const oklchMatch = color.match(/oklch\(\s*([\d.]+)%?\s/);
    if (oklchMatch) {
      const L = parseFloat(oklchMatch[1]);
      const lightness = L > 1 ? L / 100 : L;
      return lightness > 0.6 ? "#000" : "#fff";
    }
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return lum > 0.4 ? "#000" : "#fff";
    }
    return "#000";
  }
};
registerComponent("color-palette", ColorPalette);

// src/web-components/color-picker/_color-utils.js
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255)
  };
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const n = parseInt(hex, 16);
  return {
    r: n >> 16 & 255,
    g: n >> 8 & 255,
    b: n & 255
  };
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(
    (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
  ).join("");
}
function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}
function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// src/web-components/palette-generator/_palette-utils.js
var wrap = (h) => (h % 360 + 360) % 360;
function complementary(h, s, l) {
  return {
    colors: [hslToHex(h, s, l), hslToHex(wrap(h + 180), s, l)],
    names: ["Base", "Complement"]
  };
}
function analogous(h, s, l) {
  return {
    colors: [
      hslToHex(wrap(h - 30), s, l),
      hslToHex(h, s, l),
      hslToHex(wrap(h + 30), s, l)
    ],
    names: ["Analog A", "Base", "Analog B"]
  };
}
function triadic(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 120), s, l),
      hslToHex(wrap(h + 240), s, l)
    ],
    names: ["Base", "Triad A", "Triad B"]
  };
}
function splitComplementary(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 150), s, l),
      hslToHex(wrap(h + 210), s, l)
    ],
    names: ["Base", "Split A", "Split B"]
  };
}
function tetradic(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 90), s, l),
      hslToHex(wrap(h + 180), s, l),
      hslToHex(wrap(h + 270), s, l)
    ],
    names: ["Base", "Tetrad A", "Tetrad B", "Tetrad C"]
  };
}
var MONO_STEPS = [
  { label: "50", l: 96 },
  { label: "100", l: 90 },
  { label: "200", l: 80 },
  { label: "300", l: 70 },
  { label: "400", l: 60 },
  { label: "500", l: 50 },
  { label: "600", l: 40 },
  { label: "700", l: 30 },
  { label: "800", l: 22 },
  { label: "900", l: 15 },
  { label: "950", l: 10 }
];
function monochromatic(h, s, _l) {
  const colors = [];
  const names = [];
  for (const step of MONO_STEPS) {
    const satAdj = step.l > 85 || step.l < 20 ? Math.max(s * 0.6, 5) : s;
    colors.push(hslToHex(h, Math.round(satAdj), step.l));
    names.push(step.label);
  }
  return { colors, names };
}
var algorithms = {
  complementary,
  analogous,
  triadic,
  "split-complementary": splitComplementary,
  tetradic,
  monochromatic
};
function generatePalette(hex, harmony) {
  const { h, s, l } = hexToHsl(hex);
  const fn = algorithms[harmony] || algorithms.complementary;
  return fn(h, s, l);
}

// src/web-components/palette-generator/logic.js
var PaletteGenerator = class extends VBElement {
  static observedAttributes = [
    "seed",
    "harmony",
    "include-seed",
    "show-export",
    "layout",
    "size",
    "show-values",
    "show-names"
  ];
  /** @type {HTMLElement|null} */
  #pickerEl = null;
  /** @type {string} */
  #currentSeed = "";
  /** @type {string[]} */
  #colors = [];
  /** @type {string[]} */
  #names = [];
  setup() {
    this.#pickerEl = this.querySelector("color-picker") || this.querySelector('input[type="color"]');
    this.#currentSeed = this.#resolveSeed();
    if (!this.#currentSeed) return;
    this.#render();
    this.#wireInteractive();
    this.#emitGenerate();
  }
  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute("data-upgraded")) {
      this.#currentSeed = this.#resolveSeed();
      if (this.#currentSeed) this.#render();
    }
  }
  /** Extract seed hex from the picker element or seed attribute */
  #resolveSeed() {
    if (this.#pickerEl) {
      const cp = (
        /** @type {any} */
        this.#pickerEl
      );
      if (cp.tagName === "COLOR-PICKER") {
        const val = cp.value;
        if (val && val !== "#000000") return val;
        const input = (
          /** @type {HTMLInputElement | null} */
          cp.querySelector('input[type="color"]')
        );
        return input?.value || val || "";
      }
      return cp.value || "";
    }
    return this.getAttribute("seed") || "";
  }
  /** Render the full component: picker area + swatches + export toolbar */
  #render() {
    const harmony = this.getAttribute("harmony") || "complementary";
    const layout = this.getAttribute("layout") || "inline";
    const size = this.getAttribute("size") || "md";
    const showValues = this.hasAttribute("show-values");
    const showNames = this.hasAttribute("show-names");
    const showExport = this.hasAttribute("show-export");
    const { colors, names } = generatePalette(this.#currentSeed, harmony);
    this.#colors = colors;
    this.#names = names;
    const sizes = { sm: 48, md: 80, lg: 120 };
    const px = sizes[size] || 80;
    let containerStyle = `display:flex;flex-wrap:wrap;gap:var(--size-xs,0.5rem)`;
    if (layout === "grid") {
      containerStyle = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${px}px,1fr));gap:var(--size-xs,0.5rem)`;
    } else if (layout === "list") {
      containerStyle = `display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)`;
    }
    const swatches = colors.map((color, i) => {
      const name = names[i] || "";
      const contrast = this.#contrastColor(color);
      const wrapStyle = layout === "list" ? `display:flex;flex-direction:row;align-items:center;gap:0.75rem` : `display:flex;flex-direction:column;align-items:center;gap:0.25rem;max-inline-size:${px}px`;
      const boxSize = layout === "list" ? 36 : px;
      const formatted = color.length > 12 ? color.slice(0, 12) + "\u2026" : color;
      return `<div class="swatch-wrap" role="listitem" style="${wrapStyle}">
        <button type="button" class="color-box" data-index="${i}"
          style="background:${color};color:${contrast};width:${boxSize}px;height:${boxSize}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0"
          title="Click to copy${name ? ": " + name : ""}"
          aria-label="${name || "Color " + (i + 1)}: ${color}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${showValues ? "1" : "0"};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${formatted}</span>
        </button>
        ${showNames && name ? `<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>` : ""}
      </div>`;
    }).join("");
    let exportHTML = "";
    if (showExport) {
      exportHTML = `<div class="pg-export" role="toolbar" aria-label="Export palette" style="display:flex;gap:0.5rem;margin-block-start:var(--size-xs,0.5rem)">
        <button type="button" class="pg-copy-hex" style="padding:0.25rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#333);cursor:pointer;font-size:var(--font-size-xs,0.75rem);font-family:inherit">Copy Hex</button>
        <button type="button" class="pg-copy-css" style="padding:0.25rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#333);cursor:pointer;font-size:var(--font-size-xs,0.75rem);font-family:inherit">Copy CSS</button>
      </div>`;
    }
    const pickerEl = this.#pickerEl;
    for (const child of [...this.children]) {
      if (child === pickerEl) continue;
      if (child.classList?.contains("pg-seed-label")) continue;
      child.remove();
    }
    if (pickerEl && !this.querySelector(".pg-seed-label")) {
      const label = document.createElement("span");
      label.className = "pg-seed-label";
      label.textContent = "Seed Color";
      pickerEl.before(label);
    }
    const paletteDiv = document.createElement("div");
    paletteDiv.className = `palette ${layout}`;
    paletteDiv.setAttribute("role", "list");
    paletteDiv.setAttribute("aria-label", "Color palette");
    paletteDiv.style.cssText = containerStyle;
    paletteDiv.innerHTML = swatches;
    if (pickerEl) {
      pickerEl.after(paletteDiv);
    } else {
      this.prepend(paletteDiv);
    }
    if (exportHTML) {
      const tmp = document.createElement("div");
      tmp.innerHTML = exportHTML;
      if (tmp.firstElementChild) this.append(tmp.firstElementChild);
    }
    this.#wireSwatches(paletteDiv, colors, names, showValues);
    if (showExport) {
      this.#wireExport();
    }
  }
  /** Wire click-to-copy and hover on swatches */
  #wireSwatches(container, colors, names, showValues) {
    container.querySelectorAll(".color-box").forEach((el2) => {
      const btn = (
        /** @type {HTMLElement} */
        el2
      );
      if (!showValues) {
        btn.addEventListener("pointerenter", () => {
          const val = (
            /** @type {HTMLElement | null} */
            btn.querySelector(".color-value")
          );
          if (val) val.style.opacity = "1";
        });
        btn.addEventListener("pointerleave", () => {
          const val = (
            /** @type {HTMLElement | null} */
            btn.querySelector(".color-value")
          );
          if (val) val.style.opacity = "0";
        });
      }
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.index);
        const color = colors[idx];
        const name = names[idx] || "";
        copyText(color, { button: btn, announceMessage: "Color copied" });
        this.dispatchEvent(new CustomEvent("color-palette:select", {
          bubbles: true,
          detail: { color, name, index: idx }
        }));
        btn.style.outline = "3px solid currentColor";
        btn.style.outlineOffset = "2px";
        setTimeout(() => {
          btn.style.outline = "";
          btn.style.outlineOffset = "";
        }, 600);
      });
    });
  }
  /** Wire up interactive picker for live regeneration */
  #wireInteractive() {
    const cp = this.#pickerEl;
    if (!cp) return;
    if (cp.tagName === "COLOR-PICKER") {
      this.listen(cp, "color-picker:change", (e) => {
        this.#currentSeed = /** @type {CustomEvent} */
        e.detail.hex;
        this.#render();
        this.#emitGenerate();
      });
    } else {
      this.listen(cp, "input", () => {
        this.#currentSeed = /** @type {any} */
        cp.value;
        this.#render();
        this.#emitGenerate();
      });
    }
  }
  /** Wire export toolbar buttons */
  #wireExport() {
    const hexBtn = this.querySelector(".pg-copy-hex");
    const cssBtn = this.querySelector(".pg-copy-css");
    if (hexBtn) {
      hexBtn.addEventListener("click", () => {
        copyText(this.#colors.join(", "), {
          button: (
            /** @type {HTMLElement} */
            hexBtn
          ),
          announceMessage: "Hex values copied"
        });
      });
    }
    if (cssBtn) {
      cssBtn.addEventListener("click", () => {
        const harmony = this.getAttribute("harmony") || "complementary";
        const css = this.#formatCSSExport(harmony);
        copyText(css, {
          button: (
            /** @type {HTMLElement} */
            cssBtn
          ),
          announceMessage: "CSS variables copied"
        });
      });
    }
  }
  /** Return black or white depending on perceived lightness */
  #contrastColor(color) {
    if (color.startsWith("#")) {
      const { r, g, b } = hexToRgb(color);
      const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
      return lum > 0.4 ? "#000" : "#fff";
    }
    return "#000";
  }
  /** Format colors as CSS custom properties */
  #formatCSSExport(harmony) {
    if (harmony === "monochromatic") {
      return this.#colors.map((c, i) => `--color-seed-${this.#names[i] || i + 1}: ${c};`).join("\n");
    }
    return this.#colors.map((c, i) => {
      const name = this.#names[i] ? this.#names[i].toLowerCase().replace(/\s+/g, "-") : `${i + 1}`;
      return `--palette-${name}: ${c};`;
    }).join("\n");
  }
  #emitGenerate() {
    const harmony = this.getAttribute("harmony") || "complementary";
    this.dispatchEvent(new CustomEvent("palette-generator:generate", {
      bubbles: true,
      detail: { colors: [...this.#colors], harmony, seed: this.#currentSeed }
    }));
  }
};
registerComponent("palette-generator", PaletteGenerator);

// src/web-components/type-specimen/logic.js
var QUICK_FONTS = ["system-ui", "Georgia", "Inter, sans-serif", '"JetBrains Mono", monospace', "Verdana", "Cambria", "ui-serif"];
var TypeSpecimen = class extends VBElement {
  static observedAttributes = ["font-family", "label", "sample", "show-scale", "show-weights", "show-characters", "weights", "editable", "target", "token"];
  setup() {
    this.#render();
    this.#wireEditing();
  }
  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#wireEditing();
    }
  }
  #render() {
    const fontFamily = this.getAttribute("font-family") || "system-ui";
    const label = this.getAttribute("label") || fontFamily.replace(/['"]/g, "").split(",")[0];
    const sample = this.getAttribute("sample") || "The quick brown fox jumps over the lazy dog";
    const showScale = this.hasAttribute("show-scale");
    const showWeights = this.hasAttribute("show-weights");
    const showChars = this.hasAttribute("show-characters");
    const weightsAttr = this.getAttribute("weights") || "300,400,500,600,700";
    const weights = weightsAttr.split(",").map((w) => w.trim());
    let html = "";
    const editable = this.hasAttribute("editable");
    const labelHTML = editable ? `<input type="text" class="specimen-font-input" value="${fontFamily.replace(/"/g, "&quot;")}" aria-label="Font family" style="font:inherit;padding:0.25rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);min-inline-size:18rem;max-inline-size:100%;font-family:${fontFamily};font-size:var(--font-size-sm,0.875rem)">
          <span class="specimen-quick" style="display:inline-flex;flex-wrap:wrap;gap:0.25rem;margin-inline-start:0.5rem">
            ${QUICK_FONTS.map((f) => `<button type="button" class="specimen-quick-btn" data-font="${f.replace(/"/g, "&quot;")}" style="font:inherit;font-size:var(--font-size-xs,0.75rem);padding:0.125rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:999px;background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer">${f.split(",")[0].replace(/["']/g, "")}</button>`).join("")}
          </span>` : `<span class="specimen-label">${label}</span>`;
    html += `<div class="specimen-header" style="font-family:${fontFamily}">
      ${labelHTML}
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${sample}</p>
    </div>`;
    if (showChars) {
      html += `<div class="specimen-chars" style="font-family:${fontFamily}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map((c) => `<span>${c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c}</span>`).join("")}</div>
      </div>`;
    }
    if (showWeights) {
      html += `<div class="specimen-weights">`;
      for (const w of weights) {
        html += `<div class="weight-sample" style="font-family:${fontFamily};font-weight:${w}">
          <span class="weight-label">${w}</span>
          <span class="weight-text">Aa</span>
        </div>`;
      }
      html += `</div>`;
    }
    if (showScale) {
      const scale = [
        { name: "xs", rem: 0.75 },
        { name: "sm", rem: 0.875 },
        { name: "md", rem: 1 },
        { name: "lg", rem: 1.125 },
        { name: "xl", rem: 1.25 },
        { name: "2xl", rem: 1.5 },
        { name: "3xl", rem: 1.875 },
        { name: "4xl", rem: 2.25 },
        { name: "5xl", rem: 3 }
      ];
      html += `<div class="specimen-scale">`;
      for (const step of scale) {
        html += `<div class="scale-step" style="font-family:${fontFamily};font-size:${step.rem}rem">
          <span class="scale-label">${step.name}</span>
          <span class="scale-text">${sample.substring(0, 30)}</span>
        </div>`;
      }
      html += `</div>`;
    }
    this.innerHTML = html;
  }
  #wireEditing() {
    if (!this.hasAttribute("editable")) return;
    const input = (
      /** @type {HTMLInputElement | null} */
      this.querySelector(".specimen-font-input")
    );
    if (input) {
      this.listen(input, "input", () => this.#applyFontFamily(input.value));
    }
    this.querySelectorAll(".specimen-quick-btn").forEach((btn) => {
      this.listen(btn, "click", () => {
        const font = btn.getAttribute("data-font") || "";
        if (input) input.value = font;
        this.#applyFontFamily(font);
      });
    });
  }
  #applyFontFamily(value) {
    const target = (
      /** @type {HTMLElement | null} */
      this.#resolveTarget()
    );
    const token = this.getAttribute("token") || "font-family-base";
    if (target) target.style.setProperty(`--${token}`, value);
    this.setAttribute("font-family", value);
    this.dispatchEvent(new CustomEvent("type-specimen:change", {
      bubbles: true,
      detail: { fontFamily: value, token, target: this.getAttribute("target") || ":root" }
    }));
  }
  #resolveTarget() {
    const sel = this.getAttribute("target") || ":root";
    try {
      return sel === ":root" ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }
};
registerComponent("type-specimen", TypeSpecimen);

// src/web-components/spacing-specimen/logic.js
var SpacingSpecimen = class extends VBElement {
  static observedAttributes = ["tokens", "prefix", "show-values", "label", "editable", "target"];
  setup() {
    this.#render();
    this.#wireEditing();
  }
  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#wireEditing();
    }
  }
  #render() {
    const tokensAttr = this.getAttribute("tokens") || "3xs,2xs,xs,s,m,l,xl,2xl,3xl";
    const prefix = this.getAttribute("prefix") || "--size-";
    const showValues = this.getAttribute("show-values") !== "false";
    const label = this.getAttribute("label") || "";
    const editable = this.hasAttribute("editable");
    const tokens = tokensAttr.split(",").map((t) => t.trim());
    let html = "";
    if (label) {
      html += `<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</div>`;
    }
    html += `<div role="list" aria-label="${label || "Spacing scale"}" style="display:flex;flex-direction:column;gap:0.25rem">`;
    for (const name of tokens) {
      const varName = `${prefix}${name}`;
      const valueControl = editable ? `<input type="text" class="scale-edit" data-token="${name}" aria-label="${name} value" style="font-family:var(--font-mono,monospace);font-size:0.75rem;padding:0.125rem 0.375rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);inline-size:6rem;text-align:end">` : showValues ? `<span class="scale-value" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>` : "";
      html += `<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
        <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
        <div class="scale-bar" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${varName});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
        ${valueControl}
      </div>`;
    }
    html += "</div>";
    this.innerHTML = html;
    requestAnimationFrame(() => {
      if (editable) {
        const cs = getComputedStyle(this);
        this.querySelectorAll(".scale-edit").forEach((node) => {
          const input = (
            /** @type {HTMLInputElement} */
            node
          );
          const name = input.getAttribute("data-token");
          const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
          input.value = raw || "";
        });
      } else if (showValues) {
        this.querySelectorAll(".scale-bar").forEach((bar) => {
          const px = bar.getBoundingClientRect().width;
          const valueEl = bar.nextElementSibling;
          if (valueEl) valueEl.textContent = `${Math.round(px * 100) / 100}px`;
        });
      }
    });
  }
  #wireEditing() {
    if (!this.hasAttribute("editable")) return;
    const prefix = this.getAttribute("prefix") || "--size-";
    this.querySelectorAll(".scale-edit").forEach((input) => {
      this.listen(input, "change", () => this.#applyTokenEdit(input, prefix));
      this.listen(input, "keydown", (e) => {
        if (
          /** @type {KeyboardEvent} */
          e.key === "Enter"
        ) this.#applyTokenEdit(input, prefix);
      });
    });
  }
  #applyTokenEdit(input, prefix) {
    const name = input.getAttribute("data-token");
    const value = input.value.trim();
    if (!name || !value) return;
    const target = (
      /** @type {HTMLElement | null} */
      this.#resolveTarget()
    );
    const token = `${prefix}${name}`;
    if (target) target.style.setProperty(token, value);
    this.dispatchEvent(new CustomEvent("spacing-specimen:change", {
      bubbles: true,
      detail: { name, value, token, target: this.getAttribute("target") || ":root" }
    }));
  }
  #resolveTarget() {
    const sel = this.getAttribute("target") || ":root";
    try {
      return sel === ":root" ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }
};
registerComponent("spacing-specimen", SpacingSpecimen);

// src/web-components/token-specimen/logic.js
var TYPE_DEFAULTS = {
  shadow: {
    prefix: "--shadow-",
    tokens: "xs,s,m,l,xl,2xl"
  },
  radius: {
    prefix: "--radius-",
    tokens: "xs,s,m,l,xl,2xl,full"
  },
  border: {
    prefix: "--border-width-",
    tokens: "thin,medium,thick"
  },
  color: {
    prefix: "--color-",
    tokens: "primary,secondary,accent,success,warning,error,info"
  },
  size: {
    prefix: "--size-",
    tokens: "3xs,2xs,xs,s,m,l,xl,2xl,3xl"
  },
  icon: {
    prefix: "",
    tokens: "home,search,settings,user,bell,heart,star,check,x,chevron-right,menu,trash"
  }
};
var RENDERERS = {
  shadow: renderShadow,
  radius: renderRadius,
  border: renderBorder,
  color: renderColor,
  size: renderSize,
  icon: renderIcon
};
var TokenSpecimen = class extends VBElement {
  static observedAttributes = ["type", "tokens", "prefix", "show-values", "label", "size", "icon-set", "editable", "target"];
  setup() {
    this.#render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }
  #render() {
    const type = this.getAttribute("type") || "shadow";
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.shadow;
    const prefix = this.getAttribute("prefix") || defaults.prefix;
    const tokensAttr = this.getAttribute("tokens") || defaults.tokens;
    const showValues = this.getAttribute("show-values") !== "false";
    const label = this.getAttribute("label") || "";
    const tokens = tokensAttr.split(",").map((t) => t.trim());
    const renderer = RENDERERS[type] || RENDERERS.shadow;
    let html = "";
    if (label) {
      html += `<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</p>`;
    }
    html += renderer(tokens, prefix, showValues, this);
    this.innerHTML = html;
    const editable = this.hasAttribute("editable") && type !== "icon";
    if (showValues && type !== "icon") {
      requestAnimationFrame(() => {
        this.#readComputedValues(type, prefix, tokens);
        if (editable) this.#injectEditors(type, prefix);
      });
    } else if (editable) {
      requestAnimationFrame(() => this.#injectEditors(type, prefix));
    }
  }
  #injectEditors(type, prefix) {
    const cs = getComputedStyle(this);
    this.querySelectorAll("[data-token-value]").forEach((node) => {
      const el2 = (
        /** @type {HTMLElement} */
        node
      );
      const name = el2.dataset.tokenValue;
      const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
      const input = document.createElement("input");
      input.type = type === "color" && /^#[0-9a-f]{3,8}$/i.test(raw) ? "color" : "text";
      input.value = raw || "";
      input.className = "ts-edit";
      input.setAttribute("data-token", name || "");
      input.setAttribute("aria-label", `${name} value`);
      input.style.cssText = `font-family:var(--font-mono,monospace);font-size:0.625rem;padding:0.125rem 0.25rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);inline-size:${type === "color" ? "3rem" : "100%"};${type === "color" ? "block-size:1.5rem;padding:0;" : "max-inline-size:8rem;"}`;
      el2.replaceWith(input);
      this.listen(input, "change", () => this.#applyEdit(input, prefix));
      this.listen(input, "keydown", (e) => {
        if (
          /** @type {KeyboardEvent} */
          e.key === "Enter"
        ) this.#applyEdit(input, prefix);
      });
    });
  }
  #applyEdit(input, prefix) {
    const name = input.getAttribute("data-token");
    const value = input.value.trim();
    if (!name || !value) return;
    const target = (
      /** @type {HTMLElement | null} */
      this.#resolveTarget()
    );
    const token = `${prefix}${name}`;
    if (target) target.style.setProperty(token, value);
    this.dispatchEvent(new CustomEvent("token-specimen:change", {
      bubbles: true,
      detail: { name, value, token, target: this.getAttribute("target") || ":root" }
    }));
  }
  #resolveTarget() {
    const sel = this.getAttribute("target") || ":root";
    try {
      return sel === ":root" ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }
  #readComputedValues(type, prefix, tokens) {
    const cs = getComputedStyle(this);
    this.querySelectorAll("[data-token-value]").forEach((node) => {
      const el2 = (
        /** @type {HTMLElement} */
        node
      );
      const name = el2.dataset.tokenValue;
      const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
      if (type === "radius" || type === "size") {
        const sample = this.querySelector(`[data-token-sample="${name}"]`);
        if (sample) {
          const prop = type === "radius" ? "borderRadius" : "width";
          const rect = type === "size" ? sample.getBoundingClientRect().width : null;
          el2.textContent = rect != null ? `${Math.round(rect * 100) / 100}px` : raw || "\u2014";
        }
      } else {
        el2.textContent = raw || "\u2014";
      }
    });
  }
};
function renderShadow(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div style="width:7rem;height:5rem;background:var(--color-surface,#fff);border-radius:var(--radius-m,0.5rem);box-shadow:var(${prefix}${name})" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);margin-block-start:0.5rem">${name}</p>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);max-width:7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
function renderRadius(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div data-token-sample="${name}" style="width:4.5rem;height:4.5rem;background:var(--color-primary,oklch(55% 0.2 260));border-radius:var(${prefix}${name});display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-family:var(--font-mono,monospace)" aria-hidden="true">${name}</div>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);margin-block-start:0.25rem"></p>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
function renderBorder(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-direction:column;gap:0.75rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:grid;grid-template-columns:4rem 1fr auto;align-items:center;gap:0.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
      <div style="border-block-start:var(${prefix}${name}) solid var(--color-text,#333);min-inline-size:4rem" aria-hidden="true"></div>
      ${showValues ? `<span data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums"></span>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
function renderColor(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:0.75rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div style="width:4rem;height:3rem;background:var(${prefix}${name});border-radius:var(--radius-s,0.25rem);border:1px solid var(--color-border,#ddd)" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#666);margin-block-start:0.25rem">${name}</p>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.5625rem;color:var(--color-text-muted,#999);max-width:4rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
function renderSize(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-direction:column;gap:0.25rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
      <div data-token-sample="${name}" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${prefix}${name});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
      ${showValues ? `<span data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
function renderIcon(tokens, _prefix, showValues, host) {
  const size = host?.getAttribute("size") || "md";
  const iconSet = host?.getAttribute("icon-set") || "";
  const setAttr = iconSet ? ` set="${iconSet}"` : "";
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:flex;flex-direction:column;align-items:center;gap:0.375rem;min-inline-size:4.5rem">
      <span style="display:inline-flex;align-items:center;justify-content:center;padding:var(--size-s,0.75rem);background:var(--color-surface-raised,#f5f5f5);border-radius:var(--radius-s,0.25rem);border:1px solid var(--color-border,#ddd);color:var(--color-text,#222)">
        <icon-wc name="${name}" size="${size}"${setAttr}></icon-wc>
      </span>
      ${showValues ? `<code style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#666);max-inline-size:5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</code>` : ""}
    </div>`;
  }
  html += "</div>";
  return html;
}
registerComponent("token-specimen", TokenSpecimen);

// src/web-components/component-sampler/logic.js
var COMPONENT_RENDERERS = {
  button: () => `
    <layout-cluster data-layout-gap="s">
      <button>Primary</button>
      <button class="secondary">Secondary</button>
      <button disabled>Disabled</button>
    </layout-cluster>`,
  input: () => `
    <layout-stack data-layout-gap="xs">
      <input type="text" placeholder="Text input" aria-label="Sample text input"/>
      <input type="email" placeholder="email@example.com" aria-label="Sample email"/>
      <input type="text" value="Read only" readonly aria-label="Read-only input"/>
    </layout-stack>`,
  select: () => `
    <select aria-label="Sample select">
      <option>Choose an option</option>
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>`,
  checkbox: () => `
    <layout-stack data-layout-gap="xs">
      <label><input type="checkbox" checked="checked"/> Checked option</label>
      <label><input type="checkbox"/> Unchecked option</label>
      <label><input type="checkbox" disabled/> Disabled option</label>
    </layout-stack>`,
  radio: () => `
    <layout-stack data-layout-gap="xs">
      <label><input type="radio" name="sampler-radio" checked="checked"/> Selected</label>
      <label><input type="radio" name="sampler-radio"/> Unselected</label>
      <label><input type="radio" name="sampler-radio" disabled/> Disabled</label>
    </layout-stack>`,
  badge: () => `
    <layout-cluster data-layout-gap="xs">
      <layout-badge>Default</layout-badge>
      <layout-badge data-color="success">Success</layout-badge>
      <layout-badge data-color="warning">Warning</layout-badge>
      <layout-badge data-color="danger">Danger</layout-badge>
      <layout-badge data-color="info">Info</layout-badge>
    </layout-cluster>`,
  progress: () => `
    <layout-stack data-layout-gap="xs">
      <progress value="33" max="100">33%</progress>
      <progress value="66" max="100">66%</progress>
      <progress value="100" max="100">100%</progress>
    </layout-stack>`,
  range: () => `
    <input type="range" min="0" max="100" value="50" aria-label="Sample range"/>`,
  textarea: () => `
    <textarea rows="3" placeholder="Textarea sample" aria-label="Sample textarea" style="width:100%"></textarea>`
};
var ComponentSampler = class extends VBElement {
  static observedAttributes = ["components", "label", "compact"];
  setup() {
    this.#render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }
  #render() {
    const componentsAttr = this.getAttribute("components") || "button,input,select,checkbox,radio,badge,progress";
    const label = this.getAttribute("label") || "";
    const compact = this.hasAttribute("compact");
    const components2 = componentsAttr.split(",").map((c) => c.trim());
    const gap = compact ? "0.75rem" : "1.25rem";
    let html = "";
    if (label) {
      html += `<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</p>`;
    }
    html += `<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:${gap}">`;
    for (const name of components2) {
      const renderer = COMPONENT_RENDERERS[name];
      if (!renderer) continue;
      html += `<article style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);background:var(--color-surface,#fff)">
        <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#999);margin-block-end:var(--size-s,0.5rem);font-family:var(--font-sans,system-ui)">${name}</p>
        ${renderer()}
      </article>`;
    }
    html += "</section>";
    this.innerHTML = html;
  }
};
registerComponent("component-sampler", ComponentSampler);

// src/web-components/semantic-palette/_color-math.js
var srgbToLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
var linearToSrgb = (c) => c <= 31308e-7 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);
  const lcone = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const mcone = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const scone = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const lp = Math.cbrt(lcone);
  const mp = Math.cbrt(mcone);
  const sp = Math.cbrt(scone);
  const L = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
  const A = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
  const B = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
  const c = Math.sqrt(A * A + B * B);
  let h = Math.atan2(B, A) * 180 / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}
function oklchToHex(l, c, h) {
  const hr = h * Math.PI / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const lp = l + 0.3963377774 * A + 0.2158037573 * B;
  const mp = l - 0.1055613458 * A - 0.0638541728 * B;
  const sp = l - 0.0894841775 * A - 1.291485548 * B;
  const lcone = lp * lp * lp;
  const mcone = mp * mp * mp;
  const scone = sp * sp * sp;
  const lr = 4.0767416621 * lcone - 3.3077115913 * mcone + 0.2309699292 * scone;
  const lg = -1.2684380046 * lcone + 2.6097574011 * mcone - 0.3413193965 * scone;
  const lb = -0.0041960863 * lcone - 0.7034186147 * mcone + 1.707614701 * scone;
  const r = clamp01(linearToSrgb(lr));
  const g = clamp01(linearToSrgb(lg));
  const b = clamp01(linearToSrgb(lb));
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}
function resolveToHex(input, probeEl) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return ("#" + s.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
  }
  if (typeof document === "undefined") return null;
  const probe = probeEl || document.createElement("span");
  if (!probeEl) {
    probe.style.display = "none";
    document.body.appendChild(probe);
  }
  probe.style.color = "";
  probe.style.color = s;
  const computed = getComputedStyle(probe).color;
  if (!probeEl) probe.remove();
  const m = computed.match(/rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/);
  if (!m) return null;
  return rgbToHex(Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3]));
}
function formatOklch({ l, c, h }) {
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
}
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function wcagLevel(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}
function pickContrastingHex(hex) {
  return relativeLuminance(hex) > 0.4 ? "#000000" : "#ffffff";
}

// src/web-components/semantic-palette/logic.js
var BRAND_ROLES = ["primary", "secondary", "accent"];
var STATUS_ROLES = ["success", "warning", "error", "info"];
var ALL_ROLES = [...BRAND_ROLES, ...STATUS_ROLES];
var ROLE_LABELS = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  warning: "Warning",
  error: "Error",
  info: "Info"
};
var LEVEL_COLORS = {
  aaa: { bg: "oklch(92% 0.08 145)", fg: "oklch(30% 0.12 145)" },
  aa: { bg: "oklch(94% 0.08 90)", fg: "oklch(35% 0.12 70)" },
  fail: { bg: "oklch(92% 0.08 25)", fg: "oklch(35% 0.15 25)" }
};
var MONO = "var(--font-mono, monospace)";
var MUTED = "var(--color-text-muted, #666)";
var BORDER = "var(--color-border, #ddd)";
var SURFACE = "var(--color-surface, #fff)";
var TEXT = "var(--color-text, #222)";
var RADIUS_S = "var(--radius-s, 0.25rem)";
var RADIUS_M = "var(--radius-m, 0.5rem)";
var SemanticPalette = class extends VBElement {
  static observedAttributes = ["colors", "roles", "show-export", "label"];
  /** @type {string[]} */
  #colors = [];
  /** @type {string[]} */
  #roles = [];
  /** @type {HTMLElement|null} */
  #source = null;
  /** @type {HTMLElement|null} */
  #previews = null;
  /** @type {HTMLElement|null} */
  #probe = null;
  setup() {
    this.#probe = document.createElement("span");
    this.#probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
    this.append(this.#probe);
    this.#source = this.querySelector("color-palette, palette-generator");
    this.#resolveRoles();
    this.#readColors();
    this.#renderShell();
    this.#renderPreviews("init");
    this.#wireSource();
    this.#wireExport();
    this.#emitChange("init");
  }
  attributeChangedCallback(name) {
    if (!this.isConnected || !this.hasAttribute("data-upgraded")) return;
    if (name === "roles") this.#resolveRoles();
    if (name === "colors") this.#readColors();
    this.#renderShell();
    this.#renderPreviews("attribute");
    this.#wireExport();
    this.#emitChange("attribute");
  }
  teardown() {
    this.#probe?.remove();
    this.#probe = null;
  }
  // ── Source + state ─────────────────────────────────────────────────
  #readColors() {
    const cp = this.querySelector("color-palette");
    if (cp) {
      if (typeof /** @type {any} */
      cp.colors !== "undefined" && /** @type {any} */
      cp.colors.length) {
        this.#colors = /** @type {any} */
        cp.colors.slice();
        return;
      }
      const raw2 = cp.getAttribute("colors") || "";
      const parsed = raw2.split(",").map((s) => s.trim()).filter(Boolean);
      if (parsed.length) {
        this.#colors = parsed;
        return;
      }
    }
    const pg = this.querySelector("palette-generator");
    if (pg) {
      const seed = pg.getAttribute("seed") || /** @type {HTMLInputElement | null} */
      pg.querySelector('input[type="color"]')?.value || "";
      const harmony = pg.getAttribute("harmony") || "complementary";
      if (seed) {
        try {
          const { colors } = generatePalette(seed, harmony);
          this.#colors = colors.slice();
          return;
        } catch {
        }
      }
    }
    const raw = this.getAttribute("colors") || "";
    this.#colors = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  #resolveRoles() {
    const raw = this.getAttribute("roles") || BRAND_ROLES.join(",");
    const roles = raw.split(",").map((s) => s.trim().toLowerCase()).filter((r) => ALL_ROLES.includes(r));
    this.#roles = roles.length ? roles : [...BRAND_ROLES];
  }
  #mapping() {
    const map = {};
    for (let i = 0; i < this.#roles.length; i++) {
      map[this.#roles[i]] = this.#colors[i] || this.#colors[this.#colors.length - 1] || "#888888";
    }
    return map;
  }
  // ── Render ─────────────────────────────────────────────────────────
  #renderShell() {
    const existing = this.querySelector(":scope > .sp-shell");
    if (existing) existing.remove();
    const label = this.getAttribute("label");
    const showExport = this.hasAttribute("show-export");
    const shell = document.createElement("div");
    shell.className = "sp-shell";
    shell.style.cssText = "display:flex;flex-direction:column;gap:var(--size-m,1rem);margin-block-start:var(--size-s,0.75rem)";
    if (label) {
      const p = document.createElement("p");
      p.style.cssText = "font-weight:600;margin:0";
      p.textContent = label;
      shell.append(p);
    }
    const previews = document.createElement("section");
    previews.className = "sp-previews";
    previews.setAttribute("aria-label", "Role previews");
    previews.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(min(22rem,100%),1fr));gap:var(--size-m,1rem)`;
    shell.append(previews);
    this.#previews = previews;
    if (showExport) {
      shell.insertAdjacentHTML("beforeend", this.#renderExport());
    }
    this.append(shell);
  }
  #renderPreviews(_source) {
    if (!this.#previews) return;
    const map = this.#mapping();
    this.#previews.innerHTML = this.#roles.map((role) => this.#renderCard(role, map[role])).join("");
  }
  #renderCard(role, hex) {
    const roleLabel = ROLE_LABELS[role] || role;
    const isStatus = STATUS_ROLES.includes(role);
    const samples = isStatus ? this.#renderStatusSamples(role, hex) : this.#renderBrandSamples(role, hex);
    const cardStyle = `display:flex;flex-direction:column;gap:var(--size-s,0.75rem);padding:var(--size-m,1rem);border:1px solid ${BORDER};border-radius:${RADIUS_M};background:${SURFACE};min-inline-size:0`;
    return `<article class="sp-card" data-role="${role}" aria-label="${roleLabel} role preview" style="${cardStyle}">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:var(--size-s,0.75rem)">
        <div>
          <code style="font-family:${MONO};font-size:var(--font-size-sm,0.875rem);font-weight:600">${role}</code>
          <span style="display:block;font-size:var(--font-size-xs,0.75rem);color:${MUTED}">${roleLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="sp-swatch" style="display:inline-block;inline-size:1.75rem;block-size:1.75rem;border-radius:${RADIUS_S};border:1px solid oklch(0% 0 0 / 0.15);background:${hex}"></span>
          <code style="font-family:${MONO};font-size:var(--font-size-xs,0.75rem);color:${MUTED}">${hex}</code>
        </div>
      </header>
      <div class="sp-samples" style="display:flex;flex-wrap:wrap;gap:var(--size-s,0.75rem);align-items:flex-start">${samples}</div>
    </article>`;
  }
  #renderBrandSamples(role, hex) {
    const textOnRole = this.#resolveTextOnRole(role, hex);
    const surface = this.#resolveSurface();
    const subtleBg = this.#resolveSubtle(role, hex);
    const subtleFg = this.#darken(hex);
    return [
      this.#sample({
        render: `<button type="button" tabindex="-1" style="all:unset;display:inline-block;padding:0.375rem 0.875rem;border-radius:${RADIUS_S};background:${hex};color:${textOnRole};font-family:inherit;font-size:var(--font-size-sm,0.875rem);font-weight:600;cursor:default">Button</button>`,
        fg: textOnRole,
        bg: hex,
        caption: "On role"
      }),
      this.#sample({
        render: `<span style="color:${hex};background:${surface};padding:0.25rem 0.5rem;border-radius:${RADIUS_S};font-size:var(--font-size-sm,0.875rem);font-weight:500;text-decoration:underline">Linked text</span>`,
        fg: hex,
        bg: surface || "#ffffff",
        caption: "On surface"
      }),
      this.#sample({
        render: `<span style="display:inline-block;padding:0.125rem 0.5rem;border-radius:999px;background:${subtleBg};color:${subtleFg};font-size:var(--font-size-xs,0.75rem);font-weight:600;letter-spacing:0.04em;text-transform:uppercase">Badge</span>`,
        fg: subtleFg,
        bg: subtleBg,
        caption: "Subtle"
      })
    ].join("");
  }
  #renderStatusSamples(role, hex) {
    const surface = this.#resolveSurface();
    const subtleBg = this.#resolveStatusSubtle(role, hex);
    const statusText = this.#resolveStatusText(role, hex);
    const onRole = pickContrastingHex(hex);
    return [
      this.#sample({
        render: `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border-radius:${RADIUS_S};background:${subtleBg};color:${statusText};border:1px solid ${hex};font-size:var(--font-size-sm,0.875rem);max-inline-size:100%">
          <span style="display:inline-block;inline-size:0.5rem;block-size:0.5rem;border-radius:50%;background:${hex};flex-shrink:0"></span>
          <span><strong>${ROLE_LABELS[role] || role}</strong> \u2014 message text</span>
        </div>`,
        fg: statusText,
        bg: subtleBg,
        caption: "Alert"
      }),
      this.#sample({
        render: `<span style="display:inline-block;padding:0.125rem 0.5rem;border-radius:999px;background:${hex};color:${onRole};font-size:var(--font-size-xs,0.75rem);font-weight:700;letter-spacing:0.04em;text-transform:uppercase">${role}</span>`,
        fg: onRole,
        bg: hex,
        caption: "Badge"
      }),
      this.#sample({
        render: `<span style="color:${hex};background:${surface};padding:0.25rem 0.5rem;border-radius:${RADIUS_S};font-size:var(--font-size-sm,0.875rem);font-weight:600">Inline status</span>`,
        fg: hex,
        bg: surface || "#ffffff",
        caption: "On surface"
      })
    ].join("");
  }
  #sample({ render, fg, bg, caption }) {
    const fgHex = resolveToHex(fg, this.#probe || void 0) || "#000000";
    const bgHex = resolveToHex(bg, this.#probe || void 0) || "#ffffff";
    const ratio = contrastRatio(fgHex, bgHex);
    const level = wcagLevel(ratio).toLowerCase();
    const lc = LEVEL_COLORS[level];
    const chipStyle = `display:inline-flex;align-items:center;gap:0.25rem;padding:0.125rem 0.375rem;border-radius:${RADIUS_S};font-family:${MONO};font-size:var(--font-size-xs,0.75rem);background:${lc.bg};color:${lc.fg}`;
    return `<div style="display:flex;flex-direction:column;gap:0.25rem;align-items:flex-start;min-inline-size:0;max-inline-size:100%">
      <div style="max-inline-size:100%">${render}</div>
      <div style="display:flex;align-items:center;gap:0.375rem;font-size:var(--font-size-xs,0.75rem);color:${MUTED}">
        <span style="${chipStyle}" title="${caption}: ${ratio.toFixed(2)}:1">${ratio.toFixed(2)} <small>${level.toUpperCase()}</small></span>
        <span>${caption}</span>
      </div>
    </div>`;
  }
  #renderExport() {
    const toolbar = `display:flex;gap:var(--size-2xs,0.375rem);padding-block-start:var(--size-xs,0.5rem);border-block-start:1px solid ${BORDER}`;
    const btn = `padding:0.375rem 0.875rem;border:1px solid ${BORDER};border-radius:${RADIUS_S};background:${SURFACE};color:${TEXT};cursor:pointer;font:inherit;font-size:var(--font-size-sm,0.875rem)`;
    return `<div class="sp-export" role="toolbar" aria-label="Export semantic palette" style="${toolbar}">
      <button type="button" class="sp-copy-css" style="${btn}">Copy Theme CSS</button>
      <button type="button" class="sp-copy-json" style="${btn}">Copy JSON</button>
    </div>`;
  }
  // ── Wiring ─────────────────────────────────────────────────────────
  #wireSource() {
    const cp = this.querySelector("color-palette");
    if (cp) {
      this.listen(cp, "color-palette:change", () => {
        this.#readColors();
        this.#renderPreviews("palette");
        this.#emitChange("palette");
      });
    }
    const pg = this.querySelector("palette-generator");
    if (pg) {
      this.listen(pg, "palette-generator:generate", () => {
        this.#readColors();
        this.#renderPreviews("palette");
        this.#emitChange("palette");
      });
    }
  }
  #wireExport() {
    const cssBtn = this.querySelector(".sp-copy-css");
    const jsonBtn = this.querySelector(".sp-copy-json");
    if (cssBtn) {
      this.listen(cssBtn, "click", () => {
        copyText(this.#buildCSS(), {
          button: (
            /** @type {HTMLElement} */
            cssBtn
          ),
          announceMessage: "Theme CSS copied"
        });
      });
    }
    if (jsonBtn) {
      this.listen(jsonBtn, "click", () => {
        copyText(JSON.stringify(this.#mapping(), null, 2), {
          button: (
            /** @type {HTMLElement} */
            jsonBtn
          ),
          announceMessage: "JSON copied"
        });
      });
    }
  }
  // ── Token resolution ───────────────────────────────────────────────
  #cs() {
    return getComputedStyle(this);
  }
  #resolveSurface() {
    return this.#cs().getPropertyValue("--color-surface").trim() || "#ffffff";
  }
  #resolveTextOnRole(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-text-on-${role}`).trim();
    return explicit || pickContrastingHex(fallbackHex);
  }
  #resolveSubtle(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-subtle`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.95, 0.03, h);
  }
  #resolveStatusSubtle(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-subtle`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.94, 0.05, h);
  }
  #resolveStatusText(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-text`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.3, 0.14, h);
  }
  #darken(hex) {
    const { l, c, h } = hexToOklch(hex);
    return oklchToHex(Math.max(0.2, l - 0.25), c, h);
  }
  // ── Export + emit ──────────────────────────────────────────────────
  #buildCSS() {
    const map = this.#mapping();
    const brand = [];
    const status = [];
    for (const role of this.#roles) {
      const hex = map[role];
      if (!hex) continue;
      const { l, c, h } = hexToOklch(hex);
      if (BRAND_ROLES.includes(role)) {
        brand.push(
          `  --hue-${role}: ${h.toFixed(1)};`,
          `  --lightness-${role}: ${(l * 100).toFixed(1)}%;`,
          `  --chroma-${role}: ${c.toFixed(3)};`
        );
      } else {
        status.push(`  --color-${role}: ${formatOklch({ l, c, h })};`);
      }
    }
    const parts = [];
    if (brand.length) parts.push("  /* Brand seeds */", ...brand);
    if (status.length) {
      if (brand.length) parts.push("");
      parts.push("  /* Status colors */", ...status);
    }
    return `:root {
${parts.join("\n")}
}
`;
  }
  #emitChange(source) {
    this.dispatchEvent(new CustomEvent("semantic-palette:change", {
      bubbles: true,
      detail: { mapping: this.#mapping(), tokens: this.#buildCSS(), source }
    }));
  }
};
registerComponent("semantic-palette", SemanticPalette);

// src/web-components/motion-specimen/logic.js
var DEFAULT_EASINGS = "1,2,3,4,5,in-1,in-2,in-3,out-1,out-2,out-3,out-4,out-5,elastic-1,elastic-2,squish-1,squish-2";
var DEFAULT_DURATIONS = "instant,fast,normal,slow,slower";
var KEYFRAMES_ID = "ms-keyframes";
var KEYFRAMES_CSS = `
@keyframes ms-slide { from { inset-inline-start: 0 } to { inset-inline-start: calc(100% - 1rem) } }
@keyframes ms-fill { 0% { transform: scaleX(0) } 60% { transform: scaleX(1) } 100% { transform: scaleX(1); opacity: 0.3 } }
@media (prefers-reduced-motion: reduce) {
  motion-specimen .ms-dot { animation: none !important; inset-inline-start: calc(50% - 0.5rem) !important }
  motion-specimen .ms-bar-fill { animation: none !important; transform: scaleX(0.6) !important; opacity: 0.6 !important }
}
`;
function ensureKeyframes() {
  if (typeof document === "undefined" || document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = KEYFRAMES_CSS;
  document.head.append(style);
}
var MONO2 = "var(--font-mono, monospace)";
var MUTED2 = "var(--color-text-muted, #666)";
var INTERACTIVE = "var(--color-interactive, oklch(55% 0.2 260))";
var SUNKEN = "var(--color-surface-sunken, #f1f1f1)";
var MotionSpecimen = class extends VBElement {
  static observedAttributes = ["type", "tokens", "prefix", "duration", "show-values", "label"];
  setup() {
    ensureKeyframes();
    this.#render();
  }
  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute("data-upgraded")) this.#render();
  }
  #render() {
    const type = this.getAttribute("type") || "easing";
    const previewDuration = this.getAttribute("duration") || "1.2s";
    const showValues = this.getAttribute("show-values") !== "false";
    const label = this.getAttribute("label") || "";
    let html = "";
    if (label) html += `<p style="font-weight:600;margin:0 0 var(--size-s,0.75rem)">${label}</p>`;
    if (type === "easing" || type === "both") {
      html += this.#renderEasingSection(previewDuration, showValues);
    }
    if (type === "duration" || type === "both") {
      if (type === "both") html += `<div aria-hidden="true" style="block-size:var(--size-m,1rem)"></div>`;
      html += this.#renderDurationSection(showValues);
    }
    this.innerHTML = html;
    if (showValues) {
      requestAnimationFrame(() => this.#fillValues());
    }
  }
  #rowStyle() {
    return `display:grid;grid-template-columns:5rem 1fr auto;align-items:center;gap:var(--size-s,0.75rem);min-block-size:1.75rem`;
  }
  #nameStyle() {
    return `font-family:${MONO2};font-size:var(--font-size-sm,0.875rem);color:${MUTED2};text-align:end`;
  }
  #valueStyle() {
    return `font-family:${MONO2};font-size:var(--font-size-xs,0.75rem);color:${MUTED2};font-variant-numeric:tabular-nums;white-space:nowrap`;
  }
  #listStyle() {
    return `list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem)`;
  }
  #renderEasingSection(previewDuration, showValues) {
    const names = (this.getAttribute("tokens") || DEFAULT_EASINGS).split(",").map((s) => s.trim());
    const prefix = this.getAttribute("prefix") || "--ease-";
    const trackStyle = `position:relative;display:block;block-size:0.5rem;background:${SUNKEN};border-radius:999px`;
    const dotStyle = `position:absolute;inset-block-start:50%;inset-inline-start:0;inline-size:1rem;block-size:1rem;background:${INTERACTIVE};border-radius:50%;transform:translateY(-50%)`;
    const rows = names.map((name) => {
      const varName = `${prefix}${name}`;
      return `<li class="ms-row ms-row-ease" role="listitem" style="${this.#rowStyle()}">
        <span style="${this.#nameStyle()}">${name}</span>
        <span style="${trackStyle}" aria-hidden="true">
          <span class="ms-dot" style="${dotStyle};animation: ms-slide ${previewDuration} var(${varName}) infinite alternate"></span>
        </span>
        ${showValues ? `<span class="ms-value" data-var="${varName}" style="${this.#valueStyle()}"></span>` : ""}
      </li>`;
    }).join("");
    return `<ul class="ms-list" role="list" aria-label="Easing scale" style="${this.#listStyle()}">${rows}</ul>`;
  }
  #renderDurationSection(showValues) {
    const names = (this.getAttribute("tokens") || DEFAULT_DURATIONS).split(",").map((s) => s.trim());
    const prefix = this.getAttribute("prefix") || "--duration-";
    const barStyle = `position:relative;display:block;block-size:0.5rem;background:${SUNKEN};border-radius:999px;overflow:hidden`;
    const fillStyle = `position:absolute;inset-block:0;inset-inline-start:0;inline-size:100%;background:${INTERACTIVE};transform-origin:left center;animation-name:ms-fill;animation-iteration-count:infinite;animation-timing-function:linear`;
    const rows = names.map((name) => {
      const varName = `${prefix}${name}`;
      return `<li class="ms-row ms-row-dur" role="listitem" style="${this.#rowStyle()}">
        <span style="${this.#nameStyle()}">${name}</span>
        <span style="${barStyle}" aria-hidden="true">
          <span class="ms-bar-fill" style="${fillStyle};animation-duration: var(${varName})"></span>
        </span>
        ${showValues ? `<span class="ms-value" data-var="${varName}" style="${this.#valueStyle()}"></span>` : ""}
      </li>`;
    }).join("");
    return `<ul class="ms-list" role="list" aria-label="Duration scale" style="${this.#listStyle()}">${rows}</ul>`;
  }
  #fillValues() {
    this.querySelectorAll(".ms-value").forEach((el2) => {
      const v = el2.getAttribute("data-var");
      if (!v) return;
      const computed = getComputedStyle(this).getPropertyValue(v).trim();
      el2.textContent = computed || "\u2014";
    });
  }
};
registerComponent("motion-specimen", MotionSpecimen);

// src/web-components/theme-export/dtcg-serialize.js
var VB_NS = "com.vanilla-breeze";
var SPEC = "2025.10";
function serializeDTCG(entries, options = {}) {
  const root = {};
  const unmapped = [];
  let seedDerivation = false;
  for (const [name, rawValue] of entries) {
    const value = String(rawValue).trim();
    const target = mapPrefix(name);
    if (!target) {
      unmapped.push(name);
      continue;
    }
    if (target.path[0] === "color" && target.path[1] === "seeds") {
      seedDerivation = true;
    }
    const token = buildToken(name, value, target);
    insertAt(root, target.path, target.name, token);
  }
  const meta = { spec: SPEC };
  if (options.vbVersion) meta.vbVersion = options.vbVersion;
  if (seedDerivation) meta.seedDerivation = true;
  if (unmapped.length) meta.unmapped = unmapped;
  root.$extensions = { [VB_NS]: meta };
  return root;
}
function mapPrefix(name) {
  const prefixes = [
    // color seeds (must precede --color-)
    { p: "--hue-", path: ["color", "seeds"], type: "number", keep: true },
    { p: "--lightness-", path: ["color", "seeds"], type: "number", keep: true },
    { p: "--chroma-", path: ["color", "seeds"], type: "number", keep: true },
    // color
    { p: "--color-", path: ["color"], type: "color" },
    // typography
    { p: "--font-size-", path: ["typography", "size"], type: "dimension" },
    { p: "--font-weight-", path: ["typography", "weight"], type: "fontWeight" },
    { p: "--font-", path: ["typography", "family"], type: "fontFamily" },
    { p: "--line-height-", path: ["typography", "lineHeight"], type: "number" },
    { p: "--letter-spacing-", path: ["typography", "letterSpacing"], type: "dimension" },
    // spacing
    { p: "--size-", path: ["spacing"], type: "dimension" },
    // border
    { p: "--radius-", path: ["border", "radius"], type: "dimension" },
    { p: "--border-width-", path: ["border", "width"], type: "dimension" },
    // motion
    { p: "--duration-", path: ["motion", "duration"], type: "duration" },
    { p: "--ease-", path: ["motion", "easing"], type: "cubicBezier" },
    // effect
    { p: "--shadow-", path: ["effect", "shadow"], type: "shadow" }
  ];
  for (const { p, path, type, keep } of prefixes) {
    if (name.startsWith(p)) {
      const tail = keep ? name.slice(2) : name.slice(p.length);
      return { path, type, name: tail };
    }
  }
  return null;
}
function buildToken(_name, value, target) {
  switch (target.type) {
    case "color":
      return buildColorToken(value);
    case "fontFamily":
      return { $type: "fontFamily", $value: parseFontFamily(value) };
    case "fontWeight":
      return { $type: "fontWeight", $value: parseNumber(value) };
    case "number":
      return buildNumberToken(value);
    case "dimension":
      return buildDimensionToken(value);
    case "duration":
      return { $type: "duration", $value: parseDuration(value) };
    case "cubicBezier":
      return buildCubicBezierToken(value);
    case "shadow":
      return buildShadowToken(value);
    default:
      return { $value: value };
  }
}
function buildColorToken(value) {
  const ld = parseLightDark(value);
  if (ld) {
    return {
      $root: { $type: "color", $value: parseColorValue(ld.light) ?? opaque(ld.light) },
      light: { $type: "color", $value: parseColorValue(ld.light) ?? opaque(ld.light) },
      dark: { $type: "color", $value: parseColorValue(ld.dark) ?? opaque(ld.dark) },
      $extensions: { [VB_NS]: { lightDark: value } }
    };
  }
  if (/\bfrom\b/.test(value) && /^oklch\(/i.test(value)) {
    return {
      $type: "color",
      $value: { colorSpace: "srgb", components: [0, 0, 0] },
      $extensions: { [VB_NS]: { expression: value } }
    };
  }
  const parsed = parseColorValue(value);
  if (parsed) return { $type: "color", $value: parsed };
  return { $type: "color", $value: { colorSpace: "srgb", components: [0, 0, 0] }, $extensions: { [VB_NS]: { literal: value } } };
}
function opaque(value) {
  return { colorSpace: "srgb", components: [0, 0, 0], $vbLiteral: value };
}
function parseColorValue(raw) {
  const value = String(raw).trim();
  let m = value.match(/^oklch\(\s*([^)]+)\)\s*$/i);
  if (m) {
    const [comps, alpha] = splitAlpha(m[1]);
    const parts = comps.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const L = parsePercentOrNumber(parts[0]);
    const C = parseNumber(parts[1]);
    const H = parseNumber(parts[2]);
    if ([L, C, H].some(Number.isNaN)) return null;
    const out = {
      colorSpace: "oklch",
      // OKLCH lightness is 0–1; VB writes 55%.
      components: [normalizeLightness(parts[0], L), C, H]
    };
    if (alpha != null) out.alpha = alpha;
    return out;
  }
  m = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    const hex = m[1];
    let r, g, b, a;
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
      if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
    } else {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    const out = {
      colorSpace: "srgb",
      components: [r, g, b],
      hex: "#" + (hex.length <= 4 ? hex.slice(0, 3).split("").map((c) => c + c).join("") : hex.slice(0, 6)).toLowerCase()
    };
    if (a != null) out.alpha = a;
    return out;
  }
  m = value.match(/^rgba?\(\s*([^)]+)\)\s*$/i);
  if (m) {
    const parts = m[1].split(/\s*,\s*|\s+/).filter(Boolean);
    if (parts.length < 3) return null;
    const r = parseRGBChannel(parts[0]);
    const g = parseRGBChannel(parts[1]);
    const b = parseRGBChannel(parts[2]);
    const out = { colorSpace: "srgb", components: [r, g, b] };
    if (parts[3] != null) out.alpha = parsePercentOrNumber(parts[3]);
    return out;
  }
  return null;
}
function normalizeLightness(raw, parsed) {
  if (typeof raw === "string" && raw.endsWith("%")) return parsed / 100;
  return parsed;
}
function splitAlpha(inner) {
  const idx = inner.indexOf("/");
  if (idx < 0) return [inner, null];
  const comps = inner.slice(0, idx);
  const alpha = parsePercentOrNumber(inner.slice(idx + 1).trim());
  return [comps, alpha];
}
function parseRGBChannel(s) {
  const v = s.trim();
  if (v.endsWith("%")) return parseFloat(v) / 100;
  return parseFloat(v) / 255;
}
function buildNumberToken(value) {
  const n = parsePercentOrNumber(value);
  const tok = { $type: "number", $value: n };
  if (typeof value === "string" && value.trim().endsWith("%")) {
    tok.$extensions = { [VB_NS]: { unit: "%" } };
  }
  return tok;
}
function buildDimensionToken(value) {
  const v = String(value).trim();
  const m = v.match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  if (!m) return { $type: "dimension", $value: { value: 0, unit: "px" }, $extensions: { [VB_NS]: { literal: v } } };
  const n = parseFloat(m[1]);
  const unit = m[2] || "px";
  const dtcgUnit = unit === "px" || unit === "rem" ? unit : "rem";
  const tok = { $type: "dimension", $value: { value: n, unit: dtcgUnit } };
  if (unit !== "px" && unit !== "rem") {
    tok.$extensions = { [VB_NS]: { unit } };
  }
  return tok;
}
function parseNumber(value) {
  return parseFloat(String(value).trim());
}
function parsePercentOrNumber(value) {
  const v = String(value).trim();
  if (v.endsWith("%")) return parseFloat(v);
  return parseFloat(v);
}
function parseFontFamily(value) {
  const out = [];
  let buf = "";
  let quote = null;
  for (const ch of String(value)) {
    if (quote) {
      if (ch === quote) {
        quote = null;
        continue;
      }
      buf += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ",") {
      const t2 = buf.trim();
      if (t2) out.push(t2);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const t = buf.trim();
  if (t) out.push(t);
  return out;
}
function parseDuration(value) {
  const v = String(value).trim();
  let m = v.match(/^(-?[\d.]+)(ms|s)$/);
  if (m) return { value: parseFloat(m[1]), unit: m[2] };
  return { value: parseFloat(v), unit: "ms" };
}
function buildCubicBezierToken(value) {
  const m = String(value).match(/^cubic-bezier\(\s*([^)]+)\)\s*$/i);
  if (!m) return { $type: "cubicBezier", $value: [0, 0, 1, 1], $extensions: { [VB_NS]: { literal: value } } };
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return { $type: "cubicBezier", $value: [0, 0, 1, 1], $extensions: { [VB_NS]: { literal: value } } };
  }
  return { $type: "cubicBezier", $value: parts };
}
function buildShadowToken(value) {
  const stops = splitTopLevelCommas(String(value));
  const parsed = stops.map(parseShadowStop);
  if (parsed.some((p) => p == null)) {
    return { $type: "shadow", $value: { offsetX: { value: 0, unit: "px" }, offsetY: { value: 0, unit: "px" }, blur: { value: 0, unit: "px" }, color: { colorSpace: "srgb", components: [0, 0, 0] } }, $extensions: { [VB_NS]: { literal: value } } };
  }
  if (parsed.length === 1) return { $type: "shadow", $value: parsed[0] };
  return { $type: "shadow", $value: parsed };
}
function parseShadowStop(raw) {
  const s = raw.trim();
  const colorMatch = s.match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))$/i);
  if (!colorMatch) return null;
  const color = parseColorValue(colorMatch[0]);
  if (!color) return null;
  const dimsRaw = s.slice(0, colorMatch.index).trim();
  const dims = dimsRaw.split(/\s+/).filter(Boolean);
  if (dims.length < 3) return null;
  const dim = (i) => parseDimensionPart(dims[i]);
  const out = {
    offsetX: dim(0),
    offsetY: dim(1),
    blur: dim(2),
    color
  };
  if (dims[3]) out.spread = dim(3);
  return out;
}
function parseDimensionPart(part) {
  const m = part.match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (!m) return { value: 0, unit: "px" };
  const n = parseFloat(m[1]);
  const unit = m[2] || "px";
  const dtcgUnit = unit === "px" || unit === "rem" ? unit : "rem";
  return { value: n, unit: dtcgUnit };
}
function splitTopLevelCommas(value) {
  const out = [];
  let buf = "";
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}
function parseLightDark(value) {
  const m = String(value).match(/^light-dark\(\s*([\s\S]+)\s*\)\s*$/i);
  if (!m) return null;
  const parts = splitTopLevelCommas(m[1]);
  if (parts.length !== 2) return null;
  return { light: parts[0].trim(), dark: parts[1].trim() };
}
function insertAt(root, path, name, token) {
  let node = root;
  for (const key of path) {
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  node[name] = token;
}

// src/web-components/theme-export/logic.js
var DEFAULT_INCLUDE = "--color-,--hue-,--lightness-,--chroma-,--font-,--size-,--radius-,--shadow-,--border-width-,--ease-,--duration-,--line-height-,--letter-spacing-";
var LIVE_EVENTS = [
  "type-specimen:change",
  "spacing-specimen:change",
  "token-specimen:change",
  "semantic-palette:change"
];
var ThemeExport = class extends VBElement {
  static observedAttributes = ["scope", "selector", "include", "format", "label", "live"];
  setup() {
    this.#render();
    this.#refresh();
    this.#wireButtons();
    this.#wireLive();
  }
  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute("data-upgraded")) {
      this.#render();
      this.#refresh();
      this.#wireButtons();
      this.#wireLive();
    }
  }
  #scopeEl() {
    const sel = this.getAttribute("scope") || ":root";
    try {
      return sel === ":root" ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }
  #prefixes() {
    const raw = this.getAttribute("include") || DEFAULT_INCLUDE;
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  #collect() {
    const scope = this.#scopeEl();
    if (!scope) return [];
    const prefixes = this.#prefixes();
    const style = (
      /** @type {HTMLElement} */
      scope.style
    );
    const entries = [];
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (!name.startsWith("--")) continue;
      if (!prefixes.some((p) => name.startsWith(p))) continue;
      const value = style.getPropertyValue(name).trim();
      if (value) entries.push([name, value]);
    }
    return entries;
  }
  #format(entries) {
    const format = this.getAttribute("format") || "css";
    if (format === "json") {
      const obj = Object.fromEntries(entries);
      return JSON.stringify(obj, null, 2);
    }
    if (format === "dtcg") {
      const vbVersion = this.getAttribute("vb-version") || void 0;
      return JSON.stringify(serializeDTCG(entries, { vbVersion }), null, 2);
    }
    const selector = this.getAttribute("selector") || ":root";
    if (!entries.length) {
      return `${selector} {
  /* No theme overrides detected yet. Edit a specimen to populate. */
}
`;
    }
    const lines = entries.map(([name, value]) => `  ${name}: ${value};`).join("\n");
    return `${selector} {
${lines}
}
`;
  }
  #render() {
    const label = this.getAttribute("label") || "";
    const labelHTML = label ? `<p style="font-weight:600;margin:0 0 var(--size-xs,0.5rem)">${label}</p>` : "";
    const toolbarStyle = `display:flex;gap:var(--size-2xs,0.375rem);margin-block-end:var(--size-xs,0.5rem);align-items:center;flex-wrap:wrap`;
    const btn = `padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const sel = `padding:0.375rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const ta = `inline-size:100%;block-size:16rem;padding:var(--size-s,0.75rem);border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface-sunken,#f8f8f8);color:var(--color-text,#222);font-family:var(--font-mono,monospace);font-size:var(--font-size-xs,0.75rem);white-space:pre;overflow:auto;tab-size:2;resize:vertical;box-sizing:border-box`;
    const current = this.getAttribute("format") || "css";
    this.innerHTML = `
      ${labelHTML}
      <div class="te-toolbar" style="${toolbarStyle}">
        <label style="display:flex;gap:var(--size-2xs,0.375rem);align-items:center;font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666)">
          Format
          <select class="te-format" style="${sel}" aria-label="Output format">
            <option value="css"${current === "css" ? " selected" : ""}>CSS</option>
            <option value="json"${current === "json" ? " selected" : ""}>JSON</option>
            <option value="dtcg"${current === "dtcg" ? " selected" : ""}>DTCG</option>
          </select>
        </label>
        <button type="button" class="te-refresh" style="${btn}" aria-label="Refresh">Refresh</button>
        <button type="button" class="te-copy" style="${btn}">Copy</button>
        <button type="button" class="te-download" style="${btn}">Download</button>
        <span class="te-count" style="align-self:center;font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);margin-inline-start:auto"></span>
      </div>
      <textarea class="te-output" readonly aria-label="Theme output" style="${ta}"></textarea>
    `;
  }
  #refresh() {
    const entries = this.#collect();
    const output = this.#format(entries);
    const ta = this.querySelector(".te-output");
    const count = this.querySelector(".te-count");
    if (ta) ta.value = output;
    if (count) count.textContent = `${entries.length} token${entries.length === 1 ? "" : "s"}`;
    this.dispatchEvent(new CustomEvent("theme-export:change", {
      bubbles: true,
      detail: { output, format: this.getAttribute("format") || "css", tokens: Object.fromEntries(entries) }
    }));
  }
  #wireButtons() {
    const refresh = this.querySelector(".te-refresh");
    const copy = this.querySelector(".te-copy");
    const download = this.querySelector(".te-download");
    const formatSel = (
      /** @type {HTMLSelectElement|null} */
      this.querySelector(".te-format")
    );
    if (formatSel) {
      this.listen(formatSel, "change", () => {
        this.setAttribute("format", formatSel.value);
      });
    }
    if (refresh) this.listen(refresh, "click", () => this.#refresh());
    if (copy) {
      this.listen(copy, "click", () => {
        const ta = (
          /** @type {HTMLTextAreaElement} */
          this.querySelector(".te-output")
        );
        if (!ta) return;
        copyText(ta.value, {
          button: (
            /** @type {HTMLElement} */
            copy
          ),
          announceMessage: "Theme copied"
        });
      });
    }
    if (download) {
      this.listen(download, "click", () => this.#download());
    }
  }
  #download() {
    const ta = (
      /** @type {HTMLTextAreaElement} */
      this.querySelector(".te-output")
    );
    if (!ta) return;
    const format = this.getAttribute("format") || "css";
    let ext = "css";
    let mime = "text/css";
    let filename = "theme.css";
    if (format === "json") {
      ext = "json";
      mime = "application/json";
      filename = "theme.json";
    } else if (format === "dtcg") {
      ext = "tokens.json";
      mime = "application/design-tokens+json";
      filename = "theme.tokens.json";
    }
    const blob = new Blob([ta.value], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  #wireLive() {
    if (!this.hasAttribute("live")) return;
    for (const ev of LIVE_EVENTS) {
      this.listen(document, ev, () => this.#refresh());
    }
  }
};
registerComponent("theme-export", ThemeExport);

// src/web-components/accessibility-specimen/logic.js
function parseColor(str) {
  const s = String(str || "").trim();
  if (!s) return null;
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    const h = m[1];
    if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    if (h.length === 4) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    if (h.length === 8) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = s.match(/^rgba?\s*\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
  if (m) return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])];
  if (typeof document !== "undefined") {
    const probe = document.createElement("span");
    probe.style.color = s;
    probe.style.display = "none";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe).color;
    probe.remove();
    const rgb = cs.match(/^rgba?\s*\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
    if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];
  }
  return null;
}
function lin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio2(fg, bg) {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const l1 = luminance(f);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function wcagBadges(ratio) {
  if (ratio == null) return { aaNormal: false, aaLarge: false, aaaNormal: false, aaaLarge: false };
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5
  };
}
var AccessibilitySpecimen = class extends VBElement {
  static observedAttributes = ["type"];
  setup() {
    const type = this.getAttribute("type") || "contrast";
    if (type === "checklist") this.#renderChecklist();
    else this.#renderContrast();
  }
  attributeChangedCallback(_name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    this.setup();
  }
  // ── Contrast mode ─────────────────────────────────────────────────
  #renderContrast() {
    const pairs = (
      /** @type {HTMLElement[]} */
      [...this.querySelectorAll(":scope > button[data-fg][data-bg]")].map((b) => ({
        fg: b.dataset.fg,
        bg: b.dataset.bg,
        label: b.dataset.label || b.textContent.trim() || `${b.dataset.fg} on ${b.dataset.bg}`
      }))
    );
    const table = document.createElement("table");
    table.className = "as-contrast-table";
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th scope="col">Pair</th>
        <th scope="col">Sample</th>
        <th scope="col">Ratio</th>
        <th scope="col">AA</th>
        <th scope="col">AA Large</th>
        <th scope="col">AAA</th>
        <th scope="col">AAA Large</th>
      </tr>`;
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    if (pairs.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "as-empty";
      td.textContent = 'No color pairs authored. Add <button data-fg="\u2026" data-bg="\u2026">Label</button> children.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      for (const p of pairs) tbody.appendChild(this.#renderPairRow(p));
    }
    table.appendChild(tbody);
    this.replaceChildren(table);
  }
  #renderPairRow({ fg, bg, label }) {
    const ratio = contrastRatio2(fg, bg);
    const badges = wcagBadges(ratio);
    const ratioText = ratio == null ? "?" : `${ratio.toFixed(2)}:1`;
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("th");
    tdLabel.scope = "row";
    tdLabel.className = "as-pair-label";
    tdLabel.innerHTML = `<span class="as-swatch" style="background:${bg};border-color:${fg}"></span><span>${escapeText(label)}</span>`;
    tr.appendChild(tdLabel);
    const tdSample = document.createElement("td");
    tdSample.className = "as-pair-sample";
    tdSample.style.background = bg;
    tdSample.style.color = fg;
    tdSample.textContent = "Aa Bb 123";
    tr.appendChild(tdSample);
    const tdRatio = document.createElement("td");
    tdRatio.className = "as-pair-ratio";
    tdRatio.textContent = ratioText;
    tr.appendChild(tdRatio);
    for (const key of ["aaNormal", "aaLarge", "aaaNormal", "aaaLarge"]) {
      const td = document.createElement("td");
      const ok = badges[key];
      td.className = `as-badge ${ok ? "as-pass" : "as-fail"}`;
      td.textContent = ok ? "\u2713" : "\u2717";
      td.setAttribute("aria-label", ok ? "Pass" : "Fail");
      tr.appendChild(td);
    }
    return tr;
  }
  // ── Checklist mode ────────────────────────────────────────────────
  #renderChecklist() {
    const list = this.querySelector(":scope > ul, :scope > ol");
    if (!list) return;
    list.classList.add("as-checklist");
    for (const item of list.querySelectorAll(":scope > li")) {
      this.#decorateChecklistItem(item);
    }
  }
  #decorateChecklistItem(item) {
    if (item.dataset.decorated === "") return;
    item.dataset.decorated = "";
    const status = item.dataset.status || "na";
    item.classList.add(`as-status-${status}`);
    const icon = document.createElement("span");
    icon.className = "as-checklist-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = { pass: "\u2713", fail: "\u2717", warn: "!", na: "\u2013" }[status] || "\u2013";
    const label = { pass: "Pass", fail: "Fail", warn: "Warning", na: "Not applicable" }[status] || "Not applicable";
    const sr = document.createElement("span");
    sr.className = "as-sr-only";
    sr.textContent = `${label}: `;
    item.prepend(icon, sr);
  }
};
function escapeText(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
registerComponent("accessibility-specimen", AccessibilitySpecimen);

// src/web-components/breakpoint-specimen/logic.js
var BreakpointSpecimen = class extends VBElement {
  static observedAttributes = ["tokens", "prefix", "label", "data-observe"];
  setup() {
    this.#render();
    this.#start();
  }
  attributeChangedCallback() {
    if (this.isConnected) {
      this.#stop();
      this.#render();
      this.#start();
    }
  }
  teardown() {
    this.#stop();
  }
  #render() {
    const tokensAttr = this.getAttribute("tokens") || "sm,md,lg,xl";
    const prefix = this.getAttribute("prefix") || "--bp-";
    const label = this.getAttribute("label") || "";
    const names = tokensAttr.split(",").map((t) => t.trim()).filter(Boolean);
    const cs = getComputedStyle(document.documentElement);
    const stops = names.map((name) => {
      const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
      const px = this.#toPx(raw);
      return { name, raw, px };
    }).filter((s) => s.px > 0).sort((a, b) => a.px - b.px);
    this.#stops = stops;
    this.#max = stops.length ? stops[stops.length - 1].px * 1.15 : 1;
    const labelHTML = label ? `<header class="bps-label">${label}</header>` : "";
    const readoutHTML = `
      <output class="bps-readout" aria-live="polite">
        <span class="bps-width">\u2014</span>
        <span class="bps-active" data-active="">\u2014</span>
      </output>
    `;
    const rulerHTML = `
      <figure class="bps-ruler" aria-hidden="true">
        <span class="bps-cursor" data-cursor></span>
        ${stops.map((s) => `
          <span class="bps-stop" style="--bps-pos:${s.px / this.#max * 100}%" data-bp="${s.name}">
            <span class="bps-tick"></span>
            <span class="bps-stop-label">${s.name}<br><small>${Math.round(s.px)}px</small></span>
          </span>
        `).join("")}
      </figure>
    `;
    const tableHTML = `
      <dl class="bps-list">
        ${stops.map((s) => `
          <div class="bps-row" data-bp="${s.name}">
            <dt>${s.name}</dt>
            <dd><code>${s.raw}</code> \u2014 ${Math.round(s.px)}px and up</dd>
          </div>
        `).join("")}
      </dl>
    `;
    this.innerHTML = `${labelHTML}${readoutHTML}${rulerHTML}${tableHTML}`;
    this.#widthEl = /** @type {HTMLElement | null} */
    this.querySelector(".bps-width");
    this.#activeEl = /** @type {HTMLElement | null} */
    this.querySelector(".bps-active");
    this.#cursorEl = /** @type {HTMLElement | null} */
    this.querySelector("[data-cursor]");
  }
  #start() {
    const sel = this.getAttribute("data-observe");
    if (sel) {
      const target = document.querySelector(sel);
      if (!target) return;
      this.#ro = new ResizeObserver(() => this.#update(target.clientWidth));
      this.#ro.observe(target);
      this.#update(target.clientWidth);
      return;
    }
    const update = () => this.#update(window.innerWidth);
    update();
    this.listen(window, "resize", update, { passive: true });
  }
  #stop() {
    if (this.#ro) {
      this.#ro.disconnect();
      this.#ro = null;
    }
  }
  #update(width) {
    if (!this.#widthEl || !this.#activeEl) return;
    this.#widthEl.textContent = `${Math.round(width)}px`;
    const active = this.#activeFor(width);
    this.#activeEl.textContent = active ? active.name : "base";
    this.#activeEl.dataset.active = active ? active.name : "";
    if (this.#cursorEl) {
      const pct = Math.min(100, width / this.#max * 100);
      this.#cursorEl.style.setProperty("--bps-pos", `${pct}%`);
    }
    this.querySelectorAll("[data-bp]").forEach((el2) => {
      const matches = active && el2.getAttribute("data-bp") === active.name;
      el2.toggleAttribute("data-current", !!matches);
    });
  }
  #activeFor(width) {
    let match = null;
    for (const stop of this.#stops) {
      if (width >= stop.px) match = stop;
    }
    return match;
  }
  #toPx(value) {
    if (!value) return 0;
    const n = parseFloat(value);
    if (Number.isNaN(n)) return 0;
    if (value.endsWith("rem") || value.endsWith("em")) {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return n * root;
    }
    return n;
  }
  /** @type {Array{name: string, raw: string, px: number}} */
  #stops = [];
  #max = 1;
  /** @type {ResizeObserver | null} */
  #ro = null;
  /** @type {HTMLElement | null} */
  #widthEl = null;
  /** @type {HTMLElement | null} */
  #activeEl = null;
  /** @type {HTMLElement | null} */
  #cursorEl = null;
};
registerComponent("breakpoint-specimen", BreakpointSpecimen);

// src/web-components/layout-specimen/logic.js
var PRIMITIVES = [
  {
    name: "layout-stack",
    desc: "Vertical stack with consistent gap between children.",
    snippet: `<layout-stack data-layout-gap="m">
  <p>One</p>
  <p>Two</p>
  <p>Three</p>
</layout-stack>`,
    render: () => el("layout-stack", { "data-layout-gap": "s" }, [box("One"), box("Two"), box("Three")])
  },
  {
    name: "layout-cluster",
    desc: "Horizontal cluster that wraps; for tag rows, button groups.",
    snippet: `<layout-cluster data-layout-gap="s">
  <button>One</button> <button>Two</button> <button>Three</button>
</layout-cluster>`,
    render: () => el("layout-cluster", { "data-layout-gap": "s" }, [chip("One"), chip("Two"), chip("Three"), chip("Four")])
  },
  {
    name: "layout-grid",
    desc: "Auto-fit responsive grid; columns flow based on min-item-size.",
    snippet: `<layout-grid data-layout-min="12rem">
  <div>1</div> <div>2</div> <div>3</div> <div>4</div>
</layout-grid>`,
    render: () => el("layout-grid", { "data-layout-min": "6rem", "data-layout-gap": "s" }, [box("1"), box("2"), box("3"), box("4"), box("5"), box("6")])
  },
  {
    name: "layout-center",
    desc: "Center a block horizontally with optional max-width.",
    snippet: `<layout-center data-layout-max="readable">
  <p>Centered prose.</p>
</layout-center>`,
    render: () => el("layout-center", { "data-layout-max": "narrow", style: "border: 1px dashed var(--color-border); padding: var(--size-2xs)" }, [box("Centered")])
  },
  {
    name: "layout-cover",
    desc: "Vertical cover layout: optional header + main area + optional footer, with main filling available space.",
    snippet: `<layout-cover style="block-size: 12rem">
  <header>Top</header>
  <main>Center</main>
  <footer>Bottom</footer>
</layout-cover>`,
    render: () => el("layout-cover", { style: "block-size: 9rem; border: 1px dashed var(--color-border); padding: var(--size-2xs)" }, [
      el("header", {}, [box("Top")]),
      el("main", {}, [box("Center", "main")]),
      el("footer", {}, [box("Bottom")])
    ])
  },
  {
    name: "layout-imposter",
    desc: "Absolute centering \u2014 child sits in the dead center of the parent.",
    snippet: `<div style="position:relative; block-size:8rem">
  <layout-imposter><span>Centered</span></layout-imposter>
</div>`,
    render: () => el("div", { style: "position:relative; block-size: 6rem; border: 1px dashed var(--color-border)" }, [
      el("layout-imposter", {}, [box("Imposter")])
    ])
  },
  {
    name: "layout-columns",
    desc: "Multi-column text layout (CSS columns); good for newspapery prose.",
    snippet: `<layout-columns data-layout-columns="3">
  <p>Long prose flows across columns\u2026</p>
</layout-columns>`,
    render: () => el("layout-columns", { "data-layout-columns": "3" }, [
      el("p", { style: "margin: 0; font-size: 0.85em" }, ["One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen."])
    ])
  },
  {
    name: "layout-card",
    desc: "Stack of header + body + actions with card chrome (border + padding).",
    snippet: `<layout-card>
  <h3>Title</h3>
  <p>Body text.</p>
  <div data-layout-card-actions><button>OK</button></div>
</layout-card>`,
    render: () => el("layout-card", {}, [
      el("h3", { style: "margin: 0; font-size: 0.9em" }, ["Card title"]),
      el("p", { style: "margin: 0; font-size: 0.85em" }, ["Card body content."])
    ])
  },
  {
    name: "layout-canvas",
    desc: "Full-bleed canvas section that breaks the centered max-width.",
    snippet: `<layout-canvas>
  <p>Edge-to-edge content.</p>
</layout-canvas>`,
    render: () => el("layout-canvas", { style: "background: var(--color-surface-sunken, oklch(94% 0 0)); padding: var(--size-2xs)" }, [box("Full-bleed")])
  },
  {
    name: "layout-badge",
    desc: "Tiny inline badge / pill for inline labels.",
    snippet: `<layout-badge>NEW</layout-badge>`,
    render: () => el("layout-cluster", { "data-layout-gap": "xs" }, [
      el("layout-badge", {}, ["NEW"]),
      el("layout-badge", {}, ["BETA"]),
      el("layout-badge", {}, ["v2.0"])
    ])
  },
  {
    name: "layout-reel",
    desc: "Horizontal scrollable reel with snap points.",
    snippet: `<layout-reel>
  <article>1</article> <article>2</article> <article>3</article>
</layout-reel>`,
    render: () => el("layout-reel", {}, [box("1", "reel"), box("2", "reel"), box("3", "reel"), box("4", "reel"), box("5", "reel"), box("6", "reel")])
  },
  {
    name: "layout-sidebar",
    desc: "Sidebar + main split that collapses to a stack on narrow viewports.",
    snippet: `<layout-sidebar>
  <aside>Side</aside>
  <main>Main</main>
</layout-sidebar>`,
    render: () => el("layout-sidebar", {}, [
      el("aside", { style: "background: var(--color-surface-sunken, oklch(94% 0 0)); padding: var(--size-2xs)" }, ["Side"]),
      el("main", {}, [box("Main")])
    ])
  },
  {
    name: "layout-switcher",
    desc: "Container that switches from a row to a stack at a configurable threshold.",
    snippet: `<layout-switcher data-layout-threshold="30rem">
  <div>One</div> <div>Two</div>
</layout-switcher>`,
    render: () => el("layout-switcher", { "data-layout-threshold": "20rem" }, [box("One"), box("Two")])
  },
  {
    name: "layout-text",
    desc: "Constrains line length to a readable measure (~60ch).",
    snippet: `<layout-text>
  <p>Constrained-measure prose for comfortable reading.</p>
</layout-text>`,
    render: () => el("layout-text", {}, [
      el("p", { style: "margin: 0; font-size: 0.85em" }, ["This paragraph is constrained to a comfortable reading measure (~60ch) regardless of the parent width."])
    ])
  }
];
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "style") node.setAttribute("style", v);
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children) {
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}
function box(label, variant) {
  const b = el("div", { class: `ls-box${variant ? ` ls-box-${variant}` : ""}` }, [label]);
  return b;
}
function chip(label) {
  return el("span", { class: "ls-chip" }, [label]);
}
var LayoutSpecimen = class extends VBElement {
  setup() {
    const only = this.getAttribute("data-only");
    const allowed = only ? new Set(only.split(",").map((s) => s.trim())) : null;
    const list = PRIMITIVES.filter((p) => !allowed || allowed.has(p.name) || allowed.has(p.name.replace(/^layout-/, "")));
    this.replaceChildren();
    for (const prim of list) {
      this.appendChild(this.#renderEntry(prim));
    }
  }
  #renderEntry(prim) {
    const section = el("section", { class: "ls-entry" });
    const head = el("header", { class: "ls-entry-head" }, [
      el("h3", { class: "ls-entry-name" }, [prim.name]),
      el("p", { class: "ls-entry-desc" }, [prim.desc])
    ]);
    const live = el("div", { class: "ls-live" });
    live.appendChild(prim.render());
    const code = el("pre", { class: "ls-snippet" }, [el("code", {}, [prim.snippet])]);
    section.append(head, live, code);
    return section;
  }
};
registerComponent("layout-specimen", LayoutSpecimen);

// src/web-components/font-pairer/_font-data.js
var FONTS = [
  // Serif
  { name: "Playfair Display", category: "serif", weights: "400;600;700;900", style: "elegant" },
  { name: "Merriweather", category: "serif", weights: "300;400;700;900", style: "readable" },
  { name: "Lora", category: "serif", weights: "400;500;600;700", style: "elegant" },
  { name: "Source Serif 4", category: "serif", weights: "300;400;600;700", style: "neutral" },
  { name: "Libre Baskerville", category: "serif", weights: "400;700", style: "classic" },
  { name: "Crimson Text", category: "serif", weights: "400;600;700", style: "classic" },
  { name: "DM Serif Display", category: "serif", weights: "400", style: "bold" },
  { name: "Cormorant Garamond", category: "serif", weights: "300;400;500;600;700", style: "elegant" },
  // Sans-Serif
  { name: "Inter", category: "sans-serif", weights: "300;400;500;600;700", style: "neutral" },
  { name: "Open Sans", category: "sans-serif", weights: "300;400;600;700", style: "friendly" },
  { name: "Roboto", category: "sans-serif", weights: "300;400;500;700", style: "neutral" },
  { name: "Lato", category: "sans-serif", weights: "300;400;700;900", style: "warm" },
  { name: "Nunito", category: "sans-serif", weights: "300;400;600;700", style: "friendly" },
  { name: "Work Sans", category: "sans-serif", weights: "300;400;500;600;700", style: "geometric" },
  { name: "DM Sans", category: "sans-serif", weights: "400;500;700", style: "geometric" },
  { name: "Plus Jakarta Sans", category: "sans-serif", weights: "300;400;500;600;700", style: "modern" },
  { name: "Space Grotesk", category: "sans-serif", weights: "300;400;500;600;700", style: "technical" },
  { name: "Manrope", category: "sans-serif", weights: "300;400;500;600;700", style: "geometric" },
  { name: "IBM Plex Sans", category: "sans-serif", weights: "300;400;500;600", style: "technical" },
  { name: "Outfit", category: "sans-serif", weights: "300;400;500;600;700", style: "modern" },
  // Display
  { name: "Bebas Neue", category: "display", weights: "400", style: "bold" },
  { name: "Abril Fatface", category: "display", weights: "400", style: "elegant" },
  { name: "Oswald", category: "display", weights: "300;400;500;600;700", style: "condensed" },
  { name: "Sora", category: "display", weights: "300;400;500;600;700", style: "modern" },
  { name: "Fraunces", category: "display", weights: "300;400;500;600;700;900", style: "elegant" },
  // Monospace
  { name: "JetBrains Mono", category: "monospace", weights: "400;500;600;700", style: "technical" },
  { name: "Fira Code", category: "monospace", weights: "300;400;500;600;700", style: "technical" },
  { name: "IBM Plex Mono", category: "monospace", weights: "400;500;600", style: "technical" },
  { name: "Source Code Pro", category: "monospace", weights: "300;400;500;600;700", style: "neutral" }
];
var SUGGESTED_PAIRINGS = [
  ["Playfair Display", "Inter"],
  ["DM Serif Display", "DM Sans"],
  ["Fraunces", "Plus Jakarta Sans"],
  ["Lora", "Open Sans"],
  ["Merriweather", "Roboto"],
  ["Oswald", "Lato"],
  ["Cormorant Garamond", "Work Sans"],
  ["Sora", "Inter"],
  ["Abril Fatface", "Nunito"],
  ["Source Serif 4", "Source Code Pro"],
  ["Space Grotesk", "IBM Plex Sans"],
  ["Outfit", "Manrope"]
];
function googleFontsUrl(family, weights = "400;700") {
  const encoded = family.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`;
}
async function loadFont(family, weights = "400;700") {
  const id = `gf-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) {
    await document.fonts.ready;
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = googleFontsUrl(family, weights);
  document.head.appendChild(link);
  await document.fonts.ready;
}

// src/web-components/font-pairer/logic.js
var E = (font, tag, role, extra = "") => `${extra} contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="${role}"`;
var PREVIEWS = {
  combined: {
    label: "Combined",
    render: (f, t) => `
      <p style="font-family:${f.display};font-size:var(--font-size-3xl,2rem);font-weight:800;margin:0;line-height:1.15"
        ${E(f.display, "p", "heading")}>${t.heading}</p>
      <h3 style="font-family:${f.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0"
        ${E(f.heading, "h3", "subheading")}>${t.subheading}</h3>
      <p style="font-family:${f.body};font-size:var(--font-size-md,1rem);line-height:1.65;margin:0;color:var(--color-text-muted,#666)"
        ${E(f.body, "p", "body")}>${t.body}</p>
      <pre style="font-family:${f.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code ${E(f.code, "code", "code")}>${t.code}</code></pre>`
  },
  article: {
    label: "Article",
    render: (f, t) => `
      <small style="font-family:${f.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.08em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600"
        ${E(f.body, "small", "eyebrow")}>${t.eyebrow}</small>
      <h2 style="font-family:${f.heading};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0;line-height:1.2"
        ${E(f.heading, "h2", "heading")}>${t.heading}</h2>
      <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0"
        ${E(f.body, "p", "byline")}>${t.byline}</p>
      <p style="font-family:${f.body};line-height:1.7;margin:0" ${E(f.body, "p", "body")}>${t.body}</p>
      <h3 style="font-family:${f.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0"
        ${E(f.heading, "h3", "subheading")}>${t.subheading}</h3>
      <p style="font-family:${f.body};line-height:1.7;margin:0" ${E(f.body, "p", "body2")}>${t.body2}</p>
      <blockquote style="font-family:${f.display};font-style:italic;font-size:var(--font-size-lg,1.125rem);border-inline-start:3px solid var(--color-interactive,oklch(55% .2 260));padding-inline-start:var(--size-m,1rem);margin:0;color:var(--color-text-muted,#666)"
        ${E(f.display, "blockquote", "quote")}>${t.quote}</blockquote>
      <pre style="font-family:${f.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code ${E(f.code, "code", "code")}>${t.code}</code></pre>`
  },
  "long-article": {
    label: "Long Article",
    render: (f, t) => `
      <small style="font-family:${f.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.08em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600">${t.eyebrow}</small>
      <h1 style="font-family:${f.display};font-size:var(--font-size-3xl,2rem);font-weight:800;margin:0;line-height:1.15">${t.heading}</h1>
      <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">${t.byline}</p>
      <p style="font-family:${f.body};font-size:var(--font-size-lg,1.125rem);line-height:1.6;margin:0;color:var(--color-text-muted,#666)">${t.lead}</p>
      <h2 style="font-family:${f.heading};font-size:var(--font-size-xl,1.375rem);font-weight:700;margin:0">${t.subheading}</h2>
      <p style="font-family:${f.body};line-height:1.7;margin:0">${t.body}</p>
      <p style="font-family:${f.body};line-height:1.7;margin:0">${t.body2}</p>
      <blockquote style="font-family:${f.display};font-style:italic;font-size:var(--font-size-lg,1.125rem);border-inline-start:3px solid var(--color-interactive,oklch(55% .2 260));padding-inline-start:var(--size-m,1rem);margin:0;color:var(--color-text-muted,#666)">${t.quote}</blockquote>
      <h2 style="font-family:${f.heading};font-size:var(--font-size-xl,1.375rem);font-weight:700;margin:0">Implementation Details</h2>
      <p style="font-family:${f.body};line-height:1.7;margin:0">Design tokens form the atomic layer of any visual system. Colors, spacing, typography, and motion are expressed as named variables that cascade through every component. When a token changes, every surface that references it updates automatically \u2014 no find-and-replace, no missed instances.</p>
      <pre style="font-family:${f.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code>${t.code}</code></pre>
      <h3 style="font-family:${f.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0">Key Takeaways</h3>
      <ul style="font-family:${f.body};line-height:1.7;margin:0;padding-inline-start:1.5rem">
        <li>Typography sets the emotional tone before a single word is read</li>
        <li>Pair contrast with harmony \u2014 serif headings with sans-serif body</li>
        <li>Test at real content lengths, not just sample sentences</li>
        <li>Code fonts need clear distinction between similar glyphs</li>
      </ul>`
  },
  card: {
    label: "Card UI",
    render: (f, t) => `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--size-m,1rem)">
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${f.heading};font-weight:600;margin:0" ${E(f.heading, "h4", "cardTitle")}>Premium Plan</h4>
          <p style="font-family:${f.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">$49<small style="font-size:0.5em;font-weight:400">/mo</small></p>
          <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0" ${E(f.body, "p", "cardBody")}>Everything you need to build faster.</p>
          <code style="font-family:${f.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem" ${E(f.code, "code", "cardCode")}>npm install acme</code>
        </div>
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${f.heading};font-weight:600;margin:0">Enterprise</h4>
          <p style="font-family:${f.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">Custom</p>
          <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">Dedicated support and SLA guarantees.</p>
          <code style="font-family:${f.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem">contact@acme.dev</code>
        </div>
      </div>`
  },
  hero: {
    label: "Hero",
    render: (f, t) => `
      <div style="text-align:center;padding:var(--size-xl,2rem) 0">
        <p style="font-family:${f.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.1em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600;margin:0 0 var(--size-xs,0.5rem)"
          ${E(f.body, "p", "eyebrow")}>${t.eyebrow}</p>
        <h1 style="font-family:${f.display};font-size:clamp(2rem,5vw,3rem);font-weight:800;margin:0;line-height:1.1"
          ${E(f.display, "h1", "heading")}>${t.heading}</h1>
        <p style="font-family:${f.body};font-size:var(--font-size-lg,1.125rem);color:var(--color-text-muted,#666);margin:var(--size-s,0.75rem) auto 0;max-width:40ch"
          ${E(f.body, "p", "body")}>${t.body}</p>
      </div>`
  }
};
var FontPairer = class extends VBElement {
  static observedAttributes = ["heading-font", "body-font", "code-font", "display-font", "sample", "show-export", "show-suggestions", "preview"];
  #fonts = { heading: "", body: "", code: "", display: "" };
  #preview = "combined";
  #sampleText = {
    heading: "The Art of Typography",
    subheading: "Building visual harmony through font pairing",
    body: "Good typography is invisible \u2014 it lets the content speak without distraction. The best font pairings create harmony between heading impact and body readability. Every typeface carries personality: serif fonts convey trust and tradition, while sans-serif fonts feel modern and clean.",
    body2: "Choosing the right pairing is about contrast and complement. A bold display font for headlines needs a quiet, readable body font to balance it. Monospace fonts ground technical content in precision. The interplay between these roles defines your brand voice.",
    code: 'const theme = {\n  heading: "Playfair Display",\n  body: "Inter",\n  tokens: { size: 16, scale: 1.25 }\n};',
    eyebrow: "Design Systems",
    byline: "By Jamie Chen \xB7 April 14, 2026 \xB7 8 min read",
    lead: "How native CSS features and design tokens are replacing the complex tooling we thought we needed.",
    quote: '"Good typography is invisible \u2014 it lets the content breathe."'
  };
  setup() {
    this.#fonts.heading = this.getAttribute("heading-font") || "Playfair Display";
    this.#fonts.body = this.getAttribute("body-font") || "Inter";
    this.#fonts.code = this.getAttribute("code-font") || "JetBrains Mono";
    this.#fonts.display = this.getAttribute("display-font") || this.#fonts.heading;
    this.#preview = this.getAttribute("preview") || "combined";
    this.#render();
    this.#loadAllFonts();
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === "heading-font") this.#fonts.heading = newVal || "Playfair Display";
    if (name === "body-font") this.#fonts.body = newVal || "Inter";
    if (name === "code-font") this.#fonts.code = newVal || "JetBrains Mono";
    if (name === "display-font") this.#fonts.display = newVal || this.#fonts.heading;
    if (name === "preview") this.#preview = newVal || "combined";
    this.#render();
    this.#loadAllFonts();
  }
  async #loadAllFonts() {
    const loads = Object.values(this.#fonts).filter(Boolean).map((name) => {
      const f = FONTS.find((x) => x.name === name);
      return loadFont(name, f?.weights || "400;700");
    });
    await Promise.all(loads);
    this.#updateFonts();
  }
  #render() {
    const showExport = this.hasAttribute("show-export");
    const showSuggestions = this.hasAttribute("show-suggestions");
    const gap = "var(--size-m, 1rem)";
    const smGap = "var(--size-s, 0.75rem)";
    const xsGap = "var(--size-xs, 0.5rem)";
    const radius = "var(--radius-m, 0.5rem)";
    const border = "var(--color-border, #ddd)";
    const surface = "var(--color-surface, #fff)";
    const raised = "var(--color-surface-raised, #f5f5f5)";
    const muted = "var(--color-text-muted, #666)";
    const smFont = "var(--font-size-sm, 0.875rem)";
    const xsFont = "var(--font-size-xs, 0.75rem)";
    const selectStyle = `font:inherit;font-size:${smFont};padding:0.35rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}`;
    const roles = [
      { key: "heading", label: "Heading" },
      { key: "body", label: "Body" },
      { key: "code", label: "Code" },
      { key: "display", label: "Display" }
    ];
    const selects = roles.map((r) => `
      <label style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:9rem;font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em">
        ${r.label}
        <select class="fp-select" data-role="${r.key}" style="${selectStyle}">
          ${this.#buildOptions(this.#fonts[r.key])}
        </select>
      </label>
    `).join("");
    const previewTabs = Object.entries(PREVIEWS).map(
      ([key, { label }]) => `<button type="button" class="fp-tab" data-mode="${key}"
        style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.75rem;border-radius:999px;${key === this.#preview ? `background:var(--color-interactive,oklch(55% .2 260));color:white` : `border:1px solid ${border}`}">${label}</button>`
    ).join("");
    const fontStyles = {
      heading: `'${this.#fonts.heading}', serif`,
      body: `'${this.#fonts.body}', sans-serif`,
      code: `'${this.#fonts.code}', monospace`,
      display: `'${this.#fonts.display}', serif`
    };
    const previewHTML = PREVIEWS[this.#preview]?.render(fontStyles, this.#sampleText) || "";
    const suggestionPills = SUGGESTED_PAIRINGS.map(
      ([h, b]) => `<button type="button" class="fp-suggestion" data-h="${h}" data-b="${b}"
        style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.5rem;border:1px solid ${border};border-radius:4px;white-space:nowrap;text-align:left;line-height:1.3"
        title="${h} + ${b}"><strong>${h}</strong><br><span style="color:${muted}">${b}</span></button>`
    ).join("");
    const cssCode = this.#buildCSS();
    const codeSection = `<details class="fp-code-details" style="border:1px solid ${border};border-radius:${radius};overflow:hidden"${showExport ? " open" : ""}>
      <summary style="padding:${xsGap} ${smGap};cursor:pointer;font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em;background:${raised}">Code</summary>
      <div style="padding:${smGap}">
        <pre style="font-family:var(--font-mono,monospace);font-size:${xsFont};margin:0;white-space:pre-wrap;word-break:break-all" class="fp-css-output">${cssCode}</pre>
        <div style="display:flex;gap:${xsGap};margin-block-start:${smGap}">
          <button type="button" class="fp-copy-css"
            style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.65rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy CSS</button>
          <button type="button" class="fp-copy-import"
            style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.65rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy @import</button>
        </div>
      </div>
    </details>`;
    const mainContent = `<div style="display:flex;flex-direction:column;gap:${gap};flex:1;min-width:0">
      <div style="display:flex;flex-wrap:wrap;gap:${xsGap}">${selects}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center">
        <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em;margin-inline-end:${xsGap}">Examples</span>
        ${previewTabs}
      </div>
      <div style="display:flex;flex-direction:column;gap:${xsGap}">
        <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em">Preview</span>
        <div class="fp-preview" style="padding:var(--size-l,1.5rem);background:${raised};border-radius:${radius};border:1px solid ${border};display:flex;flex-direction:column;gap:${smGap};max-height:24rem;overflow-y:auto">
          ${previewHTML}
        </div>
      </div>
      ${codeSection}
    </div>`;
    if (showSuggestions) {
      this.innerHTML = `<div style="display:flex;gap:${gap};flex-wrap:wrap">
        ${mainContent}
        <aside style="flex:0 0 11rem;display:flex;flex-direction:column;gap:${xsGap}">
          <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em">Pairings</span>
          <div style="display:flex;flex-direction:column;gap:0.25rem">${suggestionPills}</div>
        </aside>
      </div>`;
    } else {
      this.innerHTML = mainContent;
    }
    this.#wire();
  }
  #buildOptions(selected) {
    const categories = ["serif", "sans-serif", "display", "monospace"];
    return categories.map((cat) => {
      const fonts = FONTS.filter((f) => f.category === cat);
      const opts = fonts.map(
        (f) => `<option value="${f.name}"${f.name === selected ? " selected" : ""}>${f.name}</option>`
      ).join("");
      return `<optgroup label="${cat}">${opts}</optgroup>`;
    }).join("");
  }
  #buildCSS() {
    const lines = [];
    const roles = { heading: "serif", body: "sans-serif", code: "monospace", display: "serif" };
    for (const [role, fallback] of Object.entries(roles)) {
      const name = this.#fonts[role];
      if (!name) continue;
      const f = FONTS.find((x) => x.name === name);
      lines.push(`--font-${role}: "${name}", ${f?.category || fallback};`);
    }
    return lines.join("\n");
  }
  #buildImports() {
    const seen = /* @__PURE__ */ new Set();
    const lines = [];
    for (const name of Object.values(this.#fonts)) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const f = FONTS.find((x) => x.name === name);
      lines.push(`@import url('${googleFontsUrl(name, f?.weights || "400;700")}');`);
    }
    return lines.join("\n");
  }
  #wire() {
    this.querySelectorAll(".fp-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const target = (
          /** @type {HTMLSelectElement} */
          e.target
        );
        this.#fonts[target.dataset.role] = target.value;
        this.#loadAllFonts();
        this.#renderPreview();
        this.#updateCode();
        this.#emit();
      });
    });
    this.querySelectorAll(".fp-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el2 = (
          /** @type {HTMLElement} */
          btn
        );
        this.#preview = el2.dataset.mode || "combined";
        this.#render();
        this.#loadAllFonts();
      });
    });
    this.querySelectorAll(".fp-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el2 = (
          /** @type {HTMLElement} */
          btn
        );
        this.#fonts.heading = el2.dataset.h || "";
        this.#fonts.body = el2.dataset.b || "";
        this.#fonts.display = el2.dataset.h || "";
        this.#render();
        this.#loadAllFonts();
        this.#emit();
      });
    });
    this.querySelectorAll(".fp-editable").forEach((el2) => {
      const node = (
        /** @type {HTMLElement} */
        el2
      );
      node.addEventListener("blur", () => {
        const role = node.dataset.role;
        if (role && node.textContent.trim()) {
          this.#sampleText[role] = node.textContent.trim();
        }
      });
    });
    this.querySelector(".fp-copy-css")?.addEventListener("click", (e) => {
      copyText(this.#buildCSS(), {
        button: (
          /** @type {HTMLElement} */
          e.target
        ),
        announceMessage: "CSS copied"
      });
    });
    this.querySelector(".fp-copy-import")?.addEventListener("click", (e) => {
      copyText(this.#buildImports(), {
        button: (
          /** @type {HTMLElement} */
          e.target
        ),
        announceMessage: "@import statement copied"
      });
    });
  }
  #renderPreview() {
    const container = this.querySelector(".fp-preview");
    if (!container) return;
    const fontStyles = {
      heading: `'${this.#fonts.heading}', serif`,
      body: `'${this.#fonts.body}', sans-serif`,
      code: `'${this.#fonts.code}', monospace`,
      display: `'${this.#fonts.display}', serif`
    };
    container.innerHTML = PREVIEWS[this.#preview]?.render(fontStyles, this.#sampleText) || "";
    container.querySelectorAll(".fp-editable").forEach((el2) => {
      const node = (
        /** @type {HTMLElement} */
        el2
      );
      node.addEventListener("blur", () => {
        const role = node.dataset.role;
        if (role && node.textContent.trim()) {
          this.#sampleText[role] = node.textContent.trim();
        }
      });
    });
  }
  #updateFonts() {
    this.#renderPreview();
    this.#updateCode();
  }
  #updateCode() {
    const output = this.querySelector(".fp-css-output");
    if (output) output.textContent = this.#buildCSS();
  }
  #emit() {
    this.dispatchEvent(new CustomEvent("font-pairer:change", {
      bubbles: true,
      detail: { ...this.#fonts }
    }));
  }
};
registerComponent("font-pairer", FontPairer);

// src/web-components/gradient-builder/_gradient-utils.js
function buildGradientCSS(stops, { type = "linear", angle = 90, interpolation = "oklab" } = {}) {
  if (stops.length < 2) return "transparent";
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const colorStops = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  const space = interpolation !== "srgb" ? ` in ${interpolation}` : "";
  if (type === "radial") {
    return `radial-gradient(circle${space}, ${colorStops})`;
  }
  return `linear-gradient(${angle}deg${space}, ${colorStops})`;
}
function parseColorStops(colorsStr) {
  if (!colorsStr) return defaultStops();
  const colors = colorsStr.split(",").map((c) => c.trim()).filter(Boolean);
  if (colors.length < 2) return defaultStops();
  return colors.map((color, i) => ({
    color,
    position: Math.round(i / (colors.length - 1) * 100)
  }));
}
function defaultStops() {
  return [
    { color: "#6366f1", position: 0 },
    { color: "#ec4899", position: 100 }
  ];
}

// src/web-components/gradient-builder/logic.js
var GradientBuilder = class extends VBElement {
  static observedAttributes = ["colors", "type", "angle", "interpolation", "show-export", "show-controls"];
  /** @type {import('./_gradient-utils.js').GradientStop[]} */
  #stops = [];
  #type = "linear";
  #angle = 90;
  #interpolation = "oklab";
  setup() {
    this.#stops = parseColorStops(this.getAttribute("colors") ?? "");
    this.#type = this.getAttribute("type") || "linear";
    this.#angle = Number(this.getAttribute("angle")) || 90;
    this.#interpolation = this.getAttribute("interpolation") || "oklab";
    this.#render();
    return true;
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === "colors") this.#stops = parseColorStops(newVal);
    if (name === "type") this.#type = newVal || "linear";
    if (name === "angle") this.#angle = Number(newVal) || 90;
    if (name === "interpolation") this.#interpolation = newVal || "oklab";
    this.#render();
  }
  get css() {
    return buildGradientCSS(this.#stops, {
      type: this.#type,
      angle: this.#angle,
      interpolation: this.#interpolation
    });
  }
  #render() {
    const showExport = this.hasAttribute("show-export");
    const showControls = this.getAttribute("show-controls") !== "false";
    const css = this.css;
    const gap = "var(--size-m, 1rem)";
    const smGap = "var(--size-s, 0.75rem)";
    const xsGap = "var(--size-xs, 0.5rem)";
    const radius = "var(--radius-m, 0.5rem)";
    const border = "var(--color-border, #ddd)";
    const surface = "var(--color-surface, #fff)";
    const muted = "var(--color-text-muted, #666)";
    const mono = "var(--font-mono, monospace)";
    const smFont = "var(--font-size-sm, 0.875rem)";
    const xsFont = "var(--font-size-xs, 0.75rem)";
    const preview = `<div class="gb-preview" style="height:4rem;border-radius:${radius};background:${css};border:1px solid ${border}"></div>`;
    const selectStyle = `font:inherit;font-size:${smFont};padding:0.25rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}`;
    let controls = "";
    if (showControls) {
      controls = `<div style="display:flex;flex-direction:column;gap:${smGap};font-size:${smFont}">
        <div style="display:flex;flex-wrap:wrap;gap:${gap};align-items:center">
          <label style="display:flex;align-items:center;gap:${xsGap}">
            Type
            <select class="gb-type" style="${selectStyle}">
              <option value="linear"${this.#type === "linear" ? " selected" : ""}>Linear</option>
              <option value="radial"${this.#type === "radial" ? " selected" : ""}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${xsGap}${this.#type === "radial" ? ";opacity:0.4;pointer-events:none" : ""}">
            Angle
            <input type="range" class="gb-angle" min="0" max="360" value="${this.#angle}" style="width:8rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
            <span class="gb-angle-value" style="min-width:2.5em;font-family:${mono};font-size:${xsFont}">${this.#angle}\xB0</span>
          </label>
        </div>
        <label style="display:inline-flex;align-items:center;gap:${xsGap}">
          Color Space
          <select class="gb-space" style="${selectStyle}">
            <option value="oklab"${this.#interpolation === "oklab" ? " selected" : ""}>oklab</option>
            <option value="oklch"${this.#interpolation === "oklch" ? " selected" : ""}>oklch</option>
            <option value="srgb"${this.#interpolation === "srgb" ? " selected" : ""}>sRGB</option>
          </select>
        </label>
      </div>`;
    }
    const sorted = [...this.#stops].map((s, i) => ({ ...s, origIndex: i })).sort((a, b) => a.position - b.position);
    const stopRows = sorted.map((stop) => {
      const i = stop.origIndex;
      return `<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${i}">
        <input type="color" value="${stop.color}" class="gb-stop-color" data-i="${i}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${border};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${stop.position}" class="gb-stop-pos-range" data-i="${i}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${stop.color}">
        <span style="font-family:${mono};font-size:${xsFont};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${i}">${stop.position}%</span>
        ${this.#stops.length > 2 ? `<button type="button" class="gb-remove" data-i="${i}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${muted};padding:0 0.25rem" title="Remove stop">&times;</button>` : ""}
      </div>`;
    }).join("");
    const addBtn = `<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${smFont};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`;
    this.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:${gap}">
        ${preview}
        ${controls}
        <div style="display:flex;flex-direction:column;gap:${xsGap}">
          <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${stopRows}
          ${addBtn}
        </div>
        <div style="display:flex;flex-direction:column;gap:${xsGap}">
          <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.05em">Code</span>
          <div style="display:flex;align-items:start;gap:${xsGap}">
            <div style="flex:1;font-family:${mono};font-size:${xsFont};padding:${smGap};background:var(--color-surface-raised,#f5f5f5);border-radius:${radius};word-break:break-all;color:var(--color-text,#222)" class="gb-css-output">${css}</div>
            ${showExport ? `<button type="button" class="gb-copy"
              style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.35rem 0.75rem;border:1px solid ${border};border-radius:4px;background:${surface};white-space:nowrap;flex-shrink:0">Copy CSS</button>` : ""}
          </div>
        </div>
      </div>
    `;
    this.#wire();
  }
  #wire() {
    this.querySelector(".gb-type")?.addEventListener("change", (e) => {
      const t = (
        /** @type {HTMLSelectElement} */
        e.target
      );
      this.#type = t.value;
      this.#render();
      this.#emit();
    });
    const angleInput = this.querySelector(".gb-angle");
    const angleValue = this.querySelector(".gb-angle-value");
    angleInput?.addEventListener("input", (e) => {
      const t = (
        /** @type {HTMLInputElement} */
        e.target
      );
      this.#angle = Number(t.value);
      if (angleValue) angleValue.textContent = `${this.#angle}\xB0`;
      const preview = (
        /** @type {HTMLElement | null} */
        this.querySelector(".gb-preview")
      );
      if (preview) preview.style.background = this.css;
      this.#emit();
    });
    this.querySelector(".gb-space")?.addEventListener("change", (e) => {
      const t = (
        /** @type {HTMLSelectElement} */
        e.target
      );
      this.#interpolation = t.value;
      this.#render();
      this.#emit();
    });
    this.querySelectorAll(".gb-stop-color").forEach((input) => {
      input.addEventListener("input", (e) => {
        const t = (
          /** @type {HTMLInputElement} */
          e.target
        );
        const i = Number(t.dataset.i);
        this.#stops[i].color = t.value;
        this.#updatePreview();
        this.#emit();
      });
    });
    this.querySelectorAll(".gb-stop-pos-range").forEach((input) => {
      input.addEventListener("input", (e) => {
        const t = (
          /** @type {HTMLInputElement} */
          e.target
        );
        const i = Number(t.dataset.i);
        const val = Math.max(0, Math.min(100, Number(t.value) || 0));
        this.#stops[i].position = val;
        const label = this.querySelector(`.gb-stop-pos-label[data-i="${i}"]`);
        if (label) label.textContent = `${val}%`;
        this.#updatePreview();
        this.#emit();
      });
    });
    this.querySelectorAll(".gb-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const t = (
          /** @type {HTMLElement} */
          e.target
        );
        const i = Number(t.dataset.i);
        this.#stops.splice(i, 1);
        this.#render();
        this.#emit();
      });
    });
    this.querySelector(".gb-add")?.addEventListener("click", () => {
      const last = this.#stops[this.#stops.length - 1];
      const prev = this.#stops[this.#stops.length - 2];
      const pos = Math.round((prev.position + last.position) / 2);
      this.#stops.splice(this.#stops.length - 1, 0, { color: "#888888", position: pos });
      this.#render();
      this.#emit();
    });
    this.querySelector(".gb-copy")?.addEventListener("click", (e) => {
      const btn = (
        /** @type {HTMLElement | null} */
        e.target
      );
      if (!btn) return;
      copyText(this.css, { button: btn, announceMessage: "Gradient CSS copied" });
    });
  }
  #updatePreview() {
    const css = this.css;
    const preview = (
      /** @type {HTMLElement | null} */
      this.querySelector(".gb-preview")
    );
    if (preview) preview.style.background = css;
    const output = this.querySelector(".gb-css-output");
    if (output) output.textContent = css;
  }
  #emit() {
    this.dispatchEvent(new CustomEvent("gradient-builder:change", {
      bubbles: true,
      detail: {
        css: this.css,
        stops: [...this.#stops],
        type: this.#type,
        angle: this.#angle,
        interpolation: this.#interpolation
      }
    }));
  }
};
registerComponent("gradient-builder", GradientBuilder);

// src/web-components/theme-import/dtcg-deserialize.js
var VB_NS2 = "com.vanilla-breeze";
function deserializeDTCG(doc) {
  const tokens = [];
  const ignored = [];
  const tree = doc && typeof doc === "object" ? doc : {};
  walk(tree, [], void 0, tree, tokens, ignored);
  return {
    tokens,
    ignored,
    stats: { applied: tokens.length, ignored: ignored.length }
  };
}
function walk(node, path, inheritedType, root, tokens, ignored) {
  if (!node || typeof node !== "object") return;
  if ("$value" in node) {
    handleToken(node, path, inheritedType ?? node.$type, root, tokens, ignored);
    return;
  }
  if (isVariantContainer(node)) {
    handleVariantToken(node, path, inheritedType ?? node.$type ?? "color", root, tokens, ignored);
    return;
  }
  const groupType = node.$type ?? inheritedType;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    walk(child, [...path, key], groupType, root, tokens, ignored);
  }
}
function isVariantContainer(node) {
  const variants = ["$root", "light", "dark"];
  return variants.some((k) => node[k] && typeof node[k] === "object" && "$value" in node[k]);
}
function pathToVar(path) {
  const [head, second, ...rest] = path;
  switch (head) {
    case "color": {
      if (second === "seeds") {
        return rest.length ? `--${rest.join("-")}` : null;
      }
      const tail = [second, ...rest].filter(Boolean).join("-");
      return tail ? `--color-${tail}` : null;
    }
    case "typography": {
      const leaf = rest.join("-") || second;
      const child = rest.length ? rest.join("-") : "";
      switch (second) {
        case "family":
          return child ? `--font-${child}` : null;
        case "size":
          return child ? `--font-size-${child}` : null;
        case "weight":
          return child ? `--font-weight-${child}` : null;
        case "lineHeight":
          return child ? `--line-height-${child}` : null;
        case "letterSpacing":
          return child ? `--letter-spacing-${child}` : null;
        default:
          return null;
      }
      const _ = leaf;
    }
    case "spacing":
      return [second, ...rest].filter(Boolean).length ? `--size-${[second, ...rest].filter(Boolean).join("-")}` : null;
    case "border": {
      const child = rest.join("-") || "";
      if (second === "radius") return child ? `--radius-${child}` : null;
      if (second === "width") return child ? `--border-width-${child}` : null;
      return null;
    }
    case "motion": {
      const child = rest.join("-") || "";
      if (second === "duration") return child ? `--duration-${child}` : null;
      if (second === "easing") return child ? `--ease-${child}` : null;
      return null;
    }
    case "effect": {
      const child = rest.join("-") || "";
      if (second === "shadow") return child ? `--shadow-${child}` : null;
      return null;
    }
    default:
      return null;
  }
}
function handleToken(token, path, type, root, tokens, ignored) {
  if ((type === "typography" || token.$type === "typography") && token.$value && typeof token.$value === "object" && !Array.isArray(token.$value) && path[0] === "typography") {
    unpackTypography(token, path, tokens);
    return;
  }
  const cssVar = pathToVar(path);
  if (!cssVar) {
    ignored.push(path.join("."));
    return;
  }
  const effectiveType = type ?? inferTypeFromPath(path);
  const ext = token.$extensions && token.$extensions[VB_NS2] || {};
  if (ext.expression) {
    tokens.push([cssVar, ext.expression]);
    return;
  }
  if (ext.lightDark) {
    tokens.push([cssVar, ext.lightDark]);
    return;
  }
  const value = renderValue(token.$value, effectiveType, ext, root);
  if (value == null) {
    ignored.push(path.join("."));
    return;
  }
  tokens.push([cssVar, value]);
}
function inferTypeFromPath(path) {
  const [head, second] = path;
  if (head === "color") return "color";
  if (head === "spacing") return "dimension";
  if (head === "border" && (second === "radius" || second === "width")) return "dimension";
  if (head === "motion" && second === "duration") return "duration";
  if (head === "motion" && second === "easing") return "cubicBezier";
  if (head === "effect" && second === "shadow") return "shadow";
  if (head === "typography") {
    if (second === "family") return "fontFamily";
    if (second === "size") return "dimension";
    if (second === "weight") return "fontWeight";
    if (second === "lineHeight") return "number";
    if (second === "letterSpacing") return "dimension";
  }
  return void 0;
}
function handleVariantToken(node, path, type, root, tokens, ignored) {
  const cssVar = pathToVar(path);
  if (!cssVar) {
    ignored.push(path.join("."));
    return;
  }
  const ext = node.$extensions && node.$extensions[VB_NS2] || {};
  if (ext.lightDark) {
    tokens.push([cssVar, ext.lightDark]);
    return;
  }
  const light = node.light?.$value ? renderValue(node.light.$value, type, {}, root) : null;
  const dark = node.dark?.$value ? renderValue(node.dark.$value, type, {}, root) : null;
  const root_ = node.$root?.$value ? renderValue(node.$root.$value, type, {}, root) : null;
  if (light && dark) {
    tokens.push([cssVar, `light-dark(${light}, ${dark})`]);
    return;
  }
  if (root_) {
    tokens.push([cssVar, root_]);
    return;
  }
  if (light) {
    tokens.push([cssVar, light]);
    return;
  }
  if (dark) {
    tokens.push([cssVar, dark]);
    return;
  }
  ignored.push(path.join("."));
}
function renderValue(value, type, ext, root) {
  if (typeof value === "string" && /^\{[^}]+\}$/.test(value)) {
    const targetPath = value.slice(1, -1).split(".");
    const targetVar = pathToVar(targetPath);
    if (targetVar) return `var(${targetVar})`;
    return value;
  }
  switch (type) {
    case "color":
      return renderColor2(value, ext);
    case "fontFamily":
      return renderFontFamily(value);
    case "fontWeight":
      return String(value);
    case "number":
      return renderNumber(value, ext);
    case "dimension":
      return renderDimension(value, ext);
    case "duration":
      return renderDuration(value);
    case "cubicBezier":
      return Array.isArray(value) ? `cubic-bezier(${value.join(", ")})` : null;
    case "shadow":
      return renderShadow2(value);
    default:
      if (typeof value === "string" || typeof value === "number") return String(value);
      return null;
  }
}
function renderColor2(value, ext) {
  if (!value || typeof value !== "object") return null;
  if (value.hex) return value.hex;
  if (value.colorSpace === "oklch") {
    const [L, C, H] = value.components || [0, 0, 0];
    const alpha = value.alpha != null ? ` / ${value.alpha}` : "";
    return `oklch(${L} ${C} ${H}${alpha})`;
  }
  if (value.colorSpace === "srgb") {
    const [r, g, b] = value.components || [0, 0, 0];
    const a = value.alpha;
    if (a != null) {
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    return rgbToHex2(r, g, b);
  }
  return null;
}
function rgbToHex2(r, g, b) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
var BARE_FONT_KEYWORDS = /* @__PURE__ */ new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
  "fangsong",
  "-apple-system",
  "BlinkMacSystemFont"
]);
function renderFontFamily(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return null;
  return value.map((f) => {
    if (BARE_FONT_KEYWORDS.has(f)) return f;
    if (f.startsWith('"') || f.startsWith("'")) return f;
    return `"${f}"`;
  }).join(", ");
}
function renderNumber(value, ext) {
  if (ext.unit === "%") return `${value}%`;
  return String(value);
}
function renderDimension(value, ext) {
  if (!value || typeof value !== "object") return null;
  const unit = ext.unit || value.unit || "px";
  return `${value.value}${unit}`;
}
function renderDuration(value) {
  if (!value || typeof value !== "object") return null;
  return `${value.value}${value.unit || "ms"}`;
}
function renderShadow2(value) {
  if (Array.isArray(value)) return value.map(renderShadowStop).filter(Boolean).join(", ");
  return renderShadowStop(value);
}
function renderShadowStop(stop) {
  if (!stop) return null;
  const ox = renderDimension(stop.offsetX, {}) ?? "0px";
  const oy = renderDimension(stop.offsetY, {}) ?? "0px";
  const blur = renderDimension(stop.blur, {}) ?? "0px";
  const spread = stop.spread ? " " + renderDimension(stop.spread, {}) : "";
  const color = renderColor2(stop.color, {}) ?? "#000";
  return `${ox} ${oy} ${blur}${spread} ${color}`;
}
function unpackTypography(token, path, tokens) {
  const v = token.$value;
  const leaf = path[path.length - 1];
  if (v.fontFamily != null) tokens.push([`--font-${leaf}`, renderFontFamily(v.fontFamily)]);
  if (v.fontSize != null) tokens.push([`--font-size-${leaf}`, renderDimension(v.fontSize, {})]);
  if (v.fontWeight != null) tokens.push([`--font-weight-${leaf}`, String(v.fontWeight)]);
  if (v.lineHeight != null) tokens.push([`--line-height-${leaf}`, String(v.lineHeight)]);
  if (v.letterSpacing != null) tokens.push([`--letter-spacing-${leaf}`, renderDimension(v.letterSpacing, {})]);
}

// src/web-components/theme-import/logic.js
var ThemeImport = class extends VBElement {
  static observedAttributes = ["target", "placeholder"];
  setup() {
    this.#render();
    this.#wire();
  }
  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute("data-upgraded")) {
      this.#render();
      this.#wire();
    }
  }
  #targetEl() {
    const sel = this.getAttribute("target") || "#preview";
    try {
      return (
        /** @type {HTMLElement|null} */
        document.querySelector(sel)
      );
    } catch {
      return null;
    }
  }
  #render() {
    const placeholder = this.getAttribute("placeholder") || "Paste DTCG tokens.json here\u2026";
    const btn = `padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const inp = `padding:0.375rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const ta = `inline-size:100%;block-size:10rem;padding:var(--size-s,0.75rem);border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface-sunken,#f8f8f8);color:var(--color-text,#222);font-family:var(--font-mono,monospace);font-size:var(--font-size-xs,0.75rem);white-space:pre;overflow:auto;tab-size:2;resize:vertical;box-sizing:border-box`;
    const row = `display:flex;flex-wrap:wrap;gap:var(--size-2xs,0.375rem);align-items:center;margin-block-end:var(--size-s,0.5rem)`;
    const muted = `font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666)`;
    this.innerHTML = `
      <div class="ti-modes" role="tablist" aria-label="Import source" style="${row}">
        <button type="button" class="ti-mode" data-mode="paste" style="${btn}" role="tab" aria-selected="true">Paste</button>
        <button type="button" class="ti-mode" data-mode="file"  style="${btn}" role="tab" aria-selected="false">File</button>
        <button type="button" class="ti-mode" data-mode="url"   style="${btn}" role="tab" aria-selected="false">URL</button>
        <span style="${muted};margin-inline-start:auto" class="ti-target"></span>
      </div>

      <div class="ti-pane ti-pane-paste" role="tabpanel">
        <textarea class="ti-paste" aria-label="DTCG JSON" placeholder="${placeholder}" style="${ta}"></textarea>
        <div style="${row};margin-block-start:var(--size-2xs,0.375rem)">
          <button type="button" class="ti-apply-paste" style="${btn}">Apply</button>
        </div>
      </div>

      <div class="ti-pane ti-pane-file" role="tabpanel" hidden>
        <label style="display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem);${muted}">
          <span>DTCG file (.tokens.json or .json)</span>
          <input class="ti-file" type="file" accept=".json,.tokens,.tokens.json,application/json,application/design-tokens+json" style="${inp}">
        </label>
      </div>

      <div class="ti-pane ti-pane-url" role="tabpanel" hidden>
        <label style="display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem);${muted}">
          <span>DTCG URL (CORS-permitted host)</span>
          <input class="ti-url" type="url" placeholder="https://example.com/theme.tokens.json" style="${inp}">
        </label>
        <div style="${row};margin-block-start:var(--size-2xs,0.375rem)">
          <button type="button" class="ti-apply-url" style="${btn}">Fetch &amp; apply</button>
        </div>
      </div>

      <output class="ti-result" style="display:block;margin-block-start:var(--size-s,0.5rem);${muted}"></output>

      <details class="ti-ignored" style="margin-block-start:var(--size-2xs,0.375rem)" hidden>
        <summary style="${muted};cursor:pointer">Ignored tokens</summary>
        <ul class="ti-ignored-list" style="margin:var(--size-2xs,0.375rem) 0 0;padding-inline-start:1.25rem;${muted}"></ul>
      </details>

      <div style="${row};margin-block-start:var(--size-s,0.5rem)">
        <button type="button" class="ti-reset" style="${btn}">Reset preview scope</button>
      </div>
    `;
    this.#refreshTargetLabel();
  }
  #refreshTargetLabel() {
    const span = this.querySelector(".ti-target");
    if (!span) return;
    const sel = this.getAttribute("target") || "#preview";
    const found = this.#targetEl();
    span.textContent = found ? `Target: ${sel}` : `Target ${sel} not found`;
  }
  #wire() {
    for (const tab of this.querySelectorAll(".ti-mode")) {
      this.listen(tab, "click", () => this.#switchMode(
        /** @type {HTMLElement} */
        tab.dataset.mode || "paste"
      ));
    }
    const apply = this.querySelector(".ti-apply-paste");
    if (apply) this.listen(apply, "click", () => this.#applyFromPaste());
    const file = (
      /** @type {HTMLInputElement|null} */
      this.querySelector(".ti-file")
    );
    if (file) this.listen(file, "change", () => this.#applyFromFile(file));
    const applyUrl = this.querySelector(".ti-apply-url");
    if (applyUrl) this.listen(applyUrl, "click", () => this.#applyFromURL());
    const reset = this.querySelector(".ti-reset");
    if (reset) this.listen(reset, "click", () => this.#reset());
  }
  #switchMode(mode) {
    for (const tab of this.querySelectorAll(".ti-mode")) {
      const t = (
        /** @type {HTMLElement} */
        tab
      );
      const active = t.dataset.mode === mode;
      t.setAttribute("aria-selected", String(active));
    }
    for (const pane of this.querySelectorAll(".ti-pane")) {
      const p = (
        /** @type {HTMLElement} */
        pane
      );
      p.hidden = !p.classList.contains(`ti-pane-${mode}`);
    }
  }
  #applyFromPaste() {
    const ta = (
      /** @type {HTMLTextAreaElement|null} */
      this.querySelector(".ti-paste")
    );
    if (!ta) return;
    this.#applyJSON(ta.value, "paste");
  }
  /** @param {HTMLInputElement} input */
  async #applyFromFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      this.#applyJSON(text, "file");
    } catch (err) {
      this.#fail(err, "file");
    }
  }
  async #applyFromURL() {
    const input = (
      /** @type {HTMLInputElement|null} */
      this.querySelector(".ti-url")
    );
    const url = input?.value?.trim();
    if (!url) return;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      this.#applyJSON(text, "url");
    } catch (err) {
      this.#fail(err, "url");
    }
  }
  /**
   * @param {string} text
   * @param {'paste'|'file'|'url'} source
   */
  #applyJSON(text, source) {
    let doc;
    try {
      doc = JSON.parse(text);
    } catch (err) {
      this.#fail(err, "parse");
      return;
    }
    const result = deserializeDTCG(doc);
    const target = this.#targetEl();
    if (!target) {
      this.#fail(new Error(`Target ${this.getAttribute("target") || "#preview"} not found`), "apply");
      return;
    }
    for (const [name, value] of result.tokens) {
      target.style.setProperty(name, value);
    }
    this.#showResult(result, source);
    this.dispatchEvent(new CustomEvent("theme-import:applied", {
      bubbles: true,
      detail: {
        tokens: result.tokens,
        applied: result.stats.applied,
        ignored: result.ignored,
        source
      }
    }));
  }
  #reset() {
    const target = this.#targetEl();
    if (!target) return;
    const style = target.style;
    const remove = [];
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (name.startsWith("--")) remove.push(name);
    }
    for (const name of remove) style.removeProperty(name);
    const out = this.querySelector(".ti-result");
    if (out) out.textContent = `Cleared ${remove.length} custom properties from ${this.getAttribute("target") || "#preview"}.`;
    const ig = this.querySelector(".ti-ignored");
    if (ig) ig.hidden = true;
  }
  #showResult(result, source) {
    const out = this.querySelector(".ti-result");
    if (out) {
      out.textContent = `Applied ${result.stats.applied} token${result.stats.applied === 1 ? "" : "s"} from ${source}${result.stats.ignored ? ` \xB7 ${result.stats.ignored} ignored` : ""}.`;
    }
    const ig = this.querySelector(".ti-ignored");
    const list = this.querySelector(".ti-ignored-list");
    if (ig && list) {
      const det = (
        /** @type {HTMLDetailsElement} */
        ig
      );
      if (result.ignored.length === 0) {
        det.hidden = true;
        list.innerHTML = "";
      } else {
        det.hidden = false;
        list.innerHTML = result.ignored.map((p) => `<li>${escapeHTML(p)}</li>`).join("");
      }
    }
  }
  #fail(err, phase) {
    const out = this.querySelector(".ti-result");
    if (out) out.textContent = `Error (${phase}): ${err && err.message ? err.message : String(err)}`;
    this.dispatchEvent(new CustomEvent("theme-import:error", {
      bubbles: true,
      detail: { error: err, phase }
    }));
  }
};
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (ch) => (
    /** @type {Recordstring,string} */
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]
  ));
}
registerComponent("theme-import", ThemeImport);
