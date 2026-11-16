import XCTest
import SwiftUI
import UIKit
import ImageIO
import Observation
@testable import InfoHub

final class ContractTests: XCTestCase {
    @MainActor func testProfileUpdatesValidateAndRespectCurrentAccount() async throws {
        setenv("INFOHUB_TEST_FAKE_CREDENTIALS", "1", 1)
        let defaults = UserDefaults.standard
        let originalEmail = defaults.object(forKey: "native.email")
        let originalToken = Credential.shared.token
        defer {
            Credential.shared.clear()
            if let originalToken { try? Credential.shared.save(originalToken) }
            if let originalEmail { defaults.set(originalEmail, forKey: "native.email") }
            else { defaults.removeObject(forKey: "native.email") }
            ProfileFixtureProtocol.handler = nil
            unsetenv("INFOHUB_TEST_FAKE_CREDENTIALS")
        }
        try Credential.shared.save("fixture-a")
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [ProfileFixtureProtocol.self]
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let store = AppStore(api: API(baseURL: URL(string: "https://profile.invalid/api")!, session: session))
        store.userInfo = .object(["name": .string("Before"), "email": .string("a@example.invalid")])

        let lock = NSLock()
        var requests: [URLRequest] = []
        let response = #"{"name":"Updated","email":"a@example.invalid","avatar":"https://example.invalid/avatar.png"}"#
        var delayed: XCTestExpectation?
        ProfileFixtureProtocol.handler = { request in
            lock.lock(); requests.append(request); lock.unlock()
            let text = String(decoding: request.httpBody ?? Data(), as: UTF8.self)
            if text.contains("Delayed") { delayed?.fulfill(); return (200, response, 0.3) }
            if text.contains("Failure") { return (500, #"{"message":"测试保存失败"}"#, 0) }
            return (200, response, 0)
        }
        for invalid in ["A", String(repeating: "a", count: 31), "a\nb", "a\u{2028}b", "Alice\u{2028}"] {
            do { try await store.updateUserInfo(name: invalid, avatar: nil, sessionToken: "fixture-a"); XCTFail("Expected invalid name") }
            catch { XCTAssertEqual(store.userInfo?["name"].text, "Before") }
        }
        XCTAssertTrue(requests.isEmpty, "Invalid names must not reach the network")

        try await store.updateUserInfo(name: "  新名字  ", avatar: nil, sessionToken: "fixture-a")
        XCTAssertEqual(store.userInfo?["name"].text, "Updated")
        let nameRequest = try XCTUnwrap(requests.last)
        XCTAssertEqual(nameRequest.url?.path, "/api/user/me")
        XCTAssertEqual(nameRequest.httpMethod, "PATCH")
        XCTAssertEqual(nameRequest.value(forHTTPHeaderField: "Authorization"), "Bearer fixture-a")
        let contentType = try XCTUnwrap(nameRequest.value(forHTTPHeaderField: "Content-Type"))
        XCTAssertTrue(contentType.hasPrefix("multipart/form-data; boundary="))
        let boundary = String(contentType.dropFirst("multipart/form-data; boundary=".count))
        let nameBody = String(decoding: try XCTUnwrap(nameRequest.httpBody), as: UTF8.self)
        XCTAssertTrue(nameBody.contains("name=\"name\"\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n新名字\r\n"))
        XCTAssertFalse(nameBody.contains("name=\"avatar\""))
        XCTAssertTrue(nameBody.hasSuffix("--\(boundary)--\r\n"))

        let avatar = Data([137, 80, 78, 71, 0, 255])
        try await store.updateUserInfo(name: "👩‍💻 User", avatar: avatar, sessionToken: "fixture-a")
        let avatarBody = try XCTUnwrap(requests.last?.httpBody)
        XCTAssertNotNil(avatarBody.range(of: Data("name=\"avatar\"; filename=\"avatar.png\"\r\nContent-Type: image/png\r\n\r\n".utf8)))
        XCTAssertNotNil(avatarBody.range(of: avatar))

        do { try await store.updateUserInfo(name: "Failure", avatar: nil, sessionToken: "fixture-a"); XCTFail("Expected error") }
        catch { XCTAssertEqual(store.userInfo?["name"].text, "Updated") }
        let started = expectation(description: "Old account update started")
        delayed = started
        let oldAccount = Task { try await store.updateUserInfo(name: "Delayed", avatar: nil, sessionToken: "fixture-a") }
        await fulfillment(of: [started], timeout: 2)
        try Credential.shared.save("fixture-b")
        store.userInfo = .object(["name": .string("Account B"), "email": .string("b@example.invalid")])
        do { try await oldAccount.value; XCTFail("A stale response must not update the new account") }
        catch is CancellationError {} catch { XCTFail("Unexpected error: \(error)") }
        XCTAssertEqual(store.userInfo?["name"].text, "Account B")
    }

    @MainActor func testProfileAvatarConvertsToBoundedPNG() throws {
        let format = UIGraphicsImageRendererFormat(); format.scale = 1
        let image = UIGraphicsImageRenderer(size: CGSize(width: 2200, height: 1100), format: format).image { context in
            UIColor.orange.setFill(); context.fill(CGRect(x: 0, y: 0, width: 2200, height: 1100))
        }
        let encoded = try XCTUnwrap(image.jpegData(compressionQuality: 0.9))
        let png = try profileAvatarPNG(from: encoded)
        XCTAssertEqual(Array(png.prefix(8)), [137, 80, 78, 71, 13, 10, 26, 10])
        let source = try XCTUnwrap(CGImageSourceCreateWithData(png as CFData, nil))
        let properties = try XCTUnwrap(CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any])
        XCTAssertEqual(properties[kCGImagePropertyPixelWidth] as? Int, 1024)
        XCTAssertEqual(properties[kCGImagePropertyPixelHeight] as? Int, 512)
        XCTAssertThrowsError(try profileAvatarPNG(from: Data([0, 1, 2])))
        XCTAssertThrowsError(try profileAvatarPNG(from: Data()))
    }

    @MainActor func testLoginUpdatesObservationAndIsolatesAccountChanges() async throws {
        setenv("INFOHUB_TEST_FAKE_CREDENTIALS", "1", 1)
        let defaults = UserDefaults.standard
        let keys = ["native.email", "native.syncEnabled", "native.syncVersion", "native.lastSync"]
        let saved = keys.map { defaults.object(forKey: $0) }
        let originalToken = Credential.shared.token
        Credential.shared.clear()
        defer {
            Credential.shared.clear()
            if let originalToken { try? Credential.shared.save(originalToken) }
            for (key, value) in zip(keys, saved) {
                if let value { defaults.set(value, forKey: key) } else { defaults.removeObject(forKey: key) }
            }
            AuthFixtureProtocol.onDelayed = nil
            AuthFixtureProtocol.onRestore = nil
            unsetenv("INFOHUB_TEST_FAKE_CREDENTIALS")
        }
        for key in keys { defaults.removeObject(forKey: key) }
        defaults.set("not-a-fixture-token", forKey: "fixture.authToken")
        XCTAssertNil(Credential.shared.token)
        defaults.removeObject(forKey: "fixture.authToken")
        do { _ = try await API().request("user/me"); XCTFail("Fixtures must not contact production") } catch {}
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [AuthFixtureProtocol.self]
        let api = API(baseURL: URL(string: "https://fixture.invalid/api")!, session: URLSession(configuration: configuration))
        let store = AppStore(api: api)
        XCTAssertFalse(store.loggedIn)
        AuthFixtureProtocol.signInToken = "fixture-a"
        let loginChanged = expectation(description: "Login is observable")
        withObservationTracking { _ = store.loggedIn } onChange: { loginChanged.fulfill() }
        try await store.signIn(email: "a@example.invalid", code: "123456")
        await fulfillment(of: [loginChanged], timeout: 2)
        XCTAssertTrue(store.loggedIn)
        XCTAssertEqual(Credential.shared.token, "fixture-a")
        XCTAssertEqual(store.email, "a@example.invalid")
        XCTAssertTrue(AppStore(api: api).loggedIn, "A new store sees the persisted credential")

        let expired = expectation(description: "Expiration is observable")
        withObservationTracking { _ = store.loggedIn } onChange: { expired.fulfill() }
        do { _ = try await api.request("protected"); XCTFail("Expected 401") } catch {}
        await fulfillment(of: [expired], timeout: 2)
        XCTAssertFalse(store.loggedIn)

        try await store.signIn(email: "a@example.invalid", code: "123456")
        store.syncEnabled = true
        defaults.set("a-version", forKey: "native.syncVersion")
        let original = Channel(.object(["id": .string("local"), "title": .string("Local"), "isRss": .bool(true), "enable": .bool(true)]))
        store.channels = [original]
        let requested = expectation(description: "Old request started")
        AuthFixtureProtocol.onDelayed = { requested.fulfill() }
        let stale = Task { try await api.request("delayed-unauthorized") }
        await fulfillment(of: [requested], timeout: 2)
        AuthFixtureProtocol.signInToken = "fixture-b"
        try await store.signIn(email: "b@example.invalid", code: "123456")
        XCTAssertEqual(Credential.shared.token, "fixture-b")
        do { _ = try await stale.value; XCTFail("Expected stale 401") } catch {}
        XCTAssertTrue(store.loggedIn, "A stale 401 must not clear the new account")
        XCTAssertEqual(store.email, "b@example.invalid")
        XCTAssertFalse(store.syncEnabled)
        XCTAssertNil(defaults.string(forKey: "native.syncVersion"))
        XCTAssertEqual(store.channels.map(\.id), ["local"])

        AuthFixtureProtocol.signInToken = "fixture-a"
        try await store.signIn(email: "a@example.invalid", code: "123456")
        let restoring = expectation(description: "Old restore started")
        AuthFixtureProtocol.onRestore = { restoring.fulfill() }
        let restore = Task { await store.sync(download: true) }
        await fulfillment(of: [restoring], timeout: 2)
        AuthFixtureProtocol.signInToken = "fixture-b"
        try await store.signIn(email: "b@example.invalid", code: "123456")
        await restore.value
        XCTAssertEqual(store.channels.map(\.id), ["local"], "The prior account's delayed restore must not replace local data")
        store.signOut()
        XCTAssertFalse(store.loggedIn)
        XCTAssertEqual(store.channels.map(\.id), ["local"], "Sign-out retains local subscriptions")
    }

    func testRSSCardContentAndSafeThumbnail() {
        let item = NewsItem(raw: .object(["description": .string("<p>Hello&nbsp; world &amp; friends</p>"),
                                         "thumbnail": .string("/images/example.png")]), index: 0)
        XCTAssertEqual(item.rssSummary, "Hello world & friends")
        let escaped = NewsItem(raw: .object(["description": .string("新闻电#8195;通讯 &#8195; 正文 #8195;")]), index: 0)
        XCTAssertEqual(escaped.rssSummary, "新闻电 通讯 正文 #8195;")
        for (description, expected) in [("同一个标题", ""), ("新闻聚焦｜同一个标题", ""),
                                        ("同一个标题：附带的详细内容", "同一个标题：附带的详细内容")] {
            let story = NewsItem(raw: .object(["title": .string("同一个标题"), "description": .string(description)]), index: 0)
            XCTAssertEqual(story.rssCardSummary, expected)
        }
        XCTAssertEqual(item.rssThumbnail(feedURL: "https://example.invalid/rss/feed.xml")?.absoluteString, "https://example.invalid/images/example.png")
        let unsafe = NewsItem(raw: .object(["thumbnail": .string("javascript:alert(1)")]), index: 0)
        XCTAssertNil(unsafe.rssThumbnail(feedURL: "https://example.invalid/feed"))
        XCTAssertNil(item.rssThumbnail(feedURL: "file:///private/feed"))
        for (title, topic, headline) in [
            ("[分享创造] 做了一个工具", "分享创造", "做了一个工具"),
            ("[iPhone]使用心得", "iPhone", "使用心得"),
            ("没有分类的标题", nil, "没有分类的标题"),
            ("[未完成的标题", nil, "[未完成的标题"),
            ("[] 空分类", nil, "[] 空分类"),
            ("[只有分类]", nil, "[只有分类]")
        ] as [(String, String?, String)] {
            let item = NewsItem(raw: .object(["title": .string(title)]), index: 0)
            XCTAssertEqual(item.rssTitleParts.topic, topic)
            XCTAssertEqual(item.rssTitleParts.headline, headline)
        }
    }
    func testRSSSameDayRequiresAllDates() {
        func item(_ date: String, _ index: Int) -> NewsItem {
            NewsItem(raw: .object(["publishDate": .string(date)]), index: index)
        }
        XCTAssertFalse(rssItemsShareDay([]))
        XCTAssertTrue(rssItemsShareDay([item("2026-10-08 09:30", 0), item("2026-10-08 10:30", 1)]))
        XCTAssertFalse(rssItemsShareDay([item("2026-10-08 09:30", 0), item("2026-10-09 09:30", 1)]))
        XCTAssertFalse(rssItemsShareDay([item("2026-10-08 09:30", 0), item("invalid", 1)]))
    }
    @MainActor func testRSSListLongTitlesStayOnOneLine() throws {
        let store = AppStore()
        let player = PodcastPlayer()
        let short = NewsItem(raw: .object(["title": .string("短标题"), "publishDate": .string("2026-10-29T10:00:00Z")]), index: 0)
        let long = NewsItem(raw: .object(["title": .string(String(repeating: "这是很长的新闻标题", count: 12)),
                                         "publishDate": .string("2026-10-29T10:00:00Z")]), index: 1)
        for width in [CGFloat(280), 390] {
            for density in [FeedDensity.standard, .spacious] {
                for textSize in [DynamicTypeSize.large, .accessibility3] {
                    func height(_ item: NewsItem) throws -> CGFloat {
                        let renderer = ImageRenderer(content: NewsRow(item: item, channel: "rss", density: density)
                            .environment(store).environment(player).environment(\.dynamicTypeSize, textSize).frame(width: width))
                        renderer.scale = 2
                        return try XCTUnwrap(renderer.uiImage).size.height
                    }
                    let shortHeight = try height(short)
                    XCTAssertGreaterThanOrEqual(shortHeight, 44)
                    XCTAssertEqual(try height(long), shortHeight, accuracy: 0.5,
                                   "Long RSS headlines must not add a second line or move the date")
                }
            }
        }
    }
    func testSettingsIllustrationsAreBundled() {
        // The account row uses the original system icon, not a settings illustration.
        for name in ["appearance", "reading", "sync", "feedback", "website", "terms", "privacy", "version"] {
            XCTAssertNotNil(UIImage(named: "settings-\(name)"), "Missing settings illustration: \(name)")
        }
    }
    @MainActor func testWeiboRowsTightenPaddingWithoutShrinkingTouchTargets() throws {
        let store = AppStore()
        let player = PodcastPlayer()
        let originalSize = store.readingSize
        defer { store.readingSize = originalSize }
        for readingSize in ["system", "large"] {
            store.readingSize = readingSize
            for scheme in [ColorScheme.light, .dark] {
                for headline in ["微博热榜", String(repeating: "这是一条需要换行的微博新闻标题", count: 3)] {
                    let item = NewsItem(raw: .object(["title": .string(headline), "url": .string("https://example.org/news"),
                        "properties": .object(["viewers": .number(1234000)])]), index: 0)
                    func render(overview: Bool) throws -> UIImage {
                        let renderer = ImageRenderer(content: NewsRow(item: item, channel: "sina", isOverview: overview)
                            .environment(store).environment(player).environment(\.dynamicTypeSize, .large)
                            .environment(\.colorScheme, scheme).frame(width: 390))
                        renderer.scale = 2
                        return try XCTUnwrap(renderer.uiImage)
                    }
                    let overview = try render(overview: true)
                    let full = try render(overview: false)
                    XCTAssertGreaterThanOrEqual(overview.size.height, 44, "Keep the original 44pt content/touch target")
                    XCTAssertEqual(full.size.height - overview.size.height, 4, accuracy: 0.5,
                                   "The complete Weibo tab adds only 2pt above and below each unchanged row")
                    if headline == "微博热榜" { XCTAssertEqual(full.size.height, 48, accuracy: 0.5) }
                    let attachment = XCTAttachment(image: full)
                    attachment.name = "Weibo-tight-row-\(scheme)-\(readingSize)-\(headline == "微博热榜" ? "single" : "wrapped")"
                    attachment.lifetime = .keepAlways
                    add(attachment)
                }
            }
        }
    }
    @MainActor func testAppSceneKeepsStandardTextSizeForPresentedHosts() throws {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        XCTAssertFalse(scenes.isEmpty)
        for scene in scenes {
            XCTAssertEqual(scene.traitOverrides.preferredContentSizeCategory, .large)
            XCTAssertEqual(scene.traitCollection.preferredContentSizeCategory, .large)
        }
    }
    @MainActor func testOverviewArticleCoverKeepsLandscapeRatio() throws {
        let wideArtwork = UIGraphicsImageRenderer(size: CGSize(width: 300, height: 200)).image { context in
            UIColor.red.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 300, height: 200))
            UIColor.green.setFill()
            context.cgContext.fillEllipse(in: CGRect(x: 110, y: 60, width: 80, height: 80))
        }
        let cover = Color.clear.frame(width: 140, height: 140 / 1.5).overlay {
            GeometryReader { geometry in
                Image(uiImage: wideArtwork).resizable().scaledToFill()
                    .frame(width: geometry.size.width, height: geometry.size.height).clipped()
            }
        }.clipped()
        for width in [280, 390] {
            for (copyHeight, topInset) in [60, 94, 132, 210].flatMap({ height in [0, 8, 14].map { (height, $0) } }) {
                for coverFirst in [true, false] {
                    let renderer = ImageRenderer(content: OverviewArticleLayout(coverFirst: coverFirst, spacing: coverFirst ? 14 : 12,
                                                                                coverTopInset: CGFloat(topInset)) {
                        if coverFirst { cover }
                        Color.green.frame(height: CGFloat(copyHeight))
                        if !coverFirst { cover }
                    }.frame(width: CGFloat(width)))
                    renderer.scale = 3
                    let image = try XCTUnwrap(renderer.cgImage)
                    let height = max(copyHeight * 3, topInset * 3 + 280)
                    let pixelWidth = width * 3
                    XCTAssertEqual(image.width, pixelWidth)
                    XCTAssertEqual(image.height, height, "The row accommodates both the fixed-ratio cover and longer text")
                    var pixels = [UInt8](repeating: 0, count: pixelWidth * height * 4)
                    try pixels.withUnsafeMutableBytes { bytes in
                        let context = try XCTUnwrap(CGContext(data: bytes.baseAddress, width: pixelWidth, height: height,
                            bitsPerComponent: 8, bytesPerRow: pixelWidth * 4, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
                        context.draw(image, in: CGRect(x: 0, y: 0, width: pixelWidth, height: height))
                    }
                    let x = coverFirst ? 210 : pixelWidth - 210
                    var artworkRows = 0
                    var transparentRows = 0
                    for y in 0..<height {
                        let offset = (y * pixelWidth + x) * 4
                        if pixels[offset + 3] == 255 { artworkRows += 1 }
                        if pixels[offset + 3] == 0 { transparentRows += 1 }
                    }
                    XCTAssertEqual(artworkRows, 280, "The 420px-wide artwork is always 280px high (3:2)")
                    XCTAssertEqual(transparentRows, height - 280, "Longer copy must not stretch the artwork")
                    var minX = pixelWidth, maxX = 0, minY = height, maxY = 0
                    let coverStart = coverFirst ? 0 : pixelWidth - 420
                    for y in 0..<height {
                        for x in coverStart..<(coverStart + 420) {
                            let offset = (y * pixelWidth + x) * 4
                            if pixels[offset] < 10 && pixels[offset + 1] > 240 && pixels[offset + 2] < 10 {
                                minX = min(minX, x); maxX = max(maxX, x)
                                minY = min(minY, y); maxY = max(maxY, y)
                            }
                        }
                    }
                    XCTAssertGreaterThan(maxX - minX, 100)
                    XCTAssertEqual(maxX - minX, maxY - minY, accuracy: 1, "A source circle must remain circular, not become an ellipse")
                }
            }
        }
        let textOnly = ImageRenderer(content: OverviewArticleLayout {
            Color.green.frame(height: 60)
        }.frame(width: 280))
        textOnly.scale = 1
        XCTAssertEqual(try XCTUnwrap(textOnly.cgImage).height, 60, "Image-less rows keep their natural height")
    }
    @MainActor func testBackToTopInterruptsNativeScrollingAndKeepsPagerPosition() async throws {
        guard #available(iOS 17.4, *) else { throw XCTSkip("Scroll-animation state is available from iOS 17.4") }
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        let root = UIViewController()
        window.rootViewController = root
        window.isHidden = false
        defer { window.isHidden = true }
        let pager = UIScrollView(frame: window.bounds)
        pager.contentInsetAdjustmentBehavior = .never
        pager.contentSize = CGSize(width: window.bounds.width * 2, height: window.bounds.height)
        root.view.addSubview(pager)
        let feed = UIScrollView(frame: CGRect(x: 0, y: 0, width: 350, height: 500))
        feed.contentInsetAdjustmentBehavior = .never
        feed.contentInset = UIEdgeInsets(top: 37, left: 0, bottom: 120, right: 0)
        feed.contentSize = CGSize(width: 700, height: 4000)
        pager.addSubview(feed)
        pager.setContentOffset(CGPoint(x: 30, y: 0), animated: false)
        let anchor = UIView()
        feed.addSubview(anchor)
        let controller = FeedScrollController()
        controller.anchor = anchor
        for animatedReturn in [false, true] {
            feed.setContentOffset(CGPoint(x: 12, y: 600), animated: false)
            feed.setContentOffset(CGPoint(x: 12, y: 2600), animated: true)
            try await Task.sleep(for: .milliseconds(50))
            XCTAssertTrue(feed.isScrollAnimating, "Exercise a moving native scroll view, not an idle one")
            XCTAssertTrue(controller.scrollToTop(animated: animatedReturn))
            if !animatedReturn { XCTAssertFalse(feed.isScrollAnimating, "Reduced motion must stop immediately") }
            try await Task.sleep(for: .seconds(1))
            XCTAssertEqual(feed.contentOffset.y, -feed.adjustedContentInset.top, accuracy: 0.5)
            XCTAssertEqual(feed.contentOffset.x, 12, accuracy: 0.5)
            XCTAssertEqual(pager.contentOffset, CGPoint(x: 30, y: 0), "Only the nearest feed may be scrolled")
            XCTAssertFalse(feed.isScrollAnimating)
        }
        anchor.removeFromSuperview()
        XCTAssertFalse(controller.scrollToTop(animated: false), "An unmounted anchor must use the proxy fallback")
    }
    @MainActor func testLaunchScreenUsesOriginalArtworkWithoutCropping() throws {
        XCTAssertEqual(Bundle.main.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String, "LaunchScreen")
        let controller = try XCTUnwrap(UIStoryboard(name: "LaunchScreen", bundle: .main).instantiateInitialViewController())
        let view = try XCTUnwrap(controller.view)
        let artwork = try XCTUnwrap(view.subviews.compactMap { $0 as? UIImageView }.first)
        XCTAssertNotNil(artwork.image)
        XCTAssertEqual(artwork.image?.size, CGSize(width: 390, height: 844))
        XCTAssertEqual(artwork.contentMode, .scaleAspectFit)
        for style in [UIUserInterfaceStyle.light, .dark] {
            controller.overrideUserInterfaceStyle = style
            for size in [CGSize(width: 440, height: 956), CGSize(width: 956, height: 440), CGSize(width: 1024, height: 1366)] {
                view.frame = CGRect(origin: .zero, size: size)
                view.setNeedsLayout(); view.layoutIfNeeded()
                XCTAssertEqual(artwork.frame, view.bounds)
                XCTAssertEqual(view.backgroundColor?.resolvedColor(with: view.traitCollection), UIColor.white)
                let image = UIGraphicsImageRenderer(size: size).image { context in view.layer.render(in: context.cgContext) }
                let attachment = XCTAttachment(image: image)
                attachment.name = "Launch-\(style.rawValue)-\(Int(size.width))x\(Int(size.height))"
                attachment.lifetime = .keepAlways
                add(attachment)
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
    @MainActor func testRSSRecommendationSubscribesOnceAndReenablesExistingFeed() async throws {
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
        let existing = Channel(.object(["id": .string("existing-recommendation"), "title": .string("My renamed feed"),
            "isRss": .bool(true), "enable": .bool(false), "rssUrl": .string("https://example.org/existing.xml"),
            "iconUrl": .string("https://example.org/existing.png"), "customField": .string("keep")]))
        store.channels = [Channel(.object(["channelCode": .string("sina"), "enable": .bool(true)])), existing]
        let recommendation = JSON.object(["id": .number(42), "title": .string("Recommended feed"), "rssUrl": .string("https://example.org/new.xml")])
        try await store.subscribeRSS(recommendation)
        let added = try XCTUnwrap(store.channels.first)
        XCTAssertEqual(added.title, "Recommended feed")
        XCTAssertTrue(added.enabled)
        XCTAssertEqual(added.raw["iconUrl"].text, "https://example.org/feed-icon.png")
        try await store.subscribeRSS(recommendation)
        XCTAssertEqual(store.channels.count, 3)
        try await store.subscribeRSS(.object(["title": .string("Server name"), "rssUrl": .string(existing.rssURL)]))
        XCTAssertEqual(store.channels.map(\.id), [added.id, "sina", existing.id])
        XCTAssertTrue(store.channels[2].enabled)
        XCTAssertEqual(store.channels[2].title, "My renamed feed")
        XCTAssertEqual(store.channels[2].raw["iconUrl"], existing.raw["iconUrl"])
        XCTAssertEqual(store.channels[2].raw["customField"].text, "keep")
        let persisted = try JSONDecoder().decode([JSON].self, from: XCTUnwrap(defaults.data(forKey: "native.channels")))
        XCTAssertEqual(persisted.map { $0["id"].text }, store.channels.map { $0.raw["id"].text })
        for invalid in [JSON.object(["title": .string("Unsafe"), "rssUrl": .string("javascript:alert(1)")]),
                        .object(["title": .string(" \n"), "rssUrl": .string("https://example.org/empty.xml")])] {
            do { try await store.subscribeRSS(invalid); XCTFail("Invalid recommendations must not be saved") }
            catch { XCTAssertEqual(error.localizedDescription, "推荐来源的名称或订阅地址无效") }
        }
        XCTAssertEqual(store.channels.count, 3)
        await store.refreshRSS()
    }
    @MainActor func testConcurrentRSSRecommendationSavesDoNotCreateDuplicates() async throws {
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
        store.channels = []
        let recommendation = JSON.object(["id": .number(42), "title": .string("Concurrent feed"), "rssUrl": .string("https://example.org/concurrent.xml")])
        let first = Task { try await store.subscribeRSS(recommendation) }
        let second = Task { try await store.subscribeRSS(recommendation) }
        var successes = 0
        for task in [first, second] {
            do { try await task.value; successes += 1 }
            catch { XCTAssertEqual(error.localizedDescription, "已订阅此 RSS") }
        }
        XCTAssertGreaterThanOrEqual(successes, 1)
        XCTAssertEqual(store.channels.count, 1)
        XCTAssertEqual(store.channels.first?.rssURL, "https://example.org/concurrent.xml")
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
        for (label, asset) in [("Claude Opus 5.5 (max)", "arena-anthropic"), ("GPT-6 Astra (max)", "arena-openai"),
                               ("Gemini 4 Argon (high)", "arena-google"), ("DeepSeek V4.1 Flash", "arena-deepseek"),
                               ("Grok 4.7 (xhigh)", "arena-xai"), ("Kimi K2", "arena-moonshot"),
                               ("GLM-5.3 (max)", "analysis-zai"), ("Muse Spark 1.3", "arena-meta"),
                               ("MiMo-V2.6-Pro", "analysis-xiaomi"), ("Xiaomi model", "analysis-xiaomi")] {
            let point = AnalysisChart.Point(label: label, value: 1, detailsURL: nil, color: "")
            XCTAssertEqual(point.logoAsset, asset)
            XCTAssertNotNil(UIImage(named: asset))
        }
        XCTAssertNil(AnalysisChart.Point(label: "Unknown model", value: 1, detailsURL: nil, color: "").logoAsset)
        XCTAssertNil(AnalysisChart.Point(label: "NotGPT", value: 1, detailsURL: nil, color: "").logoAsset)
        XCTAssertEqual(UIImage(named: "arena-openai")?.renderingMode, .alwaysTemplate,
                       "Monochrome provider logos must adapt to the chart's semantic dark-mode tint")
        for asset in ["analysis-zai", "analysis-xiaomi"] {
            XCTAssertEqual(UIImage(named: asset)?.renderingMode, .alwaysOriginal,
                           "Multicolor provider logos must preserve their original artwork")
        }
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

private final class ProfileFixtureProtocol: URLProtocol {
    static var handler: ((URLRequest) -> (Int, String, TimeInterval))?
    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "profile.invalid" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        var captured = request
        if captured.httpBody == nil, let stream = captured.httpBodyStream {
            stream.open(); defer { stream.close() }
            var data = Data(), buffer = [UInt8](repeating: 0, count: 4096)
            while stream.hasBytesAvailable {
                let count = stream.read(&buffer, maxLength: buffer.count)
                if count <= 0 { break }
                data.append(contentsOf: buffer.prefix(count))
            }
            captured.httpBody = data
        }
        guard let url = request.url, let (status, body, delay) = Self.handler?(captured) else { return }
        DispatchQueue.global().asyncAfter(deadline: .now() + delay) { [self] in
            guard let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/json"]) else { return }
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(body.utf8))
            client?.urlProtocolDidFinishLoading(self)
        }
    }
    override func stopLoading() {}
}

private final class AuthFixtureProtocol: URLProtocol {
    static var signInToken = "fixture-a"
    static var onDelayed: (() -> Void)?
    static var onRestore: (() -> Void)?
    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "fixture.invalid" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        guard let url = request.url else { return }
        let status: Int
        let body: String
        let delay: TimeInterval
        switch url.path {
        case "/api/user/sign-in":
            status = 200; body = "{\"accessToken\":\"\(Self.signInToken)\"}"; delay = 0
        case "/api/user/me":
            let isA = request.value(forHTTPHeaderField: "Authorization") == "Bearer fixture-a"
            status = 200; body = isA ? #"{"name":"Account A","email":"a@example.invalid"}"# : #"{"name":"Account B","email":"b@example.invalid"}"#; delay = 0
        case "/api/delayed-unauthorized":
            Self.onDelayed?(); status = 401; body = "{}"; delay = 0.4
        case "/api/user/news-channel-config":
            Self.onRestore?(); status = 200
            body = #"{"content":"[{\"id\":\"cloud\",\"title\":\"Cloud\",\"isRss\":true,\"enable\":true}]","version":"1"}"#
            delay = 0.4
        default: status = 401; body = "{}"; delay = 0
        }
        DispatchQueue.global().asyncAfter(deadline: .now() + delay) { [self] in
            guard let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/json"]) else { return }
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(body.utf8))
            client?.urlProtocolDidFinishLoading(self)
        }
    }
    override func stopLoading() {}
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
