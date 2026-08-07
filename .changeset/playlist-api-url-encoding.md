---
"@triplef.io/dashboard": patch
---

- Playlist API helpers now URL-encode session, conversation, and playlist-name path segments (user input can contain spaces, slashes, `#`, `?`), with a dedicated spec covering save/list/rename/delete
- Playlist state and related-stories handling tightened; DLQ filter menu and news schema adjusted
