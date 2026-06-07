import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyQueue, draft, next, mark, parseQueue } from '../lib/queue.js';

const ENTRY = {
  episode: 'day-01',
  media: 'x-hero-why-ytlive.png',
  text: 'Day 1 shipped. Code: https://github.com/erickcxc',
};

test('draft appends an entry with a stable sequential id and state drafted', () => {
  const q1 = draft(emptyQueue(), ENTRY);
  assert.equal(q1.entries.length, 1);
  assert.equal(q1.entries[0].id, 'post-001');
  assert.equal(q1.entries[0].state, 'drafted');
  const q2 = draft(q1, { ...ENTRY, media: 'clip-01.mp4' });
  assert.equal(q2.entries[1].id, 'post-002');
});

test('ids are never reused, even after earlier entries advance', () => {
  let q = draft(emptyQueue(), ENTRY);
  q = mark(q, 'post-001', 'armed');
  q = mark(q, 'post-001', 'posted');
  q = draft(q, { ...ENTRY, media: 'clip-01.mp4' });
  assert.equal(q.entries[1].id, 'post-002');
});

test('next returns the oldest drafted entry, null when none', () => {
  let q = draft(draft(emptyQueue(), ENTRY), { ...ENTRY, media: 'b.png' });
  assert.equal(next(q).id, 'post-001');
  q = mark(q, 'post-001', 'armed');
  assert.equal(next(q).id, 'post-002');
  q = mark(q, 'post-002', 'armed');
  assert.equal(next(q), null);
});

test('mark allows only drafted to armed to posted, in order', () => {
  let q = draft(emptyQueue(), ENTRY);
  assert.throws(() => mark(q, 'post-001', 'posted'), /invalid transition/);
  q = mark(q, 'post-001', 'armed');
  assert.throws(() => mark(q, 'post-001', 'armed'), /invalid transition/);
  q = mark(q, 'post-001', 'posted');
  assert.throws(() => mark(q, 'post-001', 'drafted'), /invalid transition/);
});

test('mark rejects unknown ids', () => {
  assert.throws(() => mark(draft(emptyQueue(), ENTRY), 'post-999', 'armed'), /unknown entry/);
});

test('parseQueue refuses corrupt JSON and wrong shapes instead of guessing', () => {
  assert.throws(() => parseQueue('{not json'), /corrupt queue/);
  assert.throws(() => parseQueue('{"entries": "nope"}'), /corrupt queue/);
  assert.throws(() => parseQueue('{"entries": [{"id": "post-001"}]}'), /corrupt queue/);
  const good = JSON.stringify(draft(emptyQueue(), ENTRY));
  assert.equal(parseQueue(good).entries[0].id, 'post-001');
});
