/**
 * @file element-groups.js
 * @description Cook "before" plugin. Joins the `elements` HTML collection
 * (cook `collections: { html: true }`, built from each
 * src/pages/elements/<name>.html front matter) onto the role groups declared
 * in config/data.js, so the elements index and the home-page chips are
 * generated from the pages themselves instead of hand-maintained lists.
 *
 * Reads:  data.collections.elements  (items with `elementName`, `group`, `order`)
 *         data.elementGroups         ([{ id, title, blurb }])
 * Writes: data.elements              (every element, grouped order)
 *         data.elementCount
 *         data.elementGroups[i].items
 *
 * A page without `elementName` (the index itself) is ignored. A page whose
 * `group` matches no declared group is reported and left out, so a typo is
 * visible in the build log rather than silently missing from the site.
 */
import chalk from 'chalk';

const byOrderThenSlug = (a, b) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.slug.localeCompare(b.slug);

export class ElementGroups {
  constructor({ data }) {
    this.data = data;
  }

  init() {
    const { data } = this;
    const groups = Array.isArray(data.elementGroups) ? data.elementGroups : [];
    const pages = (data.collections?.elements || []).filter(p => p.elementName);

    if (!groups.length) {
      console.warn(chalk.yellow('  [element-groups] data.elementGroups is empty; nothing to group'));
    }

    for (const group of groups) group.items = [];
    const ids = new Set(groups.map(g => g.id));
    const orphans = [];

    for (const page of pages) {
      const group = groups.find(g => g.id === page.group);
      if (!group) { orphans.push(page); continue; }
      group.items.push(page);
    }
    for (const group of groups) group.items.sort(byOrderThenSlug);

    data.elements = groups.flatMap(g => g.items);
    data.elementCount = data.elements.length;

    if (orphans.length) {
      console.warn(chalk.yellow(`  [element-groups] ${orphans.length} element page(s) with no declared group (known: ${[...ids].join(', ')}):`));
      orphans.forEach(p => console.warn(chalk.yellow(`    ${p.url} group: ${JSON.stringify(p.group)}`)));
    }
    console.log(`  element-groups: ${data.elementCount} elements in ${groups.length} groups`);
  }
}
