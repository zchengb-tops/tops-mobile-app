import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .body) private var avatarSize: CGFloat = 44
    @ScaledMetric(relativeTo: .body) private var actionSymbolSize: CGFloat = 20
    @State private var login = false
    @State private var confirmLogin = false
    @State private var syncPresented = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 36) {
                HStack {
                    Text("我的").font(.largeTitle.bold()).tracking(-1).accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 16)
                    Image("InfoHubLogo").resizable().scaledToFit().frame(width: 32, height: 32).accessibilityHidden(true)
                }
                account
                SettingsSection("阅读") {
                    if typeSize >= .xxLarge {
                        VStack(spacing: 10) { readingControls(compact: false) }
                    } else {
                        ViewThatFits(in: .horizontal) {
                            HStack(alignment: .top, spacing: 10) { readingControls(compact: true) }
                            VStack(spacing: 10) { readingControls(compact: false) }
                        }
                    }
                }
                SettingsSection("更多") {
                    VStack(spacing: 4) {
                        Button {
                            if store.loggedIn { syncPresented = true } else { confirmLogin = true }
                        } label: {
                            secondaryAction("订阅同步", symbol: "arrow.triangle.2.circlepath",
                                            value: store.loggedIn ? (store.syncEnabled ? "自动同步" : "手动同步") : "未登录")
                        }.accessibilityIdentifier("settings-sync")
                        Link(destination: URL(string: "https://jsj.top/f/T4STLU")!) {
                            secondaryAction("意见反馈", symbol: "bubble.left", accessory: "arrow.up.right")
                        }.accessibilityIdentifier("settings-feedback")
                        Link(destination: URL(string: "https://infohub.net.cn/")!) {
                            secondaryAction("访问官网", symbol: "globe", accessory: "arrow.up.right")
                        }.accessibilityIdentifier("settings-website")
                        NavigationLink { LegalView(kind: "terms") } label: {
                            secondaryAction("服务协议", symbol: "doc.text")
                        }.accessibilityIdentifier("settings-terms")
                        NavigationLink { LegalView(kind: "privacy") } label: {
                            secondaryAction("隐私政策", symbol: "hand.raised")
                        }.accessibilityIdentifier("settings-privacy")
                        Button {
                            if let update = store.availableUpdate { store.update = update }
                            else { Task { await store.checkUpdate() } }
                        } label: {
                            secondaryAction("版本", symbol: "square.stack.3d.up",
                                        value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—",
                                        accessory: nil, badge: store.availableUpdate == nil ? nil : "新版本")
                        }.accessibilityIdentifier("settings-version").accessibilityHint("检查或查看版本更新")
                    }
                }
            }.buttonStyle(.plain).frame(maxWidth: 600).padding(.horizontal, 24)
                .frame(maxWidth: .infinity).padding(.top, 28).padding(.bottom, 24)
        }.avoidsAppFooter().accessibilityIdentifier("settings-scroll")
            .ignoresSafeArea(.container, edges: .bottom)
            .background(Color(uiColor: .systemBackground).ignoresSafeArea())
            .navigationTitle("我的").toolbar(.hidden, for: .navigationBar)
            .navigationDestination(isPresented: $syncPresented) { SubscriptionSyncView() }
            .sheet(isPresented: $login) { LoginView().environment(\.appFooterHeight, 0) }
            .alert("请先登录", isPresented: $confirmLogin) {
                Button("取消", role: .cancel) {}
                Button("去登录") { login = true }
            } message: {
                Text("登录后即可管理云端订阅，同时在不同设备间保持同步")
            }
    }
    @ViewBuilder private var account: some View {
        if store.loggedIn {
            VStack(alignment: .leading, spacing: 8) {
                accountLabel
                Button("退出登录", role: .destructive) { store.signOut() }
                    .font(.subheadline).frame(minHeight: 44)
            }
        } else {
            Button { login = true } label: {
                HStack(spacing: 12) {
                    accountLabel
                    chevron
                }.contentShape(Rectangle())
            }.accessibilityLabel("使用邮箱登录").accessibilityHint("在不同设备间同步订阅")
        }
    }
    private var accountLabel: some View {
        HStack(spacing: 14) {
            Image(systemName: "person.fill").font(.body).foregroundStyle(.white)
                .frame(width: min(avatarSize, 80), height: min(avatarSize, 80))
                .background(Color.infoHubSelection, in: Circle()).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 6) {
                Text(store.loggedIn ? store.email : "使用邮箱登录").font(.title3.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
                Text(store.loggedIn ? "已登录" : "在不同设备间同步订阅").font(.footnote).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }.padding(.vertical, 8)
    }
    private var chevron: some View {
        Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.secondary).accessibilityHidden(true)
    }
    private func secondaryAction(_ title: String, symbol: String, value: String? = nil,
                                 accessory: String? = "chevron.right", badge: String? = nil) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).font(.body).foregroundStyle(.secondary)
                .frame(width: actionSymbolSize, height: actionSymbolSize).padding(8)
                .background(Color(uiColor: .secondarySystemBackground), in: Circle()).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.subheadline.weight(.medium)).fixedSize(horizontal: false, vertical: true)
                if typeSize.isAccessibilitySize, let value { Text(value).font(.footnote).foregroundStyle(.secondary) }
                if typeSize.isAccessibilitySize, let badge { actionBadge(badge) }
            }
            Spacer(minLength: 8)
            if !typeSize.isAccessibilitySize, let value { Text(value).font(.footnote).foregroundStyle(.secondary) }
            if !typeSize.isAccessibilitySize, let badge { actionBadge(badge) }
            if let accessory {
                Image(systemName: accessory).font(.caption.weight(.semibold)).foregroundStyle(.secondary).accessibilityHidden(true)
            }
        }.padding(.vertical, 6).frame(minHeight: 56).contentShape(Rectangle())
    }
    private func actionBadge(_ title: String) -> some View {
        Text(title).font(.caption2.weight(.semibold)).foregroundStyle(.primary)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
    }
    @ViewBuilder private func readingControls(compact: Bool) -> some View {
        @Bindable var store = store
        ReadingPreference("外观", symbol: "circle.lefthalf.filled",
                          value: store.appearance == "system" ? "跟随系统" : store.appearance == "dark" ? "深色" : "浅色",
                          selection: $store.appearance, compact: compact) {
            Text("跟随系统").tag("system"); Text("浅色").tag("light"); Text("深色").tag("dark")
        }.accessibilityIdentifier("appearance-picker")
        ReadingPreference("阅读字号", symbol: "textformat.size",
                          value: store.readingSize == "system" ? "跟随系统" : store.readingSize == "large" ? "大" : "小",
                          selection: $store.readingSize, compact: compact) {
            Text("跟随系统").tag("system"); Text("小").tag("small"); Text("大").tag("large")
        }.accessibilityIdentifier("reading-size-picker")
        ReadingPreference("列表间距", symbol: "rectangle.compress.vertical", value: store.feedDensity.title,
                          selection: $store.feedDensity, compact: compact) {
            ForEach(FeedDensity.allCases) { Text($0.title).tag($0) }
        }.accessibilityIdentifier("density-picker")
            .accessibilityHint("手动设置列表间距；在资讯页双指合拢可查看所有频道。")
    }
}

