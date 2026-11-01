import Foundation
import Observation
import Security

enum APIError: LocalizedError {
    case message(String)
    var errorDescription: String? { switch self { case .message(let message): return message } }
}

@MainActor @Observable final class Credential {
    static let shared = Credential()
    private static let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "cn.zchengb.infohub.native", kSecAttrAccount as String: "accessToken"]
    private(set) var isLoggedIn = false
    private init() { isLoggedIn = token != nil }
    var token: String? {
        #if DEBUG
        if ProcessInfo.processInfo.environment["INFOHUB_TEST_FAKE_CREDENTIALS"] == "1" {
            guard let token = UserDefaults.standard.string(forKey: "fixture.authToken"), token.hasPrefix("fixture-") else { return nil }
            return token
        }
        #endif
        var q = Self.query
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    func save(_ token: String) throws {
        #if DEBUG
        if ProcessInfo.processInfo.environment["INFOHUB_TEST_FAKE_CREDENTIALS"] == "1" {
            guard token.hasPrefix("fixture-") else { throw APIError.message("测试凭证无效") }
            UserDefaults.standard.set(token, forKey: "fixture.authToken")
            isLoggedIn = true
            return
        }
        #endif
        let data = Data(token.utf8)
        let status = SecItemUpdate(Self.query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var q = Self.query
            q[kSecValueData as String] = data
            q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw APIError.message("无法安全保存登录凭证") }
        } else if status != errSecSuccess { throw APIError.message("无法更新登录凭证") }
        isLoggedIn = true
    }
    func clear() {
        #if DEBUG
        if ProcessInfo.processInfo.environment["INFOHUB_TEST_FAKE_CREDENTIALS"] == "1" {
            UserDefaults.standard.removeObject(forKey: "fixture.authToken")
            isLoggedIn = false
            return
        }
        #endif
        SecItemDelete(Self.query as CFDictionary)
        isLoggedIn = token != nil
    }
    func clear(ifMatching expected: String) {
        guard token == expected else { return }
        clear()
    }
}

struct API {
    let baseURL: URL
    let session: URLSession
    init(baseURL: URL? = nil, session: URLSession = .shared) {
        self.baseURL = baseURL ?? URL(string: Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String ?? "https://zchengb.top/api")!
        self.session = session
    }
    func request(_ path: String, body: JSON? = nil, query: [URLQueryItem] = [], requiredToken: String? = nil) async throws -> JSON {
        #if DEBUG
        // Explicit subscription UI fixtures intercept every request, including writes and cloud sync.
        if let scenario = ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_RSS"],
           ["success", "subscribe-error", "load-error", "empty", "feed"].contains(scenario) {
            return try await RSSUITestAPI.shared.request(path, scenario: scenario)
        }
        if ProcessInfo.processInfo.environment["INFOHUB_TEST_FAKE_CREDENTIALS"] == "1", baseURL.host?.hasSuffix(".invalid") != true {
            throw APIError.message("测试请求必须使用隔离服务")
        }
        #endif
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        var request = URLRequest(url: components.url!, timeoutInterval: 30)
        request.httpMethod = body == nil ? "GET" : "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let token = await Credential.shared.token
        if let requiredToken, token != requiredToken { throw CancellationError() }
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body { request.httpBody = try JSONEncoder().encode(body) }
        let (data, response) = try await session.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw APIError.message("服务器响应无效") }
        if response.statusCode == 401 {
            if let token, !["user/sign-in", "sign-in-verification-code/email"].contains(path) {
                await Credential.shared.clear(ifMatching: token)
            }
            throw APIError.message("登录已过期，请重新登录")
        }
        guard (200..<300).contains(response.statusCode) else {
            let message = (try? JSONDecoder().decode(JSON.self, from: data))?["message"].text
            throw APIError.message(message?.nilIfEmpty ?? "请求失败（\(response.statusCode)），请稍后重试")
        }
        return data.isEmpty ? .null : try JSONDecoder().decode(JSON.self, from: data)
    }
}

#if DEBUG
private actor RSSUITestAPI {
    static let shared = RSSUITestAPI()
    private var resourceAttempts = 0
    private var recommendationAttempts = 0
    func request(_ path: String, scenario: String) async throws -> JSON {
        let response: String
        switch path {
        case "rss-recommendations":
            recommendationAttempts += 1
            if scenario == "load-error", recommendationAttempts == 1 { throw APIError.message("测试推荐加载失败") }
            response = scenario == "empty" ? "[]" : #"[{"id":"fixture-one","title":"测试来源一","rssUrl":"https://example.org/one.xml","description":"独立推荐列表，点击即可订阅","iconUrl":""},{"id":"fixture-two","title":"测试来源二","rssUrl":"https://example.org/two.xml","description":"无需填写 RSS 创建表单","iconUrl":""}]"#
        case "rss-resource":
            resourceAttempts += 1
            let shouldFail = scenario == "subscribe-error" && resourceAttempts == 1
            try await Task.sleep(for: .milliseconds(500))
            if shouldFail { throw APIError.message("测试订阅失败，请重试") }
            response = #"{"description":"Fixture RSS metadata","iconUrl":""}"#
        case "rss-resource/title": response = #""自定义测试来源""#
        case "news-channels/default": response = #"[{"channelCode":"sina","title":"微博","isAppEnabled":true,"enable":true}]"#
        case "rss-news":
            response = scenario == "feed" ? #"[{"rssUrl":"https://example.org/a.xml","originLink":"https://example.org/","items":[{"title":"第一篇测试新闻，较长的标题也应该完整展示","link":"https://example.org/article-1","description":"<p>这是一段用于卡片视图的测试摘要。</p>","publishDate":"2026-10-29T10:00:00Z"},{"title":"第二篇测试新闻","link":"https://example.org/article-2","publishDate":"2026-10-29T09:00:00Z"}]},{"rssUrl":"https://example.org/b.xml","items":[{"title":"另一个频道的测试新闻","link":"https://example.org/article-3","publishDate":"2026-10-29T08:00:00Z"}]}]"# : "[]"
        case "user/sign-in" where ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_LOGIN_STATE"] == "1":
            response = #"{"accessToken":"fixture-token"}"#
        case "user/me" where ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_LOGIN_STATE"] == "1":
            response = #"{"name":"预览用户","email":"preview@example.invalid","avatar":""}"#
        case "normal-news", "news/github", "news/artificial-analysis", "app/versions": response = "{}"
        default: throw APIError.message("订阅测试未配置此请求")
        }
        let run = ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_RSS_RUN"] ?? "default"
        let isolated = response.replacingOccurrences(of: "https://example.org/", with: "https://example.org/\(run)/")
            .replacingOccurrences(of: "fixture-feed-", with: "fixture-\(run)-feed-")
        return try JSONDecoder().decode(JSON.self, from: Data(isolated.utf8))
    }
}
#endif
