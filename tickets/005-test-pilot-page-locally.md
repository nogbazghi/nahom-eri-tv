# 005: Test the pilot page locally

**Depends on:** 004 (real `videos.json`)

## Steps

1. Serve the `docs/` folder locally (it needs to be served over HTTP, not opened as a `file://` URL — the YouTube IFrame API and the `fetch` call for `videos.json` both require it):
   ```
   cd docs
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000` in a desktop browser (Chrome and Safari if available). Confirm:
   - A video autoplays muted, with the "🔇 Tap to unmute" button visible.
   - Clicking unmute actually unmutes and hides the button.
   - The credit block below the player shows the current video's title and `by <channel>`.
   - Let a short video play to the end (or manually seek near the end via the player controls) — confirm it auto-advances to the next video in the list.
   - Reload the page after some time has passed — confirm it resumes at roughly the expected point in the lineup (not restarting from video 1), proving the shared-broadcast math works.
3. Repeat on a mobile browser (phone on the same Wi-Fi, hitting `http://<your-computer's-LAN-IP>:8000`, or deploy to a quick preview host if that's easier) — mobile autoplay/mute behavior is the main cross-browser risk.
4. If any video in the lineup is actually unplayable (geo-blocked, embedding disabled despite the API check), confirm the page silently skips to the next one instead of freezing.

## Acceptance

- All behaviors above work on at least one desktop browser and one mobile browser.
- Any bug found gets written up in ticket 006 (create its content from the stub) rather than fixed ad hoc here.