private struct ReadingPreference<Selection: Hashable, Options: View>: View {
    let title: String
    let symbol: String
    let value: String
    @Binding var selection: Selection
    let compact: Bool
    @ScaledMetric(relativeTo: .title3) private var symbolSize: CGFloat = 26
    @ViewBuilder let options: Options
    init(_ title: String, symbol: String, value: String, selection: Binding<Selection>, compact: Bool,
         @ViewBuilder options: () -> Options) {
        self.title = title; self.symbol = symbol; self.value = value
        _selection = selection; self.compact = compact; self.options = options()
    }
    var body: some View {
        Menu {
            Picker(title, selection: $selection) { options }
        } label: {
            Group {
                if compact {
                    VStack(alignment: .leading, spacing: 16) {
                        preferenceIcon
                        preferenceLabel
                    }
                } else {
                    HStack(spacing: 14) {
                        preferenceIcon
                        preferenceLabel
                    }
                }
            }.padding(16).frame(minWidth: compact ? 108 : 0, maxWidth: .infinity, alignment: .leading)
                .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20))
                .contentShape(RoundedRectangle(cornerRadius: 20))
        }.accessibilityLabel(title).accessibilityValue(value)
    }
    private var preferenceIcon: some View {
        Image(systemName: symbol).font(.title3).foregroundStyle(.secondary)
            .frame(width: symbolSize, height: symbolSize).accessibilityHidden(true)
    }
    private var preferenceLabel: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 4) {
                Text(value).font(.subheadline.weight(.semibold)).fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                Image(systemName: "chevron.down").font(.caption2.weight(.semibold)).foregroundStyle(.secondary).accessibilityHidden(true)
            }
        }
    }
}

