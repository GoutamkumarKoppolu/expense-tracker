// Pure report rules: per-tag breakdown of one transaction kind.
const MAX_SLICES = 7; // + "Other" = 8, matching the --cat-1..8 palette

// rows: ledger rows with type_kind. Returns { total, items } where items are
// [{ tag, amount, share, color, previous }] biggest first; tags past the
// palette size are folded into "Other". `previousRows` (optional) supplies
// the prior period for a change-vs-last-period figure.
export function breakdownByTag(rows, kind, previousRows = null) {
  const sumByTag = (list) => {
    const map = new Map();
    list
      .filter((t) => t.type_kind === kind)
      .forEach((t) => map.set(t.tag, (map.get(t.tag) || 0) + Number(t.amount)));
    return map;
  };

  const current = sumByTag(rows);
  const previous = previousRows ? sumByTag(previousRows) : null;
  const total = [...current.values()].reduce((s, v) => s + v, 0);

  const sorted = [...current.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);

  const items = head.map(([tag, amount]) => ({ tag, amount, previous: previous ? previous.get(tag) || 0 : null }));
  if (rest.length) {
    items.push({
      tag: `Other (${rest.length})`,
      amount: rest.reduce((s, [, v]) => s + v, 0),
      previous: previous ? rest.reduce((s, [tag]) => s + (previous.get(tag) || 0), 0) : null,
    });
  }

  return {
    total,
    items: items.map((item, i) => ({
      ...item,
      share: total ? item.amount / total : 0,
      color: `var(--cat-${i + 1})`,
    })),
  };
}

// Percentage change vs the previous period, or null when not comparable.
export function changePct(amount, previous) {
  if (previous === null || previous === 0) return null;
  return ((amount - previous) / previous) * 100;
}
