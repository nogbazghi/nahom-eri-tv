# 016: Decide what to do about Kebire's thin lineup (1 video)

**Depends on:** 014

## Context

`kebire_channel.py`'s `#eritrea` rule matched only 1 video out of Kebire's entire upload history. A "channel" that's really one video isn't much of a broadcast — it'll just loop the same ~20-minute video endlessly, which is a worse experience than not having the channel yet.

This is a judgment call, not something to decide automatically:

## Options

1. **Loosen the rule** — e.g. also match `#eritrean`, "Eritrea" as a plain word (not just the hashtag), or drop the hashtag requirement if his Eritrea-related videos just aren't tagged that way. Risk: pulls in content he didn't intend to flag as Eritrea-specific.
2. **Launch anyway with 1 video** — it'll still loop and play, just repetitively. Low effort, honest about what's actually available right now.
3. **Hold the Kebire channel back** (don't add it to the live switcher yet) until he posts more matching content, or until the rule is loosened and re-run.

## Steps

1. Watch the 1 video found and a sample of his other uploads to judge whether loosening the rule (option 1) would actually pull in more genuinely Eritrea-related content, or just noise.
2. Decide: loosen the rule, launch thin, or hold back for now.
3. If loosening: edit the filter in `curation/kebire_channel.py` and re-run it.
4. If holding back: the channel-switcher UI already only renders tabs for channels present in `schedules` (ticket 015) — removing Kebire's entry from `docs/data/videos.json` is enough to hide it without any code change.

## Acceptance

- A decision is made and acted on — not left as an unreviewed 1-video channel by default.
