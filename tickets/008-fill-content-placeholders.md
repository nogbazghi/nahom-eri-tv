# 008: Fill in page content placeholders

**Depends on:** 009 (done — resolved as "no contact address for now")

## Status: done, with a gap carried forward

Ticket 009 resolved with a decision to launch without any visible contact method, rather than publish a placeholder/broken address. The `mailto:TODO@example.com` line has been removed from `docs/index.html`'s footer entirely (not replaced), and `grep -r "TODO" docs/` now returns nothing.

**This reopens a real gap**, noted in the design doc's Takedowns section: there is currently no way for anyone to request a takedown or correction, which was the pilot's only safeguard given there's no pre-publish content review. Re-open this ticket once a real contact address exists:

1. Add `<p>Takedown or correction requests: <a href="mailto:REAL_ADDRESS">REAL_ADDRESS</a></p>` back into `docs/index.html`'s `<footer>`.
2. Update the design doc's Contact line (Takedowns, moderation, and privacy section) from "currently none" to the real address.

## Acceptance

- `grep -r "TODO" docs/` returns nothing. (met)
- Tracked as a known gap until a real address is added (see ticket 010's launch-readiness note).
