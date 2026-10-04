# InfoHub native iOS

Native SwiftUI rewrite on `feature/ios-native-rebuild`. The React Native app and Android sources remain in place. Open **InfoHub.xcodeproj**, select the **InfoHub** scheme, then run on an iPhone or iPad simulator. No Metro, CocoaPods, or third-party runtime is required.

## Platform and design

- Minimum iOS 17; Liquid Glass navigation surfaces on iOS 26+. The bottom bar uses the original Ionicons with icon-left/text-right items; the mini player sits above it. Earlier systems use standard materials.
- Three destinations: Discover, Subscriptions, and My Account. Native navigation stack, sheets, reordering and pull to refresh. Discover has a single compact channel bar, without an additional generic hero or search header.
- Edge-to-edge editorial layouts: an inset glass channel rail above open hot lists/tables, article/video artwork, podcast rows with independent playback, and readable Arena metric cells. There are no enclosing rounded reading panels; glass is reserved for navigation and the mini player.
- Two-finger pinch changes between compact, standard and spacious information density. Compact image feeds use thumbnails; spacious feeds expand artwork and summaries. Density is saved locally, separately from font size; the channel menu and My page provide a non-gesture alternative.
- The bottom glass controls have no opaque tint or safe-area shelf. Content and semantic backgrounds continue behind them to the home-indicator region. Reduced transparency/high contrast retains a solid, legible fallback.
- My page uses an open reading-space profile, real subscription counts/channel icons, and separated reading, sync and app settings. Login, confirmed cloud restore, legal documents and existing links remain available.
- Sina's standard layout uses an open headline-first hot list: lightweight numbered ranks, up to two headline lines and secondary heat below, without repetitive rules or colored rank discs. Compact density keeps an inline metric; spacious density expands full headlines.
- Email login uses a focused scrollable screen instead of a grouped Form: labeled fields, an inline resend action, explicit legal consent and a full-width primary action. Native focus, keyboard dismissal, one-time-code autofill, cooldown and the existing endpoints remain in place.
- Scrollable feeds, subscriptions, settings, and legal documents reserve the measured floating footer height plus 16pt of reading clearance. The space adapts to the player and Dynamic Type; footer-free sheets retain native margins, and opening the reader does not shift the underlying feed.
- Semantic colors, system fonts, Dynamic Type, dark/light/system appearance, VoiceOver labels, and system-managed reduced-motion/transparency behavior.
- Debug bundle ID: `cn.zchengb.infohub.native`, allowing side-by-side development. Release retains `cn.zchengb.infohub`. TestFlight signing is configured by the release lane, independently of Debug.
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

Unit checks cover provider variants, unsafe links, lossless cross-platform subscription settings, heatmap geometry, and density thresholds/bounds. UI tests cover physical two-touch pinches, density persistence/selector, edge-to-edge scrolling surfaces, channel paging/scroll retention, reader back navigation, native navigation, subscription toggles, RSS form, login consent, playback, and all 12 channel layouts in light/dark and large reading text. End-of-page checks cover all channels, forms and legal documents, with/without the player, accessibility text sizes, and reader return. An accessibility-size check exercises the stacked table layout. They do not send verification email or write production subscriptions.

The checked-in Xcode project is directly usable. `ruby generate_project.rb` regenerates it using the already-installed `xcodeproj` gem, copies the existing App icon, and extracts the original legal documents from the React Native sources. Do not edit generated legal text independently.

## TestFlight release

The existing **Deploy to TestFlight** GitHub Action retains its React Native/Expo
push behavior on `main`. Native publishing is **manual only**: select
`feature/ios-native-rebuild`, set `implementation` to `native`, and run it.
`validate_only` builds and tests on the hosted Xcode 27 runner without credentials
or an upload; leave it unchecked to actually publish.

The native job uses the checked-in Xcode project, not Expo, Metro, CocoaPods or
`generate_project.rb`. Fastlane is pinned by `Gemfile.lock`; it verifies the
existing InfoHub App Store Connect ID `6739748229`, increments the build above
the current TestFlight train and the local baseline, uses a dedicated
`InfoHub Native AppStore` profile, then waits up to 20 minutes for Apple to process
the upload. It never submits public App Store review or invites external testers.
Internal testing-group access must be verified separately after processing.

Required repository Actions secrets (do not commit them):

| Secret | Value |
| --- | --- |
| `APPSTORE_KEY_ID` | Existing App Store Connect API Key ID |
| `APPSTORE_ISSUER_ID` | Issuer ID for the InfoHub team |
| `APPSTORE_PRIVATE_KEY` | Corresponding PEM `.p8` contents |
| `P12_BASE64` | Base64 distribution certificate **and its private key** |
| `P12_PASSWORD` | Password protecting that PKCS#12 archive |

