---
"@triplef.io/dashboard": minor
---

- Chat right panel: attachments/files with previews, message history view, playlist queue with now-playing marquee, and transport controls
- Add-to-playlist toggle on every video surface: video lists, gallery items, hero media, product spotlight media
- Floating player: single app-level mounted player docked over its source figure via CSS anchors, popping out into a draggable/resizable window when off-screen — playback survives tab and conversation switches
- Floating playlist widget with playlist persistence, autoplay queue capture, and background-play settings
- Video popout/now-playing contract fixed: hero videos synthesized from tool candidates now carry the candidate's title (title bar + marquee), and title-less heroes are dropped exactly like the server schema requires
- Synthesized gallery/video entries satisfy the response contract: nameless candidates skipped, captions fall back to candidate titles
- Context-usage indicator in the conversation header and conversation compaction flow
