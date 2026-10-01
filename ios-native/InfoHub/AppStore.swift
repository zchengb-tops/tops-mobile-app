import SwiftUI

@MainActor @Observable final class AppStore {
    var channels: [Channel] = []
    var news: JSON = .object([:])
    var rss: JSON = .object([:])
    var loading = false
    var error: String?
    var message: String?
    var update: JSON?
    var email = UserDefaults.standard.string(forKey: "native.email") ?? ""
    var loggedIn: Bool { Credential.token != nil }
    var selectedChannel = UserDefaults.standard.string(forKey: "native.selectedChannel") ?? "sina" {
        didSet { UserDefaults.standard.set(selectedChannel, forKey: "native.selectedChannel") }
    }
    var appearance = UserDefaults.standard.string(forKey: "native.appearance") ?? "system" {
        didSet { UserDefaults.standard.set(appearance, forKey: "native.appearance") }
    }
    var readingSize = UserDefaults.standard.string(forKey: "native.readingSize") ?? "system" {
        didSet { UserDefaults.standard.set(readingSize, forKey: "native.readingSize") }
    }
    var syncEnabled = UserDefaults.standard.bool(forKey: "native.syncEnabled") {
        didSet { UserDefaults.standard.set(syncEnabled, forKey: "native.syncEnabled") }
    }
    var lastSync = UserDefaults.standard.string(forKey: "native.lastSync") ?? "尚未同步"
    let api = API()
    private let cacheURL = URL.applicationSupportDirectory.appendingPathComponent("InfoHub/news.json")
    private var syncTask: Task<Void, Never>?
    var enabledChannels: [Channel] { channels.filter { $0.enabled && $0.supported } }
    var current: Channel? { enabledChannels.first { $0.id == selectedChannel } ?? enabledChannels.first }
    var colorScheme: ColorScheme? { appearance == "system" ? nil : appearance == "dark" ? .dark : .light }

