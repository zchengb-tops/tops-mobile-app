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
    static let codes: Set<String> = ["featured", "sina", "zhihu", "sspai", "arena", "xiaoyuzhou", "stock", "36kr", "doubanMovie", "bilibili", "nnGroup", "tiobe", "history", "github", "artificialAnalysis"]
    var visibleInMobile: Bool { isRSS || !["codexRadar", "aiNews"].contains(code) }
    var assetName: String { code == "featured" && !isRSS ? "InfoHubLogo" : "channel-\(code)" }

    /// Add new native capabilities without resetting order, opt-outs, RSS, or unknown sync fields.
    static func mobileCatalog(existing: [Channel], remote: [Channel]) -> [Channel] {
        var channels = existing
        let incoming = remote.filter { $0.supported && ($0.raw["isAppEnabled"].flag || $0.code == "artificialAnalysis") }
        for channel in incoming where !channels.contains(where: { $0.code == channel.code && !$0.isRSS }) {
            channels.append(channel)
        }
        for (code, title, detail) in [
            ("featured", "总览", "汇集热点、阅读、开源与影音，快速发现值得关注的资讯"),
            ("github", "GitHub", "GitHub Trending · 日榜、周榜、月榜"),
            ("artificialAnalysis", "AI Analysis", "Artificial Analysis · 模型智能、速度与任务成本对比")
        ] where !channels.contains(where: { $0.code == code && !$0.isRSS }) {
            let channel = Channel(.object(["id": .string(code), "channelCode": .string(code), "title": .string(title),
                                          "tabTitle": .string(title), "desc": .string(detail), "enable": .bool(true)]))
            if code == "featured" { channels.insert(channel, at: 0) } else { channels.append(channel) }
        }
        return channels
    }
    var symbol: String {
        ["featured": "square.grid.2x2", "github": "chevron.left.forwardslash.chevron.right", "artificialAnalysis": "chart.bar.xaxis", "sina": "flame", "zhihu": "bubble.left.and.bubble.right", "sspai": "sparkles", "arena": "chart.bar.xaxis", "xiaoyuzhou": "headphones", "stock": "chart.xyaxis.line", "36kr": "newspaper", "doubanMovie": "film", "bilibili": "play.rectangle", "nnGroup": "person.crop.rectangle", "tiobe": "chevron.left.forwardslash.chevron.right", "history": "clock.arrow.circlepath"][code] ?? "dot.radiowaves.left.and.right"
    }
}

enum GithubPeriod: String, CaseIterable, Identifiable {
    case daily, weekly, monthly
    var id: String { rawValue }
    var title: String { self == .daily ? "日榜" : self == .weekly ? "周榜" : "月榜" }
    var growthTitle: String { self == .daily ? "今日新增" : self == .weekly ? "本周新增" : "本月新增" }
    func items(in payload: JSON) -> [NewsItem] {
        payload[rawValue]["items"].array.enumerated().compactMap { index, raw in
            let item = NewsItem(raw: raw, index: index)
            return item.title.isEmpty || item.url == nil ? nil : item
        }
    }
}

