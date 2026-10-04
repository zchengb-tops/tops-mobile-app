import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @State private var login = false
    @State private var confirmRestore = false
    @State private var syncing = false
    var body: some View {
        @Bindable var store = store
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {
                profile
                SettingsSection("阅读体验", detail: "让资讯，以你喜欢的节奏展开。") {
                    SettingsControl("外观", symbol: "circle.lefthalf.filled") {
                        Picker("外观", selection: $store.appearance) {
                            Text("跟随系统").tag("system"); Text("浅色").tag("light"); Text("深色").tag("dark")
                        }.labelsHidden().pickerStyle(.menu)
                    }
                    Divider()
                    SettingsControl("阅读字号", symbol: "textformat.size") {
                        Picker("阅读字号", selection: $store.readingSize) {
                            Text("跟随系统").tag("system"); Text("小").tag("small"); Text("大").tag("large")
                        }.labelsHidden().pickerStyle(.menu)
                    }
                    Divider()
                    SettingsControl("资讯密度", symbol: "rectangle.compress.vertical") {
                        Picker("资讯密度", selection: $store.feedDensity) {
                            ForEach(FeedDensity.allCases) { Text($0.title).tag($0) }
                        }.labelsHidden().pickerStyle(.menu).accessibilityIdentifier("density-picker")
                    }
                    Text("在资讯页双指合拢，浏览更多；双指张开，展开图文。字号不会随捏合改变。")
                        .font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true).padding(.top, 8)
                }
                SettingsSection("订阅同步", detail: store.loggedIn ? "在不同设备间，接着探索。" : "登录后，让你的频道随你同行。") {
                    Toggle(isOn: $store.syncEnabled) { SettingsLabel("自动上传订阅改动", symbol: "arrow.triangle.2.circlepath") }
                        .disabled(!store.loggedIn).frame(minHeight: 52)
                    Divider()
                    Button { Task { syncing = true; await store.sync(download: false); syncing = false } } label: {
                        SettingsAction("上传本机订阅到云端", symbol: "icloud.and.arrow.up")
                    }.disabled(!store.loggedIn || syncing)
                    Divider()
                    Button { confirmRestore = true } label: {
                        SettingsAction("从云端恢复订阅", symbol: "icloud.and.arrow.down")
                    }.disabled(!store.loggedIn || syncing)
                    if syncing { ProgressView("正在同步") }
                    LabeledContent("最近同步", value: store.lastSync).font(.caption).foregroundStyle(.secondary).padding(.vertical, 8)
                    Text("从旧版迁移时，请先在旧版上传订阅，再在此登录同一账号并恢复。恢复将替换本机订阅配置。")
                        .font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                }
                SettingsSection("关于 InfoHub", detail: "连接信息，也连接你的好奇心。") {
                    SettingsControl("版本", symbol: "square.stack.3d.up") {
                        Text(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—").foregroundStyle(.secondary)
                    }
                    Divider()
                    Button { Task { await store.checkUpdate() } } label: { SettingsAction("检查更新", symbol: "arrow.down.circle") }
                    Divider()
                    Link(destination: URL(string: "https://infohub.net.cn/")!) { SettingsAction("官方网站", symbol: "globe", external: true) }
                    Divider()
                    Link(destination: URL(string: "https://jsj.top/f/T4STLU")!) { SettingsAction("意见反馈", symbol: "bubble.left", external: true) }
                    Divider()
                    NavigationLink { LegalView(kind: "terms") } label: { SettingsAction("用户服务协议", symbol: "doc.text") }
                    Divider()
                    NavigationLink { LegalView(kind: "privacy") } label: { SettingsAction("隐私政策", symbol: "hand.raised") }
                        .accessibilityIdentifier("settings-privacy")
                }
                if store.loggedIn { Button("退出登录", role: .destructive) { store.signOut() }.frame(minHeight: 44) }
            }.buttonStyle(.plain).padding(.horizontal, 24).padding(.top, 28).padding(.bottom, 24)
        }.avoidsAppFooter().accessibilityIdentifier("settings-scroll")
            .ignoresSafeArea(.container, edges: .bottom)
            .background {
                Color(uiColor: .systemBackground).ignoresSafeArea()
                VStack {
                    LinearGradient(colors: [Color(uiColor: .secondarySystemBackground), Color(uiColor: .systemBackground)], startPoint: .top, endPoint: .bottom)
                        .frame(height: 320)
                    Spacer(minLength: 0)
                }.ignoresSafeArea().allowsHitTesting(false)
            }
            .navigationTitle("我的").toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $login) { LoginView().environment(\.appFooterHeight, 0) }
            .confirmationDialog("用云端订阅替换本机配置？", isPresented: $confirmRestore, titleVisibility: .visible) {
                Button("恢复订阅", role: .destructive) { Task { syncing = true; await store.sync(download: true); syncing = false } }
            }
    }
    private var profile: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Text("我的").font(.largeTitle.bold()).tracking(-1)
                Text("为好奇心，留一个位置。").font(.title3).foregroundStyle(.secondary)
            }
            HStack(alignment: .top, spacing: 16) {
                Image(systemName: "person.crop.circle").font(.system(size: 52, weight: .light)).foregroundStyle(.secondary).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 8) {
                    Text(store.loggedIn ? store.email : "你的阅读空间").font(.headline)
                    Text(store.loggedIn ? "已登录 · 订阅可在设备间同步" : "从热榜到深读，让兴趣在这里相遇。")
                        .font(.subheadline).foregroundStyle(.secondary)
                    if !store.loggedIn {
                        Button("使用邮箱登录") { login = true }
                            .font(.subheadline.weight(.semibold)).buttonStyle(.borderedProminent).tint(.infoHubSelection)
                            .frame(minHeight: 44)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 16) { channelCollection; subscriptionCount }
                VStack(alignment: .leading, spacing: 12) { channelCollection; subscriptionCount }
            }.padding(.vertical, 8)
        }
    }
    private var subscriptionCount: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(store.enabledChannels.count) 个频道，属于你的视野").font(.subheadline.weight(.medium))
            Text("\(store.enabledChannels.filter(\.isRSS).count) 个 RSS 订阅").font(.caption).foregroundStyle(.secondary)
        }
    }
    private var channelCollection: some View {
        HStack(spacing: -8) {
            ForEach(store.enabledChannels.prefix(4)) { channel in
                ChannelIcon(channel: channel).frame(width: 24, height: 24).padding(8)
                    .background(Color(uiColor: .systemBackground), in: Circle())
                    .overlay { Circle().stroke(Color(uiColor: .separator).opacity(0.25), lineWidth: 0.5) }
            }
        }.accessibilityHidden(true)
    }
}

