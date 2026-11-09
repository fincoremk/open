// @fincoremk/coa-ifrs-ar — a bilingual (Arabic/English) chart of accounts structured for IFRS statements.
// It is the same seed chart FINCOREMK ships with. MIT. Zero dependencies.
import { readFileSync } from 'node:fs';
const chart = JSON.parse(readFileSync(new URL('./chart.json', import.meta.url), 'utf8'));
export default chart;
export { chart };

/** Accounts as a tree: [{...account, children:[...]}] */
export function tree(list = chart) {
  const by = new Map(list.map(a => [a.code, { ...a, children: [] }])), roots = [];
  for (const a of by.values()) (a.parent && by.has(a.parent) ? by.get(a.parent).children : roots).push(a);
  return roots;
}
/** Leaf accounts — the only ones a journal line may post to. */
export const postable = (list = chart) => { const parents = new Set(list.map(a => a.parent).filter(Boolean)); return list.filter(a => !parents.has(a.code)); };
export const find = (code, list = chart) => list.find(a => a.code === String(code)) || null;
