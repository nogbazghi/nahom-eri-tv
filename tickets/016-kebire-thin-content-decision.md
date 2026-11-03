# 016: Decide what to do about Kebire's thin lineup (1 video)

**Depends on:** 014

## Context

`kebire_channel.py`'s `#eritrea` rule matched only 1 video out of Kebire's entire upload history. A "channel" that's really one video isn't much of a broadcast — it'll just loop the same ~20-minute video endlessly, which is a worse experience than not having the channel yet.

This is a judgment call, not something to decide automatically:

## Options

1. **Loosen the rule** — e.g. also match `#eritrean`, "Eritrea" as a plain word (not just the hashtag), or drop the hashtag requirement if his Eritrea-related videos just aren't tagged that way. Risk: pulls in content he didn't intend to flag as Eritrea-specific.
2. **Launch anyway with 1 video** — it'll still loop and play, just repetitively. Low effort, honest about what's actually available right now.
3. **Hold the Kebire channel back** (don't add it to the live switcher yet) until he posts more matching content, or until the rule is loosened and re-run.

## Decision

**Owner decision (2026-11-02): Option 1, loosen the rule — and go wider than the option's own examples.** Match "eritrea" as a plain substring anywhere in the hashtags, description, or title — not just the `#eritrea` hashtag. Done: `channels.yaml`'s `kebire.text_filter` changed from `"#eritrea"` to `"eritrea"`. `matches_text_filter()` in `curation/kebire_channel.py` already checks title OR description with a case-insensitive substring match and needed no code change — dropping the `#` from the config value is enough, since `"eritrea"` matches both the bare word and the hashtag form (`"eritrea"` is a substring of `"#eritrea"`).

**Done (2026-11-02):** re-ran `kebire_channel.py` locally with the widened rule. Result: 6 added, 0 removed, 7 total (up from 1). All 6 additions are genuinely on-topic — "My Asmara Community," "14th Annual Senior Eritrean Soccer Tournament of North America," "Eritrea's hidden gem.," "Asmara, Eritrea Night life.," "2023 Martyrs' Day in Asmara, Eritrea Walk," "Asmara, Eritrea Walking Tour" — no noise pulled in. `docs/data/videos.json` was updated directly (a local run, not the GitHub Actions workflow, so the normal additions-go-through-a-PR step didn't apply here); review and commit the resulting diff as you would any other change.

## Steps

1. ~~Watch the 1 video found and a sample of his other uploads to judge whether loosening the rule (option 1) would actually pull in more genuinely Eritrea-related content, or just noise.~~ Superseded by the decision above.
2. ~~Decide: loosen the rule, launch thin, or hold back for now.~~ Done — see Decision.
3. Edit the filter in `curation/kebire_channel.py` and re-run it. — done; see Decision.
4. If holding back: the channel-switcher UI already only renders tabs for channels present in `schedules` (ticket 015) — removing Kebire's entry from `docs/data/videos.json` is enough to hide it without any code change. — not applicable, rule was loosened instead.

## Acceptance

- A decision is made and acted on — not left as an unreviewed 1-video channel by default.
- Decision made, config changed, script re-run, 6 videos added, no noise observed.
