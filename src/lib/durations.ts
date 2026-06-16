// Single source of truth for the mix / live-set length boundary.
// A video counts as a MIX (DJ set, live act recording) when it is THIS LONG OR
// LONGER. Anything shorter is a track/sample. Every classifier — the feed
// router, the saved-list tabs, and display badges — imports this so they can
// never drift apart again.
//
// NOTE: changing this affects which videos route into the Mixes pool, so the
// pool must rebuild (next scheduled rebuild, or a manual one) for the feed to
// reflect a new value.
export const MIX_MIN_SECONDS = 2600;
