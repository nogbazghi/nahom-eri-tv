# 008: Fill in page content placeholders

**Depends on:** 009 (contact address decided)

## Context

`docs/index.html` has a placeholder: `<a href="mailto:TODO@example.com">TODO@example.com</a>`.

## Steps

1. Open `docs/index.html`, find the `mailto:TODO@example.com` link (currently near the end, in the `<footer>`).
2. Replace both the `href` and the visible text with the real contact address settled in ticket 009.
3. If ticket 009 also settled a Tigrinya name for the channel, consider whether to add it to the `<h1>` or `<title>` in `docs/index.html` (optional — not required for launch).

## Acceptance

- `grep -r "TODO" docs/` returns nothing.
