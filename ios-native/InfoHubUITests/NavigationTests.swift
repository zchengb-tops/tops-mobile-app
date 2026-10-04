import XCTest

final class NavigationTests: XCTestCase {
    func testLoginAtAccessibilityTextSize() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "sina", "-native.readingSize", "system",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        waitUntilHittable(app.buttons["nav-2"])
        app.buttons["nav-2"].tap()
        let login = app.buttons["使用邮箱登录"]
        XCTAssertTrue(login.waitForExistence(timeout: 5))
        for _ in 0..<4 where !login.isHittable { app.scrollViews["settings-scroll"].swipeUp() }
        XCTAssertTrue(login.isHittable)
        login.tap()
        let form = app.scrollViews["login-scroll"]
        let email = app.textFields["login-email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        for _ in 0..<5 where !email.isHittable { form.swipeUp() }
        XCTAssertTrue(email.isHittable)
        XCTAssertGreaterThanOrEqual(email.frame.minX, app.frame.minX + 16)
        XCTAssertLessThanOrEqual(email.frame.maxX, app.frame.maxX - 16)
        capture(app, "Login-accessibility-fields")
        email.tap()
        email.typeText("preview@example.com")
        XCTAssertLessThanOrEqual(email.frame.maxY, app.keyboards.firstMatch.frame.minY)
        app.buttons["login-dismiss-keyboard"].tap()
        let keyboardDismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.keyboards.firstMatch)
        XCTAssertEqual(XCTWaiter.wait(for: [keyboardDismissed], timeout: 5), .completed)
        let submit = app.buttons["login-submit"]
        // A partly clipped button can already be hittable. Require its whole frame.
        for _ in 0..<6 {
            if submit.isHittable && submit.frame.maxY <= app.frame.maxY - 16 { break }
            form.swipeUp()
        }
        XCTAssertTrue(submit.isHittable)
        XCTAssertFalse(submit.isEnabled)
        XCTAssertLessThanOrEqual(submit.frame.maxY, app.frame.maxY - 16)
        capture(app, "Login-accessibility-action")
        app.buttons["login-close"].tap()
    }
    func testLoginLayoutKeyboardConsentAndLegalNavigation() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            app.buttons["使用邮箱登录"].tap()
            let email = app.textFields["login-email"]
            let code = app.textFields["login-code"]
            let consent = app.buttons["login-consent"]
            let submit = app.buttons["login-submit"]
            let send = app.buttons["login-send-code"]
            waitUntilHittable(email)
            XCTAssertTrue(app.staticTexts["登录 InfoHub"].exists)
            XCTAssertFalse(app.staticTexts["你的阅读，\n随你同行。"].exists, "Keep login free of the old marketing block")
            XCTAssertTrue(code.isHittable)
            XCTAssertTrue(submit.isHittable, "Primary action should be visible without scrolling before editing")
            XCTAssertFalse(submit.isEnabled)
            XCTAssertFalse(send.isEnabled)
            XCTAssertEqual(consent.value as? String, "未同意")
            capture(app, "Login-\(appearance)-initial")
            email.tap()
            email.typeText("design-preview@example.com")
            XCTAssertTrue(app.keyboards.firstMatch.exists)
            XCTAssertLessThanOrEqual(email.frame.maxY, app.keyboards.firstMatch.frame.minY, "Keep the active field above the keyboard")
            capture(app, "Login-\(appearance)-keyboard")
            app.buttons["login-dismiss-keyboard"].tap()
            XCTAssertFalse(send.isEnabled, "An email alone must not bypass consent")
            consent.tap()
            XCTAssertEqual(consent.value as? String, "已同意")
            XCTAssertTrue(send.isEnabled)
            code.tap()
            code.typeText("123456")
            app.buttons["login-dismiss-keyboard"].tap()
            XCTAssertTrue(submit.isEnabled)
            capture(app, "Login-\(appearance)-ready")
            // Only inspect enabled states. Never send email or submit credentials to production.
            app.buttons["login-privacy"].tap()
            XCTAssertTrue(app.scrollViews["legal-scroll"].waitForExistence(timeout: 5))
            app.navigationBars.buttons.firstMatch.tap()
            XCTAssertEqual(email.value as? String, "design-preview@example.com", "Legal navigation must preserve form input")
            XCTAssertEqual(code.value as? String, "123456")
            consent.tap()
            XCTAssertFalse(send.isEnabled)
            XCTAssertFalse(submit.isEnabled)
            app.buttons["login-close"].tap()
            XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 5))
            app.terminate()
        }
    }
    func testWeiboEditorialHierarchyAndBottomClearance() {
        let app = XCUIApplication()
        for (appearance, size) in [("light", "system"), ("dark", "system"), ("light", "large")] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", size, "-native.feedDensity", "standard"]
            app.launch()
            let first = app.buttons["news-sina-0"].firstMatch
            waitUntilHittable(first)
            let title = app.staticTexts["sina-title-0"].firstMatch
            let heat = app.staticTexts["sina-heat-0"].firstMatch
            XCTAssertTrue(title.exists)
            XCTAssertTrue(heat.exists)
            XCTAssertGreaterThan(heat.frame.minY, title.frame.maxY, "Heat is secondary metadata, not competing with the headline")
            XCTAssertEqual(heat.frame.minX, title.frame.minX, accuracy: 1)
            XCTAssertGreaterThanOrEqual(first.frame.height, 44)
            capture(app, "Weibo-editorial-\(appearance)-\(size)")
            let feed = app.scrollViews["feed-sina"]
            let lastItem = { self.lastNewsItem(app, channel: "sina", fallback: feed) }
            scrollToEnd(feed, lastItem: lastItem)
            assertAboveFooter(lastItem(), in: app, name: "Weibo-editorial-bottom-\(appearance)-\(size)")
            app.terminate()
        }
    }
    func testReadingSurfacesReachBottomEdge() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.feedDensity", "standard"]
            app.launch()
            XCTAssertTrue(app.buttons["nav-0"].waitForExistence(timeout: 15))
            for (tab, identifier) in [(0, "feed-sina"), (1, "subscriptions-scroll"), (2, "settings-scroll")] {
                app.buttons["nav-\(tab)"].tap()
                let surface = app.descendants(matching: .any).matching(identifier: identifier).firstMatch
                XCTAssertTrue(surface.waitForExistence(timeout: 5))
                XCTAssertEqual(surface.frame.minX, app.frame.minX, accuracy: 1)
                XCTAssertEqual(surface.frame.maxX, app.frame.maxX, accuracy: 1)
                XCTAssertEqual(surface.frame.maxY, app.frame.maxY, accuracy: 1, "Content must continue behind the glass and home indicator")
                capture(app, "Edge-to-edge-\(appearance)-\(identifier)")
            }
            app.terminate()
        }
    }
    func testPinchChangesDensityWithoutOpeningReader() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.feedDensity", "standard", "-native.readingSize", "system"]
            app.launch()
            let feed = app.scrollViews["feed-sina"]
            let first = app.buttons["news-sina-0"].firstMatch
            waitUntilHittable(first)
            let second = app.buttons["news-sina-1"].firstMatch
            let standardHeight = second.frame.minY - first.frame.minY
            // Pinch an unobstructed content item. A full-feed pinch starts one finger on the floating player.
            first.pinch(withScale: 0.55, velocity: -1)
            waitForDensity("紧凑", app: app)
            XCTAssertLessThan(second.frame.minY - first.frame.minY, standardHeight)
            capture(app, "Density-\(appearance)-compact")
            first.pinch(withScale: 1.8, velocity: 1)
            waitForDensity("标准", app: app)
            first.pinch(withScale: 1.8, velocity: 1)
            waitForDensity("舒展", app: app)
            XCTAssertGreaterThan(second.frame.minY - first.frame.minY, standardHeight)
            capture(app, "Density-\(appearance)-spacious")
            XCTAssertFalse(app.buttons["刷新"].exists, "Pinching must not open an article")
            XCTAssertTrue(app.buttons["channel-menu"].exists)
            feed.swipeUp()
            XCTAssertFalse(first.isHittable, "One-finger scrolling still works after pinching")
            swipeChannel(app, left: true)
            XCTAssertTrue(app.buttons["tab-zhihu"].isSelected, "Pinching must not capture channel paging")
            app.buttons["nav-2"].tap()
            XCTAssertTrue(app.buttons["使用邮箱登录"].exists)
            XCTAssertTrue(app.buttons["density-picker"].exists)
            capture(app, "Reading-space-\(appearance)")
            app.buttons["density-picker"].tap()
            app.buttons["标准"].tap()
            app.buttons["nav-0"].tap()
            waitForDensity("标准", app: app)
            app.terminate()
        }
    }
    func testImageFeedPinchChangesComposition() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sspai", "-native.feedDensity", "standard", "-native.readingSize", "system"]
        app.launch()
        let first = app.buttons["news-sspai-0"].firstMatch
        waitUntilHittable(first)
        let expandedHeight = first.frame.height
        capture(app, "Editorial-density-standard")
        first.pinch(withScale: 0.55, velocity: -1)
        waitForDensity("紧凑", app: app)
        XCTAssertLessThan(first.frame.height, expandedHeight * 0.75, "Hero art should become a compact thumbnail, not shrink text")
        capture(app, "Editorial-density-compact")
        app.terminate()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sspai", "-native.readingSize", "system"]
        app.launch()
        waitUntilHittable(first)
        waitForDensity("紧凑", app: app)
        first.pinch(withScale: 1.8, velocity: 1)
        waitForDensity("标准", app: app)
        XCTAssertEqual(first.frame.height, expandedHeight, accuracy: 2)
    }
    private func waitForDensity(_ density: String, app: XCUIApplication) {
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", density), object: app.buttons["channel-menu"])
        XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 5), .completed)
    }
    private func waitUntilHittable(_ element: XCUIElement) {
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND hittable == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 15), .completed)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testSettingsBottomClearsFloatingPlayer() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
        app.launch()
        XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 15))
        if !app.buttons["mini-player"].exists {
            let play = app.buttons["播放"].firstMatch
            XCTAssertTrue(play.waitForExistence(timeout: 15))
            play.tap()
        }
        XCTAssertTrue(app.buttons["mini-player"].waitForExistence(timeout: 5))
        app.buttons["nav-2"].tap()
        let form = app.descendants(matching: .any).matching(identifier: "settings-scroll").firstMatch
        let privacy = app.descendants(matching: .any).matching(identifier: "settings-privacy").firstMatch
        for _ in 0..<6 { form.swipeUp(velocity: .fast) }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Settings-bottom-player"; screenshot.lifetime = .keepAlways; add(screenshot)
        XCTAssertTrue(privacy.isHittable)
        XCTAssertLessThanOrEqual(privacy.frame.maxY, app.buttons["mini-player"].frame.minY - 12,
                                 "The entire last row must scroll above the mini-player, not just above navigation")
    }
    func testAllChannelEndsClearFloatingPlayer() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        ensureMiniPlayer(app)
        for channel in ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "tiobe", "doubanMovie", "nnGroup", "bilibili", "36kr", "history", "stock"] {
            app.buttons["channel-menu"].tap()
            app.buttons["choose-\(channel)"].tap()
            let feed = app.scrollViews["feed-\(channel)"]
            waitUntilHittable(feed)
            let lastItem = {
                if channel == "stock" { return app.staticTexts["面积代表市值 · 点击板块查看详情"] }
                return self.lastNewsItem(app, channel: channel, fallback: feed)
            }
            XCTAssertTrue(lastItem().waitForExistence(timeout: 15), channel)
            scrollToEnd(feed, lastItem: lastItem)
            assertAboveFooter(lastItem(), in: app, name: "Feed-bottom-\(channel)")
            if channel == "arena" {
                // Labs is a second list on the same scrolling surface.
                let labs = app.segmentedControls.buttons["Labs"]
                for _ in 0..<45 {
                    if labs.exists && labs.isHittable { break }
                    feed.swipeDown(velocity: .fast)
                }
                XCTAssertTrue(labs.exists && labs.isHittable)
                labs.tap()
                scrollToEnd(feed, lastItem: lastItem)
                assertAboveFooter(lastItem(), in: app, name: "Feed-bottom-arena-labs")
            }
        }
    }
    func testFormEndsClearFooterWithAndWithoutPlayer() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
            app.launch()
            XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 15))
            ensureMiniPlayer(app)
            for withPlayer in [true, false] {
                if !withPlayer {
                    app.buttons["mini-player"].tap()
                    let stop = app.buttons["结束播放"]
                    XCTAssertTrue(stop.waitForExistence(timeout: 5))
                    stop.tap()
                    XCTAssertFalse(app.buttons["mini-player"].exists)
                }
                app.buttons["nav-1"].tap()
                let list = app.descendants(matching: .any).matching(identifier: "subscriptions-scroll").firstMatch
                let note = app.staticTexts["subscriptions-end"]
                scrollToEnd(list) { note }
                assertAboveFooter(note, in: app, name: "Subscriptions-bottom-\(appearance)-player-\(withPlayer)")
                app.buttons["nav-2"].tap()
                let form = app.descendants(matching: .any).matching(identifier: "settings-scroll").firstMatch
                let privacy = app.buttons["settings-privacy"]
                scrollToEnd(form) { privacy }
                assertAboveFooter(privacy, in: app, name: "Settings-bottom-\(appearance)-player-\(withPlayer)")
                privacy.tap()
                let legal = app.scrollViews["legal-scroll"]
                let document = app.staticTexts["legal-document"]
                XCTAssertTrue(document.waitForExistence(timeout: 5))
                scrollToEnd(legal) { document }
                assertAboveFooter(document, in: app, name: "Legal-bottom-\(appearance)-player-\(withPlayer)")
                app.navigationBars.buttons.firstMatch.tap()
            }
            app.terminate()
        }
    }
    func testLargeTextBottomClearance() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 15))
        ensureMiniPlayer(app)
        app.buttons["nav-2"].tap()
        let form = app.descendants(matching: .any).matching(identifier: "settings-scroll").firstMatch
        let privacy = app.buttons["settings-privacy"]
        scrollToEnd(form) { privacy }
        assertAboveFooter(privacy, in: app, name: "Settings-bottom-accessibility")
        app.buttons["nav-0"].tap()
        let feed = app.scrollViews["feed-xiaoyuzhou"]
        let lastItem = {
            self.lastNewsItem(app, channel: "xiaoyuzhou", fallback: feed)
        }
        scrollToEnd(feed, lastItem: lastItem)
        assertAboveFooter(lastItem(), in: app, name: "Podcast-bottom-accessibility")
    }
    func testReaderReturnKeepsBottomClearance() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        ensureMiniPlayer(app)
        app.buttons["channel-menu"].tap()
        app.buttons["choose-sina"].tap()
        let feed = app.scrollViews["feed-sina"]
        let lastItem = {
            self.lastNewsItem(app, channel: "sina", fallback: feed)
        }
        scrollToEnd(feed, lastItem: lastItem)
        let last = lastItem()
        let bottom = last.frame.maxY
        last.tap()
        XCTAssertTrue(app.buttons["刷新"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["mini-player"].exists)
        XCTAssertFalse(app.buttons["nav-0"].exists)
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(app.buttons["mini-player"].waitForExistence(timeout: 5))
        XCTAssertEqual(last.frame.maxY, bottom, accuracy: 2, "Returning must not clamp the feed's bottom scroll position")
        assertAboveFooter(last, in: app, name: "Feed-bottom-after-reader")
    }
    private func ensureMiniPlayer(_ app: XCUIApplication) {
        if !app.buttons["mini-player"].exists {
            let play = app.buttons["播放"].firstMatch
            XCTAssertTrue(play.waitForExistence(timeout: 15))
            play.tap()
        }
        XCTAssertTrue(app.buttons["mini-player"].waitForExistence(timeout: 5))
    }
    private func lastNewsItem(_ app: XCUIApplication, channel: String, fallback: XCUIElement) -> XCUIElement {
        let rows = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).allElementsBoundByIndex
        guard let identifier = rows.last?.identifier else { return fallback }
        // Podcast cards have two accessible buttons with the row ID: measure all the text,
        // not just the smaller play button in the middle of a tall accessibility-size card.
        return rows.reversed().prefix { $0.identifier == identifier }.max { $0.frame.maxY < $1.frame.maxY } ?? fallback
    }
    private func scrollToEnd(_ scroll: XCUIElement, lastItem: () -> XCUIElement) {
        var previous = CGRect.null
        var previousID = ""
        var settled = 0
        for _ in 0..<45 {
            scroll.swipeUp(velocity: .fast)
            let item = lastItem()
            // Form/List virtualize their trailing rows, especially at accessibility text sizes.
            guard item.exists else { settled = 0; continue }
            let frame = item.frame
            settled = !frame.isEmpty && frame == previous && item.identifier == previousID ? settled + 1 : 0
            if settled >= 2 { return }
            previous = frame; previousID = item.identifier
        }
        XCTFail("The scroll view must reach a stable end position")
    }
    private func assertAboveFooter(_ item: XCUIElement, in app: XCUIApplication, name: String) {
        let miniPlayer = app.buttons["mini-player"]
        let footerTop = miniPlayer.exists ? miniPlayer.frame.minY - 6 : app.buttons["nav-0"].frame.minY - 4
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = name; screenshot.lifetime = .keepAlways; add(screenshot)
        XCTAssertTrue(item.exists)
        XCTAssertLessThanOrEqual(item.frame.maxY, footerTop - 12, "Last content must clear the entire floating footer: \(name)")
    }
    func testChannelPagingKeepsScrollingAndSelectionInSync() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            app.launch()
            let firstSina = app.descendants(matching: .any).matching(identifier: "news-sina-0").firstMatch
            XCTAssertTrue(firstSina.waitForExistence(timeout: 15))
            swipeChannel(app, left: true)
            let firstZhihu = app.descendants(matching: .any).matching(identifier: "news-zhihu-0").firstMatch
            XCTAssertTrue(firstZhihu.waitForExistence(timeout: 5))
            XCTAssertTrue(app.buttons["tab-zhihu"].isSelected)
            app.scrollViews["feed-zhihu"].swipeUp()
            XCTAssertFalse(firstZhihu.isHittable, "Vertical scrolling must still work inside a page")
            swipeChannel(app, left: true)
            XCTAssertTrue(app.buttons["tab-sspai"].isSelected)
            swipeChannel(app, left: false)
            XCTAssertTrue(app.buttons["tab-zhihu"].isSelected)
            XCTAssertFalse(firstZhihu.isHittable, "Keep each channel's scroll position when returning")
            app.buttons["channel-menu"].tap()
            app.buttons["choose-arena"].tap()
            XCTAssertTrue(app.segmentedControls.buttons["Labs"].waitForExistence(timeout: 5))
            swipeChannel(app, left: true)
            XCTAssertTrue(app.buttons["tab-xiaoyuzhou"].isSelected, "Paging must also work from Arena")
            XCTAssertTrue(app.buttons["播放"].firstMatch.waitForExistence(timeout: 5))
            app.buttons["channel-menu"].tap()
            app.buttons["choose-sina"].tap()
            swipeChannel(app, left: false)
            XCTAssertTrue(app.buttons["tab-sina"].isSelected, "Do not wrap past the first enabled channel")
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "Paging-and-fonts-\(appearance)"; screenshot.lifetime = .keepAlways; add(screenshot)
            app.terminate()
        }
    }
    private func swipeChannel(_ app: XCUIApplication, left: Bool) {
        app.coordinate(withNormalizedOffset: CGVector(dx: left ? 0.85 : 0.15, dy: 0.45)).press(forDuration: 0.05,
            thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: left ? 0.15 : 0.85, dy: 0.45)))
    }
    func testReaderHidesAppNavigation() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina"]
            app.launch()
            let article = app.descendants(matching: .any).matching(identifier: "news-sina-0").firstMatch
            XCTAssertTrue(article.waitForExistence(timeout: 15))
            article.tap()
            XCTAssertTrue(app.buttons["刷新"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.tabBars.firstMatch.exists)
            for index in 0..<3 { XCTAssertFalse(app.buttons["nav-\(index)"].exists, "App navigation must be hidden in the reader") }
            let back = app.navigationBars.buttons.firstMatch
            XCTAssertTrue(back.exists, "Keep the native Back button")
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "Reader-\(appearance)"; screenshot.lifetime = .keepAlways; add(screenshot)
            if appearance == "light" {
                back.tap()
            } else {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.5)).press(forDuration: 0.05,
                    thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.5)))
            }
            XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 5))
            for index in 0..<3 { XCTAssertTrue(app.buttons["nav-\(index)"].exists, "Restore app navigation after returning") }
            app.terminate()
        }
    }
    func testSubscriptionSwitchesInBothAppearances() {
        let app = XCUIApplication()
        for appearance in ["dark", "light"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.syncEnabled", "NO"]
            app.launch()
            XCTAssertTrue(app.buttons["nav-1"].waitForExistence(timeout: 15))
            app.buttons["nav-1"].tap()
            let toggle = app.switches["订阅 知乎"]
            XCTAssertTrue(toggle.waitForExistence(timeout: 5))
            let original = toggle.value as? String
            XCTAssertNotNil(original)
            toggle.tap()
            XCTAssertNotEqual(toggle.value as? String, original)
            let changed = XCTAttachment(screenshot: app.screenshot())
            changed.name = "Subscriptions-\(appearance)-toggled"; changed.lifetime = .keepAlways; add(changed)
            toggle.tap()
            XCTAssertEqual(toggle.value as? String, original, "Restore the original subscription state")
            let restored = XCTAttachment(screenshot: app.screenshot())
            restored.name = "Subscriptions-\(appearance)-restored"; restored.lifetime = .keepAlways; add(restored)
            app.terminate()
        }
    }
    func testDarkModeArenaAndPodcast() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        app.buttons["channel-menu"].tap()
        let arena = app.buttons["choose-arena"]
        XCTAssertTrue(arena.waitForExistence(timeout: 5))
        arena.tap()
        XCTAssertTrue(app.segmentedControls.buttons["Labs"].waitForExistence(timeout: 5))
        app.segmentedControls.buttons["Labs"].tap()
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Dark Arena labs"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.buttons["channel-menu"].tap()
        let podcasts = app.buttons["choose-xiaoyuzhou"]
        XCTAssertTrue(podcasts.waitForExistence(timeout: 5))
        podcasts.tap()
        XCTAssertTrue(app.buttons["播放"].firstMatch.waitForExistence(timeout: 10))
    }
    func testNativeNavigationAndSettings() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "sina"]
        app.launch()
        XCTAssertTrue(app.buttons["nav-1"].waitForExistence(timeout: 15))
        app.buttons["nav-1"].tap()
        XCTAssertTrue(app.navigationBars["订阅"].exists)
        XCTAssertTrue(app.buttons["nav-1"].isSelected)
        XCTAssertFalse(app.tabBars.firstMatch.exists, "System tab bar must not duplicate the horizontal navigation")
        let navigation = app.buttons["nav-1"]
        XCTAssertGreaterThanOrEqual(navigation.frame.height, 44, "Navigation keeps a full touch target")
        let bottomClearance = app.frame.maxY - navigation.frame.maxY
        XCTAssertGreaterThanOrEqual(bottomClearance, 4, "Navigation must remain inside the screen")
        XCTAssertLessThanOrEqual(bottomClearance, 34, "Do not leave an extra safe-area gap below navigation")
        let switches = app.switches.allElementsBoundByIndex.filter(\.isHittable)
        if let edge = switches.first?.frame.maxX {
            // Native switch accessibility bounds can differ by 2 pt from their enclosing control.
            for toggle in switches { XCTAssertEqual(toggle.frame.maxX, edge, accuracy: 2, "Subscription toggles must align") }
        }
        let subscriptions = XCTAttachment(screenshot: app.screenshot())
        subscriptions.name = "Parity-subscriptions"; subscriptions.lifetime = .keepAlways; add(subscriptions)
        app.buttons["添加 RSS"].tap()
        XCTAssertTrue(app.textFields["名称"].waitForExistence(timeout: 5))
        app.buttons["取消"].tap()
        app.buttons["nav-2"].tap()
        XCTAssertTrue(app.buttons["使用邮箱登录"].exists)
        XCTAssertTrue(app.buttons["nav-2"].isSelected)
        let profile = XCTAttachment(screenshot: app.screenshot())
        profile.name = "Parity-profile"; profile.lifetime = .keepAlways; add(profile)
        app.buttons["使用邮箱登录"].tap()
        XCTAssertTrue(app.textFields["邮箱地址"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["发送验证码"].isEnabled)
        app.buttons["关闭"].tap()
        app.buttons["nav-0"].tap()
        XCTAssertTrue(app.buttons["channel-menu"].exists)
        XCTAssertTrue(app.buttons["nav-0"].isSelected)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Native discovery"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
    func testFeedLayoutParity() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sina", "-native.feedDensity", "standard"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        for channel in ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "tiobe", "doubanMovie", "nnGroup", "bilibili", "36kr", "history", "stock"] {
            app.buttons["channel-menu"].tap()
            app.buttons["choose-\(channel)"].tap()
            waitUntilHittable(app.scrollViews["feed-\(channel)"])
            if channel != "stock" {
                let first = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).firstMatch
                XCTAssertTrue(first.waitForExistence(timeout: 10), channel)
                if channel == "sina" {
                    XCTAssertLessThan(first.frame.minY, 180, "Feed should start directly below channel bar")
                    XCTAssertLessThanOrEqual(first.frame.height, 112, "Allow two headline lines and secondary heat without an oversized card")
                }
            }
            let shot = XCTAttachment(screenshot: app.screenshot())
            shot.name = "Parity-\(channel)"; shot.lifetime = .keepAlways; add(shot)
        }
        app.buttons["channel-menu"].tap()
        app.buttons["choose-xiaoyuzhou"].tap()
        app.buttons["播放"].firstMatch.tap()
        XCTAssertTrue(app.buttons["暂停"].firstMatch.waitForExistence(timeout: 5))
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "Parity-player"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["暂停"].firstMatch.tap()
    }
    func testEditorialLayoutsInDarkModeAndLargeType() {
        let app = XCUIApplication()
        let channels = ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "tiobe", "doubanMovie", "nnGroup", "bilibili", "36kr", "history", "stock"]
        for (appearance, size) in [("dark", "system"), ("light", "large")] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", size, "-native.feedDensity", "standard"]
            app.launch()
            XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
            for channel in channels {
                app.buttons["channel-menu"].tap()
                app.buttons["choose-\(channel)"].tap()
                XCTAssertTrue(app.buttons["tab-\(channel)"].isSelected)
                if channel != "stock" {
                    let first = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).firstMatch
                    XCTAssertTrue(first.waitForExistence(timeout: 10), channel)
                    XCTAssertTrue(first.isHittable, "The first item must remain readable in \(channel)")
                    XCTAssertGreaterThanOrEqual(first.frame.minX, app.frame.minX + 12)
                    XCTAssertLessThanOrEqual(first.frame.maxX, app.frame.maxX - 12, "Cards must not overflow horizontally")
                }
                let screenshot = XCTAttachment(screenshot: app.screenshot())
                screenshot.name = "Editorial-\(appearance)-\(size)-\(channel)"
                screenshot.lifetime = .keepAlways; add(screenshot)
            }
            app.terminate()
        }
    }
    func testAccessibilityReadingLayout() {
        let app = XCUIApplication()
        for channel in ["sina", "tiobe", "arena", "xiaoyuzhou", "sspai"] {
            // Start at the channel directly: native menus virtualize offscreen entries at AX sizes.
            app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", channel, "-native.readingSize", "system", "-native.feedDensity", "standard",
                                   "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            app.launch()
            let first = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).firstMatch
            XCTAssertTrue(first.waitForExistence(timeout: 15))
            if !first.isHittable { app.scrollViews["feed-\(channel)"].swipeUp() }
            XCTAssertTrue(first.isHittable)
            XCTAssertGreaterThanOrEqual(first.frame.minX, app.frame.minX + 12)
            XCTAssertLessThanOrEqual(first.frame.maxX, app.frame.maxX - 12)
            if channel == "tiobe" { XCTAssertTrue(app.staticTexts["编程语言排行"].exists, "Accessibility sizes must use the stacked table layout") }
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "Editorial-accessibility-\(channel)"; screenshot.lifetime = .keepAlways; add(screenshot)
            app.terminate()
        }
    }
}
