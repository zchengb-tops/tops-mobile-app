import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @State private var login = false
    @State private var confirmRestore = false
    @State private var syncing = false
    var body: some View {
        @Bindable var store = store
        Form {
            Section {
                HStack(spacing: 16) {
                    Image(systemName: "person.crop.circle.fill").font(.system(size: 48)).foregroundStyle(.orange.gradient)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(store.loggedIn ? store.email : "你的阅读空间").font(.headline)
                        Text("在不同设备间，接着探索。").font(.subheadline).foregroundStyle(.secondary)
                    }
                }.padding(.vertical, 16)
                if !store.loggedIn { Button("使用邮箱登录") { login = true } }
            }
            Section("阅读体验") {
                Picker("外观", selection: $store.appearance) {
                    Text("跟随系统").tag("system"); Text("浅色").tag("light"); Text("深色").tag("dark")
                }
                Picker("阅读字号", selection: $store.readingSize) {
                    Text("跟随系统").tag("system"); Text("小").tag("small"); Text("大").tag("large")
                }
            }
            Section {
                Toggle("自动上传订阅改动", isOn: $store.syncEnabled).disabled(!store.loggedIn)
                Button("上传本机订阅到云端") { Task { syncing = true; await store.sync(download: false); syncing = false } }
                    .disabled(!store.loggedIn || syncing)
                Button("从云端恢复订阅") { confirmRestore = true }.disabled(!store.loggedIn || syncing)
                if syncing { ProgressView("正在同步") }
                LabeledContent("最近同步", value: store.lastSync).font(.caption)
            } header: { Text("订阅同步") } footer: { Text("从旧版迁移时，请先在旧版上传订阅，再在此登录同一账号并恢复。恢复将替换本机订阅配置。") }
            Section("关于 InfoHub") {
                LabeledContent("版本", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—")
                Button("检查更新") {
                    Task { await store.checkUpdate() }
                }
                Link("官方网站", destination: URL(string: "https://infohub.net.cn/")!)
                Link("意见反馈", destination: URL(string: "https://jsj.top/f/T4STLU")!)
                NavigationLink("用户服务协议") { LegalView(kind: "terms") }
                NavigationLink("隐私政策") { LegalView(kind: "privacy") }
            }
            if store.loggedIn { Section { Button("退出登录", role: .destructive) { store.signOut() } } }
        }.navigationTitle("我的")
            .sheet(isPresented: $login) { LoginView() }
            .confirmationDialog("用云端订阅替换本机配置？", isPresented: $confirmRestore, titleVisibility: .visible) {
                Button("恢复订阅", role: .destructive) { Task { syncing = true; await store.sync(download: true); syncing = false } }
            }
    }
}

struct LoginView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var code = ""
    @State private var agreed = false
    @State private var busy = false
    @State private var sentAt: Date?
    @State private var error: String?
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Image(systemName: "square.stack.3d.up.fill").font(.system(size: 54)).foregroundStyle(.orange.gradient).frame(maxWidth: .infinity).padding(28)
                    Text("让阅读与你同步").font(.title2.bold())
                    Text("无需密码，使用邮箱验证码登录。").foregroundStyle(.secondary)
                }.listRowBackground(Color.clear)
                Section {
                    TextField("邮箱地址", text: $email).keyboardType(.emailAddress).textContentType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    TextField("验证码", text: $code).keyboardType(.numberPad).textContentType(.oneTimeCode)
                    TimelineView(.periodic(from: .now, by: 1)) { timeline in
                        let remaining = max(0, 60 - Int(timeline.date.timeIntervalSince(sentAt ?? .distantPast)))
                        Button(remaining > 0 ? "\(remaining) 秒后重发" : "发送验证码") {
                            Task {
                                busy = true; defer { busy = false }
                                do {
                                    _ = try await store.api.request("sign-in-verification-code/email", body: .object(["email": .string(email.trimmingCharacters(in: .whitespaces))]))
                                    sentAt = .now
                                } catch { self.error = error.localizedDescription }
                            }
                        }.disabled(!agreed || !email.contains("@") || busy || remaining > 0)
                    }
                }
                Section {
                    Toggle("我已阅读并同意服务协议和隐私政策", isOn: $agreed)
                    NavigationLink("服务协议") { LegalView(kind: "terms") }
                    NavigationLink("隐私政策") { LegalView(kind: "privacy") }
                }
                if let error { Text(error).foregroundStyle(.red) }
                if busy { ProgressView() }
                Button("登录") {
                    Task {
                        busy = true; defer { busy = false }
                        do { try await store.signIn(email: email.trimmingCharacters(in: .whitespaces), code: code); dismiss() }
                        catch { self.error = error.localizedDescription }
                    }
                }.disabled(!agreed || code.isEmpty || !email.contains("@") || busy)
            }.navigationTitle("登录").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("关闭") { dismiss() } } }
        }
    }
}

struct LegalView: View {
    let kind: String
    var body: some View {
        ScrollView {
            Text(Bundle.main.url(forResource: kind, withExtension: "txt").flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? "文档加载失败，请通过官方网站查看。")
                .frame(maxWidth: .infinity, alignment: .leading).padding(24).textSelection(.enabled)
        }.navigationTitle(kind == "terms" ? "服务协议" : "隐私政策").navigationBarTitleDisplayMode(.inline)
    }
}
