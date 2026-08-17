/**
 * Pure chunking/drill-down logic for the Zettelkasten "pile grid" — see
 * src/components/PileDrill.tsx for the rendering half and §6 of the plan for
 * the UI rules this encodes:
 *
 *   - A pile grid is a row-major chunking of the current level's items.
 *   - A chunk with more than FLAT_THRESHOLD members renders as a further
 *     pile (drill in on tap); a chunk with FLAT_THRESHOLD or fewer members
 *     renders flat: a single-line spine + full content, same as the
 *     走り書き timeline.
 *   - `drillPath` is the only state a PileDrill instance holds: a list of
 *     chunk indices chosen at each level, root to current. Everything else
 *     (what's visible, whether it's flat, the breadcrumb trail) is derived
 *     from (items, drillPath) by resolveDrillPath below.
 */

export const FLAT_THRESHOLD = 10;

/** Splits `items` into row-major groups of at most `size` items each. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be positive");
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export interface Breadcrumb {
  label: string;
  path: number[];
}

export type DrillResult<T> =
  | { isFlat: true; flatItems: T[]; groups: null; breadcrumbs: Breadcrumb[] }
  | { isFlat: false; flatItems: null; groups: T[][]; breadcrumbs: Breadcrumb[] };

/**
 * Resolves what should be visible for a given `drillPath` into `items`,
 * re-chunking recursively with `groupSize` at each level until either the
 * path runs out or the current slice is small enough to go flat
 * (<= FLAT_THRESHOLD members). Stale trailing drillPath entries (e.g. items
 * changed underneath, or the level went flat before the path was consumed)
 * are silently ignored rather than throwing.
 */
export function resolveDrillPath<T>(items: T[], drillPath: number[], groupSize: number): DrillResult<T> {
  const breadcrumbs: Breadcrumb[] = [{ label: "全体", path: [] }];

  let current = items;
  for (let depth = 0; depth < drillPath.length; depth++) {
    if (current.length <= FLAT_THRESHOLD) break;
    const groups = chunk(current, groupSize);
    const idx = drillPath[depth];
    const group = groups[idx];
    if (!group) break;
    current = group;
    breadcrumbs.push({
      label: `山${idx + 1}（${group.length}件）`,
      path: drillPath.slice(0, depth + 1),
    });
  }

  if (current.length <= FLAT_THRESHOLD) {
    return { isFlat: true, flatItems: current, groups: null, breadcrumbs };
  }

  return { isFlat: false, flatItems: null, groups: chunk(current, groupSize), breadcrumbs };
}