private struct SubscriptionSyncView: View {
    @Environment(AppStore.self) private var store
    @State private var login = false
    @State private var confirmRestore = false
    @State private var syncing = false
    var body: some View {
        @Bindable var store = store
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                if !store.loggedIn {
                    Button("使用邮箱登录") { login = true }
                        .font(.body.weight(.semibold)).frame(minHeight: 44)
                    Text("登录后可上传和恢复订阅。").font(.subheadline).foregroundStyle(.secondary)
                }
                SettingsSection("同步设置") {
                    Toggle(isOn: $store.syncEnabled) { SettingsLabel("自动上传订阅改动", symbol: "arrow.triangle.2.circlepath") }
                        .disabled(!store.loggedIn || syncing).frame(minHeight: 52).accessibilityIdentifier("sync-auto-upload")
                    Divider()
                    Button { Task { syncing = true; await store.sync(download: false); syncing = false } } label: {
                        SettingsAction("上传本机订阅到云端", symbol: "icloud.and.arrow.up")
                    }.disabled(!store.loggedIn || syncing).accessibilityIdentifier("sync-upload")
                    Divider()
                    Button { confirmRestore = true } label: {
                        SettingsAction("从云端恢复订阅", symbol: "icloud.and.arrow.down")
                    }.disabled(!store.loggedIn || syncing).accessibilityIdentifier("sync-restore")
                    if syncing { ProgressView("正在同步").padding(.vertical, 12) }
                }
                LabeledContent("最近同步", value: store.lastSync).font(.footnote).foregroundStyle(.secondary)
                Text("恢复将替换本机订阅。迁移旧版数据时，请先在旧版上传，再使用同一账号恢复。")
                    .font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("sync-help")
            }.buttonStyle(.plain).padding(24)
        }.avoidsAppFooter().ignoresSafeArea(.container, edges: .bottom).accessibilityIdentifier("sync-scroll")
            .background(Color(uiColor: .systemBackground).ignoresSafeArea())
            .navigationTitle("订阅同步").navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
            .sheet(isPresented: $login) { LoginView().environment(\.appFooterHeight, 0) }
            .confirmationDialog("用云端订阅替换本机配置？", isPresented: $confirmRestore, titleVisibility: .visible) {
                Button("恢复订阅", role: .destructive) { Task { syncing = true; await store.sync(download: true); syncing = false } }
            }
    }
}

private struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    init(_ title: String, @ViewBuilder content: () -> Content) {
        self.title = title; self.content = content()
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.footnote.weight(.medium)).foregroundStyle(.secondary).accessibilityAddTraits(.isHeader)
            VStack(spacing: 0) { content }
        }
    }
}

private struct SettingsLabel: View {
    let title: String
    let symbol: String
    @ScaledMetric(relativeTo: .body) private var symbolWidth = 24.0
    init(_ title: String, symbol: String) { self.title = title; self.symbol = symbol }
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).font(.body).foregroundStyle(.secondary).frame(width: symbolWidth).accessibilityHidden(true)
            Text(title).font(.body)
        }
    }
}

private struct SettingsAction: View {
    let title: String
    let symbol: String
    var external = false
    var value: String?
    @Environment(\.dynamicTypeSize) private var typeSize
    init(_ title: String, symbol: String, external: Bool = false, value: String? = nil) {
        self.title = title; self.symbol = symbol; self.external = external; self.value = value
    }
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                SettingsLabel(title, symbol: symbol)
                if typeSize.isAccessibilitySize, let value { Text(value).font(.subheadline).foregroundStyle(.secondary) }
            }
            Spacer(minLength: 12)
            if !typeSize.isAccessibilitySize, let value { Text(value).font(.subheadline).foregroundStyle(.secondary) }
            Image(systemName: external ? "arrow.up.right" : "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
        }.padding(.vertical, typeSize.isAccessibilitySize ? 12 : 0)
            .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading).contentShape(Rectangle())
    }
}

