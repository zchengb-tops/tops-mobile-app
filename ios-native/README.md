# InfoHub native iOS

Native SwiftUI rewrite on `feature/ios-native-rebuild`. The React Native app and Android sources remain in place. Open **InfoHub.xcodeproj**, select the **InfoHub** scheme, then run on an iPhone or iPad simulator. No Metro, CocoaPods, or third-party runtime is required.

## Platform and design

- Minimum iOS 17; Liquid Glass via native tab/navigation bars, with the mini player in the system tab accessory on iOS 26.1+. Earlier systems use standard materials.
- Three destinations: Discover, Subscriptions, and My Account. Native navigation stack, sheets, reordering and pull to refresh. Discover has a single compact channel bar, without an additional generic hero or search header.
- Semantic colors, system fonts, Dynamic Type, dark/light/system appearance, VoiceOver labels, and system-managed reduced-motion/transparency behavior.
- Debug bundle ID: `cn.zchengb.infohub.native`, allowing side-by-side development. Release retains `cn.zchengb.infohub`. Release signing team must be selected in Xcode.
- API base is configurable through `APIBaseURL` in `InfoHub/Info.plist`; defaults to the existing production endpoint. No credentials in the project.

## React Native feature migration

| Existing feature | Native implementation | Acceptance still required |
| --- | --- | --- |
| All 12 Mobile-enabled channels | Remote channel configuration and native feed rows | Inspect each provider against live data |
| Sina / Zhihu rankings | Rank, title, metrics and article navigation | Source-site navigation on device |
| Sspai / 36kr / NN Group / Bilibili | Artwork, summaries, metadata and reader | Provider artwork/network failures |
| Douban / History / TIOBE | Film scores, history year, language rank/change | Visual comparison |
| Arena Models / Labs | Segmented native view and four score metrics | Data and naming comparison |
| Stock market heatmap | Native weighted treemap, change percentage and source links | Small sectors, landscape, accessibility sizes |
| RSS subscriptions | Recommendations, title lookup, add/edit/delete, deduplication | Server writes with a test feed |
| Channel settings | Toggles, drag reorder, local persistence | Relaunch and cross-platform restore |
| Email-code login | Existing endpoints, agreement gate, resend cooldown, Keychain token | Real test-account email flow |
| Subscription cloud sync | Upload, confirmed restore, opt-in auto-upload with version conflict check | Two-device conflict and expiry flows |
| Reader | WKWebView, back gesture, refresh, share, Safari, failed-load retry | Site-specific redirects/video |
| Podcasts | AVPlayer, background audio, mini/full player, seek, −15/+30, saved progress, AirPlay, lock-screen commands, interruption handling | Real-device lock screen, calls, Bluetooth, AirPlay |
| Appearance and font size | System/light/dark and reading text preference | Accessibility sizes and high contrast |
| Update check / feedback / legal | Startup/manual check, mandatory-update sheet, existing feedback URL, original legal text copied verbatim | Exercise an actual mandatory-update response |
| React Native local data | Cloud restore entry in settings | Direct MMKV-to-native migration is not implemented |

This is a runnable development version, not a parity-certified App Store release. Existing MMKV subscriptions and playback state are not silently imported; users can recover cloud-synced subscriptions through the same account. Decide and implement an upgrade migration before replacing the shipped app. The native app does not include Firebase analytics; revisit instrumentation and privacy disclosures before release.

## Verify

```sh
xcodebuild -project InfoHub.xcodeproj -scheme InfoHub \
  -destination 'platform=iOS Simulator,name=iPhone 18 Pro' \
  -derivedDataPath /tmp/infohub-native-derived CODE_SIGNING_ALLOWED=NO test
```

Unit checks cover provider variants, unsafe links, lossless cross-platform subscription settings, and heatmap geometry. UI tests cover native tab navigation, RSS form, login consent and a discovery screenshot. They do not send verification email or write production subscriptions.

The checked-in Xcode project is directly usable. `ruby generate_project.rb` regenerates it using the already-installed `xcodeproj` gem, copies the existing App icon, and extracts the original legal documents from the React Native sources. Do not edit generated legal text independently.

No distribution archive or production package has been generated.

## Validation on 2026-09-27

- Xcode 27 simulator build passed.
- Four contract/geometry tests and three native UI tests passed on iPhone 18 Pro (iOS 27).
- UI coverage includes 12 channel screenshots, feed density, subscription alignment, RSS add/cancel, login consent gating, dark-mode Arena Labs, and podcast play/pause. See [UI-REVIEW.md](UI-REVIEW.md) for the actual old/new comparison and remaining gaps.
- iPad Pro 11-inch (M5) simulator launched successfully and rendered the live feed and native top tabs.
- iOS 17–26 runtime compatibility, real account writes, legacy storage migration and real-device audio remain unverified; the installed simulator runtime is iOS 27.