The expected team is `UPDM24DCXU`, as in Momento's existing personal-account
release setup. Confirm that InfoHub's app belongs to this team before the first
upload. A company-team distribution certificate cannot be substituted. Never
revoke an existing certificate to work around a certificate limit. GitHub cannot
return previously saved secret values; find their original authorized source or
have the account owner configure them. Only copy credentials to this repository
with the owner's approval, since maintainers can use Actions secrets.

The native target bundles a required-reason UserDefaults privacy manifest and
declares only OS-provided, exempt encryption. Review the backend's collected data
and existing App Store privacy labels before a **public** release. The 1024px icon
is an opaque, losslessly rendered copy of the original logo;
`prepare_app_icon.swift` reproduces it when regenerating the project.

Local validation on 2026-10-04: unsigned device Release archive and six unit tests
passed. An unsigned archive is **not** an installable TestFlight package; these
local checks did not upload a build.

Hosted validation also passed on 2026-10-04:
[GitHub Actions run #4](https://github.com/zchengb-tops/tops-mobile-app/actions/runs/37193377755)
tested commit `63360cb` on Xcode 27, with six passing contract tests and a successful
unsigned Release archive. Signing, upload and the legacy Expo job were skipped.

Signed publishing completed on 2026-10-04:
[GitHub Actions run #7](https://github.com/zchengb-tops/tops-mobile-app/actions/runs/37214218153)
published commit `966a868` as **1.3 (25)**. Six contract tests passed, the IPA was
signed and uploaded, and Apple finished processing it with state `VALID`. The
existing **内测用户** internal group automatically received the build; its
App Store Connect status was verified as **Testing**. The signed IPA and dSYM are
retained in the run's `InfoHub-native-7` artifact for 14 days. No public App Store
review or external testing submission was made; the React Native job was skipped.

With the owner's explicit approval, a dedicated **InfoHub GitHub Actions** team
API key and a new personal-team distribution certificate were configured in the
five repository secrets above. No existing keys or certificates were revoked.
The team API key has Admin access across the team's apps, not just InfoHub;
protect workflow write access accordingly. Credential backups are outside Git.
The release lane resolves absolute project/output paths and changes only the
native app's Release signing settings, without relying on optional Xcode project
metadata. Debug and test-target settings remain unchanged.

## Validation on 2026-10-04

- Login brand-background follow-up: three targeted UI cases passed (light/dark login, maximum accessibility text size and native navigation); the two login cases were rerun after contrast/artwork clipping polish and passed. Enlarged sun/horizon elements use one-shot native springs with reduced-motion support. Auth endpoints and consent/cooldown behavior are unchanged; no email or sign-in request was submitted.
- Login/Sina follow-up: five unit tests and seven relevant UI cases passed across regression rounds, including real keyboard dismissal and reachable login actions at the maximum accessibility text size. Login consent/input/legal navigation, headline/heat hierarchy, density gestures, light/dark and large-text trailing content, reader return and native navigation were checked. No verification emails or sign-in requests were sent.
- iPhone 18 Pro Max / iOS 27: five unit tests and sixteen UI tests passed across the design and follow-up regression rounds.
- After replacing the inset page host with native scrolling pagination, affected checks were rerun: all twelve channels' visible layouts and trailing content, physical pinches, saved density after relaunch, light/dark paging and scroll retention, reader return, and all three primary surfaces reaching the bottom screen edge.
- Final targeted run passed five unit tests and five UI tests; image-density/relaunch and twelve-channel visible-layout checks passed separately. Settings/subscription/legal bottom clearance and accessibility-size checks passed in the preceding rounds.
- Tests did not send verification emails or upload production subscriptions. No commit or distribution package was created. See [UI-REVIEW.md](UI-REVIEW.md) for design changes and remaining acceptance gaps.

## Validation on 2026-09-27

- Xcode 27 simulator build passed.
- Four contract/geometry tests and three native UI tests passed on iPhone 18 Pro (iOS 27).
- UI coverage includes 12 channel screenshots, feed density, subscription alignment, RSS add/cancel, login consent gating, dark-mode Arena Labs, and podcast play/pause. See [UI-REVIEW.md](UI-REVIEW.md) for the actual old/new comparison and remaining gaps.
- iPad Pro 11-inch (M5) simulator launched successfully and rendered the live feed and native top tabs.
- iOS 17–26 runtime compatibility, real account writes, legacy storage migration and real-device audio remain unverified; the installed simulator runtime is iOS 27.
