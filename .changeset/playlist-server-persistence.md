---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- Server: playlists persisted to PostgreSQL via a new `HarnessPlaylist` Prisma model and a playlist controller (list by session/conversation, save, rename, delete)
- Dashboard: `playlists.api` client for the new endpoints; playlist state refactored around server persistence, replacing the browser-only saved-playlists store