@MainActor @Observable final class EmailLoginFlow {
    enum Step { case email, code }
    enum Operation { case sendCode, signIn }
    var email = ""
    var agreed = false
    var error: String?
    private var digits = ""
    var code: String {
        get { digits }
        set { digits = String(newValue.filter { "0123456789".contains($0) }.prefix(6)) }
    }
    private(set) var step: Step = .email
    private(set) var operation: Operation?
    private(set) var sentEmail: String?
    private(set) var sentAt: Date?
    var busy: Bool { operation != nil }
    var normalizedEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var validEmail: Bool {
        let parts = normalizedEmail.split(separator: "@", omittingEmptySubsequences: false)
        return parts.count == 2 && !parts[0].isEmpty && !parts[1].isEmpty && !normalizedEmail.contains(where: \.isWhitespace)
    }
    func remaining(at date: Date) -> Int {
        guard let sentAt else { return 0 }
        return max(0, Int(ceil(60 - date.timeIntervalSince(sentAt))))
    }
    func canResume(at date: Date) -> Bool {
        sentEmail == normalizedEmail && sentAt.map { date.timeIntervalSince($0) < 300 } == true
    }
    func canContinue(at date: Date) -> Bool {
        validEmail && agreed && !busy && (remaining(at: date) == 0 || canResume(at: date))
    }
    var canSignIn: Bool { step == .code && sentEmail != nil && agreed && code.count == 6 && !busy }
    func backToEmail() {
        guard !busy else { return }
        step = .email; code = ""; error = nil
    }
    @discardableResult func sendCode(at date: Date? = nil, using send: (String) async throws -> Void) async -> Bool {
        let now = date ?? .now
        guard agreed && !busy else { return false }
        if step == .email && canResume(at: now) {
            error = nil; step = .code
            return true
        }
        guard remaining(at: now) == 0 else { return false }
        let address = step == .code ? sentEmail : (validEmail ? normalizedEmail : nil)
        guard let address else { return false }
        operation = .sendCode; error = nil
        defer { operation = nil }
        do {
            try await send(address)
            sentEmail = address; sentAt = date ?? .now; code = ""; step = .code
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func signIn(using authenticate: (String, String) async throws -> Void) async -> Bool {
        guard canSignIn, let sentEmail else { return false }
        operation = .signIn; error = nil
        defer { operation = nil }
        do { try await authenticate(sentEmail, code); return true }
        catch { self.error = error.localizedDescription; return false }
    }
}

struct LoginView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title) private var titleLogoSize: CGFloat = 40
    @State private var flow = EmailLoginFlow()
    @FocusState private var emailFocused: Bool
    @State private var codeFocused = false
    var body: some View {
        @Bindable var flow = flow
        NavigationStack {
            ZStack {
                LoginBrandBackdrop().ignoresSafeArea().ignoresSafeArea(.keyboard)
                GeometryReader { viewport in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            HStack(spacing: 12) {
                                if flow.step == .email {
                                    Image("InfoHubLogo").resizable().scaledToFit()
                                        .frame(width: min(titleLogoSize, 64), height: min(titleLogoSize, 64))
                                        .accessibilityHidden(true)
                                }
                                Text(flow.step == .email ? "登录 InfoHub" : "输入验证码")
                                    .font(typeSize.isAccessibilitySize ? .title2.weight(.semibold) : .title.weight(.semibold)).tracking(-0.7)
                                    .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                            }
                            if flow.step == .email {
                                inputSurface(active: emailFocused) {
                                    TextField("邮箱地址", text: $flow.email, prompt: Text("邮箱地址").foregroundStyle(Color(uiColor: .secondaryLabel)))
                                        .keyboardType(.emailAddress).textContentType(.emailAddress)
                                        .textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.go)
                                        .focused($emailFocused)
                                        .onSubmit { if flow.canContinue(at: .now) { sendCode() } }
                                        .accessibilityIdentifier("login-email")
                                }.disabled(flow.busy)
                                consent.disabled(flow.busy)
                                errorMessage
                                TimelineView(.periodic(from: .now, by: 1)) { timeline in
                                    let remaining = flow.remaining(at: timeline.date)
                                    let resume = flow.canResume(at: timeline.date)
                                    primaryButton(resume ? "输入验证码" : remaining > 0 ? "\(remaining) 秒后重发" : "发送验证码",
                                                  enabled: flow.canContinue(at: timeline.date), loading: flow.operation == .sendCode,
                                                  identifier: "login-send-code", action: sendCode)
                                }
                            } else {
                                Text("已发送至 \(flow.sentEmail ?? "")")
                                    .font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                                    .accessibilityIdentifier("login-code-destination")
                                VerificationCodeInput(code: $flow.code, isFocused: $codeFocused).disabled(flow.busy)
                                errorMessage
                                primaryButton("登录", enabled: flow.canSignIn, loading: flow.operation == .signIn,
                                              identifier: "login-submit", action: signIn)
                                resendCodeButton.frame(maxWidth: .infinity)
                            }
                        }.padding(.horizontal, 24)
                            // Leave more breathing room on a tall sheet, but yield space to the keyboard.
                            .padding(.top, typeSize.isAccessibilitySize ? 20 : min(96, max(32, viewport.size.height * 0.11)))
                            .padding(.bottom, typeSize.isAccessibilitySize ? 164 : 400)
                            .frame(maxWidth: 520, alignment: .leading).frame(maxWidth: .infinity)
                    }.scrollDismissesKeyboard(.immediately)
                        .simultaneousGesture(DragGesture(minimumDistance: 12).onChanged { drag in
                            guard emailFocused || codeFocused,
                                  abs(drag.translation.height) > abs(drag.translation.width) else { return }
                            // Keep SwiftUI and native focus in sync when dragging to dismiss.
                            finishEditing()
                        })
                        .accessibilityIdentifier("login-scroll")
                }
            }
                .navigationTitle("").navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(.hidden, for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        if flow.step == .code {
                            Button { finishEditing(); flow.backToEmail() } label: { Image(systemName: "chevron.left").font(.body.weight(.medium)) }
                                .disabled(flow.busy).accessibilityLabel("更换邮箱").accessibilityIdentifier("login-back-email")
                        } else { closeButton }
                    }
                    if flow.step == .code {
                        ToolbarItem(placement: .topBarTrailing) { closeButton }
                    }
                }
                .buttonStyle(.plain)
        }
    }
    private var closeButton: some View {
        Button { finishEditing(); dismiss() } label: { Image(systemName: "xmark").font(.body.weight(.medium)) }
            .accessibilityLabel("关闭").accessibilityIdentifier("login-close")
    }
    @ViewBuilder private var errorMessage: some View {
        if let error = flow.error {
            Label(error, systemImage: "exclamationmark.circle").font(.footnote).foregroundStyle(.red)
                .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("login-error")
        }
    }
    private func primaryButton(_ title: String, enabled: Bool, loading: Bool, identifier: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if loading { ProgressView().tint(.white) }
                Text(title).font(.body.weight(.semibold))
            }.padding(.vertical, 14).frame(maxWidth: .infinity, minHeight: 54)
                .foregroundStyle(enabled || loading ? Color.white : Color.secondary)
                .background(enabled || loading ? Color.infoHubSelection : Color(uiColor: .tertiarySystemFill), in: .rect(cornerRadius: 16))
        }.disabled(!enabled).accessibilityIdentifier(identifier)
    }
    private func inputSurface<Content: View>(active: Bool, @ViewBuilder content: () -> Content) -> some View {
        content().font(.body).padding(.horizontal, 16).padding(.vertical, 16).frame(minHeight: 56)
            .background(Color(uiColor: .secondarySystemBackground), in: .rect(cornerRadius: 14))
            .overlay { RoundedRectangle(cornerRadius: 14).stroke(active ? Color.primary.opacity(0.35) : .clear, lineWidth: 1) }
    }
    private var resendCodeButton: some View {
        TimelineView(.periodic(from: .now, by: 1)) { timeline in
            let remaining = flow.remaining(at: timeline.date)
            Button { sendCode() } label: {
                HStack(spacing: 6) {
                    if flow.operation == .sendCode { ProgressView().controlSize(.small) }
                    Text(remaining > 0 ? "\(remaining) 秒后重发" : "重新发送验证码").font(.subheadline.weight(.semibold))
                }.frame(minHeight: 44)
                    .foregroundStyle(!flow.busy && remaining == 0 ? Color.primary : Color.secondary)
            }.disabled(flow.busy || remaining > 0).accessibilityIdentifier("login-resend-code")
        }
    }
    private var consent: some View {
        HStack(alignment: .top, spacing: 8) {
            Button { flow.agreed.toggle() } label: {
                Image(systemName: flow.agreed ? "checkmark.circle.fill" : "circle")
                    .font(.title3).foregroundStyle(flow.agreed ? Color.primary : Color.secondary)
                    .frame(minWidth: 44, minHeight: 44).contentShape(Rectangle())
            }.accessibilityLabel("我已阅读并同意服务协议和隐私政策")
                .accessibilityValue(flow.agreed ? "已同意" : "未同意").accessibilityAddTraits(flow.agreed ? .isSelected : [])
                .accessibilityIdentifier("login-consent")
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 4) { consentText; legalLinks }.fixedSize(horizontal: true, vertical: false)
                VStack(alignment: .leading, spacing: 0) {
                    consentText.padding(.top, 12)
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 12) { legalLinks }.fixedSize(horizontal: true, vertical: false)
                        VStack(alignment: .leading, spacing: 0) { legalLinks }
                    }
                }
            }.font(.footnote.weight(.medium))
        }
    }
    private var consentText: some View {
        Text("我已阅读并同意").font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("login-consent-explanation")
            .onTapGesture { flow.agreed.toggle() }
    }
    @ViewBuilder private var legalLinks: some View {
        NavigationLink("《服务协议》") { LegalView(kind: "terms") }.frame(minHeight: 44).accessibilityIdentifier("login-terms")
        NavigationLink("《隐私政策》") { LegalView(kind: "privacy") }.frame(minHeight: 44).accessibilityIdentifier("login-privacy")
    }
    private func finishEditing() {
        emailFocused = false; codeFocused = false
        // End editing in both SwiftUI and the native responder chain.
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
    private func sendCode() {
        finishEditing()
        Task {
            if await flow.sendCode(using: deliverCode) { codeFocused = true }
        }
    }
    private func signIn() {
        finishEditing()
        Task {
            if await flow.signIn(using: authenticate) { dismiss() }
        }
    }
    private func deliverCode(to email: String) async throws {
        #if DEBUG
        // Explicit UI-test fixtures never send email or write credentials; absent in release builds.
        if let fixture = ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_LOGIN"], ["success", "send-error", "sign-in-error"].contains(fixture) {
            if fixture == "send-error" { throw APIError.message("验证码发送失败，请重试") }
            return
        }
        #endif
        _ = try await store.api.request("sign-in-verification-code/email", body: .object(["email": .string(email)]))
    }
    private func authenticate(email: String, code: String) async throws {
        #if DEBUG
        if let fixture = ProcessInfo.processInfo.environment["INFOHUB_UI_TEST_LOGIN"], ["success", "send-error", "sign-in-error"].contains(fixture) {
            if fixture == "sign-in-error" { throw APIError.message("验证码不正确，请重试") }
            return
        }
        #endif
        try await store.signIn(email: email, code: code)
    }
}