private struct SettingsSection<Content: View>: View {
    let title: String
    let detail: String
    @ViewBuilder let content: Content
    init(_ title: String, detail: String, @ViewBuilder content: () -> Content) {
        self.title = title; self.detail = detail; self.content = content()
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.title3.weight(.semibold)).accessibilityAddTraits(.isHeader)
            Text(detail).font(.subheadline).foregroundStyle(.secondary)
            VStack(spacing: 0) { content }.padding(.top, 4)
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

private struct SettingsControl<Content: View>: View {
    let title: String
    let symbol: String
    @ViewBuilder let content: Content
    @Environment(\.dynamicTypeSize) private var typeSize
    init(_ title: String, symbol: String, @ViewBuilder content: () -> Content) {
        self.title = title; self.symbol = symbol; self.content = content()
    }
    var body: some View {
        if typeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 8) { SettingsLabel(title, symbol: symbol); content }.padding(.vertical, 12)
        } else {
            HStack { SettingsLabel(title, symbol: symbol); Spacer(minLength: 12); content }.frame(minHeight: 52)
        }
    }
}

private struct SettingsAction: View {
    let title: String
    let symbol: String
    var external = false
    init(_ title: String, symbol: String, external: Bool = false) { self.title = title; self.symbol = symbol; self.external = external }
    var body: some View {
        HStack(spacing: 12) {
            SettingsLabel(title, symbol: symbol)
            Spacer(minLength: 12)
            Image(systemName: external ? "arrow.up.right" : "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
        }.frame(maxWidth: .infinity, minHeight: 52, alignment: .leading).contentShape(Rectangle())
    }
}

struct LoginView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var email = ""
    @State private var code = ""
    @State private var agreed = false
    @State private var operation: Operation?
    @State private var sentAt: Date?
    @State private var error: String?
    @FocusState private var focusedField: Field?
    private enum Field { case email, code }
    private enum Operation { case sendCode, signIn }
    private var busy: Bool { operation != nil }
    private var normalizedEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var canSend: Bool { agreed && normalizedEmail.contains("@") && !busy }
    private var canSignIn: Bool { canSend && !code.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // The enlarged brand landscape replaces a separate icon and marketing block.
                    Color.clear.frame(height: typeSize.isAccessibilitySize ? 16 : 136).accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("登录 InfoHub")
                            .font(typeSize.isAccessibilitySize ? .title2.weight(.semibold) : .title.weight(.semibold)).tracking(-0.7)
                            .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                        Text("无需密码，使用邮箱验证码。")
                            .font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }
                    VStack(alignment: .leading, spacing: 14) {
                        inputSurface(active: focusedField == .email) {
                            TextField("邮箱地址", text: $email, prompt: Text("邮箱地址").foregroundStyle(Color(uiColor: .secondaryLabel)))
                                .keyboardType(.emailAddress).textContentType(.emailAddress)
                                .textInputAutocapitalization(.never).autocorrectionDisabled().submitLabel(.next)
                                .focused($focusedField, equals: .email).onSubmit { focusedField = .code }
                                .accessibilityIdentifier("login-email")
                        }
                        if typeSize.isAccessibilitySize {
                            VStack(alignment: .leading, spacing: 8) {
                                inputSurface(active: focusedField == .code) { codeField }
                                sendCodeButton.frame(maxWidth: .infinity, alignment: .trailing)
                            }
                        } else {
                            inputSurface(active: focusedField == .code, verticalPadding: 8) {
                                HStack(spacing: 12) { codeField; sendCodeButton }
                            }
                        }
                    }
                    consent
                    if let error {
                        Label(error, systemImage: "exclamationmark.circle").font(.footnote).foregroundStyle(.red)
                            .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("login-error")
                    }
                    Button { signIn() } label: {
                        HStack(spacing: 10) {
                            if operation == .signIn { ProgressView().tint(.white) }
                            Text(operation == .signIn ? "正在登录" : "登录").font(.body.weight(.semibold))
                        }.frame(maxWidth: .infinity, minHeight: 54)
                            .foregroundStyle(canSignIn || operation == .signIn ? Color.white : Color.secondary)
                            .background(canSignIn || operation == .signIn ? Color.infoHubSelection : Color(uiColor: .tertiarySystemFill), in: .rect(cornerRadius: 16))
                    }.disabled(!canSignIn).accessibilityIdentifier("login-submit")
                }.padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 28)
                    .frame(maxWidth: 520, alignment: .leading).frame(maxWidth: .infinity)
            }.scrollDismissesKeyboard(.immediately).accessibilityIdentifier("login-scroll")
                .background { LoginBrandBackdrop().ignoresSafeArea().ignoresSafeArea(.keyboard) }
                .navigationTitle("").navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(.hidden, for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button { finishEditing(); dismiss() } label: { Image(systemName: "xmark").font(.body.weight(.medium)) }
                            .accessibilityLabel("关闭").accessibilityIdentifier("login-close")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        if focusedField != nil {
                            Button("完成") { finishEditing() }.accessibilityIdentifier("login-dismiss-keyboard")
                        }
                    }
                }
                .buttonStyle(.plain)
        }
    }
    private var codeField: some View {
        TextField("验证码", text: $code, prompt: Text("验证码").foregroundStyle(Color(uiColor: .secondaryLabel)))
            .keyboardType(.numberPad).textContentType(.oneTimeCode)
            .focused($focusedField, equals: .code).accessibilityIdentifier("login-code")
    }
    private func inputSurface<Content: View>(active: Bool, verticalPadding: CGFloat = 16, @ViewBuilder content: () -> Content) -> some View {
        content().font(.body).padding(.horizontal, 16).padding(.vertical, verticalPadding).frame(minHeight: 56)
            .background(Color(uiColor: .secondarySystemBackground), in: .rect(cornerRadius: 14))
            .overlay { RoundedRectangle(cornerRadius: 14).stroke(active ? Color.primary.opacity(0.35) : .clear, lineWidth: 1) }
    }
    private var sendCodeButton: some View {
        TimelineView(.periodic(from: .now, by: 1)) { timeline in
            let remaining = max(0, 60 - Int(timeline.date.timeIntervalSince(sentAt ?? .distantPast)))
            Button { sendCode() } label: {
                HStack(spacing: 6) {
                    if operation == .sendCode { ProgressView().controlSize(.small) }
                    Text(remaining > 0 ? "\(remaining) 秒后重发" : "发送验证码").font(.subheadline.weight(.semibold))
                }.frame(minHeight: 44)
                    .foregroundStyle(canSend && remaining == 0 ? Color.primary : Color.secondary)
            }.disabled(!canSend || remaining > 0).accessibilityIdentifier("login-send-code")
        }
    }
    private var consent: some View {
        HStack(alignment: .top, spacing: 8) {
            Button { agreed.toggle() } label: {
                Image(systemName: agreed ? "checkmark.circle.fill" : "circle")
                    .font(.title3).foregroundStyle(agreed ? Color.primary : Color.secondary)
                    .frame(minWidth: 44, minHeight: 44).contentShape(Rectangle())
            }.accessibilityLabel("我已阅读并同意服务协议和隐私政策")
                .accessibilityValue(agreed ? "已同意" : "未同意").accessibilityAddTraits(agreed ? .isSelected : [])
                .accessibilityIdentifier("login-consent")
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) { consentText; legalLinks }
                VStack(alignment: .leading, spacing: 0) {
                    consentText.padding(.top, 12)
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 16) { legalLinks }
                        VStack(alignment: .leading, spacing: 0) { legalLinks }
                    }
                }.font(.footnote.weight(.medium))
            }.font(.footnote.weight(.medium))
        }
    }
    private var consentText: some View {
        Text("我已阅读并同意").font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            .onTapGesture { agreed.toggle() }
    }
    @ViewBuilder private var legalLinks: some View {
        NavigationLink("服务协议") { LegalView(kind: "terms") }.frame(minHeight: 44).accessibilityIdentifier("login-terms")
        NavigationLink("隐私政策") { LegalView(kind: "privacy") }.frame(minHeight: 44).accessibilityIdentifier("login-privacy")
    }
    private func finishEditing() {
        focusedField = nil
        // End editing in both SwiftUI and the native responder chain.
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
    private func sendCode() {
        finishEditing(); error = nil; operation = .sendCode
        Task {
            defer { operation = nil }
            do {
                _ = try await store.api.request("sign-in-verification-code/email", body: .object(["email": .string(normalizedEmail)]))
                sentAt = .now; focusedField = .code
            } catch { self.error = error.localizedDescription }
        }
    }
    private func signIn() {
        finishEditing(); error = nil; operation = .signIn
        Task {
            defer { operation = nil }
            do { try await store.signIn(email: normalizedEmail, code: code); dismiss() }
            catch { self.error = error.localizedDescription }
        }
    }
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
            let artworkHeight = typeSize.isAccessibilitySize ? 144.0 : 300.0
            ZStack(alignment: .top) {
                Color(uiColor: .systemBackground)
                ZStack(alignment: .top) {
                    LinearGradient(colors: [Color(red: 0.97, green: 0.44, blue: 0).opacity(dark ? 0.08 : 0.045), .clear],
                                   startPoint: .top, endPoint: .bottom).frame(height: artworkHeight)
                    Circle()
                        .fill(Color(red: 0.97, green: 0.44, blue: 0).opacity(dark ? 0.21 : 0.16))
                        .frame(width: width * 0.63, height: width * 0.63)
                        .scaleEffect(x: settled ? 1 : 0.92, y: settled ? 1 : 0.84)
                        .offset(x: width * 0.22, y: settled ? -width * 0.12 : -width * 0.12 + 36)
                        .opacity(settled ? 1 : 0)
                        .animation(reduceMotion ? nil : .spring(response: 0.66, dampingFraction: 0.60), value: entered)
                    LoginHorizon(front: false)
                        .fill(dark ? Color(red: 0.085, green: 0.09, blue: 0.10) : Color(red: 0.94, green: 0.95, blue: 0.96))
                        .frame(height: artworkHeight)
                        .offset(y: settled ? 0 : 18)
                        .opacity(settled ? 1 : 0)
                        .animation(reduceMotion ? nil : .spring(response: 0.70, dampingFraction: 0.76).delay(0.04), value: entered)
                    LoginHorizon(front: true)
                        .fill(Color(uiColor: .systemBackground))
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
    var body: some View {
        ScrollView {
            Text(Bundle.main.url(forResource: kind, withExtension: "txt").flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? "文档加载失败，请通过官方网站查看。")
                .frame(maxWidth: .infinity, alignment: .leading).padding(24).textSelection(.enabled)
                .accessibilityIdentifier("legal-document")
        }.avoidsAppFooter().accessibilityIdentifier("legal-scroll")
            .navigationTitle(kind == "terms" ? "服务协议" : "隐私政策").navigationBarTitleDisplayMode(.inline)
            .toolbar(.visible, for: .navigationBar)
    }
}
