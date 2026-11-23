---
status: accepted
---

# Movies channel is scoped to standalone films, not serialized dramas

Research into YouTube's Eritrean-movie search space surfaced a market dominated by serialized "Part N" dramas/sitcoms (28–53 min episodes) outnumbering standalone full-length films (which cluster 1:00–2:15), not a clean single-genre pool. Owner decision: Movies covers standalone, feature-length films only; serialized dramas/series are explicitly out of scope (a candidate for a future, separate vertical, not pursued now). This is enforced with a `duration_min_sec` floor well above the project's usual 120s spam-filter floor — ~4500s (75 min) — high enough to exclude nearly all Part-N episodes, accepting as a tradeoff that a handful of genuinely short or split-into-parts films will also be excluded.

## Considered Options

Folding serialized dramas into Movies (treating each "Part N" episode as a normal rotation item, the same way Fenkil's multi-part documentary series is already handled) was considered and rejected — unlike Fenkil's single curated playlist, this pool has no trusted curator pre-filtering it, so blending genres here would flood the channel with soap-opera episodes rather than the films viewers expect from a "Movies" row.
