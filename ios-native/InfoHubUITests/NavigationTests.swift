import XCTest

final class NavigationTests: XCTestCase {
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
        app.launch()
        XCTAssertTrue(app.tabBars.buttons["订阅"].waitForExistence(timeout: 15))
        app.tabBars.buttons["订阅"].tap()
        XCTAssertTrue(app.navigationBars["订阅"].exists)
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
        app.tabBars.buttons["我的"].tap()
        XCTAssertTrue(app.buttons["使用邮箱登录"].exists)
        let profile = XCTAttachment(screenshot: app.screenshot())
        profile.name = "Parity-profile"; profile.lifetime = .keepAlways; add(profile)
        app.buttons["使用邮箱登录"].tap()
        XCTAssertTrue(app.textFields["邮箱地址"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["发送验证码"].isEnabled)
        app.buttons["关闭"].tap()
        app.tabBars.buttons["发现"].tap()
        XCTAssertTrue(app.buttons["channel-menu"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Native discovery"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
    func testFeedLayoutParity() {
        let app = XCUIApplication()
        app.launchArguments = ["-native.appearance", "light", "-native.selectedChannel", "sina"]
        app.launch()
        XCTAssertTrue(app.buttons["channel-menu"].waitForExistence(timeout: 15))
        for channel in ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "tiobe", "doubanMovie", "nnGroup", "bilibili", "36kr", "history", "stock"] {
            app.buttons["channel-menu"].tap()
            app.buttons["choose-\(channel)"].tap()
            if channel != "stock" {
                let first = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "news-\(channel)-")).firstMatch
                XCTAssertTrue(first.waitForExistence(timeout: 10), channel)
                if channel == "sina" {
                    XCTAssertLessThan(first.frame.minY, 180, "Feed should start directly below channel bar")
                    XCTAssertLessThanOrEqual(first.frame.height, 55, "Hot list must not become oversized cards")
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
}
