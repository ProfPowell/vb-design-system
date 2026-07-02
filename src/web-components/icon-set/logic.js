/**
 * icon-set: Searchable icon catalog/browser
 *
 * Renders a filterable grid of icons for a given icon set, with
 * click-to-copy names. Each cell renders via <icon-wc> so it shares the
 * design system's real icon-loading/caching/theming path (SVG fetch,
 * currentColor, size tokens) rather than duplicating that logic.
 *
 * By default it fetches {iconBase}/{set}.json — a manifest listing every
 * icon name in the set. The `names` attribute bypasses that fetch entirely
 * (space/comma-separated list), which is useful for tests, offline demos,
 * or curated subsets where no manifest exists.
 *
 * @attr {string} set   - Icon set directory (default: "lucide")
 * @attr {string} names - Optional space/comma-separated list of icon names.
 *                        Overrides the {iconBase}/{set}.json manifest fetch.
 *
 * @example
 * <icon-set names="star home search settings"></icon-set>
 * <icon-set set="lucide"></icon-set>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const iconBase = () => document.documentElement.dataset.iconPath || '/cdn/icons';

class IconSet extends VBElement {
  static observedAttributes = ['set', 'names'];

  /** @type {IntersectionObserver | null} Lazy-mounts <icon-wc> as cells scroll in. */
  #io = null;

  setup() {
    this.#render();
    this.#load();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#load();
    }
  }

  disconnectedCallback() {
    this.#io?.disconnect();
    this.#io = null;
    super.disconnectedCallback?.();
  }

  get set() {
    return this.getAttribute('set') || 'lucide';
  }

  async #load() {
    const attr = this.getAttribute('names');
    let names = attr ? attr.split(/[\s,]+/).filter(Boolean) : null;
    if (!names) {
      try {
        names = await (await fetch(`${iconBase()}/${this.set}.json`)).json();
      } catch {
        names = [];
      }
    }
    this.#renderGrid(names);
  }

  #render() {
    this.innerHTML = `
      <div class="icon-set">
        <label class="icon-set__search">
          <span class="visually-hidden">Filter icons</span>
          <input type="search" placeholder="Filter ${this.set} icons…">
        </label>
        <ul class="icon-set__grid" role="list"></ul>
      </div>`;
    const input = /** @type {HTMLInputElement} */ (this.querySelector('input'));
    this.listen(input, 'input', (e) => this.#filter(/** @type {HTMLInputElement} */ (e.target).value));
  }

  #renderGrid(names) {
    const ul = this.querySelector('.icon-set__grid');
    if (!ul) return;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    // Cells render with an empty, correctly-sized icon slot; the real <icon-wc>
    // (which fetches its SVG on connect) is mounted lazily below. Rendering a
    // full set (~1900 icons) as <icon-wc> up front fires ~1900 concurrent
    // fetches and exhausts the browser (net::ERR_INSUFFICIENT_RESOURCES).
    ul.innerHTML = names.map((n) => `
      <li data-icon-name="${esc(n)}">
        <button type="button" title="Copy “${esc(n)}”" data-copy="${esc(n)}">
          <span class="icon-set__icon" data-name="${esc(n)}"></span>
          <span>${esc(n)}</span>
        </button>
      </li>`).join('');
    this.listen(ul, 'click', (e) => {
      const btn = /** @type {HTMLElement} */ (e.target).closest('[data-copy]');
      if (btn) navigator.clipboard?.writeText(/** @type {HTMLElement} */ (btn).dataset.copy ?? '');
    });

    // Lazy-mount <icon-wc> only when a cell nears the viewport, so only the
    // handful of visible icons fetch at a time instead of the whole set at once.
    const set = this.set;
    this.#io?.disconnect();
    this.#io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const slot = /** @type {HTMLElement} */ (entry.target);
        obs.unobserve(slot);
        if (slot.firstElementChild) continue; // already mounted
        const icon = document.createElement('icon-wc');
        icon.setAttribute('name', slot.dataset.name ?? '');
        icon.setAttribute('set', set);
        slot.appendChild(icon);
      }
    }, { rootMargin: '400px' });
    for (const slot of ul.querySelectorAll('.icon-set__icon')) this.#io.observe(slot);
  }

  #filter(q) {
    const term = q.trim().toLowerCase();
    for (const li of this.querySelectorAll('[data-icon-name]')) {
      li.hidden = !!term && !(/** @type {HTMLElement} */ (li).dataset.iconName ?? '').toLowerCase().includes(term);
    }
  }
}

registerComponent('icon-set', IconSet);

export { IconSet };
