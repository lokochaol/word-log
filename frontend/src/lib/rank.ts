/**
 * Fractional indexing (Figma/Notion-style rank strings) for PermanentNote's
 * `orderKey`. Ranks are base-62 strings that sort lexicographically in the
 * same order as their numeric value, so inserting anywhere in a sequence is
 * an O(1) write of a single new rank string — no renumbering of neighbors.
 *
 * No external dependency: this module is self-contained.
 */

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = DIGITS.length;
const MID_DIGIT = DIGITS[Math.floor(BASE / 2)]; // 'V'

function digitValue(ch: string): number {
  const v = DIGITS.indexOf(ch);
  if (v === -1) throw new Error(`Invalid rank digit: ${ch}`);
  return v;
}

/** Simple lexicographic string comparison — ranks are designed to sort correctly this way. */
export function compareRanks(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Returns a rank string that sorts strictly between `a` and `b`.
 * `a === null` means "start of the sequence", `b === null` means "end of
 * the sequence". Passing both null returns a starting midpoint rank.
 */
export function midpointRank(a: string | null, b: string | null): string {
  if (a !== null && b !== null && compareRanks(a, b) >= 0) {
    throw new Error(`midpointRank requires a < b, got a=${a} b=${b}`);
  }

  if (a === null && b === null) {
    return MID_DIGIT;
  }
  if (a === null) {
    return before(b as string);
  }
  if (b === null) {
    return after(a);
  }
  return between(a, b);
}

/** A rank strictly less than `b`, for inserting at the head of the sequence. */
function before(b: string): string {
  // Walk b's digits looking for room below the first digit greater than 0.
  for (let i = 0; i < b.length; i++) {
    const d = digitValue(b[i]);
    if (d > 0) {
      const lowered = b.slice(0, i) + DIGITS[Math.floor(d / 2)];
      return lowered;
    }
    // d === 0: this position can't go lower without extending; keep looking.
  }
  // b is all zero-digits (e.g. "0" or "00") — go one level deeper.
  return b + MID_DIGIT;
}

/** A rank strictly greater than `a`, for inserting at the tail of the sequence. */
function after(a: string): string {
  for (let i = 0; i < a.length; i++) {
    const d = digitValue(a[i]);
    if (d < BASE - 1) {
      const mid = d + Math.ceil((BASE - 1 - d) / 2);
      return a.slice(0, i) + DIGITS[mid];
    }
    // d === BASE - 1: this position can't go higher without extending; keep looking.
  }
  // a is all max-digits — extend.
  return a + MID_DIGIT;
}

/** A rank strictly between `a` and `b` (a < b, both non-null). */
function between(a: string, b: string): string {
  const len = Math.max(a.length, b.length);
  let result = "";
  for (let i = 0; i < len; i++) {
    const da = i < a.length ? digitValue(a[i]) : 0;
    const db = i < b.length ? digitValue(b[i]) : BASE;
    if (da === db) {
      result += DIGITS[da];
      continue;
    }
    const gap = db - da;
    if (gap > 1) {
      const mid = da + Math.floor(gap / 2);
      return result + DIGITS[mid];
    }
    // gap === 1 (adjacent digits): commit da here, then find room deeper
    // within the "a" branch, comparing against the implicit end-of-string
    // (treated as 0) for the rest of a's tail vs BASE for b's absence.
    result += DIGITS[da];
    const restA = i + 1 < a.length ? a.slice(i + 1) : "";
    // We need a value strictly greater than restA-as-a-tail (or than
    // "nothing" if a is exhausted) and strictly less than the b tail
    // (which, since b's digit here is da+1, effectively means "anything").
    return result + tailAfter(restA);
  }
  // Digit-for-digit identical up to len (shouldn't normally happen since a<b),
  // extend a with a midpoint digit.
  return a + MID_DIGIT;
}

/** A digit-string suffix strictly greater than `tail` (tail may be ""). */
function tailAfter(tail: string): string {
  if (tail === "") return MID_DIGIT;
  const d = digitValue(tail[0]);
  if (d < BASE - 1) {
    const mid = d + Math.ceil((BASE - 1 - d) / 2);
    return DIGITS[mid];
  }
  // d === BASE - 1: can't raise this digit, recurse into the rest.
  return DIGITS[d] + tailAfter(tail.slice(1));
}
