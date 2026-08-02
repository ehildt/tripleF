---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- Server: Serper tool family consolidated and explicitly named — `serperBusinessReviewsSearch` (Google Maps reviews by `cid`/`placeId`), `serperWebpageScrape` (rendered page text), plus web/image/news/places/shopping/video search; legacy `webpageFetch` config rows migrate to `scrape` on boot
- Server: `youtubeVideoSearch` tool via the official YouTube Data API v3 (`search.list` + batch `videos.list` enrichment: duration, views, channel, language, direct thumbnails), enabled by `YOUTUBE_API_KEY` or SysCtl
- Server: per-provider/end-point enable+toggles and result counts runtime-managed; sources config supports preferred/blocked domain policy applied before the model sees results
- Server: search queries are date-anchored and support an optional recency window (day/week/month/year) on web, image, and news search
- Dashboard: SysCtl Search Engines section — per-provider cards with enable, masked API key management, and per-endpoint results
- Dashboard: prompt-bar source tags list available search engines; one `videos` tag toggles both Serper and YouTube providers