/// Keep positions when editing a middle digit; a gap must not become a valid code.
struct VerificationCodeDigits {
    private(set) var values = Array(repeating: "", count: 6)
    var code: String { values.joined() }
    init(code: String = "") { setCode(code) }
    mutating func setCode(_ code: String) {
        let digits = Array(code.filter { "0123456789".contains($0) }.prefix(6))
        values = (0..<6).map { $0 < digits.count ? String(digits[$0]) : "" }
    }
    mutating func insert(_ text: String, at index: Int) -> Int {
        let digits = Array(text.filter { "0123456789".contains($0) }.prefix(6))
        guard !digits.isEmpty else { return index }
        // Autofill can arrive in whichever native field currently has focus.
        let start = digits.count == 6 ? 0 : index
        for (offset, digit) in digits.enumerated() where start + offset < 6 {
            values[start + offset] = String(digit)
        }
        return min(start + digits.count, 5)
    }
    mutating func delete(at index: Int) -> Int {
        let empty = values[index].isEmpty
        let target = empty ? max(0, index - 1) : index
        values[target] = ""
        return empty ? target : max(0, target - 1)
    }
}

private struct VerificationCodeInput: UIViewRepresentable {
    @Binding var code: String
    @Binding var isFocused: Bool
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.colorScheme) private var colorScheme
    @ScaledMetric(relativeTo: .title2) private var digitSize: CGFloat = 28
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> VerificationCodeRow {
        let row = VerificationCodeRow()
        context.coordinator.row = row
        for (index, field) in row.fields.enumerated() {
            field.delegate = context.coordinator
            field.onBackspace = { [weak coordinator = context.coordinator] in coordinator?.delete(at: index) }
        }
        return row
    }
    func updateUIView(_ row: VerificationCodeRow, context: Context) {
        let coordinator = context.coordinator
        coordinator.parent = self
        if code != coordinator.lastPublished {
            coordinator.digits.setCode(code)
            coordinator.lastPublished = code
        }
        row.configure(fontSize: digitSize, dark: colorScheme == .dark)
        coordinator.render()
        row.isUserInteractionEnabled = isEnabled
        for field in row.fields { field.isEnabled = isEnabled }
        row.wantsFocus = isFocused && isEnabled
        row.updateFocus()
    }
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: VerificationCodeRow, context: Context) -> CGSize? {
        let width = proposal.width ?? 360
        return CGSize(width: width, height: uiView.arrange(width: width, fontSize: digitSize))
    }
    final class Coordinator: NSObject, UITextFieldDelegate {
        var parent: VerificationCodeInput
        var digits = VerificationCodeDigits()
        var lastPublished = ""
        weak var row: VerificationCodeRow?
        init(_ parent: VerificationCodeInput) { self.parent = parent }
        func render() {
            guard let row else { return }
            for (index, field) in row.fields.enumerated() { field.text = digits.values[index] }
            row.updateBorders()
        }
        private func publish(focus index: Int) {
            lastPublished = digits.code
            parent.code = lastPublished
            render()
            row?.focus(index)
        }
        func delete(at index: Int) { publish(focus: digits.delete(at: index)) }
        func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
            if string.isEmpty { delete(at: textField.tag) }
            else { publish(focus: digits.insert(string, at: textField.tag)) }
            return false
        }
        func textFieldDidBeginEditing(_ textField: UITextField) {
            if !parent.isFocused { parent.isFocused = true }
            textField.selectAll(nil)
            row?.updateBorders()
        }
        func textFieldDidEndEditing(_ textField: UITextField) {
            row?.updateBorders()
            // Moving between digits briefly ends editing in the previous field.
            DispatchQueue.main.async { [weak self] in
                guard let self, let row = self.row, !row.fields.contains(where: \.isFirstResponder) else { return }
                if self.parent.isFocused { self.parent.isFocused = false }
            }
        }
    }
}

