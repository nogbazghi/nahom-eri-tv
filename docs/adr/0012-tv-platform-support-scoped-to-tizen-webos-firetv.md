---
status: accepted
---

# Dedicated TV-platform support scoped to Tizen, webOS, and Fire TV; Apple TV and Roku excluded

**Context:** ADR 0001 planned a future "TV-stick/remote control" input track generically across "Chromecast, Apple TV, Fire TV, Roku," reasoning that real remotes all deliver arrow-key-equivalent input to *a web view*. Research (`docs/research/youtube-iframe-tv-platform-support.md`) and follow-up per-platform investigation found that assumption only holds for two of those four: Apple TV (tvOS) ships no WebKit to third-party apps, and Roku has no DOM/web engine at all.

**Decision:** Build dedicated support only for Samsung Tizen, LG webOS, and Fire TV (current Fire OS — not yet Amazon's newer Vega OS). All three can host the existing web app's YouTube-IFrame-based guide/player behind a thin per-platform packaging wrapper, reusing ADR 0001's generic directional-navigation module for D-pad input. Apple TV and Roku are out of scope: Apple TV keeps today's passive AirPlay mirroring, and Roku gets nothing, until/unless NahomEriTV ever has the rights to self-host its own video instead of pointing at YouTube.

**Considered Options:**
- *Deep-link/cross-launch handoff into the platform's own YouTube app* (Apple TV, Roku): rejected — no documented, supported mechanism exists on either platform. Roku's Certification Criteria §2.4/§5.3 explicitly forbid cross-app deep-linking from a channel, and the in-app ECP mechanism that might have enabled it has been discontinued. Apple's own tvOS-specific YouTube deep-link scheme is undocumented (the only Apple-hosted reference is an archived, iOS-only 2017 page), and App Store Guideline 4.2.2/4.2.3(i) make a handoff-only app a real review-rejection risk regardless.
- *Full native rebuild of the guide/player* (Apple TV via SwiftUI+AVKit, Roku via BrightScript+SceneGraph) with a self-resolved YouTube stream URL: rejected — resolving or rehosting a YouTube stream outside the IFrame/Data API violates YouTube's Developer Policies (prohibitions on alternate access technology, modifying/rebuilding the player, and caching the audiovisual content) on both platforms, independent of any platform-specific rule.

**Consequences:**
- Apple TV and Roku support is blocked on a business/licensing decision (securing rights to self-host video), not an engineering one — revisiting this later means revisiting content rights, not writing more code.
- Tizen/webOS/Fire TV still need real per-platform validation before shipping: background/suspend audio behavior and autoplay policy are confirmed-undocumented gaps on both Tizen and webOS, and Fire TV's WebView-wrapper path is specific to current Fire OS — it does not carry over to Amazon's newer Vega OS devices, which need a separate toolchain.