    init() {
        if let data = UserDefaults.standard.data(forKey: "native.channels"), let raw = try? JSONDecoder().decode([JSON].self, from: data) { channels = raw.map(Channel.init) }
        if let data = try? Data(contentsOf: cacheURL), let cached = try? JSONDecoder().decode(JSON.self, from: data) {
            news = cached["news"]; rss = cached["rss"]
        }
    }
    func start() async {
        do {
            let defaults = try await api.request("news-channels/default").array
                .filter { $0["isAppEnabled"].flag }.map(Channel.init)
            for channel in defaults where !channels.contains(where: { $0.code == channel.code }) { channels.append(channel) }
            persistChannels()
        } catch { self.error = error.localizedDescription }
        await refresh()
        await checkUpdate(silent: true)
    }
    func refresh() async {
        guard !loading else { return }
        loading = true
        defer { loading = false }
        do {
            news = try await api.request("normal-news")
            await refreshRSS()
            try FileManager.default.createDirectory(at: cacheURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            try JSONEncoder().encode(JSON.object(["news": news, "rss": rss])).write(to: cacheURL, options: .atomic)
        } catch { self.error = error.localizedDescription }
    }
    func refreshRSS() async {
        let urls = enabledChannels.filter(\.isRSS).map { JSON.string($0.rssURL) }
        guard !urls.isEmpty else { return }
        do {
            let result = try await api.request("rss-news", body: .object(["rssUrls": .array(urls)]))
            for feed in result.array { rss[feed["rssUrl"].text] = feed }
        } catch { self.error = error.localizedDescription }
    }
    func items(for channel: Channel) -> [NewsItem] {
        let rows = channel.isRSS ? rss[channel.rssURL]["items"].array : news[channel.code].array
        return rows.enumerated().map { NewsItem(raw: $0.element, index: $0.offset) }
    }
    func persistChannels() {
        if let data = try? JSONEncoder().encode(channels.map(\.raw)) { UserDefaults.standard.set(data, forKey: "native.channels") }
        if !enabledChannels.contains(where: { $0.id == selectedChannel }), let first = enabledChannels.first { selectedChannel = first.id }
    }
    func channelsChanged() {
        persistChannels()
        Task { await refreshRSS() }
        if syncEnabled && loggedIn {
            syncTask?.cancel()
            syncTask = Task {
                do { try await Task.sleep(for: .seconds(1)) } catch { return }
                await sync(download: false, automatic: true)
            }
        }
    }
    func saveRSS(name: String, url: String, editing: Channel?, recommendation: JSON?) async throws {
        guard let parsed = webURL(url), !name.trimmingCharacters(in: .whitespaces).isEmpty else { throw APIError.message("请输入名称和有效的 HTTP / HTTPS 订阅地址") }
        guard !channels.contains(where: { $0.isRSS && $0.rssURL == parsed.absoluteString && $0.id != editing?.id }) else { throw APIError.message("已订阅此 RSS") }
        var body = JSON.object(["rssUrl": .string(parsed.absoluteString)])
        if let recommendation, recommendation["id"] != .null { body["recommendationId"] = recommendation["id"] }
        let resource = try await api.request("rss-resource", body: body)
        var channel = editing ?? Channel(.object(["id": .string(UUID().uuidString), "isRss": .bool(true), "enable": .bool(true)]))
        channel.raw["title"] = .string(name); channel.raw["tabTitle"] = .string(name)
        channel.raw["rssUrl"] = .string(parsed.absoluteString)
        channel.raw["desc"] = resource["description"]; channel.raw["iconUrl"] = resource["iconUrl"]
        if let index = channels.firstIndex(where: { $0.id == channel.id }) { channels[index] = channel } else { channels.append(channel) }
        channelsChanged()
    }
    func signIn(email: String, code: String) async throws {
        let response = try await api.request("user/sign-in", body: .object(["email": .string(email), "verificationCode": .string(code)]))
        guard let token = response["accessToken"].text.nilIfEmpty else { throw APIError.message("服务器未返回登录凭证") }
        try Credential.save(token)
        self.email = email
        UserDefaults.standard.set(email, forKey: "native.email")
    }
    func signOut() {
        syncTask?.cancel()
        Credential.clear(); email = ""; syncEnabled = false
        UserDefaults.standard.removeObject(forKey: "native.email")
        UserDefaults.standard.removeObject(forKey: "native.syncVersion")
    }
    func sync(download: Bool, automatic: Bool = false) async {
        do {
            if automatic {
                let remote = try await api.request("user/news-channel-config/version")["version"].text
                let local = UserDefaults.standard.string(forKey: "native.syncVersion") ?? ""
                guard remote == local else {
                    syncEnabled = false
                    throw APIError.message("云端订阅已在其他设备更新。自动同步已暂停，请在「我的」选择恢复云端配置或上传本机配置。")
                }
            }
            if download {
                let result = try await api.request("user/news-channel-config")
                guard let content = result["content"].text.data(using: .utf8), !content.isEmpty else { throw APIError.message("云端还没有订阅配置，请先上传") }
                let restored = try JSONDecoder().decode([JSON].self, from: content).map(Channel.init)
                guard restored.allSatisfy({ !$0.id.isEmpty && !$0.title.isEmpty }), Set(restored.map(\.id)).count == restored.count else {
                    throw APIError.message("云端订阅格式无效，本机配置未更改")
                }
                channels = restored
                UserDefaults.standard.set(result["version"].text, forKey: "native.syncVersion")
                persistChannels()
                await refreshRSS()
            } else {
                let content = String(decoding: try JSONEncoder().encode(channels.map(\.raw)), as: UTF8.self)
                let result = try await api.request("user/news-channel-config", body: .object(["content": .string(content)]))
                UserDefaults.standard.set(result["newVersion"].text, forKey: "native.syncVersion")
            }
            lastSync = Date.now.formatted(date: .abbreviated, time: .shortened)
            UserDefaults.standard.set(lastSync, forKey: "native.lastSync")
            if !automatic { message = "订阅配置已同步" }
        } catch { self.error = error.localizedDescription }
    }
    func checkUpdate(silent: Bool = false) async {
        do {
            let result = try await api.request("app/versions")["versions"]["ios"]
            let current = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
            let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0"
            guard !result["latestVersion"].text.isEmpty else { throw APIError.message("暂无 iOS 版本信息") }
            if result["latestVersion"].text.compare(current, options: .numeric) == .orderedDescending || (result["latestVersion"].text == current && result["latestVersionCode"].number > (Double(build) ?? 0)) { update = result }
            else if !silent { message = "已是最新版本" }
        } catch { if !silent { self.error = error.localizedDescription } }
    }
}
