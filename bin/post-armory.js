#!/usr/bin/env node
// Thin fs/CLI edge. All logic lives in lib/. No publish verb exists here.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emptyQueue, draft, next, mark, parseQueue } from '../lib/queue.js';
import { composePost } from '../lib/copy.js';

const EPISODES = 'episodes';
const COMMANDS = ['draft', 'queue', 'next', 'mark'];

function queuePath(episode) {
  return join(EPISODES, episode, 'posts.json');
}

function loadQueue(episode) {
  const p = queuePath(episode);
  return existsSync(p) ? parseQueue(readFileSync(p, 'utf8')) : emptyQueue();
}

function saveQueue(episode, queue) {
  writeFileSync(queuePath(episode), JSON.stringify(queue, null, 2) + '\n');
}

function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(argv) {
  const [command, ...args] = argv;
  if (!COMMANDS.includes(command)) {
    throw new Error(`Unknown command: ${command ?? '(none)'}. Commands: ${COMMANDS.join(', ')}`);
  }

  if (command === 'draft') {
    const episode = flag(args, 'episode');
    const media = flag(args, 'media');
    const angle = flag(args, 'angle');
    const link = flag(args, 'link') ?? 'https://github.com/erickcxc';
    if (!episode || !media || !angle) throw new Error('draft needs --episode --media --angle');
    if (!existsSync(join(EPISODES, episode, media))) {
      throw new Error(`media not found: ${join(EPISODES, episode, media)}`);
    }
    const text = composePost(angle, link); // throws on any copy violation, before enqueue
    const q = draft(loadQueue(episode), { episode, media, text });
    saveQueue(episode, q);
    const added = q.entries[q.entries.length - 1];
    console.log(`drafted ${added.id} (${media})`);
    return;
  }

  const episode = flag(args, 'episode');
  if (!episode) throw new Error(`${command} needs --episode`);

  if (command === 'queue') {
    const q = loadQueue(episode);
    if (!q.entries.length) return console.log('queue empty');
    for (const e of q.entries) console.log(`${e.id}  ${e.state.padEnd(7)}  ${e.media}`);
    return;
  }

  if (command === 'next') {
    const e = next(loadQueue(episode));
    if (!e) return console.log('nothing drafted');
    console.log(JSON.stringify(e, null, 2));
    return;
  }

  if (command === 'mark') {
    // positionals only: drop --episode and its value
    const positionals = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--episode');
    const [id, state] = positionals;
    const q = mark(loadQueue(episode), id, state);
    saveQueue(episode, q);
    console.log(`${id} -> ${state}`);
  }
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
