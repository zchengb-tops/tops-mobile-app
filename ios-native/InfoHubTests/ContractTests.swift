import XCTest
@testable import InfoHub

final class ContractTests: XCTestCase {
    func testReleaseResourcesAreBundled() throws {
        let bundle = Bundle.main
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
    func testDensityPinchHasThresholdsAndBounds() {
        XCTAssertEqual(FeedDensity.standard.adjusted(by: 1.1), .standard)
        XCTAssertEqual(FeedDensity.standard.adjusted(by: 0.9), .standard)
        XCTAssertEqual(FeedDensity.standard.adjusted(by: 0.7), .compact)
        XCTAssertEqual(FeedDensity.standard.adjusted(by: 1.5), .spacious)
        XCTAssertEqual(FeedDensity.compact.adjusted(by: 0.5), .compact)
        XCTAssertEqual(FeedDensity.spacious.adjusted(by: 2), .spacious)
        XCTAssertEqual(FeedDensity.compact.adjusted(by: 2), .standard)
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
        let bounds = CGRect(x: 0, y: 0, width: 360, height: 600)
        let rects = stockRects(items, in: bounds)
        XCTAssertEqual(rects.count, items.count)
        XCTAssertEqual(rects.reduce(0) { $0 + $1.width * $1.height }, bounds.width * bounds.height, accuracy: 0.1)
        for rect in rects { XCTAssertTrue(bounds.contains(rect)) }
    }
}
