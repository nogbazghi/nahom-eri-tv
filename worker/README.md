# Watch counter Worker

Receives an anonymous per-channel "watch" beacon from the app and increments
a Workers KV counter keyed by (channel identifier, ISO week). Validates the
request's Origin and the channel identifier against the known channel list;
anything invalid is dropped silently with no error detail, since the only
legitimate caller is the app itself (ticket #114, part of #113).

## Deploy

1. `npx wrangler kv namespace create WATCH_COUNTS` and put the returned id
   into `wrangler.toml`.
2. Set `vars.ALLOWED_ORIGIN` in `wrangler.toml` to the app's real origin.
3. `npx wrangler deploy` from this directory.

## Regenerating the known-channel list

`channels.generated.js` is baked in at deploy time rather than fetched live.
After any change to `curation/channels.yaml`, run:

    python3 worker/generate_channels.py

and commit the result.

## Tests

    node --test worker/*.test.js

## Weekly export's Cloudflare API access

`curation/export_weekly_snapshot.py` (ticket #116) reads this namespace's
counts via the Cloudflare REST API, not through the Worker. The weekly
export workflow needs three repo secrets, sourced from the same account
as the deploy steps above:

- `CF_ACCOUNT_ID` — the account ID shown in the Cloudflare dashboard.
- `CF_KV_NAMESPACE_ID` — the same namespace id used in `wrangler.toml`.
- `CF_API_TOKEN` — an API token scoped to Workers KV Storage: Read for
  this namespace only.
