// Pure copy logic: composition + the guards that make bad posts impossible to draft.
// No fs, no network. The publish verb does not exist anywhere in this package.

const URL_WEIGHT = 23; // X wraps every link in t.co at a fixed 23 characters
const URL_RE = /https?:\/\/\S+/g;

export function weightedLength(text) {
  const withoutUrls = text.replace(URL_RE, '');
  const urlCount = (text.match(URL_RE) ?? []).length;
  return [...withoutUrls].length + urlCount * URL_WEIGHT;
}

const LIMIT = 280;
const EM_DASH_RE = /—/;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const PRICE_RE = /\$\s?\d|\b\d+\s?k\s?\/\s?(mo|month)\b/i;
const HAS_URL_RE = /https?:\/\/\S+/; // non-global on purpose: .test() on /g regexes is stateful

// Returns a list of violation codes; empty list means the copy is postable.
export function checkCopy(text) {
  const violations = [];
  if (weightedLength(text) > LIMIT) violations.push('over-limit');
  if (EM_DASH_RE.test(text)) violations.push('em-dash');
  if (EMOJI_RE.test(text)) violations.push('emoji');
  if (PRICE_RE.test(text)) violations.push('price');
  if (!HAS_URL_RE.test(text)) violations.push('no-link');
  return violations;
}

// Compose final post text from an angle line and a CTA link, then enforce guards.
// Throws with the joined violation codes so a bad post cannot reach the queue.
export function composePost(angle, link) {
  const text = `${angle.trim()}\n\n${link.trim()}`;
  const violations = checkCopy(text);
  if (violations.length) throw new Error(`copy rejected: ${violations.join(', ')}`);
  return text;
}
