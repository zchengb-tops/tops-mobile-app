import Foundation

// Keep provider-specific fields and unknown channel settings intact during cloud sync.
enum JSON: Codable, Equatable, Sendable {
    case object([String: JSON]), array([JSON]), string(String), number(Double), bool(Bool), null
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode([JSON].self) { self = .array(v) }
        else { self = .object(try c.decode([String: JSON].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .object(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .null: try c.encodeNil()
        }
    }
    subscript(_ key: String) -> JSON {
        get { if case .object(let v) = self { return v[key] ?? .null }; return .null }
        set { var v = object; v[key] = newValue; self = .object(v) }
    }
    var object: [String: JSON] { if case .object(let v) = self { return v }; return [:] }
    var array: [JSON] { if case .array(let v) = self { return v }; return [] }
    var text: String {
        switch self {
        case .string(let v): return v
        case .number(let v): return v == v.rounded() ? String(format: "%.0f", v) : String(v)
        default: return ""
        }
    }
    var flag: Bool { if case .bool(let v) = self { return v }; return false }
    var number: Double { Double(text) ?? 0 }
    func first(_ keys: String...) -> String { keys.map { self[$0].text }.first { !$0.isEmpty } ?? "" }
}

struct Channel: Identifiable, Codable, Equatable {
    var raw: JSON
    init(_ raw: JSON) {
        self.raw = raw
        if self.raw["title"] == .null { self.raw["title"] = .string(raw.first("name", "tabTitle")) }
        if self.raw["desc"] == .null { self.raw["desc"] = raw["description"] }
        if self.raw["enable"] == .null { self.raw["enable"] = .bool(raw["isDefaultSubscribed"].flag) }
    }
    var id: String { isRSS ? raw.first("id", "rssUrl") : raw.first("channelCode", "id") }
    var code: String { raw.first("channelCode", "id") }
    var title: String { raw.first("tabTitle", "title", "name") }
    var detail: String { raw.first("desc", "description") }
    var isRSS: Bool { raw["isRss"].flag }
    var rssURL: String { raw.first("rssUrl", "rssLink") }
    var enabled: Bool {
        get { raw["enable"] == .null ? raw["isDefaultSubscribed"].flag : raw["enable"].flag }
        set { raw["enable"] = .bool(newValue) }
    }
    var supported: Bool { isRSS || Self.codes.contains(code) }
    static let codes: Set<String> = ["sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "stock", "36kr", "doubanMovie", "bilibili", "nnGroup", "tiobe", "history"]
    var symbol: String {
        ["sina": "flame", "zhihu": "bubble.left.and.bubble.right", "sspai": "sparkles", "arena": "chart.bar.xaxis", "xiaoyuzhou": "headphones", "stock": "chart.xyaxis.line", "36kr": "newspaper", "doubanMovie": "film", "bilibili": "play.rectangle", "nnGroup": "person.crop.rectangle", "tiobe": "chevron.left.forwardslash.chevron.right", "history": "clock.arrow.circlepath"][code] ?? "dot.radiowaves.left.and.right"
    }
}

struct NewsItem: Identifiable, Hashable {
    let raw: JSON
    let index: Int
    var id: String { raw.first("shortLink", "url", "link") + "-\(index)" }
    var title: String { raw.first("title", "name") }
    var properties: JSON { raw["properties"] }
    var url: URL? { webURL(raw.first("originLink", "url", "link")) }
    var image: URL? {
        let value = raw.first("hdCoverUrl", "coverUrl", "banner", "coverImage").nilIfEmpty ?? properties.first("cover", "firstFrame", "banner", "logoUrl")
        return webURL(value.hasPrefix("http://") ? "https://" + value.dropFirst(7) : value)
    }
    var summary: String { raw.first("brief", "desc").nilIfEmpty ?? properties.first("summary", "excerpt", "recommendReason") }
    var rank: String { raw["rankNum"].text }
    var audio: URL? { webURL(raw["mediaUrl"].text) }
    var metadata: String {
        var values = [raw.first("author", "publishDate"), properties.first("author", "owner", "metrics", "ratings")]
        if !properties["viewers"].text.isEmpty { values.append("热度 " + compactCount(properties["viewers"].number)) }
        if !properties["view"].text.isEmpty { values.append("播放 " + compactCount(properties["view"].number)) }
        if !raw["rate"].text.isEmpty { values.append("评分 " + raw["rate"].text) }
        values += [raw["consumingTime"].text, raw["region"].text, raw["type"].text]
        return values.filter { !$0.isEmpty }.joined(separator: " · ")
    }
    static func == (lhs: Self, rhs: Self) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

func compactCount(_ count: Double) -> String {
    if count >= 100_000_000 { return String(format: "%.1f亿", count / 100_000_000) }
    return count >= 10_000 ? String(format: "%.1f万", count / 10_000) : String(format: "%.0f", count)
}

extension String { var nilIfEmpty: String? { isEmpty ? nil : self } }
func webURL(_ string: String) -> URL? {
    guard let url = URL(string: string), ["http", "https"].contains(url.scheme?.lowercased() ?? ""), url.host != nil else { return nil }
    return url
}