private final class VerificationDigitField: UITextField {
    var onBackspace: (() -> Void)?
    override func deleteBackward() { onBackspace?() }
}

private final class VerificationCodeRow: UIView {
    let fields: [VerificationDigitField] = (0..<6).map { index in
        let field = VerificationDigitField()
        field.tag = index
        field.keyboardType = .numberPad
        field.textContentType = .oneTimeCode
        field.textAlignment = .center
        field.autocorrectionType = .no
        field.spellCheckingType = .no
        field.backgroundColor = .secondarySystemBackground
        field.layer.cornerRadius = 12
        field.layer.borderWidth = 1.5
        field.tintColor = .label
        field.accessibilityLabel = "第 \(index + 1) 位验证码"
        field.accessibilityHint = "输入后进入下一位，也可粘贴完整的六位验证码"
        field.accessibilityIdentifier = "login-code-\(index)"
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return field
    }
    private let stack = UIStackView()
    private var fieldHeights: [NSLayoutConstraint] = []
    private var columns = 0
    private var dark = false
    var wantsFocus = false
    init() {
        super.init(frame: .zero)
        stack.axis = .vertical; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([stack.leadingAnchor.constraint(equalTo: leadingAnchor), stack.trailingAnchor.constraint(equalTo: trailingAnchor),
                                     stack.topAnchor.constraint(equalTo: topAnchor), stack.bottomAnchor.constraint(equalTo: bottomAnchor)])
        fieldHeights = fields.map { $0.heightAnchor.constraint(equalToConstant: 64) }
        NSLayoutConstraint.activate(fieldHeights)
        accessibilityIdentifier = "login-code-input"
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    func configure(fontSize: CGFloat, dark: Bool) {
        self.dark = dark
        let font = UIFont.monospacedDigitSystemFont(ofSize: fontSize, weight: .medium)
        for field in fields { field.font = font }
        updateBorders()
    }
    func arrange(width: CGFloat, fontSize: CGFloat) -> CGFloat {
        let minimumWidth = max(44, fontSize * 0.65 + 20)
        let count = width >= minimumWidth * 6 + 50 ? 6 : 3
        let height = max(64, UIFont.monospacedDigitSystemFont(ofSize: fontSize, weight: .medium).lineHeight + 24)
        for constraint in fieldHeights { constraint.constant = height }
        if columns != count {
            let focused = fields.firstIndex(where: \.isFirstResponder)
            for row in stack.arrangedSubviews { stack.removeArrangedSubview(row); row.removeFromSuperview() }
            for start in stride(from: 0, to: 6, by: count) {
                let row = UIStackView(arrangedSubviews: Array(fields[start..<start + count]))
                row.distribution = .fillEqually; row.spacing = 10
                stack.addArrangedSubview(row)
            }
            columns = count
            if let focused { focus(focused) }
        }
        return height * CGFloat(6 / count) + (count == 3 ? 12 : 0)
    }
    func updateBorders() {
        let traits = UITraitCollection(userInterfaceStyle: dark ? .dark : .light)
        for field in fields {
            field.layer.borderColor = (field.isFirstResponder ? UIColor.label.withAlphaComponent(0.4) : UIColor.clear).resolvedColor(with: traits).cgColor
        }
    }
    func focus(_ index: Int) {
        fields[index].becomeFirstResponder()
        fields[index].selectAll(nil)
        updateBorders()
    }
    func updateFocus() {
        guard window != nil else { return }
        if wantsFocus && !fields.contains(where: \.isFirstResponder) {
            focus(fields.firstIndex(where: { $0.text?.isEmpty != false }) ?? 5)
        } else if !wantsFocus {
            fields.first(where: \.isFirstResponder)?.resignFirstResponder()
        }
    }
    override func didMoveToWindow() { super.didMoveToWindow(); updateFocus() }
}

/// The sun and overlapping horizons from assets/images/logo-468.png, opened out
/// into a landscape rather than putting another framed app icon above the form.
private struct LoginBrandBackdrop: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var entered = false
    private var settled: Bool { entered || reduceMotion }
    private var dark: Bool { colorScheme == .dark }
    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let artworkHeight = typeSize.isAccessibilitySize ? 144.0 : min(380.0, proxy.size.height * 0.46)
            ZStack(alignment: .bottom) {
                Color(uiColor: .systemBackground)
                ZStack(alignment: .top) {
                    LinearGradient(colors: [.clear, Color(red: 0.97, green: 0.44, blue: 0).opacity(dark ? 0.08 : 0.045)],
                                   startPoint: .top, endPoint: .bottom).frame(height: artworkHeight)
                    Circle()
                        .fill(Color(red: 0.97, green: 0.44, blue: 0).opacity(dark ? 0.24 : 0.20))
                        .frame(width: width * 0.63, height: width * 0.63)
                        .scaleEffect(x: settled ? 1 : 0.92, y: settled ? 1 : 0.84)
                        .offset(x: width * 0.22, y: settled ? 24 : 60)
                        .opacity(settled ? 1 : 0)
                        .animation(reduceMotion ? nil : .spring(response: 0.66, dampingFraction: 0.60), value: entered)
                    LoginHorizon(front: false)
                        .fill(Color(uiColor: .systemGray5))
                        .frame(height: artworkHeight)
                        .offset(y: settled ? 0 : 18)
                        .opacity(settled ? 1 : 0)
                        .animation(reduceMotion ? nil : .spring(response: 0.70, dampingFraction: 0.76).delay(0.04), value: entered)
                    LoginHorizon(front: true)
                        .fill(Color(uiColor: .systemGray6))
                        .frame(height: artworkHeight)
                        .offset(y: settled ? 0 : 26)
                        .opacity(settled ? 1 : 0)
                        .animation(reduceMotion ? nil : .spring(response: 0.70, dampingFraction: 0.76).delay(0.08), value: entered)
                }.frame(height: artworkHeight, alignment: .top).clipped()
            }
            .clipped()
        }
        .allowsHitTesting(false).accessibilityHidden(true)
        .task {
            guard !entered else { return }
            // Let the native sheet arrive before the decorative spring starts.
            // The form is immediately usable; this delay only affects the backdrop.
            if !reduceMotion { try? await Task.sleep(for: .milliseconds(220)) }
            guard !Task.isCancelled else { return }
            entered = true
        }
    }
}

