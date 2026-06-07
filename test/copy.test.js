import test from 'node:test';
import assert from 'node:assert/strict';
import { weightedLength } from '../lib/copy.js';

test('weightedLength counts any URL as 23 characters (X t.co wrapping)', () => {
  // plain text counts as-is
  assert.equal(weightedLength('one hour on the clock'), 21);
  // a URL counts as 23 regardless of its real length
  assert.equal(weightedLength('https://youtu.be/aZd25ZrG9A8'), 23);
  // mixed: text + space + URL
  assert.equal(weightedLength('watch: https://www.youtube.com/watch?v=aZd25ZrG9A8'), 7 + 23);
});

import { checkCopy } from '../lib/copy.js';

test('checkCopy flags text over 280 weighted characters', () => {
  const long = 'a'.repeat(281);
  assert.ok(checkCopy(long).includes('over-limit'));
  const fits = 'a'.repeat(280);
  assert.ok(!checkCopy(fits).includes('over-limit'));
});

test('checkCopy flags em dashes', () => {
  assert.ok(checkCopy('one hour — one system https://x.yz').includes('em-dash'));
});

test('checkCopy flags emojis', () => {
  assert.ok(checkCopy('shipped \u{1F680} https://x.yz').includes('emoji'));
});

test('checkCopy flags prices and money figures', () => {
  assert.ok(checkCopy('saves $1,500 a month https://x.yz').includes('price'));
  assert.ok(checkCopy('worth 5k/month https://x.yz').includes('price'));
});

test('checkCopy flags missing link (the soft CTA carrier)', () => {
  assert.ok(checkCopy('one hour, one system, shipped').includes('no-link'));
});

test('checkCopy returns empty for a compliant post', () => {
  const post = 'Day 1: built a CLI that arms the stream. One hour, shipped public. Code: https://github.com/erickcxc';
  assert.deepEqual(checkCopy(post), []);
});

test('checkCopy is stateless: same input gives same result on repeated calls', () => {
  const post = 'Day 1 shipped. Code: https://github.com/erickcxc';
  assert.deepEqual(checkCopy(post), []);
  assert.deepEqual(checkCopy(post), []);
});

import { composePost } from '../lib/copy.js';

test('composePost joins angle and link with a blank line', () => {
  const text = composePost('One hour. One system. Shipped.', 'https://github.com/erickcxc');
  assert.equal(text, 'One hour. One system. Shipped.\n\nhttps://github.com/erickcxc');
  assert.deepEqual(checkCopy(text), []);
});

test('composePost throws with the violation codes when guards fail', () => {
  assert.throws(
    () => composePost('shipped \u{1F680} for $500', 'https://x.yz'),
    /emoji, price/
  );
});
