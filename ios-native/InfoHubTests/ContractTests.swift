import XCTest
import SwiftUI
import UIKit
@testable import InfoHub

final class ContractTests: XCTestCase {
    @MainActor func testChannelPreviewsRenderBothHalvesOfTallViewports() throws {
        let store = AppStore()
        let player = PodcastPlayer()
        let originalSize = store.readingSize
        defer { store.readingSize = originalSize }
        store.readingSize = "system"
        let items: [JSON] = (0..<40).map { index in
            .object(["title": .string("Preview headline \(index)"), "rankNum": .string("\(index + 1)"),
                     "url": .string("https://example.com/\(index)")])
        }
        store.news = .object(["sina": .array(items), "sspai": .array(items), "36kr": .array(items), "nnGroup": .array(items),
                              "github": .object(["daily": .object(["items": .array(items)])])])
        store.channels = ["sspai", "36kr", "nnGroup"].map { Channel(.object(["channelCode": .string($0), "enable": .bool(true)])) }
        for code in ["sina", "github", "featured"] {
            for height in [800, 1200] {
                let channel = Channel(.object(["channelCode": .string(code)]))
                let renderer = ImageRenderer(content: ChannelFeed(channel: channel, previewHeight: CGFloat(height))
                    .environment(store).environment(player).environment(\.colorScheme, .light)
                    .environment(\.dynamicTypeSize, .large).tint(.black)
                    .frame(width: 400, height: CGFloat(height)))
                renderer.scale = 1
                let image = try XCTUnwrap(renderer.cgImage)
                let attachment = XCTAttachment(image: UIImage(cgImage: image))
                attachment.name = "Preview-\(code)-\(height)"
                attachment.lifetime = .keepAlways
                add(attachment)
                var pixels = [UInt8](repeating: 255, count: 400 * height * 4)
                try pixels.withUnsafeMutableBytes { bytes in
                    let context = try XCTUnwrap(CGContext(data: bytes.baseAddress, width: 400, height: height,
                        bitsPerComponent: 8, bytesPerRow: 400 * 4, space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
                    context.draw(image, in: CGRect(x: 0, y: 0, width: 400, height: height))
                }
                for band in [100..<300, (height - 300)..<(height - 100)] {
                    let ink = band.reduce(0) { count, y in
                        count + (100..<350).filter { x in
                            let offset = (y * 400 + x) * 4
                            return pixels[offset] < 160 && pixels[offset + 1] < 160 && pixels[offset + 2] < 160
                        }.count
                    }
                    XCTAssertGreaterThan(ink, 100, "\(code) preview must render headlines in both halves at height \(height)")
                }
                if code == "sina" {
                    // Standalone NavigationLinks are dimmed; compare hue rather than absolute brightness.
                    let firstRankPixels = [0..<80, (height - 80)..<height].flatMap { Array($0) }.reduce(0) { count, y in
                        count + (0..<60).filter { x in
                            let offset = (y * 400 + x) * 4
                            let red = Int(pixels[offset]), green = Int(pixels[offset + 1]), blue = Int(pixels[offset + 2])
                            return red - green > 30 && red - blue > 30 && abs(green - blue) < 20
                        }.count
                    }
                    XCTAssertGreaterThan(firstRankPixels, 5, "Preview must start at rank 1, not center-crop the list")
                }
            }
        }
    }
    @MainActor func testListSpacingIgnoresLegacyPreference() {
        let defaults = UserDefaults.standard
        let original = defaults.object(forKey: "native.feedDensity")
        defer {
            if let original { defaults.set(original, forKey: "native.feedDensity") }
            else { defaults.removeObject(forKey: "native.feedDensity") }
        }
        for legacy in ["compact", "standard", "spacious"] {
            defaults.set(legacy, forKey: "native.feedDensity")
            XCTAssertEqual(AppStore().feedDensity, .standard)
        }
    }
    @MainActor func testRSSSavePrependsAndPreservesEditedPosition() async throws {
        let defaults = UserDefaults.standard
        let keys = ["native.channels", "native.selectedChannel", "native.syncEnabled"]
        let original = keys.map { defaults.object(forKey: $0) }
        XCTAssertTrue(URLProtocol.registerClass(RSSResourceProtocol.self))
        defer {
            URLProtocol.unregisterClass(RSSResourceProtocol.self)
            for (key, value) in zip(keys, original) {
                if let value { defaults.set(value, forKey: key) } else { defaults.removeObject(forKey: key) }
            }
        }
        let store = AppStore()
        store.syncEnabled = false
        let first = Channel(.object(["channelCode": .string("sina"), "enable": .bool(true)]))
        let existing = Channel(.object(["id": .string("existing-rss"), "isRss": .bool(true), "enable": .bool(false),
                                       "rssUrl": .string("https://example.org/existing.xml"), "customField": .string("keep")]))
        let last = Channel(.object(["channelCode": .string("zhihu"), "enable": .bool(true)]))
        store.channels = [first, existing, last]
        try await store.saveRSS(name: "New feed", url: "https://example.org/new.xml", editing: nil, recommendation: nil)
        let added = try XCTUnwrap(store.channels.first)
        XCTAssertTrue(added.isRSS && added.enabled)
        XCTAssertEqual(added.rssURL, "https://example.org/new.xml")
        XCTAssertEqual(store.channels.dropFirst().map(\.id), [first.id, existing.id, last.id])
        XCTAssertEqual(added.raw["iconUrl"].text, "https://example.org/feed-icon.png")
        let persisted = try JSONDecoder().decode([JSON].self, from: XCTUnwrap(defaults.data(forKey: "native.channels")))
        XCTAssertEqual(persisted.first?["id"].text, added.id)
        store.channels[0].enabled = false
        try await store.saveRSS(name: "Edited feed", url: existing.rssURL, editing: existing, recommendation: nil)
        XCTAssertEqual(store.channels.map(\.id), [added.id, first.id, existing.id, last.id])
        XCTAssertEqual(store.channels[2].title, "Edited feed")
        XCTAssertFalse(store.channels[2].enabled)
        XCTAssertEqual(store.channels[2].raw["customField"].text, "keep")
        do {
            try await store.saveRSS(name: "Duplicate", url: added.rssURL, editing: nil, recommendation: nil)
            XCTFail("Keep duplicate feed validation")
        } catch { XCTAssertEqual(error.localizedDescription, "已订阅此 RSS") }
        do {
            try await store.saveRSS(name: "Invalid", url: "javascript:alert(1)", editing: nil, recommendation: nil)
            XCTFail("Keep HTTP/HTTPS validation")
        } catch { XCTAssertTrue(error.localizedDescription.contains("有效的 HTTP / HTTPS")) }
        XCTAssertEqual(store.channels.count, 4)
        await store.refreshRSS()
    }
    func testRSSMarkKeepsExtensionOriginalColors() throws {
        let image = try XCTUnwrap(UIImage(named: "RSSIcon"))
        XCTAssertNotEqual(image.renderingMode, .alwaysTemplate)
        let rss = Channel(.object(["id": .string("rss-test"), "isRss": .bool(true)]))
        let menu = try XCTUnwrap(ChannelIcon.menuImage(for: rss))
        XCTAssertNotEqual(menu.renderingMode, .alwaysTemplate)
        XCTAssertEqual(menu.size, CGSize(width: 20, height: 20))
    }
    @MainActor func testOriginalProviderReadingMetadata() throws {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = try XCTUnwrap(TimeZone(identifier: "Asia/Shanghai"))
        let now = try XCTUnwrap(calendar.date(from: DateComponents(year: 2026, month: 10, day: 8, hour: 12)))
        let iso = try XCTUnwrap(newsDate("2026-10-08T02:00:00.000Z", calendar: calendar))
        XCTAssertEqual(calendar.component(.hour, from: iso), 10)
        XCTAssertEqual(newsDate(String(iso.timeIntervalSince1970 * 1000), calendar: calendar), iso)
        XCTAssertEqual(newsDate(String(iso.timeIntervalSince1970), calendar: calendar), iso)
        XCTAssertEqual(newsDate("Thu, 08 Oct 2026 02:00:00 +0000", calendar: calendar), iso)
        XCTAssertEqual(publicationTime("2026-10-08 09:30", now: now, calendar: calendar), "今天 09:30")
        XCTAssertEqual(publicationTime("2026-10-07 08:30:00", now: now, calendar: calendar), "昨天 08:30")
        XCTAssertEqual(publicationTime("2026-10-06 08:30", now: now, calendar: calendar), "10-06 08:30")
        XCTAssertEqual(calendar.component(.year, from: try XCTUnwrap(newsDate("12-31 09:00", now: now, calendar: calendar))), 2025)
        XCTAssertNil(newsDate("not a date")); XCTAssertNil(newsDate("")); XCTAssertNil(newsDate("2026-02-30"))
        let leapYearStart = try XCTUnwrap(calendar.date(from: DateComponents(year: 2028, month: 1, day: 1)))
        XCTAssertNil(newsDate("02-29 09:00", now: leapYearStart, calendar: calendar), "Do not normalize an invalid previous-year leap date")
        XCTAssertEqual(publicationTime("unknown", now: now, calendar: calendar), "unknown")
        XCTAssertEqual(NewsItem(raw: .object(["acquisitionTime": .string("2026-10-08 00:00:04")]), index: 0).stockUpdateTime, "2026/10/08 00:00")
        XCTAssertEqual(NewsItem(raw: .object(["acquisitionTime": .string("2026-10-08T02:00:00Z")]), index: 0).stockUpdateTime, "2026/10/08 10:00")
        XCTAssertEqual(NewsItem(raw: .object([:]), index: 0).stockUpdateTime, "未知时间")
        for (seconds, label) in [(0.0, "0分钟"), (3599, "59分钟"), (3600, "1小时"), (4045, "1小时7分钟"), (6104, "1小时41分钟")] {
            XCTAssertEqual(NewsItem(raw: .object(["duration": .number(seconds)]), index: 0).durationText, label)
        }
        let movie = NewsItem(raw: .object(["rate": .string("7.2")]), index: 0)
        XCTAssertEqual(movie.ratingStars, ["star.fill", "star.fill", "star.fill", "star.leadinghalf.filled", "star"])
        XCTAssertEqual(NewsItem(raw: .object(["rate": .string("12")]), index: 0).ratingStars, Array(repeating: "star.fill", count: 5))
        XCTAssertTrue(NewsItem(raw: .object([:]), index: 0).ratingStars.isEmpty)
        let neutral = UIColor(stockBackground(0)), falling = UIColor(stockBackground(-3.5)), rising = UIColor(stockBackground(3.5))
        XCTAssertNotEqual(neutral, falling); XCTAssertNotEqual(neutral, rising); XCTAssertNotEqual(falling, rising)
        for vendor in ["alibaba", "anthropic", "deepseek", "google", "meta", "minimax", "moonshot", "openai", "tencent", "thinky", "xai", "xiaomi", "zai", "stepfun", "upstage"] {
            XCTAssertNotNil(UIImage(named: "arena-\(vendor)"), "Bundle the original Arena logo: \(vendor)")
        }
        let lightLogo = try XCTUnwrap(UIImage(named: "arena-moonshot", in: .main, compatibleWith: UITraitCollection(userInterfaceStyle: .light)))
        let darkLogo = try XCTUnwrap(UIImage(named: "arena-moonshot", in: .main, compatibleWith: UITraitCollection(userInterfaceStyle: .dark)))
        XCTAssertNotEqual(try XCTUnwrap(lightLogo.pngData()), try XCTUnwrap(darkLogo.pngData()), "Keep the blue element but adapt the dark mark for contrast")
        XCTAssertEqual(UIImage(named: "arena-stepfun")?.renderingMode, .alwaysTemplate)
    }
    func testDoubanStarPaletteMatchesExtensionThresholds() {
        for rate in [0.0, 3.9, 4] {
            XCTAssertEqual(movieStarColor(rate), Color(red: 153.0 / 255, green: 169.0 / 255, blue: 191.0 / 255))
        }
        for rate in [4.1, 7.2, 7.9] {
            XCTAssertEqual(movieStarColor(rate), Color(red: 247.0 / 255, green: 186.0 / 255, blue: 42.0 / 255))
        }
        for rate in [8.0, 9.5, 10, 12] {
            XCTAssertEqual(movieStarColor(rate), Color(red: 1, green: 153.0 / 255, blue: 0))
        }
    }
    func testFullPlayerCoverUpgradesOnlyKnownProviderVariants() throws {
        for host in ["image.xyzcdn.net", "bts-image.xyzcdn.net"] {
            for variant in ["thumbnail", "small", "middle", "large"] {
                let cover = "https://\(host)/folder/cover.png@\(variant)?token=keep%2Bthis#cover"
                let item = NewsItem(raw: .object(["coverUrl": .string(cover), "hdCoverUrl": .string("")]), index: 0)
                XCTAssertEqual(item.image?.absoluteString, cover, "Keep list/mini-player images unchanged")
                XCTAssertEqual(item.playerImage?.absoluteString, "https://\(host)/folder/cover.png@large?token=keep%2Bthis#cover")
            }
        }
        let episode = NewsItem(raw: .object(["coverUrl": .string("https://image.xyzcdn.net/podcast@thumbnail"),
                                            "hdCoverUrl": .string("https://image.xyzcdn.net/episode@middle")]), index: 0)
        XCTAssertEqual(episode.playerImage?.absoluteString, "https://image.xyzcdn.net/episode@large", "Prefer the episode's own artwork")
        let encoded = NewsItem(raw: .object(["coverUrl": .string("https://image.xyzcdn.net/folder%2Fcover@thumbnail?token=a%2Bb")]), index: 0)
        XCTAssertEqual(encoded.playerImage?.absoluteString, "https://image.xyzcdn.net/folder%2Fcover@large?token=a%2Bb", "Preserve encoded paths and query values")
        for cover in ["https://example.com/cover@thumbnail", "https://image.xyzcdn.net/cover.png",
                      "https://image.xyzcdn.net/cover@custom", "https://image.xyzcdn.net/cover@thumbnail/original.png"] {
            let item = NewsItem(raw: .object(["coverUrl": .string(cover)]), index: 0)
            XCTAssertEqual(item.playerImage?.absoluteString, cover, "Do not rewrite other hosts, originals or unknown paths")
        }
        let insecure = NewsItem(raw: .object(["coverUrl": .string("http://image.xyzcdn.net/cover@thumbnail")]), index: 0)
        XCTAssertEqual(insecure.playerImage?.absoluteString, "https://image.xyzcdn.net/cover@large")
        XCTAssertNil(NewsItem(raw: .object(["coverUrl": .string("file:///cover.png")]), index: 0).playerImage)
        XCTAssertNil(NewsItem(raw: .object([:]), index: 0).playerImage)
    }
    @MainActor func testChannelMenuImageSizeAndRendering() throws {
        for code in Channel.codes.sorted() + ["custom-rss"] {
            let channel = Channel(.object(["channelCode": .string(code)]))
            let image = try XCTUnwrap(ChannelIcon.menuImage(for: channel), code)
            XCTAssertEqual(image.size, CGSize(width: 20, height: 20), code)
            XCTAssertEqual(image.scale, UIGraphicsImageRendererFormat.preferred().scale, "Keep display-resolution images: \(code)")
            let pixels = try XCTUnwrap(image.cgImage, code)
            XCTAssertEqual(pixels.width, Int(20 * image.scale), code)
            XCTAssertEqual(pixels.height, Int(20 * image.scale), code)
            let expectedMode = UIImage(named: channel.assetName)?.renderingMode ?? .alwaysTemplate
            XCTAssertEqual(image.renderingMode, expectedMode, "Keep brand colors and adaptive template icons: \(code)")
        }
    }
    func testLegalPresentationPreservesBundledTextAndSectionHeadings() throws {
        for (kind, sectionCount) in [("terms", 6), ("privacy", 7)] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: kind, withExtension: "txt"))
            let source = try String(contentsOf: url, encoding: .utf8)
            let paragraphs = LegalView.paragraphs(in: source)
            XCTAssertEqual(paragraphs.joined(separator: "\n\n"), source, "Presentation must not change agreement wording or lists")
            XCTAssertEqual(paragraphs.filter(LegalView.isSectionHeading).count, sectionCount)
            XCTAssertTrue(paragraphs.contains { $0.contains("zxchengb@163.com") })
        }
        XCTAssertFalse(LegalView.isSectionHeading("• 应用内反馈功能"))
        XCTAssertFalse(LegalView.isSectionHeading("1. 条款\n正文"))
    }
    @MainActor func testUpdateBadgeSurvivesDismissalAndClearsWhenCurrent() throws {
        let store = AppStore()
        let current = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
        let build = Double(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0") ?? 0
        let newer = JSON.object(["latestVersion": .string("9999.0"), "latestVersionCode": .number(9999), "isMandatory": .bool(true)])
        try store.applyUpdateInfo(newer, silent: true)
        XCTAssertEqual(store.availableUpdate?["latestVersion"].text, "9999.0")
        XCTAssertEqual(store.update?["isMandatory"].flag, true)
        store.update = nil
        XCTAssertNotNil(store.availableUpdate, "Dismissing the update sheet must not clear the version badge")
        XCTAssertThrowsError(try store.applyUpdateInfo(.object([:]), silent: true))
        XCTAssertNotNil(store.availableUpdate, "Invalid metadata must not hide a known update")
        try store.applyUpdateInfo(.object(["latestVersion": .string(current), "latestVersionCode": .number(build + 1)]), silent: true)
        XCTAssertNotNil(store.availableUpdate, "A newer build of the same version is still an update")
        try store.applyUpdateInfo(.object(["latestVersion": .string(current), "latestVersionCode": .number(build)]), silent: false)
        XCTAssertNil(store.availableUpdate)
        XCTAssertNil(store.update)
        XCTAssertEqual(store.message, "已是最新版本")
    }
    func testVerificationDigitsTypingEditingAndBackspace() {
        var digits = VerificationCodeDigits()
        var focus = 0
        for character in "123456" { focus = digits.insert(String(character), at: focus) }
        XCTAssertEqual(digits.values, ["1", "2", "3", "4", "5", "6"])
        XCTAssertEqual(focus, 5)
        XCTAssertEqual(digits.insert("9", at: 2), 3)
        XCTAssertEqual(digits.code, "129456")
        XCTAssertEqual(digits.delete(at: 3), 2)
        XCTAssertEqual(digits.values, ["1", "2", "9", "", "5", "6"])
        XCTAssertEqual(digits.delete(at: 3), 2)
        XCTAssertEqual(digits.values, ["1", "2", "", "", "5", "6"])
        XCTAssertEqual(digits.insert("34", at: 2), 4)
        XCTAssertEqual(digits.code, "123456")
        digits.setCode("")
        XCTAssertEqual(digits.delete(at: 0), 0)
        XCTAssertEqual(digits.insert("abc", at: 0), 0)
        XCTAssertEqual(digits.code, "")
    }
    func testVerificationDigitsWholeCodeAutofillAndPaste() {
        var digits = VerificationCodeDigits(code: "123")
        XCTAssertEqual(digits.insert("9 8-7 6a5 4", at: 4), 5)
        XCTAssertEqual(digits.values, ["9", "8", "7", "6", "5", "4"], "Whole-code autofill replaces all positions from any focused field")
        XCTAssertEqual(digits.insert("123456789", at: 5), 5)
        XCTAssertEqual(digits.code, "123456")
        digits.setCode("12")
        XCTAssertEqual(digits.insert("345", at: 2), 5)
        XCTAssertEqual(digits.values, ["1", "2", "3", "4", "5", ""])
    }
    @MainActor func testEmailLoginConsentAndNumericCode() async {
        let flow = EmailLoginFlow()
        flow.email = " preview@example.com "
        XCTAssertFalse(flow.canContinue(at: .now))
        var requests = 0
        let denied = await flow.sendCode { _ in requests += 1 }
        XCTAssertFalse(denied)
        XCTAssertEqual(requests, 0)
        flow.agreed = true
        XCTAssertTrue(flow.canContinue(at: .now))
        flow.code = "1a2-3 456789"
        XCTAssertEqual(flow.code, "123456")
        XCTAssertFalse(flow.canSignIn, "A code alone cannot bypass sending and consent")
        flow.email = "bad@"
        XCTAssertFalse(flow.canContinue(at: .now))
    }
    @MainActor func testEmailLoginSendResumeAndAddressSnapshot() async {
        let flow = EmailLoginFlow()
        let now = Date.now
        flow.email = " preview@example.com "; flow.agreed = true
        var requests = 0
        let sent = await flow.sendCode(at: now) { address in
            XCTAssertEqual(flow.operation, .sendCode)
            XCTAssertFalse(flow.canContinue(at: now))
            XCTAssertEqual(address, "preview@example.com")
            requests += 1
        }
        XCTAssertTrue(sent)
        XCTAssertEqual(flow.step, .code)
        XCTAssertEqual(flow.remaining(at: now.addingTimeInterval(0.5)), 60)
        flow.backToEmail()
        let resumed = await flow.sendCode(at: now.addingTimeInterval(2)) { _ in requests += 1 }
        XCTAssertTrue(resumed)
        XCTAssertEqual(requests, 1)
        flow.email = "different@example.com" // The destination is the successfully sent address, not mutable input.
        flow.code = "123456"
        let signedIn = await flow.signIn { address, code in
            XCTAssertEqual(address, "preview@example.com")
            XCTAssertEqual(code, "123456")
            XCTAssertEqual(flow.operation, .signIn)
            XCTAssertFalse(flow.canSignIn)
        }
        XCTAssertTrue(signedIn)
        XCTAssertFalse(flow.busy)
    }
    @MainActor func testEmailLoginSendFailureAndCooldown() async {
        let flow = EmailLoginFlow()
        let now = Date.now
        flow.email = "preview@example.com"; flow.agreed = true
        let failed = await flow.sendCode(at: now) { _ in throw APIError.message("send failed") }
        XCTAssertFalse(failed)
        XCTAssertEqual(flow.step, .email)
        XCTAssertNil(flow.sentAt)
        XCTAssertEqual(flow.error, "send failed")
        await flow.sendCode(at: now) { _ in }
        flow.backToEmail(); flow.email = "different@example.com"
        XCTAssertFalse(flow.canContinue(at: now.addingTimeInterval(59)))
        var requests = 0
        let denied = await flow.sendCode(at: now.addingTimeInterval(59)) { _ in requests += 1 }
        XCTAssertFalse(denied)
        XCTAssertEqual(requests, 0)
        let next = await flow.sendCode(at: now.addingTimeInterval(60)) { address in XCTAssertEqual(address, "different@example.com") }
        XCTAssertTrue(next)
        XCTAssertEqual(flow.sentEmail, "different@example.com")
    }
    @MainActor func testEmailLoginResendExpiryAndErrors() async {
        let flow = EmailLoginFlow()
        let now = Date.now
        flow.email = "preview@example.com"; flow.agreed = true
        await flow.sendCode(at: now) { _ in }
        flow.code = "123456"
        let failed = await flow.signIn { _, _ in throw APIError.message("wrong code") }
        XCTAssertFalse(failed)
        XCTAssertEqual(flow.step, .code)
        XCTAssertEqual(flow.error, "wrong code")
        XCTAssertEqual(flow.code, "123456")
        let resendFailed = await flow.sendCode(at: now.addingTimeInterval(60)) { _ in throw APIError.message("send failed") }
        XCTAssertFalse(resendFailed)
        XCTAssertEqual(flow.sentAt, now)
        XCTAssertEqual(flow.code, "123456")
        await flow.sendCode(at: now.addingTimeInterval(61)) { _ in }
        XCTAssertEqual(flow.code, "")
        XCTAssertNil(flow.error)
        flow.backToEmail()
        XCTAssertFalse(flow.canResume(at: now.addingTimeInterval(361)))
        var requests = 0
        await flow.sendCode(at: now.addingTimeInterval(361)) { _ in requests += 1 }
        XCTAssertEqual(requests, 1, "An expired code should trigger a fresh email, not a dead-end resume")
    }
    func testReleaseResourcesAreBundled() throws {
        let bundle = Bundle.main
        XCTAssertNotNil(UIImage(named: "InfoHubLogo", in: bundle, compatibleWith: nil), "Bundle the original logo for the login heading")
        XCTAssertEqual(bundle.object(forInfoDictionaryKey: "ITSAppUsesNonExemptEncryption") as? Bool, false)
        XCTAssertEqual(bundle.object(forInfoDictionaryKey: "UIAppFonts") as? [String], ["Ionicons.ttf"])
        XCTAssertNotNil(bundle.url(forResource: "Ionicons", withExtension: "ttf"))
        let url = try XCTUnwrap(bundle.url(forResource: "PrivacyInfo", withExtension: "xcprivacy"))
        let privacy = try XCTUnwrap(PropertyListSerialization.propertyList(from: Data(contentsOf: url), format: nil) as? [String: Any])
        XCTAssertEqual(privacy["NSPrivacyTracking"] as? Bool, false)
        let accessed = try XCTUnwrap(privacy["NSPrivacyAccessedAPITypes"] as? [[String: Any]])
        XCTAssertEqual(accessed.first?["NSPrivacyAccessedAPIType"] as? String, "NSPrivacyAccessedAPICategoryUserDefaults")
        XCTAssertEqual(accessed.first?["NSPrivacyAccessedAPITypeReasons"] as? [String], ["CA92.1"])
    }
    func testChannelOverviewZoomThresholdsAndReversal() {
        XCTAssertEqual(ChannelZoom.progress(from: 0, magnification: 0.5, thumbnailScale: 0.5), 1)
        XCTAssertEqual(ChannelZoom.progress(from: 0, magnification: 0.95, thumbnailScale: 0.5), 0.1, accuracy: 0.001)
        XCTAssertEqual(ChannelZoom.progress(from: 1, magnification: 1.5, thumbnailScale: 0.5), 0)
        XCTAssertEqual(ChannelZoom.progress(from: 0, magnification: 2, thumbnailScale: 0.5), 0)
        XCTAssertEqual(ChannelZoom.progress(from: 1, magnification: 0.1, thumbnailScale: 0.5), 1)
        XCTAssertEqual(ChannelZoom.progress(from: 0.4, magnification: .nan, thumbnailScale: 0.5), 0.4)
        XCTAssertEqual(ChannelZoom.destination(progress: 0.2, velocity: 0), 0)
        XCTAssertEqual(ChannelZoom.destination(progress: 0.8, velocity: 0), 1)
        XCTAssertEqual(ChannelZoom.destination(progress: 0.4, velocity: -1), 1)
        XCTAssertEqual(ChannelZoom.destination(progress: 0.6, velocity: 1), 0)
    }
    func testNativeChannelAdditionsPreserveSubscriptionChoices() throws {
        let github = Channel(.object(["id": .number(20), "channelCode": .string("github"), "title": .string("GitHub"), "enable": .bool(false), "custom": .string("keep")]))
        let rss = Channel(.object(["id": .string("my-feed"), "isRss": .bool(true), "title": .string("Feed"), "rssUrl": .string("https://example.com/feed"), "enable": .bool(true)]))
        let future = Channel(.object(["id": .number(50), "channelCode": .string("future"), "title": .string("Future")]))
        let radar = Channel(.object(["id": .number(51), "channelCode": .string("codexRadar"), "title": .string("Radar"), "enable": .bool(true)]))
        let remote = ["sina", "github", "artificialAnalysis", "codexRadar", "aiNews"].map { code in
            Channel(.object(["channelCode": .string(code), "title": .string(code), "isAppEnabled": .bool(code == "sina" || code == "github"), "isDefaultSubscribed": .bool(true)]))
        }
        let result = Channel.mobileCatalog(existing: [rss, github, future, radar], remote: remote)
        XCTAssertEqual(result.filter { $0.code == "github" }.count, 1)
        XCTAssertEqual(result.first { $0.code == "github" }?.raw, github.raw)
        XCTAssertEqual(result.filter { ["my-feed", "github", "future", "codexRadar"].contains($0.id) }.map(\.id), [rss.id, github.id, future.id, radar.id])
        XCTAssertEqual(result.first?.code, "featured")
        XCTAssertTrue(try XCTUnwrap(result.first { $0.code == "artificialAnalysis" }).enabled)
        XCTAssertFalse(radar.supported); XCTAssertFalse(radar.visibleInMobile)
        XCTAssertFalse(result.contains { $0.code == "aiNews" })
        XCTAssertEqual(Channel.mobileCatalog(existing: result, remote: remote), result, "Refreshing must not duplicate channels or reset opt-outs")
    }
    func testNewChannelPayloadsAndSafeModelLinks() throws {
        let github = try JSONDecoder().decode(JSON.self, from: Data(#"{"daily":{"items":[{"title":"owner/repo","link":"https://github.com/owner/repo","rankNum":"1","properties":{"stars":"1,234","starsSince":"321 stars today","description":"Actual description"}},{"title":"bad","link":"javascript:alert(1)"}]},"weekly":{"items":[{"title":"owner/week","link":"https://github.com/owner/week"}]},"monthly":{"items":[]}}"#.utf8))
        XCTAssertEqual(GithubPeriod.daily.items(in: github).count, 1)
        XCTAssertEqual(GithubPeriod.weekly.items(in: github).first?.title, "owner/week")
        XCTAssertTrue(GithubPeriod.monthly.items(in: github).isEmpty)
        let analysis = try JSONDecoder().decode(JSON.self, from: Data(##"{"charts":[{"key":"intelligence","points":[{"label":"Real model","value":57.6,"details_url":"/models/real","color":"#7F4BF3"},{"label":"Real model","value":1},{"label":"Bad","value":"NaN"},{"label":"No value"},{"label":"Unsafe","value":10,"details_url":"javascript:alert(1)"}]},{"key":"speed","points":[{"label":"Fast","value":226.6}]},{"key":"cost","points":[{"label":"Cheap","value":0.133}]},{"key":"unknown","points":[{"label":"Other","value":1}]}]}"##.utf8))
        let charts = AnalysisChart.charts(in: analysis)
        XCTAssertEqual(charts.map(\.id), ["intelligence", "speed", "cost"])
        XCTAssertEqual(charts[0].points.count, 2)
        XCTAssertEqual(charts[0].points.first?.detailsURL?.absoluteString, "https://artificialanalysis.ai/models/real")
        XCTAssertNil(charts[0].points.last?.detailsURL)
        XCTAssertEqual(charts[0].formatted(57.6), "57.6")
        XCTAssertEqual(charts[1].formatted(226.6), "227")
        XCTAssertEqual(charts[2].formatted(0.133), "$0.133")
    }
    @MainActor func testSpecialChannelFailuresKeepLastSuccessfulData() throws {
        let store = AppStore()
        store.news = .object(["sina": .array([.string("unchanged")])])
        let github = try JSONDecoder().decode(JSON.self, from: Data(#"{"daily":{"items":[{"title":"owner/day","link":"https://github.com/owner/day"}]},"weekly":{"items":[{"title":"owner/week","link":"https://github.com/owner/week"}]},"monthly":{"items":[{"title":"owner/month","link":"https://github.com/owner/month"}]}}"#.utf8))
        store.applyChannelResult(.success(github), code: "github")
        XCTAssertNil(store.channelErrors["github"])
        store.applyChannelResult(.failure(APIError.message("offline")), code: "github")
        XCTAssertEqual(store.news["github"], github)
        XCTAssertEqual(store.channelErrors["github"], "offline")
        var partial = github; partial["weekly"] = .object(["items": .array([]), "errorMessage": .string("retry")])
        store.applyChannelResult(.success(partial), code: "github")
        XCTAssertEqual(store.news["github"]["weekly"], github["weekly"])
        XCTAssertNotNil(store.channelErrors["github"])
        let analysis = try JSONDecoder().decode(JSON.self, from: Data(#"{"charts":[{"key":"intelligence","points":[{"label":"Model","value":42}]}]}"#.utf8))
        store.applyChannelResult(.success(analysis), code: "artificialAnalysis")
        store.applyChannelResult(.success(.object([:])), code: "artificialAnalysis")
        XCTAssertEqual(store.news["artificialAnalysis"], analysis)
        XCTAssertEqual(store.news["sina"], .array([.string("unchanged")]))
        XCTAssertNotNil(store.channelErrors["artificialAnalysis"])
    }
    func testAnalysisMonochromeColorsAdaptToDarkMode() {
        for source in ["#000000", "#202020", "#404040"] { XCTAssertEqual(analysisColor(source), .primary) }
        XCTAssertEqual(analysisColor("#7F4BF3"), Color(red: 127.0 / 255, green: 75.0 / 255, blue: 243.0 / 255))
        XCTAssertEqual(analysisColor("invalid"), .purple)
    }
    @MainActor func testAnalysisProviderLogosMatchExtensionAndAreBundled() {
        for (label, asset) in [("Claude Opus 5.5 (max)", "anthropic"), ("GPT-6 Astra (max)", "openai"),
                               ("Gemini 4 Argon (high)", "google"), ("DeepSeek V4.1 Flash", "deepseek"),
                               ("Grok 4.7 (xhigh)", "xai"), ("Kimi K2", "moonshot"),
                               ("GLM-5.3 (max)", "zai"), ("Muse Spark 1.3", "meta"),
                               ("MiMo-V2.6-Pro", "xiaomi"), ("Xiaomi model", "xiaomi")] {
            let point = AnalysisChart.Point(label: label, value: 1, detailsURL: nil, color: "")
            XCTAssertEqual(point.logoAsset, "arena-\(asset)")
            XCTAssertNotNil(UIImage(named: "arena-\(asset)"))
        }
        XCTAssertNil(AnalysisChart.Point(label: "Unknown model", value: 1, detailsURL: nil, color: "").logoAsset)
        XCTAssertNil(AnalysisChart.Point(label: "NotGPT", value: 1, detailsURL: nil, color: "").logoAsset)
        XCTAssertEqual(UIImage(named: "arena-openai")?.renderingMode, .alwaysTemplate,
                       "Monochrome provider logos must adapt to the chart's semantic dark-mode tint")
    }
    func testAnalysisChartLabelsAndZeroBasedScale() {
        for (label, name, variant) in [("GPT-6 Astra (max)", "GPT-6 Astra", "(max)"),
                                      ("Model (preview) (high)", "Model (preview)", "(high)"),
                                      ("MiMo-V2.6-Pro", "MiMo-V2.6-Pro", ""),
                                      ("Model (unfinished", "Model (unfinished", "")] {
            let point = AnalysisChart.Point(label: label, value: 0, detailsURL: nil, color: "")
            XCTAssertEqual(point.name, name); XCTAssertEqual(point.variant, variant)
        }
        let values = [0.0, 0.133, Double.greatestFiniteMagnitude]
        for maximum in values {
            let chart = AnalysisChart(id: "cost", points: [
                .init(label: "A", value: maximum, detailsURL: nil, color: ""),
                .init(label: "B", value: maximum / 2, detailsURL: nil, color: "")
            ])
            XCTAssertGreaterThan(chart.maximum, 0)
            XCTAssertTrue(chart.maximum.isFinite)
            XCTAssertEqual(chart.points[1].value / chart.maximum, maximum == 0 ? 0 : 0.5)
            XCTAssertEqual(chart.points[0].value / chart.maximum, maximum == 0 ? 0 : 1)
        }
        XCTAssertEqual(AnalysisChart(id: "cost", points: []).maximum, 1)
    }
    func testNativeReleaseVersionAndNewLogos() {
        XCTAssertEqual(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String, "1.4")
        XCTAssertEqual(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String, "26")
        for code in ["featured", "github", "artificialAnalysis"] {
            XCTAssertNotNil(UIImage(named: Channel(.object(["channelCode": .string(code)])).assetName))
        }
    }
    @MainActor func testOverviewIconReusesOriginalAppLogo() throws {
        let overview = Channel(.object(["channelCode": .string("featured")]))
        XCTAssertEqual(overview.assetName, "InfoHubLogo")
        let icon = try XCTUnwrap(UIImage(named: overview.assetName))
        XCTAssertNotEqual(icon.renderingMode, .alwaysTemplate, "Keep the original app logo colors in every selection state")
        let menuIcon = try XCTUnwrap(ChannelIcon.menuImage(for: overview))
        XCTAssertNotEqual(menuIcon.renderingMode, .alwaysTemplate)
        XCTAssertEqual(menuIcon.size, CGSize(width: 20, height: 20))
        XCTAssertEqual(Channel(.object(["id": .string("featured"), "isRss": .bool(true)])).assetName, "channel-featured")
        XCTAssertEqual(Channel(.object(["channelCode": .string("sina")])).assetName, "channel-sina")
    }
    func testServerChannelIsCompatibleWithExistingClients() {
        let channel = Channel(.object(["id": .number(1), "channelCode": .string("sina"), "name": .string("新浪微博"), "description": .string("热榜"), "isDefaultSubscribed": .bool(true)]))
        XCTAssertEqual(channel.raw["title"].text, "新浪微博")
        XCTAssertEqual(channel.raw["desc"].text, "热榜")
        XCTAssertTrue(channel.raw["enable"].flag)
        XCTAssertEqual(channel.id, "sina")
    }
    func testChannelSyncPreservesUnknownFieldsAndNumericID() throws {
        let original = Data(#"{"id":12,"channelCode":"future-channel","title":"Future","enable":true,"futureSetting":{"mode":2}}"#.utf8)
        let raw = try JSONDecoder().decode(JSON.self, from: original)
        var channel = Channel(raw)
        channel.enabled = false
        let restored = try JSONDecoder().decode(JSON.self, from: JSONEncoder().encode(channel.raw))
        XCTAssertEqual(restored["id"], .number(12))
        XCTAssertEqual(restored["futureSetting"], raw["futureSetting"])
        XCTAssertFalse(channel.supported)
        XCTAssertFalse(restored["enable"].flag)
    }
    func testProviderVariantsAndUnsafeLinks() throws {
        let raw = try JSONDecoder().decode(JSON.self, from: Data(#"{"name":"电影","rate":"7.2","coverUrl":"https://example.com/cover.jpg","link":"javascript:alert(1)"}"#.utf8))
        let movie = NewsItem(raw: raw, index: 0)
        XCTAssertEqual(movie.title, "电影")
        XCTAssertNotNil(movie.image)
        XCTAssertNil(movie.url)
        XCTAssertNil(webURL("file:///etc/passwd"))
        XCTAssertNil(webURL("https:///"))
    }
    func testTreemapPreservesAreaAndBounds() {
        let items = [10.0, 20, 30, 40].enumerated().map { NewsItem(raw: .object(["value": .array([.number($0.element)])]), index: $0.offset) }
        for size in [CGSize(width: 360, height: 600), CGSize(width: 360, height: 240), CGSize(width: 800, height: 280)] {
            let bounds = CGRect(origin: .zero, size: size)
            let rects = stockRects(items, in: bounds)
            XCTAssertEqual(rects.count, items.count)
            XCTAssertEqual(rects.reduce(0) { $0 + $1.width * $1.height }, bounds.width * bounds.height, accuracy: 0.1)
            for rect in rects { XCTAssertTrue(bounds.contains(rect)) }
        }
    }
    func testStockPaletteContrastAndDirectionInBothAppearances() {
        func components(_ color: Color, _ traits: UITraitCollection) -> (CGFloat, CGFloat, CGFloat, CGFloat) {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            XCTAssertTrue(UIColor(color).resolvedColor(with: traits).getRed(&r, green: &g, blue: &b, alpha: &a))
            return (r, g, b, a)
        }
        func luminance(_ rgba: (CGFloat, CGFloat, CGFloat, CGFloat)) -> Double {
            func linear(_ value: CGFloat) -> Double { value <= 0.04045 ? Double(value / 12.92) : pow(Double((value + 0.055) / 1.055), 2.4) }
            return 0.2126 * linear(rgba.0) + 0.7152 * linear(rgba.1) + 0.0722 * linear(rgba.2)
        }
        for scheme in [ColorScheme.light, .dark] {
            let traits = UITraitCollection(userInterfaceStyle: scheme == .dark ? .dark : .light)
            for change in [-4.0, -3, -1, -0.1, 0, 0.1, 1, 3, 4] {
                let background = components(stockBackground(change, colorScheme: scheme), traits)
                XCTAssertEqual(background.3, 1, "Use opaque, scheme-specific fills rather than faded light colors")
                if change < 0 { XCTAssertGreaterThan(background.1, background.0) }
                if change > 0 { XCTAssertGreaterThan(background.0, background.1) }
                for text in [Color.primary, stockChangeColor(change, colorScheme: scheme)] {
                    let values = [luminance(background), luminance(components(text, traits))].sorted()
                    XCTAssertGreaterThanOrEqual((values[1] + 0.05) / (values[0] + 0.05), 4.5, "\(scheme), \(change), \(text)")
                }
            }
        }
    }
    @MainActor func testStockMapKeepsFeaturedHeight() throws {
        let items = [-4.0, -0.1, 0, 4].enumerated().map {
            NewsItem(raw: .object(["name": .string("板块 \($0.offset)"), "value": .array([.number(10), .number(1), .number($0.element)])]), index: $0.offset)
        }
        for scheme in [ColorScheme.light, .dark] {
            let renderer = ImageRenderer(content: StockMap(items: items, height: 240).frame(width: 360)
                .environment(AppStore()).environment(\.colorScheme, scheme).environment(\.dynamicTypeSize, .large))
            let image = try XCTUnwrap(renderer.uiImage)
            XCTAssertEqual(image.size, CGSize(width: 360, height: 240))
            let attachment = XCTAttachment(image: image)
            attachment.name = "Featured-stock-\(scheme)"; attachment.lifetime = .keepAlways; add(attachment)
        }
    }
}

private final class RSSResourceProtocol: URLProtocol {
    override class func canInit(with request: URLRequest) -> Bool {
        request.url?.host == "zchengb.top" && ["/api/rss-resource", "/api/rss-news"].contains(request.url?.path ?? "")
    }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        guard let url = request.url, let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"]) else { return }
        let data = Data((url.path == "/api/rss-news" ? "[]" : #"{"description":"Fixture feed","iconUrl":"https://example.org/feed-icon.png"}"#).utf8)
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
