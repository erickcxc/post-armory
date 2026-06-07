# post-armory

Thin CLI that **arms** social posts for operator approval. It drafts post copy, enforces
the brand copy rules in code, and tracks each post through `drafted -> armed -> posted`.

It deliberately **cannot post**. There is no publish command, and no code path in this
package touches a publish control:

```
$ post-armory golive
Unknown command: golive. Commands: draft, queue, next, mark
```

Publishing is one human action: the operator reads the staged post in their own browser
and presses Post. Same doctrine as the go-live button: an irreversible public action is
safe from prompt injection only when no agent path to it exists.

## Commands

| Command | What it does |
|---|---|
| `draft --episode day-NN --media <file> --angle "<hook>" [--link <url>]` | Compose post text from the angle + a CTA link, enforce copy rules, enqueue as `drafted`. Fails before enqueue if the media is missing or the copy breaks a rule. |
| `queue --episode day-NN` | List entries with id, state, and media. |
| `next --episode day-NN` | Emit the oldest `drafted` entry as JSON (what the arming skill stages next). |
| `mark <id> armed\|posted --episode day-NN` | Advance an entry's state, in order only. |

The queue lives at `episodes/day-NN/posts.json`, beside the media it distributes.

## Copy rules (enforced in code, unit-tested)

Every rule is a guard in `lib/copy.js` with a failing-first test:

- 280-character limit with X URL weighting (any link counts as 23 characters).
- No emojis.
- No em dashes.
- No prices or money figures.
- Must carry a link (the soft CTA).

A post that breaks any rule throws at `draft` time, so it can never reach the queue or
the compose box.

## Design rules

- Pure logic (`lib/copy.js`, `lib/queue.js`) is fully unit-tested: `npm test`, zero
  runtime dependencies, Node 22 `node:test`.
- `bin/post-armory.js` is a logic-free fs/CLI edge.
- The queue state machine moves one direction only; transitions out of order throw.
- A corrupt `posts.json` is refused, never silently rewritten.

## Built live

Designed and built in one hour, live on stream (Episode 2 of the one-hour build
challenge). It is the second stage of an after-stream pipeline: clips come off the VOD,
post-armory queues and composes the posts, and a browser agent stages each one for the
operator to send. The companion arming step keeps the publish press human, on purpose.

Daily builds: https://www.youtube.com/channel/UCWCXKXvNtNbKPkeK_t5CZlg

I build agentic systems like this for businesses. Reach me through the channel.

## License

MIT
