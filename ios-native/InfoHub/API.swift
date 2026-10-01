import Foundation
import Security

enum APIError: LocalizedError {
    case message(String)
    var errorDescription: String? { switch self { case .message(let message): return message } }
}

enum Credential {
    private static let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "cn.zchengb.infohub.native", kSecAttrAccount as String: "accessToken"]
    static var token: String? {
        var q = query
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func save(_ token: String) throws {
        let data = Data(token.utf8)
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var q = query
            q[kSecValueData as String] = data
            q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw APIError.message("无法安全保存登录凭证") }
        } else if status != errSecSuccess { throw APIError.message("无法更新登录凭证") }
    }
    static func clear() { SecItemDelete(query as CFDictionary) }
}

struct API {
    let baseURL: URL
    init() { baseURL = URL(string: Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String ?? "https://zchengb.top/api")! }
    func request(_ path: String, body: JSON? = nil, query: [URLQueryItem] = []) async throws -> JSON {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        var request = URLRequest(url: components.url!, timeoutInterval: 30)
        request.httpMethod = body == nil ? "GET" : "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = Credential.token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body { request.httpBody = try JSONEncoder().encode(body) }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw APIError.message("服务器响应无效") }
        if response.statusCode == 401 {
            Credential.clear()
            throw APIError.message("登录已过期，请重新登录")
        }
        guard (200..<300).contains(response.statusCode) else {
            let message = (try? JSONDecoder().decode(JSON.self, from: data))?["message"].text
            throw APIError.message(message?.nilIfEmpty ?? "请求失败（\(response.statusCode)），请稍后重试")
        }
        return data.isEmpty ? .null : try JSONDecoder().decode(JSON.self, from: data)
    }
}
