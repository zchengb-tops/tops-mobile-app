# Overview tab icon concepts

Original vector concepts for choosing the summary/overview tab icon. The overview channel currently reuses the original colorful App logo; these concepts are retained for reference.

- A — `01-curated-wand.svg`: outlined magic wand with a compact flash point; recommended for a restrained editorial character.
- B — `02-spark-wand.svg`: simpler wand with a larger, curved sparkle; stronger silhouette, more AI-associated.
- Chosen B, reversed — `02-spark-wand-reversed.svg`: horizontal mirror of B, with its sparkle at the upper left and handle extending down-right. Original B is preserved; the live preview uses this revised vector. `02-spark-wand-reversed-preview.png` shows the updated light/dark tab states, and `comparison-reversed.png` is the updated contact sheet.
- C — `03-curated-grid.svg`: three channel tiles and a sparkle; a non-wand alternative with clearer overview semantics.

All three use a transparent 24 × 24 canvas and `currentColor`; no borrowed icon geometry, raster effects or external assets. `preview.html` shows enlarged artwork, selected light/dark states and 24/20/18px marks. `comparison.png` is a rendered contact sheet; the individual 192px PNGs are transparent previews, not replacements for the vector masters.

The previously approved reversed B remains bundled in `InfoHub/Assets.xcassets/channel-featured.imageset` with fixed black geometry and template rendering, but is not currently used by the overview channel; the vector master retains `currentColor`. The shared channel icon now supplies `InfoHubLogo` to the overview rail, menu, subscription row and global overview thumbnail. The contact sheets are design previews, not evidence of native-device validation.