private struct LoginHorizon: Shape {
    var front: Bool
    func path(in rect: CGRect) -> Path {
        // Preserve the logo's broad crest and smaller right-hand shoulder.
        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: rect.minX + x * rect.width, y: rect.minY + y * rect.height) }
        var path = Path()
        path.move(to: point(0, front ? 0.70 : 0.55))
        if front {
            path.addCurve(to: point(0.38, 0.70), control1: point(0.17, 0.69), control2: point(0.24, 0.54))
            path.addCurve(to: point(0.74, 0.73), control1: point(0.52, 0.88), control2: point(0.61, 0.64))
            path.addCurve(to: point(1, 0.90), control1: point(0.83, 0.76), control2: point(0.92, 0.85))
        } else {
            path.addCurve(to: point(0.53, 0.42), control1: point(0.20, 0.53), control2: point(0.40, 0.17))
            path.addCurve(to: point(0.79, 0.51), control1: point(0.67, 0.64), control2: point(0.68, 0.44))
            path.addCurve(to: point(1, 0.64), control1: point(0.89, 0.55), control2: point(0.94, 0.61))
        }
        path.addLine(to: point(1, 1)); path.addLine(to: point(0, 1)); path.closeSubpath()
        return path
    }
}

struct LegalView: View {
    let kind: String
    @ScaledMetric(relativeTo: .body) private var paragraphSpacing: CGFloat = 16
    @ScaledMetric(relativeTo: .body) private var lineSpacing: CGFloat = 5
    private var paragraphs: [String] {
        Self.paragraphs(in: Bundle.main.url(forResource: kind, withExtension: "txt")
            .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? "文档加载失败，请通过官方网站查看。")
    }
    static func paragraphs(in text: String) -> [String] {
        text.components(separatedBy: "\n\n").filter { !$0.isEmpty }
    }
    static func isSectionHeading(_ text: String) -> Bool {
        !text.contains("\n") && text.range(of: #"^\d+\.\s+\S"#, options: .regularExpression) != nil
    }
    var body: some View {
        let blocks = paragraphs
        ScrollView {
            VStack(alignment: .leading, spacing: paragraphSpacing) {
                ForEach(Array(blocks.enumerated()), id: \.offset) { index, text in
                    if index == 0 {
                        Text(text).font(.title.bold()).accessibilityAddTraits(.isHeader)
                            .padding(.bottom, 4).accessibilityIdentifier("legal-title")
                    } else if Self.isSectionHeading(text) {
                        Text(text).font(.headline).accessibilityAddTraits(.isHeader)
                            .padding(.top, paragraphSpacing).accessibilityIdentifier("legal-section-\(index)")
                    } else {
                        Text(text).font(.callout).lineSpacing(lineSpacing)
                            .foregroundStyle(index == 1 ? Color.secondary : Color.primary)
                            .accessibilityIdentifier(index == blocks.count - 1 ? "legal-end" : "legal-paragraph-\(index)")
                    }
                }
            }.frame(maxWidth: 680, alignment: .leading).padding(.horizontal, 24).padding(.vertical, 28)
                .frame(maxWidth: .infinity, alignment: .center).textSelection(.enabled)
        }.avoidsAppFooter().accessibilityIdentifier("legal-scroll")
            .background(Color(uiColor: .systemBackground).ignoresSafeArea())
            .navigationTitle(kind == "terms" ? "服务协议" : "隐私政策").navigationBarTitleDisplayMode(.inline)
            .toolbar(.visible, for: .navigationBar)
    }
}
