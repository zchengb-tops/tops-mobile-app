import XCTest

final class NavigationTests: XCTestCase {
    func testExistingRSSSubscriptionBrandingAndCancelPosition() throws {
        let app = XCUIApplication()
        for appearance in ["light", "dark", "accessibility"] {
            app.launchArguments = ["-native.appearance", appearance == "dark" ? "dark" : "light", "-native.selectedChannel", "sina", "-native.readingSize", "system", "-native.syncEnabled", "NO"]
            if appearance == "accessibility" {
                app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            }
            app.launch()
            waitUntilHittable(app.buttons["nav-1"])
            app.buttons["nav-1"].tap()
            let list = app.descendants(matching: .any)["subscriptions-scroll"].firstMatch
            let v2ex = app.switches["订阅 V2EX"]
            scrollToEnd(list) { v2ex }
            guard v2ex.exists else { throw XCTSkip("Requires an existing V2EX subscription; this test never creates one") }
            assertAboveFooter(v2ex, in: app, name: "RSS-V2EX-branding-\(appearance)")
            let originalY = v2ex.frame.minY
            app.buttons["添加 RSS 频道"].tap()
            XCTAssertTrue(app.textFields["名称"].waitForExistence(timeout: 5))
            app.buttons["取消"].tap()
            waitUntilHittable(v2ex)
            XCTAssertEqual(v2ex.frame.minY, originalY, accuracy: 2, "Cancelling must not scroll the subscription list")
            app.terminate()
        }
    }
    func testRSSRecommendationSelectionAndLayout() {
        let app = XCUIApplication()
        for appearance in ["light", "dark", "accessibility"] {
            app.launchArguments = ["-native.appearance", appearance == "dark" ? "dark" : "light", "-native.selectedChannel", "sina", "-native.readingSize", "system", "-native.syncEnabled", "NO"]
            if appearance == "accessibility" {
                app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            }
            app.launch()
            waitUntilHittable(app.buttons["nav-1"])
            app.buttons["nav-1"].tap()
            app.buttons["添加 RSS 频道"].tap()
            let name = app.textFields["名称"]
            let address = app.textFields["https://example.com/feed.xml"]
            let form = app.descendants(matching: .any)["rss-editor-form"].firstMatch
            XCTAssertTrue(name.waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["保存"].isEnabled)
            let first = app.buttons["rss-recommendation-2"]
            XCTAssertTrue(first.waitForExistence(timeout: 30))
            for _ in 0..<6 where !first.isHittable { form.swipeUp() }
            XCTAssertTrue(first.isHittable)
            XCTAssertTrue(first.label.contains("V2EX"))
            XCTAssertTrue(first.label.contains("创意工作者的社区讨论"))
            XCTAssertGreaterThanOrEqual(first.frame.height, 44)
            XCTAssertLessThanOrEqual(first.frame.maxX, app.frame.maxX - 16)
            XCTAssertFalse(first.isSelected)
            first.tap()
            XCTAssertTrue(first.isSelected)
            for _ in 0..<6 where !name.isHittable { form.swipeDown() }
            XCTAssertEqual(name.value as? String, "V2EX")
            XCTAssertEqual(address.value as? String, "https://www.v2ex.com/index.xml")
            XCTAssertTrue(app.buttons["保存"].isEnabled)
            let second = app.buttons["rss-recommendation-4"]
            for _ in 0..<6 where !second.isHittable { form.swipeUp() }
            second.tap()
            XCTAssertTrue(second.isSelected)
            capture(app, "RSS-recommendations-\(appearance)")
            for _ in 0..<6 where !name.isHittable { form.swipeDown() }
            XCTAssertEqual(name.value as? String, "中国新闻网")
            XCTAssertEqual(address.value as? String, "https://www.chinanews.com.cn/rss/world.xml")
            for _ in 0..<6 where !first.isHittable { form.swipeUp() }
            XCTAssertFalse(first.isSelected, "Only the feed currently entered in the form is selected")
            app.buttons["取消"].tap()
            XCTAssertTrue(app.navigationBars["资讯订阅"].exists)
            app.terminate()
        }
    }
    func testAnalysisHeaderChannelLogo() {
        let app = XCUIApplication()
        for appearance in ["light", "dark", "accessibility"] {
            app.launchArguments = ["-native.appearance", appearance == "dark" ? "dark" : "light", "-native.selectedChannel", "artificialAnalysis", "-native.readingSize", "system"]
            if appearance == "accessibility" {
                app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            }
            app.launch()
            let heading = app.descendants(matching: .any)["analysis-heading"].firstMatch
            waitUntilHittable(heading)
            XCTAssertTrue(heading.label.contains("AI Model Benchmark"))
            XCTAssertTrue(heading.label.contains("来自 Artificial Analysis · 智能、速度与成本"))
            XCTAssertGreaterThanOrEqual(heading.frame.height, 44)
            XCTAssertGreaterThanOrEqual(heading.frame.minX, app.frame.minX + 16)
            XCTAssertLessThanOrEqual(heading.frame.maxX, app.frame.maxX - 16)
            let chartHeading = app.descendants(matching: .any)["analysis-intelligence-heading"].firstMatch
            XCTAssertTrue(chartHeading.waitForExistence(timeout: 15))
            XCTAssertGreaterThanOrEqual(chartHeading.frame.minY, heading.frame.maxY)
            capture(app, "AI-Analysis-header-logo-\(appearance)")
            app.terminate()
        }
    }
    func testConciseSettingsAndSecondaryPages() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            for identifier in ["使用邮箱登录", "appearance-picker", "reading-size-picker", "density-picker", "settings-sync"] {
                XCTAssertTrue(app.buttons[identifier].isHittable, "Keep common settings visible without scrolling: \(identifier)")
            }
            XCTAssertFalse(app.staticTexts["为好奇心，留一个位置。"].exists)
            XCTAssertFalse(app.staticTexts["让资讯，以你喜欢的节奏展开。"].exists)
            XCTAssertFalse(app.buttons["sync-upload"].exists, "Sync operations belong on the secondary page")
            XCTAssertFalse(app.buttons["settings-about"].exists, "About items are directly on My, not behind another page")
            let preferences = ["appearance-picker", "reading-size-picker", "density-picker"].map { app.buttons[$0] }
            for preference in preferences {
                XCTAssertGreaterThanOrEqual(preference.frame.height, 44)
                XCTAssertEqual(preference.frame.minY, preferences[0].frame.minY, accuracy: 2, "Normal text uses three aligned preference controls")
                XCTAssertEqual(preference.frame.height, preferences[0].frame.height, accuracy: 1, "Symbol proportions must not change control heights")
            }
            XCTAssertLessThan(preferences[0].frame.maxX, preferences[1].frame.minX)
            XCTAssertLessThan(preferences[1].frame.maxX, preferences[2].frame.minX)
            assertAboveFooter(app.buttons["settings-sync"], in: app, name: "My-concise-\(appearance)")
            app.buttons["appearance-picker"].tap()
            app.buttons[appearance == "light" ? "深色" : "浅色"].tap()
            XCTAssertEqual(app.buttons["appearance-picker"].value as? String, appearance == "light" ? "深色" : "浅色")
            app.buttons["appearance-picker"].tap()
            app.buttons[appearance == "light" ? "浅色" : "深色"].tap()
            app.buttons["reading-size-picker"].tap()
            app.buttons["小"].tap()
            XCTAssertEqual(app.buttons["reading-size-picker"].value as? String, "小")
            app.buttons["reading-size-picker"].tap()
            app.buttons["跟随系统"].tap()
            app.buttons["density-picker"].tap()
            app.buttons["紧凑"].tap()
            XCTAssertEqual(app.buttons["density-picker"].value as? String, "紧凑")
            app.buttons["density-picker"].tap()
            app.buttons["标准"].tap()
            app.buttons["settings-sync"].tap()
            let prompt = app.alerts["请先登录"]
            XCTAssertTrue(prompt.waitForExistence(timeout: 5))
            XCTAssertFalse(app.scrollViews["sync-scroll"].exists, "Logged-out users must not enter disabled sync settings")
            XCTAssertFalse(app.textFields["login-email"].exists, "Ask before opening login")
            capture(app, "My-sync-login-confirm-\(appearance)")
            prompt.buttons["取消"].tap()
            XCTAssertTrue(prompt.waitForNonExistence(timeout: 5))
            XCTAssertTrue(app.scrollViews["settings-scroll"].exists)
            XCTAssertFalse(app.textFields["login-email"].exists)
            app.buttons["settings-sync"].tap()
            XCTAssertTrue(prompt.waitForExistence(timeout: 5))
            prompt.buttons["去登录"].tap()
            let email = app.textFields["login-email"]
            waitUntilHittable(email)
            XCTAssertFalse(app.scrollViews["sync-scroll"].exists)
            capture(app, "My-sync-login-sheet-\(appearance)")
            app.buttons["login-close"].tap()
            XCTAssertTrue(email.waitForNonExistence(timeout: 5))
            let form = app.scrollViews["settings-scroll"]
            XCTAssertTrue(form.exists, "Closing login returns to My without opening sync settings")
            let version = app.descendants(matching: .any).matching(identifier: "settings-version").firstMatch
            scrollToEnd(form) { version }
            XCTAssertFalse(app.scrollViews["about-scroll"].exists)
            XCTAssertFalse(app.buttons["settings-check-update"].exists, "Keep update checking in the version row")
            for label in ["settings-version", "settings-terms", "settings-privacy"] {
                XCTAssertTrue(app.buttons[label].isHittable, "Retain About action: \(label)")
            }
            // Native external Links aren't classified as buttons by XCTest.
            for identifier in ["settings-website", "settings-feedback"] {
                XCTAssertTrue(app.descendants(matching: .any).matching(identifier: identifier).firstMatch.isHittable)
            }
            XCTAssertTrue(version.isHittable)
            XCTAssertTrue(version.label.contains("版本"))
            XCTAssertFalse(version.label.contains("—"), "Show the real bundle version")
            let orderedItems = ["settings-sync", "settings-feedback", "settings-website", "settings-terms", "settings-privacy", "settings-version"]
                .map { app.descendants(matching: .any).matching(identifier: $0).firstMatch }
            for (previous, next) in zip(orderedItems, orderedItems.dropFirst()) {
                XCTAssertLessThan(previous.frame.minY, next.frame.minY, "Keep the requested menu order")
            }
            assertAboveFooter(version, in: app, name: "My-inline-about-\(appearance)")
            for identifier in ["settings-terms", "settings-privacy"] {
                app.buttons[identifier].tap()
                XCTAssertTrue(app.scrollViews["legal-scroll"].waitForExistence(timeout: 5))
                app.navigationBars.buttons.firstMatch.tap()
                XCTAssertTrue(form.exists, "One back action returns directly to My")
            }
            for _ in 0..<6 where !app.buttons["density-picker"].isHittable { form.swipeDown() }
            XCTAssertTrue(app.buttons["density-picker"].isHittable, "Back navigation returns to the concise page")
            app.terminate()
        }
    }
    func testVersionBadgeReopensUpdateAfterDismissal() {
        let app = XCUIApplication()
        app.launchEnvironment["INFOHUB_UI_TEST_UPDATE"] = "available"
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            app.launch()
            let later = app.buttons["稍后"]
            XCTAssertTrue(later.waitForExistence(timeout: 15))
            later.tap()
            XCTAssertTrue(later.waitForNonExistence(timeout: 5))
            app.buttons["nav-2"].tap()
            let version = app.buttons["settings-version"]
            scrollToEnd(app.scrollViews["settings-scroll"]) { version }
            XCTAssertTrue(version.label.contains("新版本"))
            XCTAssertFalse(app.buttons["settings-check-update"].exists)
            assertAboveFooter(version, in: app, name: "My-version-badge-\(appearance)")
            version.tap()
            XCTAssertTrue(later.waitForExistence(timeout: 5))
            XCTAssertTrue(app.staticTexts["新版本 9999.0"].exists)
            XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "前往更新")).firstMatch.exists)
            later.tap()
            XCTAssertTrue(later.waitForNonExistence(timeout: 5))
            XCTAssertTrue(version.label.contains("新版本"))
            app.terminate()
        }
    }
    func testLegalReadingLayoutAndCompleteDocument() {
        let app = XCUIApplication()
        for (appearance, largeText) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            if largeText { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            let settings = app.scrollViews["settings-scroll"]
            for (kind, title) in [("terms", "用户服务协议"), ("privacy", "隐私政策")] {
                let entry = app.buttons["settings-\(kind)"]
                scrollToEnd(settings) { app.buttons["settings-version"] }
                entry.tap()
                let scroll = app.scrollViews["legal-scroll"]
                XCTAssertTrue(scroll.waitForExistence(timeout: 5))
                let heading = app.staticTexts["legal-title"]
                XCTAssertEqual(heading.label, title)
                XCTAssertTrue(heading.isHittable)
                // Native selectable text outsets its accessibility hit frame beyond the glyphs.
                // Keep that frame on screen; screenshots verify the 24pt reading inset.
                XCTAssertGreaterThanOrEqual(heading.frame.minX, app.frame.minX)
                XCTAssertLessThanOrEqual(heading.frame.maxX, app.frame.maxX)
                let name = "Legal-\(kind)-\(appearance)\(largeText ? "-accessibility" : "")"
                capture(app, name + "-top")
                let end = app.staticTexts["legal-end"]
                scrollToEnd(scroll) { end }
                XCTAssertTrue(end.isHittable)
                XCTAssertGreaterThanOrEqual(end.frame.minX, app.frame.minX)
                XCTAssertLessThanOrEqual(end.frame.maxX, app.frame.maxX)
                assertAboveFooter(end, in: app, name: name + "-bottom")
                app.navigationBars.buttons.firstMatch.tap()
                XCTAssertTrue(settings.exists, "Back returns to the original settings page")
            }
            app.terminate()
        }
    }
    func testSettingsPreferencesAtAccessibilityTextSize() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system", "-native.feedDensity", "standard",
                                   "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            capture(app, "My-refined-accessibility-\(appearance)-account")
            let form = app.scrollViews["settings-scroll"]
            for identifier in ["appearance-picker", "reading-size-picker", "density-picker"] {
                let preference = app.buttons[identifier]
                for _ in 0..<6 where !preference.isHittable { form.swipeUp() }
                XCTAssertTrue(preference.isHittable)
                XCTAssertGreaterThanOrEqual(preference.frame.height, 44)
                XCTAssertGreaterThanOrEqual(preference.frame.minX, app.frame.minX + 16)
                XCTAssertLessThanOrEqual(preference.frame.maxX, app.frame.maxX - 16)
            }
            let appearanceControl = app.buttons["appearance-picker"]
            let sizeControl = app.buttons["reading-size-picker"]
            let densityControl = app.buttons["density-picker"]
            XCTAssertLessThanOrEqual(appearanceControl.frame.maxY, sizeControl.frame.minY, "Large text uses full-width stacked preferences")
            XCTAssertLessThanOrEqual(sizeControl.frame.maxY, densityControl.frame.minY)
            capture(app, "My-refined-accessibility-\(appearance)-preferences")
            densityControl.tap()
            app.buttons["紧凑"].tap()
            XCTAssertEqual(densityControl.value as? String, "紧凑")
            densityControl.tap()
            app.buttons["标准"].tap()
            let version = app.descendants(matching: .any).matching(identifier: "settings-version").firstMatch
            scrollToEnd(form) { version }
            assertAboveFooter(version, in: app, name: "My-refined-accessibility-\(appearance)-bottom")
            app.terminate()
        }
    }
    func testLoginAtAccessibilityTextSize() {
        let app = XCUIApplication()
        app.launchEnvironment["INFOHUB_UI_TEST_LOGIN"] = "success"
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
        dismissLoginKeyboard(in: app)
        let send = app.buttons["login-send-code"]
        // A partly clipped button can already be hittable. Require its whole frame.
        for _ in 0..<6 {
            if send.isHittable && send.frame.maxY <= app.frame.maxY - 16 { break }
            form.swipeUp()
        }
        XCTAssertTrue(send.isHittable)
        XCTAssertFalse(send.isEnabled)
        XCTAssertLessThanOrEqual(send.frame.maxY, app.frame.maxY - 16)
        capture(app, "Login-accessibility-action")
        let consent = app.buttons["login-consent"]
        for _ in 0..<6 where !consent.isHittable { form.swipeDown() }
        consent.tap()
        for _ in 0..<6 where !send.isHittable { form.swipeUp() }
        send.tap()
        let code = app.textFields["login-code-0"]
        waitUntilHittable(code)
        XCTAssertTrue(app.keyboards.firstMatch.exists)
        XCTAssertLessThanOrEqual(code.frame.maxY, app.keyboards.firstMatch.frame.minY)
        app.typeText("123456")
        let lastDigit = app.textFields["login-code-5"]
        XCTAssertLessThanOrEqual(lastDigit.frame.maxY, app.keyboards.firstMatch.frame.minY)
        dismissLoginKeyboard(in: app)
        let submit = app.buttons["login-submit"]
        for _ in 0..<6 {
            if submit.isHittable && submit.frame.maxY <= app.frame.maxY - 16 { break }
            form.swipeUp()
        }
        XCTAssertTrue(submit.isEnabled)
        XCTAssertLessThanOrEqual(submit.frame.maxY, app.frame.maxY - 16)
        capture(app, "Login-accessibility-code")
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
            let consent = app.buttons["login-consent"]
            let send = app.buttons["login-send-code"]
            waitUntilHittable(email)
            XCTAssertTrue(app.staticTexts["登录 InfoHub"].exists)
            XCTAssertFalse(app.staticTexts["你的阅读，\n随你同行。"].exists, "Keep login free of the old marketing block")
            XCTAssertFalse(app.textFields["login-code-0"].exists, "Only request email in the first step")
            XCTAssertFalse(app.buttons["login-submit"].exists)
            XCTAssertFalse(app.staticTexts["无需密码，使用邮箱验证码。"].exists)
            let explanation = app.staticTexts["login-consent-explanation"]
            let registrationNote = app.staticTexts["login-registration-note"]
            XCTAssertEqual(explanation.label, "我已阅读并同意")
            XCTAssertFalse(registrationNote.exists)
            XCTAssertFalse(app.staticTexts["新邮箱验证后将自动注册。"].exists)
            let terms = app.buttons["login-terms"]
            let privacy = app.buttons["login-privacy"]
            XCTAssertEqual(explanation.frame.midY, terms.frame.midY, accuracy: 2, "Keep the consent explanation and terms on one line")
            XCTAssertEqual(terms.frame.midY, privacy.frame.midY, accuracy: 2, "Keep both legal links on that same line")
            XCTAssertLessThanOrEqual(privacy.frame.maxX, app.frame.maxX - 16)
            let form = app.scrollViews["login-scroll"]
            if form.frame.height > 600 {
                XCTAssertGreaterThanOrEqual(app.staticTexts["登录 InfoHub"].frame.minY - form.frame.minY, 60,
                                            "Give the login form breathing room on a tall sheet")
            }
            XCTAssertTrue(send.isHittable, "Primary action should be visible without scrolling before editing")
            XCTAssertFalse(send.isEnabled)
            XCTAssertEqual(consent.value as? String, "未同意")
            capture(app, "Login-\(appearance)-initial")
            email.tap()
            email.typeText("design-preview@example.com")
            XCTAssertTrue(app.keyboards.firstMatch.exists)
            XCTAssertLessThanOrEqual(email.frame.maxY, app.keyboards.firstMatch.frame.minY, "Keep the active field above the keyboard")
            capture(app, "Login-\(appearance)-keyboard")
            dismissLoginKeyboard(in: app)
            XCTAssertFalse(send.isEnabled, "An email alone must not bypass consent")
            consent.tap()
            XCTAssertEqual(consent.value as? String, "已同意")
            XCTAssertTrue(send.isEnabled)
            capture(app, "Login-\(appearance)-ready")
            // Only inspect enabled states. Never send email or submit credentials to production.
            for link in ["login-terms", "login-privacy"] {
                app.buttons[link].tap()
                XCTAssertTrue(app.scrollViews["legal-scroll"].waitForExistence(timeout: 5))
                app.navigationBars.buttons.firstMatch.tap()
                XCTAssertEqual(email.value as? String, "design-preview@example.com", "Legal navigation must preserve form input")
                XCTAssertEqual(consent.value as? String, "已同意")
            }
            consent.tap()
            XCTAssertFalse(send.isEnabled)
            app.buttons["login-close"].tap()
            XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 5))
            app.terminate()
        }
    }
    func testLoginTwoStepCodeAndBackNavigation() {
        let app = XCUIApplication()
        app.launchEnvironment["INFOHUB_UI_TEST_LOGIN"] = "success"
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            app.buttons["使用邮箱登录"].tap()
            let email = app.textFields["login-email"]
            waitUntilHittable(email)
            email.tap(); email.typeText("preview@example.com")
            dismissLoginKeyboard(in: app)
            app.buttons["login-consent"].tap()
            app.buttons["login-send-code"].tap()
            let code = app.textFields["login-code-0"]
            waitUntilHittable(code)
            XCTAssertFalse(email.exists)
            XCTAssertFalse(app.staticTexts["login-registration-note"].exists, "Keep the code step focused on verification")
            XCTAssertTrue(app.staticTexts["输入验证码"].exists)
            XCTAssertTrue(app.staticTexts["已发送至 preview@example.com"].exists)
            XCTAssertTrue(app.keyboards.firstMatch.exists, "Focus the native numeric field after sending")
            XCTAssertLessThanOrEqual(code.frame.maxY, app.keyboards.firstMatch.frame.minY)
            app.typeText("123")
            XCTAssertFalse(app.buttons["login-submit"].isEnabled, "Require all six digits")
            app.typeText("456")
            XCTAssertTrue(app.buttons["login-submit"].isEnabled)
            for index in 0..<6 {
                XCTAssertEqual(app.textFields["login-code-\(index)"].value as? String, String(index + 1))
            }
            XCTAssertFalse(app.buttons["login-resend-code"].isEnabled, "Preserve the resend cooldown")
            capture(app, "Login-code-\(appearance)-keyboard")
            dismissLoginKeyboard(in: app)
            capture(app, "Login-code-\(appearance)-ready")
            app.buttons["login-back-email"].tap()
            XCTAssertEqual(email.value as? String, "preview@example.com")
            XCTAssertEqual(app.buttons["login-consent"].value as? String, "已同意")
            XCTAssertEqual(app.buttons["login-send-code"].label, "输入验证码", "Resume the sent code without another email")
            app.buttons["login-send-code"].tap()
            waitUntilHittable(code)
            XCTAssertFalse(app.buttons["login-submit"].isEnabled, "Discard code when changing email")
            app.typeText("123456")
            dismissLoginKeyboard(in: app)
            app.buttons["login-submit"].tap()
            XCTAssertTrue(app.buttons["nav-2"].waitForExistence(timeout: 5))
            app.terminate()
        }
    }
    func testLoginDeliveryAndAuthenticationErrors() {
        let app = XCUIApplication()
        for fixture in ["send-error", "sign-in-error"] {
            app.launchEnvironment["INFOHUB_UI_TEST_LOGIN"] = fixture
            app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sina", "-native.readingSize", "system"]
            app.launch()
            waitUntilHittable(app.buttons["nav-2"])
            app.buttons["nav-2"].tap()
            app.buttons["使用邮箱登录"].tap()
            let email = app.textFields["login-email"]
            waitUntilHittable(email)
            email.tap(); email.typeText("preview@example.com")
            dismissLoginKeyboard(in: app)
            app.buttons["login-consent"].tap()
            app.buttons["login-send-code"].tap()
            if fixture == "send-error" {
                XCTAssertTrue(app.staticTexts["login-error"].waitForExistence(timeout: 5))
                XCTAssertTrue(email.exists)
                XCTAssertFalse(app.textFields["login-code-0"].exists)
                XCTAssertTrue(app.buttons["login-send-code"].isEnabled)
            } else {
                let code = app.textFields["login-code-0"]
                waitUntilHittable(code)
                app.typeText("123456")
                dismissLoginKeyboard(in: app)
                app.buttons["login-submit"].tap()
                XCTAssertTrue(app.staticTexts["login-error"].waitForExistence(timeout: 5))
                XCTAssertTrue(code.exists)
                for index in 0..<6 {
                    XCTAssertEqual(app.textFields["login-code-\(index)"].value as? String, String(index + 1))
                }
                XCTAssertTrue(app.buttons["login-submit"].isEnabled)
            }
            capture(app, "Login-\(fixture)")
            app.terminate()
        }
    }
    func testVerificationDigitEditingAndBackspace() {
        let app = XCUIApplication()
        app.launchEnvironment["INFOHUB_UI_TEST_LOGIN"] = "success"
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sina", "-native.readingSize", "system"]
        app.launch()
        waitUntilHittable(app.buttons["nav-2"])
        app.buttons["nav-2"].tap()
        app.buttons["使用邮箱登录"].tap()
        let email = app.textFields["login-email"]
        waitUntilHittable(email)
        email.tap(); email.typeText("preview@example.com")
        dismissLoginKeyboard(in: app)
        app.buttons["login-consent"].tap()
        app.buttons["login-send-code"].tap()
        waitUntilHittable(app.textFields["login-code-0"])
        XCTAssertEqual(app.textFields.matching(NSPredicate(format: "identifier BEGINSWITH 'login-code-' ")).count, 6)
        app.typeText("123456")
        app.textFields["login-code-2"].tap()
        app.typeText("9")
        XCTAssertEqual(app.textFields["login-code-2"].value as? String, "9")
        XCTAssertEqual(app.textFields["login-code-3"].value as? String, "4", "Changing one digit preserves the next one")
        app.textFields["login-code-3"].tap()
        app.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(app.textFields["login-code-3"].value as? String ?? "", "")
        XCTAssertFalse(app.buttons["login-submit"].isEnabled)
        app.textFields["login-code-3"].tap()
        app.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(app.textFields["login-code-2"].value as? String ?? "", "", "Backspace from an empty digit clears the previous one")
        XCTAssertEqual(app.textFields["login-code-4"].value as? String, "5")
        app.typeText("34")
        XCTAssertTrue(app.buttons["login-submit"].isEnabled)
        for index in 0..<6 { XCTAssertEqual(app.textFields["login-code-\(index)"].value as? String, String(index + 1)) }
        dismissLoginKeyboard(in: app)
        capture(app, "Login-six-digits-edited")
        app.buttons["login-close"].tap()
    }
    func testWeiboEditorialHierarchyAndBottomClearance() {
        let app = XCUIApplication()
        for (appearance, size, contentSize, density) in [("light", "system", "", "standard"), ("dark", "system", "", "standard"), ("light", "large", "", "standard"), ("dark", "system", "UICTContentSizeCategoryAccessibilityXXXL", "standard"), ("light", "system", "", "compact"), ("light", "system", "", "spacious")] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", size, "-native.feedDensity", density]
            if !contentSize.isEmpty { app.launchArguments += ["-UIPreferredContentSizeCategoryName", contentSize] }
            app.launch()
            let first = app.buttons["news-sina-0"].firstMatch
            waitUntilHittable(first)
            let title = app.staticTexts["sina-title-0"].firstMatch
            let heat = app.staticTexts["sina-heat-0"].firstMatch
            let rank = app.staticTexts["sina-rank-0"].firstMatch
            XCTAssertTrue(title.exists)
            XCTAssertTrue(heat.exists)
            XCTAssertTrue(rank.exists)
            XCTAssertEqual(rank.label, "第 1 名", "Unboxed numbers keep the spoken rank clear")
            XCTAssertGreaterThanOrEqual(app.buttons["tab-sina"].frame.height, 44, "Smaller selection plates retain the channel touch target")
            for index in 0..<3 {
                XCTAssertGreaterThanOrEqual(app.buttons["nav-\(index)"].frame.height, 44, "Smaller selection plates retain navigation touch targets")
                XCTAssertGreaterThanOrEqual(app.buttons["nav-\(index)"].frame.width, 44, "The selection plate must not shrink the tappable navigation cell")
            }
            XCTAssertTrue(heat.label.hasPrefix("热度，"), "The visually simplified metric still explains itself to VoiceOver")
            XCTAssertGreaterThanOrEqual(title.frame.minX, app.frame.minX + 20)
            XCTAssertLessThanOrEqual(title.frame.maxX, app.frame.maxX - 20)
            XCTAssertGreaterThanOrEqual(first.frame.height, 44)
            if contentSize.isEmpty {
                let secondTitle = app.staticTexts["sina-title-1"].firstMatch
                XCTAssertTrue(secondTitle.exists)
                XCTAssertLessThanOrEqual(secondTitle.frame.minY - title.frame.maxY, density == "spacious" ? 52 : 36,
                                         "Keep headline-to-headline whitespace compact without reducing the tap target")
                XCTAssertEqual(heat.frame.midY, title.frame.midY, accuracy: 1, "One-line counts align with the headline")
                let fourthTitle = app.staticTexts["sina-title-3"].firstMatch
                let fourthHeat = app.staticTexts["sina-heat-3"].firstMatch
                let fourthRank = app.staticTexts["sina-rank-3"].firstMatch
                XCTAssertTrue(fourthTitle.exists)
                XCTAssertGreaterThan(title.frame.minX, rank.frame.maxX, "Ranks form a separate leading column")
                XCTAssertEqual(fourthTitle.frame.minX, title.frame.minX, accuracy: 1, "Every story shares the same headline column")
                XCTAssertEqual(fourthRank.frame.minX, rank.frame.minX, accuracy: 1)
                XCTAssertEqual(fourthRank.frame.width, rank.frame.width, accuracy: 1, "All rank numbers share the same column width")
                XCTAssertEqual(fourthRank.frame.height, rank.frame.height, accuracy: 1)
                XCTAssertGreaterThan(heat.frame.minX, title.frame.maxX, "Heat uses the trailing column, without overlapping the headline")
                XCTAssertEqual(heat.frame.maxX, first.frame.maxX, accuracy: 1, "Use the right edge instead of leaving it empty")
                XCTAssertGreaterThan(fourthHeat.frame.minX, fourthTitle.frame.maxX)
                XCTAssertEqual(fourthHeat.frame.maxX, heat.frame.maxX, accuracy: 1, "All heat values share the same trailing edge")
                XCTAssertLessThan(first.frame.height, 112, "Top stories should not become oversized hero cards")
            } else {
                XCTAssertLessThan(rank.frame.maxY, title.frame.minY, "Accessibility sizes reclaim the full headline width")
                XCTAssertGreaterThan(heat.frame.minY, title.frame.maxY, "Large accessibility text keeps the metric below the full-width headline")
                XCTAssertEqual(heat.frame.minX, title.frame.minX, accuracy: 1)
            }
            capture(app, "Weibo-editorial-\(appearance)-\(size)-\(density)-\(contentSize.isEmpty ? "normal" : "accessibility")")
            let feed = app.scrollViews["feed-sina"]
            let lastItem = { self.lastNewsItem(app, channel: "sina", fallback: feed) }
            scrollToEnd(feed, lastItem: lastItem)
            assertAboveFooter(lastItem(), in: app, name: "Weibo-editorial-bottom-\(appearance)-\(size)-\(density)-\(contentSize.isEmpty ? "normal" : "accessibility")")
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
    func testPinchOpensChannelOverviewWithoutChangingListDensity() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.feedDensity", "standard", "-native.readingSize", "system"]
            app.launch()
            let first = app.buttons["news-sina-0"].firstMatch
            waitUntilHittable(first)
            let height = first.frame.height
            first.pinch(withScale: 0.94, velocity: -0.3)
            XCTAssertFalse(app.buttons["overview-close"].exists, "A small aborted pinch returns to reading")
            waitUntilHittable(first)
            first.pinch(withScale: 0.55, velocity: -1)
            let overview = app.scrollViews["channel-overview"]
            waitUntilHittable(app.buttons["overview-sina"])
            XCTAssertTrue(overview.exists)
            XCTAssertFalse(app.buttons["reader-share"].exists, "A two-touch gesture must not open an article")
            XCTAssertFalse(app.buttons["channel-menu"].exists, "Overview replaces the channel rail")
            XCTAssertTrue(app.buttons["overview-sina"].isSelected)
            capture(app, "Channel-overview-\(appearance)")
            app.buttons["overview-sina"].pinch(withScale: 1.8, velocity: 1)
            waitUntilHittable(first)
            XCTAssertEqual(first.frame.height, height, accuracy: 1, "Pinching must not change row density")
            waitForDensity("标准", app: app)
            first.pinch(withScale: 0.55, velocity: -1)
            for _ in 0..<3 where !app.buttons["overview-zhihu"].isHittable { overview.swipeUp() }
            waitUntilHittable(app.buttons["overview-zhihu"])
            app.buttons["overview-zhihu"].tap()
            waitUntilHittable(app.buttons["news-zhihu-0"].firstMatch)
            XCTAssertTrue(app.buttons["tab-zhihu"].isSelected)
            app.scrollViews["feed-zhihu"].swipeUp()
            let visible = app.buttons.allElementsBoundByIndex.first { $0.identifier.hasPrefix("news-zhihu-") && $0.isHittable }!
            let y = visible.frame.minY
            app.buttons["channel-menu"].tap()
            app.buttons["open-channel-overview"].tap()
            XCTAssertTrue(app.buttons["overview-close"].waitForExistence(timeout: 5))
            capture(app, "Channel-overview-\(appearance)-scrolled-channel")
            closeOverview(app)
            waitUntilHittable(visible)
            XCTAssertEqual(visible.frame.minY, y, accuracy: 2, "Zooming preserves the actual channel's reading position")
            waitForDensity("标准", app: app)
            swipeChannel(app, left: false)
            waitUntilHittable(first)
            XCTAssertTrue(app.buttons["tab-sina"].isSelected, "Horizontal channel paging still works")
            app.terminate()
        }
    }
    func testManualListSpacingPersistsWithoutChangingZoom() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sspai", "-native.feedDensity", "standard", "-native.readingSize", "system"]
        app.launch()
        let first = app.buttons["news-sspai-0"].firstMatch
        waitUntilHittable(first)
        let standardHeight = first.frame.height
        app.buttons["nav-2"].tap()
        app.buttons["density-picker"].tap()
        app.buttons["紧凑"].tap()
        app.buttons["nav-0"].tap()
        waitForDensity("紧凑", app: app)
        let compactHeight = first.frame.height
        XCTAssertLessThan(compactHeight, standardHeight * 0.75)
        first.pinch(withScale: 0.55, velocity: -1)
        closeOverview(app)
        waitUntilHittable(first)
        XCTAssertEqual(first.frame.height, compactHeight, accuracy: 1)
        app.terminate()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sspai", "-native.readingSize", "system"]
        app.launch()
        waitUntilHittable(first)
        waitForDensity("紧凑", app: app)
        app.buttons["nav-2"].tap()
        app.buttons["density-picker"].tap()
        app.buttons["舒展"].tap()
        app.buttons["nav-0"].tap()
        waitForDensity("舒展", app: app)
        XCTAssertGreaterThan(first.frame.height, standardHeight * 2)
        capture(app, "Manual-list-spacing-spacious")
        app.buttons["nav-2"].tap()
        app.buttons["density-picker"].tap()
        app.buttons["标准"].tap()
        app.buttons["nav-0"].tap()
        waitForDensity("标准", app: app)
    }
    func testSspaiOriginalLayoutAndAccessibleReading() {
        let app = XCUIApplication()
        for (appearance, readingSize, accessibility) in [("light", "system", false), ("dark", "system", false), ("light", "large", false), ("light", "system", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sspai", "-native.feedDensity", "standard", "-native.readingSize", readingSize]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            let first = app.buttons["news-sspai-0"].firstMatch
            waitUntilHittable(first)
            let title = app.staticTexts["sspai-title-0"]
            XCTAssertTrue(title.exists)
            XCTAssertEqual(title.frame.minX - first.frame.minX, accessibility ? 0 : 146, accuracy: 1)
            XCTAssertLessThanOrEqual(title.frame.maxX, app.frame.maxX - 20)
            let metadata = app.descendants(matching: .any).matching(identifier: "sspai-metadata-0").firstMatch
            XCTAssertTrue(metadata.exists)
            XCTAssertTrue(metadata.label.contains("点赞"))
            XCTAssertTrue(metadata.label.contains("评论"))
            XCTAssertLessThanOrEqual(metadata.frame.maxX, first.frame.maxX + 1)
            capture(app, "Sspai-original-\(appearance)-\(readingSize)-\(accessibility ? "accessibility" : "regular")")
            if appearance == "light", readingSize == "system", !accessibility {
                let feed = app.scrollViews["feed-sspai"]
                scrollToEnd(feed) { self.lastNewsItem(app, channel: "sspai", fallback: first) }
                assertAboveFooter(lastNewsItem(app, channel: "sspai", fallback: first), in: app, name: "Sspai-original-footer")
            }
            app.terminate()
        }
    }
    func testGithubInlineGrowthAndCompactMetadata() {
        let app = XCUIApplication()
        for (appearance, readingSize, accessibility) in [("light", "system", false), ("dark", "system", false), ("light", "large", false), ("dark", "system", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "github", "-native.readingSize", readingSize]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            waitUntilHittable(app.buttons["github-daily-0"].firstMatch)
            let heading = app.descendants(matching: .any)["github-heading"].firstMatch
            let picker = app.segmentedControls["github-period"]
            if accessibility { XCTAssertGreaterThan(picker.frame.minY, heading.frame.maxY) }
            else { XCTAssertEqual(heading.frame.midY + 6, picker.frame.midY, accuracy: 3, "Only the heading and subtitle move upward") }
            for (period, title, caption) in [("daily", "日榜", "今日新增"), ("weekly", "周榜", "本周新增"), ("monthly", "月榜", "本月新增")] {
                if period != "daily" {
                    if accessibility { break }
                    app.segmentedControls["github-period"].buttons[title].tap()
                }
                let growth = app.descendants(matching: .any)["github-growth-\(period)-0"].firstMatch
                if accessibility {
                    let feed = app.scrollViews["feed-github"]
                    let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
                    for _ in 0..<8 where !growth.isHittable || growth.frame.maxY > footerTop - 18 { feed.swipeUp() }
                    XCTAssertGreaterThanOrEqual(growth.frame.minY, app.buttons["channel-menu"].frame.maxY + 4)
                    XCTAssertLessThanOrEqual(growth.frame.maxY, footerTop - 18)
                }
                waitUntilHittable(growth)
                XCTAssertTrue(growth.label.contains(caption))
                XCTAssertTrue(growth.label.contains("星"), "Preserve the metric's VoiceOver meaning")
                XCTAssertLessThanOrEqual(growth.frame.maxX, app.frame.maxX - 16)
                if !accessibility {
                    XCTAssertLessThan(growth.frame.height, readingSize == "large" ? 24 : 20, "Growth count and period must occupy one line")
                }
                capture(app, "GitHub-inline-\(appearance)-\(readingSize)-\(accessibility ? "accessibility" : period)")
            }
            app.terminate()
        }
    }
    func testFeaturedStartsWithChannelsWithoutRepeatedHeadings() {
        let app = XCUIApplication()
        for (appearance, accessibility) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            if accessibility {
                app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            }
            app.launch()
            let first = app.buttons["featured-open-sina"]
            waitUntilHittable(first)
            waitUntilHittable(app.staticTexts["sina-title-0"].firstMatch)
            if appearance == "light" {
                for prefix in ["sina-title-", "zhihu-title-", "sspai-title-", "github-title-daily-"] {
                    let rows = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix))
                    XCTAssertEqual(rows.count, prefix == "sina-title-" ? 5 : 4, "Keep the configured live preview count: \(prefix)")
                }
            }
            for title in ["InfoHub", "/ 总览", "热点与市场", "阅读与见闻", "开源与技术", "影音生活", "我的订阅"] {
                XCTAssertFalse(app.staticTexts[title].exists, "Remove repeated page and group headings")
            }
            let rail = app.buttons["channel-menu"]
            XCTAssertGreaterThanOrEqual(first.frame.minY, rail.frame.maxY)
            XCTAssertLessThanOrEqual(first.frame.minY - rail.frame.maxY, 20, "Start directly with the first channel without a blank header")
            XCTAssertGreaterThanOrEqual(first.frame.height, 44)
            XCTAssertEqual(first.label, "查看微博频道")
            XCTAssertTrue(app.buttons["tab-featured"].isSelected)
            for index in 0..<4 {
                let referenceRank = app.staticTexts["sina-rank-\(index)"].firstMatch
                let rank = app.staticTexts["zhihu-rank-\(index)"].firstMatch
                XCTAssertEqual(rank.label, "第 \(index + 1) 名", "Overview ranks use unpadded numbers with clear spoken meaning")
                XCTAssertEqual(rank.frame.minX, referenceRank.frame.minX, accuracy: 1)
                XCTAssertEqual(rank.frame.width, referenceRank.frame.width, accuracy: 1)
                XCTAssertEqual(rank.frame.height, referenceRank.frame.height, accuracy: 1)
                if !accessibility {
                    XCTAssertEqual(app.staticTexts["zhihu-title-\(index)"].firstMatch.frame.minX,
                                   app.staticTexts["sina-title-0"].firstMatch.frame.minX, accuracy: 1,
                                   "Matching rank columns align both channels' headlines")
                }
            }
            if !accessibility {
                var previous: XCUIElement?
                for index in 0..<5 {
                    let title = app.staticTexts["sina-title-\(index)"].firstMatch
                    let heat = app.staticTexts["sina-heat-\(index)"].firstMatch
                    let row = app.buttons.containing(.staticText, identifier: "sina-title-\(index)").firstMatch
                    XCTAssertGreaterThanOrEqual(row.frame.height, 44)
                    XCTAssertEqual(row.frame.height, max(44, max(title.frame.height, heat.frame.height)), accuracy: 1,
                                   "Overview rows keep only the required touch target and wrapped content")
                    if let previous { XCTAssertEqual(row.frame.minY, previous.frame.maxY, accuracy: 1) }
                    previous = row
                }
            }
            capture(app, "Featured-no-headings-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            first.tap()
            waitUntilHittable(app.buttons["news-sina-0"].firstMatch)
            if !accessibility {
                XCTAssertEqual(app.buttons["news-sina-1"].firstMatch.frame.minY - app.buttons["news-sina-0"].firstMatch.frame.maxY,
                               8, accuracy: 1,
                               "The complete channel keeps its existing standard padding")
            }
            XCTAssertTrue(app.buttons["tab-sina"].isSelected, "Keep each channel's direct entry")
            XCTAssertTrue(app.staticTexts["sina-title-5"].exists, "Do not limit the complete channel feed to five items")
            if appearance == "light" {
                app.buttons["tab-featured"].tap()
                waitUntilHittable(first)
                app.buttons["channel-menu"].tap()
                app.buttons["open-channel-overview"].tap()
                XCTAssertTrue(app.buttons["overview-close"].waitForExistence(timeout: 5))
                capture(app, "Featured-no-headings-thumbnails")
                closeOverview(app)
                XCTAssertTrue(app.buttons["tab-featured"].isSelected)
            }
            if !app.buttons["tab-featured"].isSelected { app.buttons["tab-featured"].tap() }
            let zhihu = app.buttons["featured-open-zhihu"]
            let feed = app.scrollViews["feed-featured"]
            let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
            for _ in 0..<12 where !zhihu.isHittable || zhihu.frame.maxY > footerTop - 44 { feed.swipeUp() }
            waitUntilHittable(zhihu)
            capture(app, "Featured-aligned-ranks-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            zhihu.tap()
            let completeRank = app.staticTexts["zhihu-rank-0"].firstMatch
            XCTAssertTrue(completeRank.waitForExistence(timeout: 10))
            XCTAssertEqual(completeRank.label, "01", "The complete Zhihu channel retains its original rank style")
            capture(app, "Zhihu-preserved-ranks-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            app.terminate()
        }
    }
    func testFeaturedArticleSourcesAndContinuousLayout() {
        let app = XCUIApplication()
        for (appearance, accessibility) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            let source = app.buttons["featured-source-sspai-0"]
            XCTAssertTrue(source.waitForExistence(timeout: 15))
            for channel in ["sspai", "36kr", "nnGroup"] {
                XCTAssertFalse(app.buttons["featured-open-\(channel)"].exists, "Article sources belong inside rows, not separate channel headers")
                XCTAssertEqual(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "featured-source-\(channel)-")).count, 4)
                XCTAssertEqual(app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "\(channel)-summary-")).count, 0,
                               "Overview article rows omit summaries without removing source, title or metadata")
            }
            let last = app.buttons.containing(.staticText, identifier: "sspai-title-3").firstMatch
            let next = app.buttons["featured-source-36kr-0"]
            XCTAssertTrue(last.exists && next.exists)
            let nextCover = app.buttons["featured-cover-36kr-0"]
            let coverHeight = accessibility && nextCover.exists ? nextCover.frame.height + 12 : 0
            XCTAssertGreaterThanOrEqual(next.frame.minY - last.frame.maxY, 0)
            XCTAssertLessThanOrEqual(next.frame.minY - last.frame.maxY, coverHeight + 18,
                                    "Do not add a channel-sized gap beyond the accessibility layout's stacked cover")
            let feed = app.scrollViews["feed-featured"]
            let railBottom = app.buttons["channel-menu"].frame.maxY
            let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
            let market = app.buttons["featured-open-stock"]
            for _ in 0..<40 {
                if market.isHittable && market.frame.minY >= railBottom + 4 && market.frame.maxY + 240 <= footerTop - 4 { break }
                if market.frame.minY < railBottom + 4 { feed.swipeDown(velocity: .slow) }
                else { feed.swipeUp(velocity: .slow) }
            }
            waitUntilHittable(market)
            XCTAssertEqual(app.buttons.matching(identifier: "featured-stock-map").count, 12,
                           "Show twelve real market sectors: \(app.debugDescription)")
            capture(app, "Featured-market-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            for _ in 0..<40 {
                if source.isHittable && source.frame.minY >= railBottom + 4 && source.frame.maxY <= footerTop - 160 { break }
                if source.frame.minY < railBottom + 4 { feed.swipeDown(velocity: .slow) }
                else { feed.swipeUp(velocity: .slow) }
            }
            waitUntilHittable(source)
            XCTAssertGreaterThanOrEqual(source.frame.width, 44)
            XCTAssertGreaterThanOrEqual(source.frame.height, 44)
            XCTAssertEqual(source.label, "查看少数派频道")
            for channel in ["sspai", "36kr", "nnGroup"] {
                let badge = app.buttons["featured-source-\(channel)-0"]
                let title = app.staticTexts["\(channel)-title-0"].firstMatch
                XCTAssertEqual(badge.frame.minX, title.frame.minX, accuracy: 1, "The source belongs in the headline column")
                XCTAssertLessThanOrEqual(badge.frame.maxY, title.frame.minY + 1, "Place the source above its headline, as in the extension")
            }
            for index in 0..<4 {
                let metadata = app.descendants(matching: .any).matching(identifier: "36kr-metadata-\(index)").firstMatch
                XCTAssertTrue(metadata.exists)
                XCTAssertFalse(metadata.label.contains("#"), "Do not display the board label in news metadata")
                XCTAssertNotNil(metadata.label.range(of: #"\d{2}:\d{2}"#, options: .regularExpression), "Keep the publication time")
            }
            if !accessibility {
                for channel in ["sspai", "36kr"] {
                    for index in 0..<4 {
                        let badge = app.buttons["featured-source-\(channel)-\(index)"]
                        let copy = app.buttons.containing(.staticText, identifier: "\(channel)-title-\(index)").firstMatch
                        let cover = app.buttons["featured-cover-\(channel)-\(index)"]
                        XCTAssertTrue(cover.exists)
                        XCTAssertEqual(cover.frame.width, 140, accuracy: 1, "Overview covers share the extension's landscape dimensions")
                        XCTAssertEqual(cover.frame.height, max(94, copy.frame.maxY - badge.frame.minY), accuracy: 1,
                                       "Overview covers fill the complete source, headline and metadata column")
                        XCTAssertEqual(cover.frame.midY, (badge.frame.minY + copy.frame.maxY) / 2, accuracy: 1,
                                       "Center the landscape cover beside the complete text column")
                        if channel == "36kr" {
                            let title = app.staticTexts["36kr-title-\(index)"].firstMatch
                            XCTAssertEqual(title.frame.midY, cover.frame.midY, accuracy: 1,
                                           "Center the 36kr headline vertically within the news row")
                        }
                    }
                }
            }
            capture(app, "Featured-integrated-articles-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            if appearance == "light", !accessibility {
                for entry in [app.staticTexts["sspai-title-0"].firstMatch, app.buttons["featured-cover-sspai-0"]] {
                    waitUntilHittable(entry)
                    entry.tap()
                    XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5))
                    app.navigationBars.buttons.firstMatch.tap()
                    waitUntilHittable(source)
                    XCTAssertTrue(app.buttons["tab-featured"].isSelected, "Reading must not activate the source shortcut")
                }
            }
            source.tap()
            XCTAssertTrue(app.buttons["tab-sspai"].isSelected)
            waitUntilHittable(app.staticTexts["sspai-title-0"].firstMatch)
            app.buttons["tab-featured"].tap()
            waitUntilHittable(source)
            XCTAssertTrue(app.buttons["tab-featured"].isSelected)
            for _ in 0..<40 {
                if next.isHittable && next.frame.minY >= railBottom + 4 && next.frame.maxY <= footerTop - 4 { break }
                feed.swipeUp(velocity: .slow)
            }
            waitUntilHittable(next)
            next.tap()
            let summary = app.descendants(matching: .any).matching(identifier: "36kr-summary-0").firstMatch
            XCTAssertTrue(summary.waitForExistence(timeout: 10), "Keep summaries in the complete channel, including accessibility text")
            XCTAssertFalse(summary.label.isEmpty)
            capture(app, "36kr-preserved-summary-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            app.terminate()
        }
    }
    func testFeaturedTiobeHeaderAndTopFive() {
        let app = XCUIApplication()
        for (appearance, accessibility) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system"]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            let feed = app.scrollViews["feed-featured"]
            let source = app.buttons["featured-open-tiobe"]
            XCTAssertTrue(source.waitForExistence(timeout: 15))
            let header = app.descendants(matching: .any).matching(identifier: "featured-tiobe-header").firstMatch
            let first = app.buttons["featured-tiobe-0"].firstMatch
            let fifth = app.buttons["featured-tiobe-4"].firstMatch
            XCTAssertTrue(header.exists)
            XCTAssertEqual(app.buttons.matching(NSPredicate(format: "identifier MATCHES %@", "featured-tiobe-[0-9]+")).count, 5)
            XCTAssertFalse(app.buttons["featured-tiobe-5"].exists)
            XCTAssertLessThanOrEqual(header.frame.maxY, first.frame.minY)
            let railBottom = app.buttons["channel-menu"].frame.maxY
            let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
            for _ in 0..<60 {
                if header.isHittable && header.frame.minY >= railBottom + 4 && header.frame.maxY < footerTop - 44 { break }
                if header.frame.minY < railBottom + 4 { feed.swipeDown(velocity: .slow) }
                else { feed.swipeUp(velocity: .slow) }
            }
            waitUntilHittable(header)
            if accessibility {
                XCTAssertTrue(header.staticTexts["编程语言排行"].exists)
            } else {
                for label in ["语言", "占比", "变化"] { XCTAssertTrue(header.staticTexts[label].exists) }
                XCTAssertEqual(header.staticTexts.count, 5, "Expose all five table column headings")
            }
            capture(app, "Featured-Tiobe-header-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            for _ in 0..<12 where !fifth.isHittable || fifth.frame.maxY > footerTop - 4 { feed.swipeUp(velocity: .slow) }
            waitUntilHittable(fifth)
            capture(app, "Featured-Tiobe-fifth-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            fifth.tap()
            XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5))
            app.navigationBars.buttons.firstMatch.tap()
            XCTAssertTrue(app.buttons["tab-featured"].isSelected)
            for _ in 0..<12 {
                if source.isHittable && source.frame.minY >= railBottom + 4 && source.frame.maxY < footerTop - 4 { break }
                if source.frame.minY < railBottom + 4 { feed.swipeDown(velocity: .slow) }
                else { feed.swipeUp(velocity: .slow) }
            }
            waitUntilHittable(source)
            source.tap()
            waitUntilHittable(app.buttons["news-tiobe-0"].firstMatch)
            XCTAssertTrue(app.buttons["news-tiobe-5"].exists, "The complete channel retains more than five rows")
            app.terminate()
        }
    }
    func testNewChannelsLiveDataAndRadarExclusion() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "github", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            app.launch()
            waitUntilHittable(app.buttons["github-daily-0"].firstMatch)
            let heading = app.descendants(matching: .any)["github-heading"].firstMatch
            let periodControl = app.segmentedControls["github-period"]
            XCTAssertFalse(app.staticTexts["github.com"].exists)
            XCTAssertLessThan(heading.frame.maxX, periodControl.frame.minX)
            XCTAssertEqual(heading.frame.midY + 6, periodControl.frame.midY, accuracy: 3)
            for rank in 0..<3 {
                XCTAssertEqual(app.staticTexts["github-rank-daily-\(rank)"].firstMatch.label, String(rank + 1))
            }
            XCTAssertTrue(app.staticTexts["github-language-daily-0"].firstMatch.exists)
            XCTAssertTrue(app.descendants(matching: .any)["github-growth-daily-0"].firstMatch.exists)
            capture(app, "GitHub-\(appearance)-daily")
            app.buttons["github-daily-0"].firstMatch.tap()
            XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["nav-0"].exists)
            app.navigationBars.buttons.firstMatch.tap()
            waitUntilHittable(app.buttons["github-daily-0"].firstMatch)
            for (period, title) in [("weekly", "周榜"), ("monthly", "月榜")] {
                app.segmentedControls["github-period"].buttons[title].tap()
                waitUntilHittable(app.buttons["github-\(period)-0"].firstMatch)
                capture(app, "GitHub-\(appearance)-\(period)")
            }
            app.buttons["channel-menu"].tap()
            XCTAssertFalse(app.buttons["Codex Radar"].exists)
            XCTAssertFalse(app.buttons["AI News"].exists)
            channelMenuItem(app, channel: "artificialAnalysis").tap()
            XCTAssertTrue(app.descendants(matching: .any)["analysis-intelligence-heading"].waitForExistence(timeout: 15))
            let plot = app.descendants(matching: .any)["analysis-intelligence-chart"].firstMatch
            waitUntilHittable(plot)
            XCTAssertTrue(plot.exists)
            XCTAssertFalse(app.buttons["analysis-intelligence-detail"].exists)
            XCTAssertFalse(app.staticTexts["点选柱形查看详情 · 横向滑动查看更多"].exists)
            capture(app, "AI-Analysis-\(appearance)")
            let firstModel = openAnalysisModel(app, plot: plot)
            capture(app, "AI-Analysis-\(appearance)-selected")
            plot.swipeLeft(velocity: .slow)
            XCTAssertTrue(app.buttons["tab-artificialAnalysis"].isSelected, "Chart scrolling must not change channels")
            capture(app, "AI-Analysis-\(appearance)-scrolled")
            XCTAssertNotEqual(openAnalysisModel(app, plot: plot), firstModel)
            let feed = app.scrollViews["feed-artificialAnalysis"]
            for _ in 0..<8 where !app.descendants(matching: .any)["analysis-cost-heading"].isHittable { feed.swipeUp() }
            XCTAssertTrue(app.descendants(matching: .any)["analysis-cost-heading"].exists)
            capture(app, "AI-Analysis-\(appearance)-cost")
            let lastPlot = app.descendants(matching: .any)["analysis-cost-chart"].firstMatch
            scrollToEnd(feed) { lastPlot }
            assertAboveFooter(lastPlot, in: app, name: "AI-Analysis-\(appearance)-bottom")
            app.buttons["channel-menu"].tap()
            channelMenuItem(app, channel: "featured").tap()
            waitUntilHittable(app.buttons["featured-open-sina"])
            capture(app, "Featured-\(appearance)")
            app.buttons["featured-open-sina"].tap()
            waitUntilHittable(app.buttons["news-sina-0"].firstMatch)
            XCTAssertTrue(app.buttons["tab-sina"].isSelected)
            app.terminate()
        }
    }
    func testDoubanSubtleNumericRatings() {
        let app = XCUIApplication()
        for (appearance, accessibility) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "doubanMovie", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            let rating = app.descendants(matching: .any).matching(identifier: "doubanMovie-rating-0").firstMatch
            waitUntilHittable(rating)
            XCTAssertNotNil(rating.label.range(of: #"评分 \d+(\.\d+)? 分，满分 10 分"#, options: .regularExpression))
            XCTAssertLessThanOrEqual(rating.frame.maxX, app.frame.maxX - 16)
            capture(app, "Douban-subtle-score-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            app.terminate()
            if !accessibility {
                app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system"]
                app.launch()
                let feed = app.scrollViews["feed-featured"]
                waitUntilHittable(feed)
                scrollToEnd(feed) { app.descendants(matching: .any).matching(identifier: "doubanMovie-rating-3").firstMatch }
                let overviewRating = app.descendants(matching: .any).matching(identifier: "doubanMovie-rating-0").firstMatch
                let railBottom = app.buttons["channel-menu"].frame.maxY
                let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
                for _ in 0..<12 {
                    if overviewRating.isHittable && overviewRating.frame.minY >= railBottom + 4 && overviewRating.frame.maxY < footerTop - 4 { break }
                    if overviewRating.frame.minY < railBottom + 4 { feed.swipeDown(velocity: .slow) }
                    else { feed.swipeUp(velocity: .slow) }
                }
                waitUntilHittable(overviewRating)
                XCTAssertTrue(overviewRating.label.contains("满分 10 分"))
                capture(app, "Featured-Douban-subtle-score-\(appearance)")
                app.terminate()
            }
        }
    }
    func testFeaturedAnalysisScrollsBeyondFirstFourModelsAndMovieRatings() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system"]
            app.launch()
            let feed = app.scrollViews["feed-featured"]
            let plot = app.descendants(matching: .any)["analysis-intelligence-chart"].firstMatch
            waitUntilHittable(feed)
            for _ in 0..<40 where !plot.isHittable { feed.swipeUp() }
            waitUntilHittable(plot)
            for _ in 0..<4 where plot.frame.minY < app.buttons["channel-menu"].frame.maxY + 16 {
                feed.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
                    .press(forDuration: 0.05, thenDragTo: feed.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)))
            }
            XCTAssertFalse(app.buttons["analysis-intelligence-detail"].exists)
            XCTAssertFalse(app.staticTexts["点选柱形查看详情 · 横向滑动查看更多"].exists)
            capture(app, "Featured-Analysis-\(appearance)")
            let beforeScroll = openAnalysisModel(app, plot: plot)
            plot.swipeLeft(velocity: .slow)
            XCTAssertNotEqual(openAnalysisModel(app, plot: plot), beforeScroll,
                           "Overview must retain models beyond the first four, not just a static truncated chart")
            XCTAssertTrue(app.buttons["tab-featured"].isSelected, "Chart scrolling must not switch channels")
            capture(app, "Featured-Analysis-\(appearance)-scrolled")
            let rating = app.descendants(matching: .any)["doubanMovie-rating-0"].firstMatch
            for _ in 0..<16 where !rating.isHittable { feed.swipeUp() }
            XCTAssertTrue(rating.isHittable)
            XCTAssertTrue(rating.label.contains("满分 10 分"))
            for _ in 0..<4 where rating.frame.maxY > app.buttons["nav-0"].frame.minY - 100 {
                feed.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
                    .press(forDuration: 0.05, thenDragTo: feed.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6)))
            }
            capture(app, "Featured-Douban-\(appearance)")
            app.buttons["channel-menu"].tap()
            channelMenuItem(app, channel: "doubanMovie").tap()
            waitUntilHittable(app.descendants(matching: .any)["doubanMovie-rating-0"].firstMatch)
            capture(app, "Douban-stars-\(appearance)")
            app.terminate()
        }
    }
    func testBenchmarkChartPinchAndSelectionRetention() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "artificialAnalysis", "-native.readingSize", "system"]
        app.launch()
        let plot = app.descendants(matching: .any)["analysis-intelligence-chart"].firstMatch
        waitUntilHittable(plot)
        let selected = openAnalysisModel(app, plot: plot, x: 0.65)
        plot.pinch(withScale: 0.55, velocity: -1)
        XCTAssertTrue(app.buttons["overview-close"].waitForExistence(timeout: 5))
        capture(app, "AI-Analysis-pinch-overview")
        closeOverview(app)
        waitUntilHittable(plot)
        XCTAssertEqual(plot.value as? String, selected, "Global zoom must retain the chart's selected model")
        XCTAssertTrue(app.buttons["tab-artificialAnalysis"].isSelected)
        capture(app, "AI-Analysis-pinch-return")
    }
    func testNewChannelAccessibilityLayoutAndChartOverview() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "github", "-native.readingSize", "system",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        waitUntilHittable(app.segmentedControls["github-period"])
        let heading = app.descendants(matching: .any)["github-heading"].firstMatch
        XCTAssertGreaterThan(app.segmentedControls["github-period"].frame.minY, heading.frame.maxY)
        XCTAssertLessThanOrEqual(heading.frame.maxX, app.frame.maxX - 16)
        capture(app, "GitHub-accessibility-heading")
        let feed = app.scrollViews["feed-github"]
        let language = app.staticTexts["github-language-daily-0"].firstMatch
        for _ in 0..<6 where !language.isHittable { feed.swipeUp() }
        waitUntilHittable(language)
        XCTAssertLessThanOrEqual(language.frame.maxX, app.frame.maxX - 16)
        capture(app, "GitHub-accessibility-metadata")
        app.terminate()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "artificialAnalysis", "-native.readingSize", "system",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        let plot = app.descendants(matching: .any)["analysis-intelligence-chart"].firstMatch
        XCTAssertTrue(plot.waitForExistence(timeout: 15))
        let analysisFeed = app.scrollViews["feed-artificialAnalysis"]
        let footerTop = app.buttons["mini-player"].exists ? app.buttons["mini-player"].frame.minY : app.buttons["nav-0"].frame.minY
        for _ in 0..<8 where !plot.isHittable || plot.frame.maxY > footerTop - 18 { analysisFeed.swipeUp() }
        waitUntilHittable(plot)
        XCTAssertLessThanOrEqual(plot.frame.maxX, app.frame.maxX - 16)
        // Swift Charts exposes the plot area here, excluding the model labels below it.
        XCTAssertGreaterThanOrEqual(plot.frame.height, 44)
        XCTAssertLessThanOrEqual(plot.frame.maxY, footerTop - 18)
        XCTAssertFalse(app.buttons["analysis-intelligence-detail"].exists)
        capture(app, "AI-Analysis-accessibility-icons")
        openAnalysisModel(app, plot: plot)
        app.buttons["channel-menu"].tap()
        app.buttons["open-channel-overview"].tap()
        XCTAssertTrue(app.buttons["overview-close"].waitForExistence(timeout: 5))
        capture(app, "AI-Analysis-accessibility-overview")
        closeOverview(app)
        XCTAssertTrue(app.buttons["tab-artificialAnalysis"].isSelected)
    }
    @discardableResult private func openAnalysisModel(_ app: XCUIApplication, plot: XCUIElement, x: CGFloat = 0.75) -> String {
        plot.coordinate(withNormalizedOffset: CGVector(dx: x, dy: 0.35)).tap()
        XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5), "Chart columns open their model directly without a separate detail row")
        XCTAssertFalse(app.buttons["nav-0"].exists, "Use the existing reader path and hide its floating footer")
        app.navigationBars.buttons.firstMatch.tap()
        waitUntilHittable(plot)
        let selected = plot.value as? String ?? ""
        XCTAssertFalse(selected.isEmpty)
        XCTAssertNotEqual(selected, "未选择模型")
        return selected
    }
    func testOverviewAccessibleEntryAndAllSubscribedChannels() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "dark", "-native.selectedChannel", "sina", "-native.readingSize", "system",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        waitUntilHittable(app.buttons["channel-menu"])
        app.buttons["channel-menu"].tap()
        app.buttons["open-channel-overview"].tap()
        let overview = app.scrollViews["channel-overview"]
        XCTAssertTrue(app.buttons["overview-close"].waitForExistence(timeout: 5))
        var seen = Set<String>()
        overview.swipeDown()
        for _ in 0..<30 {
            for button in app.buttons.allElementsBoundByIndex where button.identifier.hasPrefix("overview-") && button.identifier != "overview-close" {
                seen.insert(button.identifier)
                if button.isHittable { XCTAssertGreaterThanOrEqual(button.frame.height, 44) }
            }
            if seen.contains("overview-artificialAnalysis") { break }
            overview.swipeUp()
        }
        for code in ["featured", "sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "stock", "36kr", "doubanMovie", "bilibili", "nnGroup", "tiobe", "history", "github", "artificialAnalysis"] {
            XCTAssertTrue(seen.contains("overview-\(code)"), code)
        }
        XCTAssertFalse(seen.contains("overview-codexRadar"))
        capture(app, "Channel-overview-accessibility")
        closeOverview(app)
        XCTAssertTrue(app.buttons["tab-sina"].isSelected)
    }
    private func closeOverview(_ app: XCUIApplication) {
        let close = app.buttons["overview-close"]
        XCTAssertTrue(close.waitForExistence(timeout: 5))
        // XCTest misreports occlusion by thumbnails scrolling beneath glass; verify the actual touch instead.
        close.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: close)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
    }
    private func waitForDensity(_ density: String, app: XCUIApplication) {
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", density), object: app.buttons["channel-menu"])
        XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 5), .completed)
    }
    private func waitUntilHittable(_ element: XCUIElement) {
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND hittable == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 15), .completed)
    }
    private func dismissLoginKeyboard(in app: XCUIApplication) {
        XCTAssertFalse(app.buttons["login-dismiss-keyboard"].exists, "Login must not add a Done button when editing")
        XCTAssertFalse(app.navigationBars.buttons["完成"].exists)
        let form = app.scrollViews["login-scroll"]
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.exists)
        // A small upward scroll dismisses either native keyboard without dragging the sheet closed.
        let visibleBottom = min(form.frame.maxY, keyboard.frame.minY)
        let start = form.coordinate(withNormalizedOffset: .zero)
            .withOffset(CGVector(dx: form.frame.width - 12, dy: visibleBottom - form.frame.minY - 32))
        start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -44)))
        let dismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: keyboard)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
        XCTAssertTrue(form.exists, "Dismissing the keyboard should keep the login sheet open")
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
    func testPlayerCoverBackdropAndGlassControls() {
        let app = XCUIApplication()
        for appearance in ["light", "dark", "accessibility"] {
            app.launchArguments = ["-native.appearance", appearance == "dark" ? "dark" : "light", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
            if appearance == "accessibility" {
                app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            }
            app.launch()
            ensureMiniPlayer(app)
            let miniToggle = app.buttons["mini-player-toggle"]
            if miniToggle.label == "暂停" { miniToggle.tap() }
            let author = app.staticTexts["mini-player-metadata"].label
            app.buttons["mini-player"].tap()
            let scroll = app.scrollViews["player-scroll"]
            XCTAssertTrue(scroll.waitForExistence(timeout: 5))
            XCTAssertTrue(app.navigationBars["正在收听"].exists)
            capture(app, "Player-cover-backdrop-\(appearance)")
            let toggle = app.buttons["player-toggle"]
            for _ in 0..<5 where !toggle.isHittable || toggle.frame.maxY > scroll.frame.maxY - 16 { scroll.swipeUp() }
            waitUntilHittable(toggle)
            XCTAssertEqual(toggle.label, "播放", "Opening the player must preserve its paused state")
            for button in [toggle, app.buttons["后退 15 秒"], app.buttons["前进 30 秒"]] {
                XCTAssertTrue(button.isHittable)
                XCTAssertGreaterThanOrEqual(button.frame.width, 44)
                XCTAssertGreaterThanOrEqual(button.frame.height, 44)
                XCTAssertGreaterThanOrEqual(button.frame.minX, app.frame.minX)
                XCTAssertLessThanOrEqual(button.frame.maxX, app.frame.maxX)
                XCTAssertLessThanOrEqual(button.frame.maxY, scroll.frame.maxY, "Scroll large-text controls fully into view")
            }
            XCTAssertTrue(app.sliders["播放进度"].exists)
            capture(app, "Player-glass-controls-\(appearance)")
            app.buttons["收起"].tap()
            XCTAssertTrue(scroll.waitForNonExistence(timeout: 5))
            XCTAssertEqual(miniToggle.label, "播放")
            XCTAssertEqual(app.staticTexts["mini-player-metadata"].label, author)
            app.terminate()
        }
    }
    func testMiniPlayerAuthorSurvivesPauseAndRestore() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
            app.launch()
            ensureMiniPlayer(app)
            let metadata = app.staticTexts["mini-player-metadata"]
            let toggle = app.buttons["mini-player-toggle"]
            XCTAssertTrue(metadata.waitForExistence(timeout: 5))
            let author = metadata.label
            XCTAssertFalse(author.isEmpty)
            XCTAssertFalse(["正在播放", "已暂停"].contains(author), "Show the podcast author, not just its playback state")
            if toggle.label == "播放" { toggle.tap() }
            let playing = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", "暂停"), object: toggle)
            XCTAssertEqual(XCTWaiter.wait(for: [playing], timeout: 20), .completed)
            XCTAssertEqual(metadata.label, author)
            toggle.tap()
            XCTAssertEqual(toggle.label, "播放")
            XCTAssertEqual(metadata.label, author, "Pausing must not replace the author with a status message")
            capture(app, "Mini-player-author-paused-\(appearance)")
            for tab in [1, 2, 0] {
                app.buttons["nav-\(tab)"].tap()
                XCTAssertEqual(metadata.label, author, "Keep author metadata across all main tabs")
            }
            app.terminate()
            app.launch()
            XCTAssertTrue(metadata.waitForExistence(timeout: 5))
            XCTAssertEqual(toggle.label, "播放", "A restored podcast remains paused")
            XCTAssertEqual(metadata.label, author, "Restoring a paused episode keeps its author")
            app.terminate()
        }
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
        let form = app.scrollViews["settings-scroll"]
        let privacy = app.descendants(matching: .any).matching(identifier: "settings-privacy").firstMatch
        for _ in 0..<6 { form.swipeUp(velocity: .fast) }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Settings-bottom-player"; screenshot.lifetime = .keepAlways; add(screenshot)
        XCTAssertTrue(privacy.isHittable)
        XCTAssertLessThanOrEqual(privacy.frame.maxY, app.buttons["mini-player"].frame.minY - 12,
                                 "The entire last row must scroll above the mini-player, not just above navigation")
        assertAboveFooter(app.descendants(matching: .any).matching(identifier: "settings-version").firstMatch, in: app, name: "My-inline-about-player")
    }
    func testAllChannelEndsClearFloatingPlayer() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "xiaoyuzhou", "-native.readingSize", "system"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        ensureMiniPlayer(app)
        for channel in ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "tiobe", "doubanMovie", "nnGroup", "bilibili", "36kr", "history", "stock"] {
            app.buttons["channel-menu"].tap()
            channelMenuItem(app, channel: channel).tap()
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
                    XCTAssertTrue(app.buttons["mini-player"].waitForNonExistence(timeout: 5))
                }
                app.buttons["nav-1"].tap()
                let list = app.descendants(matching: .any).matching(identifier: "subscriptions-scroll").firstMatch
                let lastSubscription = { app.switches.allElementsBoundByIndex.last ?? list }
                scrollToEnd(list, lastItem: lastSubscription)
                XCTAssertFalse(app.staticTexts["点编辑调整频道顺序；RSS 频道可左滑编辑或删除。"].exists)
                assertAboveFooter(lastSubscription(), in: app, name: "Subscriptions-bottom-\(appearance)-player-\(withPlayer)")
                app.buttons["nav-2"].tap()
                let form = app.descendants(matching: .any).matching(identifier: "settings-scroll").firstMatch
                let version = app.descendants(matching: .any).matching(identifier: "settings-version").firstMatch
                scrollToEnd(form) { version }
                assertAboveFooter(version, in: app, name: "My-bottom-\(appearance)-player-\(withPlayer)")
                let privacy = app.buttons["settings-privacy"]
                assertAboveFooter(privacy, in: app, name: "Settings-bottom-\(appearance)-player-\(withPlayer)")
                privacy.tap()
                let legal = app.scrollViews["legal-scroll"]
                let document = app.staticTexts["legal-end"]
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
        let version = app.descendants(matching: .any).matching(identifier: "settings-version").firstMatch
        scrollToEnd(form) { version }
        assertAboveFooter(version, in: app, name: "My-bottom-accessibility")
        let privacy = app.buttons["settings-privacy"]
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
        channelMenuItem(app, channel: "sina").tap()
        let feed = app.scrollViews["feed-sina"]
        let lastItem = {
            self.lastNewsItem(app, channel: "sina", fallback: feed)
        }
        scrollToEnd(feed, lastItem: lastItem)
        let last = lastItem()
        let bottom = last.frame.maxY
        last.tap()
        XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5))
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
    func testVisibleChannelSelectionKeepsRailStationary() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sina", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            app.launch()
            waitUntilHittable(app.buttons["tab-sina"])
            let leading = app.buttons["tab-sina"].frame.minX
            for channel in ["zhihu", "sspai", "zhihu", "sina", "sspai", "sina"] {
                let tab = app.buttons["tab-\(channel)"]
                tab.tap()
                XCTAssertTrue(tab.isSelected)
                XCTAssertGreaterThanOrEqual(tab.frame.height, 44)
                XCTAssertEqual(app.buttons["tab-sina"].frame.minX, leading, accuracy: 2, "Do not scroll the rail when the selected channel is already visible")
                XCTAssertEqual(app.scrollViews["feed-\(channel)"].frame.minX, 0, accuracy: 1, "Keep the selected page and indicator synchronized")
            }
            app.buttons["channel-menu"].tap()
            channelMenuItem(app, channel: "history").tap()
            waitUntilHittable(app.buttons["tab-history"])
            XCTAssertTrue(app.buttons["tab-history"].isSelected)
            XCTAssertLessThanOrEqual(app.buttons["tab-history"].frame.maxX, app.buttons["channel-menu"].frame.minX + 1, "Reveal the entire offscreen selection without covering the menu")
            capture(app, "Channel-selection-\(appearance)")
            app.terminate()
        }
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
            channelMenuItem(app, channel: "arena").tap()
            XCTAssertTrue(app.segmentedControls.buttons["Labs"].waitForExistence(timeout: 5))
            swipeChannel(app, left: true)
            XCTAssertTrue(app.buttons["tab-xiaoyuzhou"].isSelected, "Paging must also work from Arena")
            XCTAssertTrue(app.buttons["播放"].firstMatch.waitForExistence(timeout: 5))
            app.buttons["channel-menu"].tap()
            channelMenuItem(app, channel: "sina").tap()
            swipeChannel(app, left: false)
            XCTAssertTrue(app.buttons["tab-featured"].isSelected, "The added editorial overview precedes Sina")
            swipeChannel(app, left: false)
            XCTAssertTrue(app.buttons["tab-featured"].isSelected, "Do not wrap past the first enabled channel")
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "Paging-and-fonts-\(appearance)"; screenshot.lifetime = .keepAlways; add(screenshot)
            app.terminate()
        }
    }
    func testChannelMenuLogosAndSelection() {
        let app = XCUIApplication()
        for appearance in ["light", "dark"] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "sspai", "-native.readingSize", "system", "-native.feedDensity", "standard"]
            app.launch()
            waitUntilHittable(app.buttons["channel-menu"])
            app.buttons["channel-menu"].tap()
            for channel in ["featured", "sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "stock", "36kr", "doubanMovie", "bilibili", "nnGroup", "tiobe", "history", "github", "artificialAnalysis"] {
                XCTAssertTrue(channelMenuItem(app, channel: channel).waitForExistence(timeout: 5))
            }
            XCTAssertTrue(channelMenuItem(app, channel: "sspai").isSelected)
            capture(app, "Channel-menu-logos-\(appearance)")
            channelMenuItem(app, channel: "sina").tap()
            XCTAssertTrue(app.buttons["tab-sina"].isSelected)
            XCTAssertTrue(app.buttons["news-sina-0"].firstMatch.waitForExistence(timeout: 5))
            app.buttons["channel-menu"].tap()
            XCTAssertTrue(channelMenuItem(app, channel: "sina").isSelected)
            XCTAssertFalse(channelMenuItem(app, channel: "sspai").isSelected)
            capture(app, "Channel-menu-logos-selected-\(appearance)")
            channelMenuItem(app, channel: "sspai").tap()
            XCTAssertTrue(app.buttons["tab-sspai"].isSelected)
            app.buttons["channel-menu"].tap()
            XCTAssertFalse(app.buttons["紧凑"].exists, "The channel menu no longer changes individual feed density")
            app.buttons["open-channel-overview"].tap()
            closeOverview(app)
            XCTAssertTrue(app.buttons["tab-sspai"].isSelected)
            app.terminate()
        }
    }
    func testOverviewIconSelectedUnselectedAndMenu() {
        let app = XCUIApplication()
        for (appearance, accessibility) in [("light", false), ("dark", false), ("dark", true)] {
            app.launchArguments = ["-native.appearance", appearance, "-native.selectedChannel", "featured", "-native.readingSize", "system"]
            if accessibility { app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] }
            app.launch()
            let overview = app.buttons["tab-featured"]
            waitUntilHittable(overview)
            XCTAssertTrue(overview.isSelected)
            XCTAssertEqual(overview.label, "总览")
            XCTAssertGreaterThanOrEqual(overview.frame.height, 44)
            capture(app, "Overview-app-logo-selected-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            app.buttons["tab-sina"].tap()
            XCTAssertFalse(overview.isSelected)
            capture(app, "Overview-app-logo-unselected-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            app.buttons["channel-menu"].tap()
            let entry = channelMenuItem(app, channel: "featured")
            XCTAssertTrue(entry.waitForExistence(timeout: 5))
            capture(app, "Overview-app-logo-menu-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            entry.tap()
            XCTAssertTrue(overview.isSelected)
            app.buttons["channel-menu"].tap()
            app.buttons["open-channel-overview"].tap()
            XCTAssertTrue(app.buttons["overview-featured"].waitForExistence(timeout: 5))
            capture(app, "Overview-app-logo-thumbnail-\(appearance)-\(accessibility ? "accessibility" : "standard")")
            closeOverview(app)
            XCTAssertTrue(overview.isSelected)
            app.terminate()
        }
    }
    private func channelMenuItem(_ app: XCUIApplication, channel: String) -> XCUIElement {
        // Native Picker menu actions expose their titles, not the SwiftUI option identifiers.
        app.buttons.matching(NSPredicate(format: "identifier == '' AND label == %@", app.buttons["tab-\(channel)"].label)).element
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
            XCTAssertTrue(app.buttons["reader-share"].waitForExistence(timeout: 5))
            // iOS 27 also exposes the top action group as a toolbar. Check our bottom actions, not all toolbar roles.
            XCTAssertFalse(app.buttons["网页后退"].exists, "Webpage actions must stay in the menu, not a bottom toolbar")
            XCTAssertFalse(app.buttons["刷新"].exists)
            app.buttons["reader-actions"].tap()
            XCTAssertTrue(app.buttons["刷新"].waitForExistence(timeout: 5))
            XCTAssertTrue(app.buttons["在 Safari 打开"].exists)
            app.buttons["刷新"].tap()
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
        let arena = channelMenuItem(app, channel: "arena")
        XCTAssertTrue(arena.waitForExistence(timeout: 5))
        arena.tap()
        XCTAssertTrue(app.segmentedControls.buttons["Labs"].waitForExistence(timeout: 5))
        app.segmentedControls.buttons["Labs"].tap()
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Dark Arena labs"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.buttons["channel-menu"].tap()
        let podcasts = channelMenuItem(app, channel: "xiaoyuzhou")
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
        XCTAssertTrue(app.navigationBars["资讯订阅"].exists)
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
        app.buttons["添加 RSS 频道"].tap()
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
            channelMenuItem(app, channel: channel).tap()
            waitUntilHittable(app.scrollViews["feed-\(channel)"])
            if channel != "stock" {
                let first = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).firstMatch
                XCTAssertTrue(first.waitForExistence(timeout: 10), channel)
                if channel == "sina" {
                    XCTAssertLessThan(first.frame.minY, 180, "Feed should start directly below channel bar")
                    XCTAssertLessThanOrEqual(first.frame.height, 112, "Allow two headline lines and secondary heat without an oversized card")
                }
                if ["bilibili", "36kr", "xiaoyuzhou"].contains(channel) {
                    let title = app.staticTexts["\(channel)-title-0"]
                    XCTAssertTrue(title.exists)
                    XCTAssertGreaterThanOrEqual(title.frame.minX - first.frame.minX, channel == "xiaoyuzhou" ? 100 : 150, "Keep the original cover on the left: \(channel)")
                    XCTAssertLessThan(first.frame.height, 220, "Standard density must not become a full-width cover feed")
                }
                if channel == "36kr" {
                    let metadata = app.descendants(matching: .any).matching(identifier: "36kr-metadata-0").firstMatch
                    XCTAssertFalse(metadata.label.contains("#"), "Do not display the board label in news metadata")
                    XCTAssertNotNil(metadata.label.range(of: #"\d{2}:\d{2}"#, options: .regularExpression), "Show publication time, not a raw Unix timestamp")
                }
                if channel == "doubanMovie" {
                    let rating = app.descendants(matching: .any).matching(identifier: "doubanMovie-rating-0").firstMatch
                    XCTAssertTrue(rating.label.contains("满分 10 分"), "Keep the original star rating with its accessible numeric score")
                }
            } else {
                XCTAssertTrue(app.staticTexts["stock-updated"].label.contains("北京"), "Keep the original acquisition-time label")
            }
            let shot = XCTAttachment(screenshot: app.screenshot())
            shot.name = "Parity-\(channel)"; shot.lifetime = .keepAlways; add(shot)
        }
        app.buttons["channel-menu"].tap()
        channelMenuItem(app, channel: "xiaoyuzhou").tap()
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
                channelMenuItem(app, channel: channel).tap()
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
        for channel in ["sina", "zhihu", "tiobe", "arena", "xiaoyuzhou", "sspai", "bilibili", "36kr", "doubanMovie", "nnGroup", "history"] {
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