struct AnalysisChart: Identifiable {
    struct Point: Identifiable {
        let label: String
        let value: Double
        let detailsURL: URL?
        let color: String
        var id: String { label }
        var name: String {
            guard label.hasSuffix(")"), let suffix = label.range(of: " (", options: .backwards) else { return label }
            return String(label[..<suffix.lowerBound])
        }
        var variant: String { String(label.dropFirst(name.count)).trimmingCharacters(in: .whitespaces) }
        var logoAsset: String? {
            // shortcut: extension-known model prefixes; extend when a new provider appears in the chart feed.
            let model = name.lowercased()
            let providers = [("claude", "anthropic"), ("gpt", "openai"), ("gemini", "google"),
                             ("deepseek", "deepseek"), ("grok", "xai"), ("kimi", "moonshot"),
                             ("glm", "zai"), ("muse", "meta"), ("mimo", "xiaomi"), ("xiaomi", "xiaomi")]
            return providers.first { model.hasPrefix($0.0) }.map { "arena-\($0.1)" }
        }
    }
    let id: String
    let points: [Point]
    var maximum: Double { let value = points.map(\.value).max() ?? 0; return value > 0 ? value : 1 }
    var title: String { id == "intelligence" ? "智能指数" : id == "speed" ? "输出速度" : "任务成本" }
    var subtitle: String { id == "intelligence" ? "Intelligence Index · 越高越好" : id == "speed" ? "Tokens / second · 越高越好" : "USD / task · 越低越好" }
    func formatted(_ value: Double) -> String {
        id == "cost" ? String(format: "$%.3f", value) : id == "speed" ? String(format: "%.0f", value) : String(format: "%.1f", value)
    }
    static func charts(in payload: JSON) -> [Self] {
        ["intelligence", "speed", "cost"].compactMap { key in
            guard let raw = payload["charts"].array.first(where: { $0["key"].text == key }) else { return nil }
            var seen = Set<String>()
            let points = raw["points"].array.compactMap { point -> Point? in
                let label = point["label"].text.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !label.isEmpty, let value = Double(point["value"].text), value.isFinite, value >= 0, seen.insert(label).inserted else { return nil }
                let link = point.first("details_url", "detailsUrl")
                let resolved = link.isEmpty ? nil : URL(string: link, relativeTo: URL(string: "https://artificialanalysis.ai/"))?.absoluteURL
                return Point(label: label, value: value, detailsURL: resolved.flatMap { webURL($0.absoluteString) }, color: point["color"].text)
            }
            return points.isEmpty ? nil : Self(id: key, points: points)
        }
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
    var playerImage: URL? {
        guard let image, ["image.xyzcdn.net", "bts-image.xyzcdn.net"].contains(image.host?.lowercased() ?? ""),
              var components = URLComponents(url: image, resolvingAgainstBaseURL: false) else { return image }
        // Missing episode artwork falls back to a podcast thumbnail; expand known provider variants only.
        components.percentEncodedPath = components.percentEncodedPath.replacingOccurrences(of: "@(thumbnail|small|middle)$", with: "@large", options: .regularExpression)
        return components.url ?? image
    }
    var summary: String { raw.first("brief", "desc").nilIfEmpty ?? properties.first("summary", "excerpt", "recommendReason") }
    var rank: String { raw["rankNum"].text }
    var audio: URL? { webURL(raw["mediaUrl"].text) }
    var durationText: String {
        let seconds = raw["duration"].number
        guard seconds.isFinite, seconds >= 0, seconds / 60 < Double(Int.max) else { return "—" }
        let minutes = Int(seconds / 60)
        return minutes >= 60 ? "\(minutes / 60)小时" + (minutes % 60 == 0 ? "" : "\(minutes % 60)分钟") : "\(minutes)分钟"
    }
    var ratingStars: [String] {
        guard let rate = Double(raw["rate"].text), rate.isFinite else { return [] }
        let rating = min(5, max(0, rate / 2))
        return (0..<5).map { rating >= Double($0 + 1) ? "star.fill" : rating >= Double($0) + 0.5 ? "star.leadinghalf.filled" : "star" }
    }
    var publicationDate: Date? { newsDate(raw["publishDate"].text.nilIfEmpty ?? properties.first("publishDate", "publishTime")) }
    var stockUpdateTime: String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Shanghai")!
        guard let date = newsDate(raw["acquisitionTime"].text, calendar: calendar) else { return "未知时间" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy/MM/dd HH:mm"
        return formatter.string(from: date)
    }
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

// Providers send ISO dates, local date strings, or Unix milliseconds. Invalid dates stay absent.
func newsDate(_ source: String, now: Date = .now, calendar: Calendar = .current) -> Date? {
    let value = source.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !value.isEmpty else { return nil }
    if let timestamp = Double(value), timestamp.isFinite, timestamp >= 1_000_000_000 {
        return Date(timeIntervalSince1970: timestamp >= 100_000_000_000 ? timestamp / 1000 : timestamp)
    }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
    if value.range(of: #"^\d{4}-\d{2}-\d{2}"#, options: .regularExpression) != nil {
        // Foundation can normalize out-of-range days even with isLenient disabled.
        let day = String(value.prefix(10))
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: day), formatter.string(from: date) == day else { return nil }
    }
    let iso = ISO8601DateFormatter()
    if let date = iso.date(from: value) { return date }
    iso.formatOptions.insert(.withFractionalSeconds)
    if let date = iso.date(from: value) { return date }
    if value.range(of: #"^\d{2}-\d{2} \d{2}:\d{2}$"#, options: .regularExpression) != nil {
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let year = calendar.component(.year, from: now)
        guard let date = formatter.date(from: "\(year)-\(value)"), formatter.string(from: date) == "\(year)-\(value)" else { return nil }
        if date > now {
            let previousValue = "\(year - 1)-\(value)"
            guard let previous = formatter.date(from: previousValue), formatter.string(from: previous) == previousValue else { return nil }
            return previous
        }
        return date
    }
    for format in ["yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd", "EEE, dd MMM yyyy HH:mm:ss Z"] {
        formatter.dateFormat = format
        if let date = formatter.date(from: value), !format.hasPrefix("yyyy") || formatter.string(from: date) == value { return date }
    }
    return nil
}

func publicationTime(_ source: String, now: Date = .now, calendar: Calendar = .current) -> String {
    guard let date = newsDate(source, now: now, calendar: calendar) else { return source }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.timeZone = calendar.timeZone
    let today = calendar.isDate(date, inSameDayAs: now)
    let yesterday = calendar.date(byAdding: .day, value: -1, to: now).map { calendar.isDate(date, inSameDayAs: $0) } ?? false
    formatter.dateFormat = today || yesterday ? "HH:mm" : "MM-dd HH:mm"
    return (today ? "今天 " : yesterday ? "昨天 " : "") + formatter.string(from: date)
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
