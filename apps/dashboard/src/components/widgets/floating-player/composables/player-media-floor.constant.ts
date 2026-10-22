/**
 * Minimum player *media* box (excluding app chrome) that keeps provider
 * controls usable.
 *
 * YouTube is the only provider with a hard rule: embeds must be at least
 * 200×200px when controls are displayed (480×270 recommended for 16:9);
 * below that the control chrome intentionally degrades. The other providers
 * we embed (Vimeo, Wistia, Loom, Dailymotion, direct <video>) switch to
 * compact responsive chrome under their own comfortable widths (~320px) but
 * keep working. 360×200 clears YouTube's hard floor — under the app's 3:2
 * player ratio a 360px-wide media is 240px tall — while staying full-chrome
 * for the rest.
 */
export const MIN_PLAYER_MEDIA_WIDTH_PX = 360;
export const MIN_PLAYER_MEDIA_HEIGHT_PX = 200;

/**
 * Worst-case height reserved for the floating media bar when deriving popup
 * minimums from the media floor (FloatingPopout caps the bar at 4rem).
 */
export const FLOATING_MEDIA_BAR_HEIGHT_PX = 64;
