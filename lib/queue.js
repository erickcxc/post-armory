// Pure queue state machine. No fs: the bin edge reads and writes posts.json.
// States move one way: drafted -> armed -> posted. There is no publish verb here.

const TRANSITIONS = { drafted: 'armed', armed: 'posted' };
const STATES = new Set(['drafted', 'armed', 'posted']);

export function emptyQueue() {
  return { nextId: 1, entries: [] };
}

export function draft(queue, { episode, media, text }) {
  const id = `post-${String(queue.nextId).padStart(3, '0')}`;
  const entry = { id, episode, media, text, state: 'drafted' };
  return { nextId: queue.nextId + 1, entries: [...queue.entries, entry] };
}

export function next(queue) {
  return queue.entries.find((e) => e.state === 'drafted') ?? null;
}

export function mark(queue, id, state) {
  const entry = queue.entries.find((e) => e.id === id);
  if (!entry) throw new Error(`unknown entry: ${id}`);
  if (TRANSITIONS[entry.state] !== state) {
    throw new Error(`invalid transition: ${entry.state} -> ${state} (${id})`);
  }
  return {
    nextId: queue.nextId,
    entries: queue.entries.map((e) => (e.id === id ? { ...e, state } : e)),
  };
}

export function parseQueue(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('corrupt queue: not valid JSON');
  }
  if (!data || typeof data.nextId !== 'number' || !Array.isArray(data.entries)) {
    throw new Error('corrupt queue: wrong shape');
  }
  for (const e of data.entries) {
    if (typeof e?.id !== 'string' || typeof e?.text !== 'string' || !STATES.has(e?.state)) {
      throw new Error(`corrupt queue: bad entry ${e?.id ?? '(no id)'}`);
    }
  }
  return data;
}
