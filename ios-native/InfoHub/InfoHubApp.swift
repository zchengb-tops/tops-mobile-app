import SwiftUI

@main struct InfoHubApp: App {
    @State private var store = AppStore()
    @State private var player = PodcastPlayer()
    var body: some Scene {
        WindowGroup {
            RootView().environment(store).environment(player)
                .tint(.primary)
                .toggleStyle(SwitchToggleStyle(tint: .infoHubSelection))
                .preferredColorScheme(store.colorScheme)
                .task { await store.start() }
        }
    }
}

struct RootView: View {
    @Environment(AppStore.self) private var store
    @Environment(PodcastPlayer.self) private var player
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedTab = 0
    @State private var discoveryPath: [NewsItem] = []
    @State private var playerPresented = false
    @State private var lastActive = Date.now
    @State private var footerHeight: CGFloat = 0
    private var footerVisible: Bool { selectedTab != 0 || discoveryPath.isEmpty }
    private var tabs: some View {
        TabView(selection: $selectedTab) {
            NavigationStack(path: $discoveryPath) { DiscoveryView().toolbar(.hidden, for: .tabBar) }.tabItem { Text("发现") }.tag(0)
            NavigationStack { SubscriptionsView().toolbar(.hidden, for: .tabBar) }.tabItem { Text("订阅") }.tag(1)
            NavigationStack { SettingsView().toolbar(.hidden, for: .tabBar) }.tabItem { Text("我的") }.tag(2)
        }
        .toolbar(.hidden, for: .tabBar)
    }
    private var navigationItems: some View {
        HStack(spacing: 4) {
            // Original NavBar.js Ionicons: navigate-circle-outline, logo-rss, person-circle-outline.
            ForEach(Array([("发现", "\u{ed6f}"), ("订阅", "\u{ed0f}"), ("我的", "\u{edab}")].enumerated()), id: \.offset) { index, item in
                Button { selectedTab = index } label: {
                    HStack(spacing: 8) {
                        Text(item.1).font(.custom("Ionicons", size: index == 1 ? 20 : 24, relativeTo: .body)).accessibilityHidden(true)
                        Text(item.0).font(.subheadline.weight(selectedTab == index ? .semibold : .regular)).lineLimit(1)
                    }.frame(maxWidth: .infinity, minHeight: 44).contentShape(Capsule())
                        .foregroundStyle(selectedTab == index || colorScheme == .dark ? Color.white : .secondary)
                }.buttonStyle(.plain)
                    .accessibilityLabel(item.0)
                    .accessibilityIdentifier("nav-\(index)")
                    .accessibilityAddTraits(selectedTab == index ? .isSelected : [])
            }
        }.background {
            GeometryReader { geometry in
                let width = max(0, (geometry.size.width - 8) / 3)
                // One persistent selection plate, like the original NavBar.js translateX.
                Capsule().fill(Color.infoHubSelection).frame(width: width, height: geometry.size.height)
                    .offset(x: CGFloat(selectedTab) * (width + 4) * (layoutDirection == .rightToLeft ? -1 : 1))
                    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1), value: selectedTab)
            }.allowsHitTesting(false).accessibilityHidden(true)
        }.padding(4)
    }
    private var navigationBar: some View {
        navigationItems.glassSurface(in: Capsule())
    }
    private var miniPlayer: some View {
        Group {
            if let item = player.item {
                HStack(spacing: 12) {
                    Button { playerPresented = true } label: {
                        HStack {
                            Artwork(url: item.image, symbol: "headphones").frame(width: 40, height: 40).clipShape(.rect(cornerRadius: 10))
                            VStack(alignment: .leading) {
                                Text(item.title).font(.subheadline.weight(.semibold)).lineLimit(1)
                                Text(player.isPlaying ? "正在播放" : "已暂停").font(.caption)
                                    .foregroundStyle(colorScheme == .dark ? Color(white: 170.0 / 255) : .secondary)
                            }
                            Spacer()
                        }
                    }.buttonStyle(.plain).accessibilityIdentifier("mini-player")
                    Button { player.toggle() } label: { Image(systemName: player.isPlaying ? "pause.fill" : "play.fill").frame(width: 44, height: 44) }
                        .accessibilityLabel(player.isPlaying ? "暂停" : "播放")
                }.padding(.horizontal, 12).padding(.vertical, 6)
            }
        }
    }
    var body: some View {
        GeometryReader { geometry in
            // Keep the footer outside TabView's changing page hosts.
            tabs
                // Keep offscreen feeds' scroll position stable while the Web reader hides the footer.
                .environment(\.appFooterHeight, footerHeight)
                .overlay(alignment: .bottom) {
                    if footerVisible {
                        VStack(spacing: 8) {
                            if player.item != nil {
                                miniPlayer.glassSurface()
                            }
                            navigationBar
                        }
                        .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                        .frame(maxWidth: 520)
                        // The page extends underneath glass and the home indicator, with no opaque shelf.
                        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, max(8, geometry.safeAreaInsets.bottom - 8))
                        .frame(maxWidth: .infinity)
                        .background {
                            GeometryReader { footer in
                                Color.clear.preference(key: FooterHeightPreference.self, value: footer.size.height)
                            }
                        }
                    }
                }
                .onPreferenceChange(FooterHeightPreference.self) { height in
                    if height > 0 { footerHeight = height }
                }
                .ignoresSafeArea(.container, edges: .bottom)
        }
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .sheet(isPresented: $playerPresented) { PlayerView() }
        .sheet(isPresented: Binding(get: { store.update != nil }, set: { if !$0 { store.update = nil } })) {
            VStack(spacing: 24) {
                Image(systemName: "arrow.down.app").font(.largeTitle).foregroundStyle(.secondary)
                Text("新版本 \(store.update?["latestVersion"].text ?? "")").font(.title.bold())
                Text(store.update?["updateMessage"].text ?? "")
                if let url = webURL(store.update?["updateUrl"].text ?? "") { Link("前往更新", destination: url).buttonStyle(.borderedProminent) }
                if store.update?["isMandatory"].flag != true { Button("稍后") { store.update = nil } }
            }.padding(28).presentationDetents([.medium])
                .interactiveDismissDisabled(store.update?["isMandatory"].flag == true)
        }
        .alert("无法完成操作", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button("好") { store.error = nil }
        } message: { Text(store.error ?? "") }
        .alert("InfoHub", isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
            Button("好") { store.message = nil }
        } message: { Text(store.message ?? "") }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active && Date.now.timeIntervalSince(lastActive) > 600 {
                lastActive = .now
                Task { await store.refresh() }
            }
        }
    }
}

extension Color {
    static let infoHubSelection = Color(white: 64.0 / 255) // Original #404040 selection color.
}

extension View {
    /// Reserve scrollable space for the shared floating controls, not a fixed screen-size spacer.
    func avoidsAppFooter() -> some View { modifier(AppFooterClearance()) }

    func glassSurface(tint: Color? = nil, in shape: some Shape = RoundedRectangle(cornerRadius: 24)) -> some View {
        modifier(GlassSurface(tint: tint, shape: shape))
    }
}

private enum FooterHeightPreference: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

private enum AppFooterHeightKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

extension EnvironmentValues {
    var appFooterHeight: CGFloat {
        get { self[AppFooterHeightKey.self] }
        set { self[AppFooterHeightKey.self] = newValue }
    }
}

private struct AppFooterClearance: ViewModifier {
    @Environment(\.appFooterHeight) private var height
    func body(content: Content) -> some View {
        // TabView hosts don't consistently forward an outer safeAreaInset to Form/List/page feeds.
        // Set the margins on the scrolling surface itself; nil preserves defaults in footer-free sheets.
        content.contentMargins(.bottom, height > 0 ? height + 16 : nil, for: .scrollContent)
            .contentMargins(.bottom, height > 0 ? height : nil, for: .scrollIndicators)
    }
}

private struct GlassSurface<S: Shape>: ViewModifier {
    let tint: Color?
    let shape: S
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorSchemeContrast) private var contrast
    func body(content: Content) -> some View {
        if reduceTransparency || contrast == .increased {
            content.background(tint ?? Color(uiColor: .secondarySystemBackground), in: shape)
                .overlay { shape.stroke(Color.primary.opacity(0.2), lineWidth: 1).allowsHitTesting(false) }
        } else if #available(iOS 26, *) {
            content.glassEffect(.regular.tint(tint), in: shape)
        } else {
            content.background(tint ?? .clear, in: shape).background(.regularMaterial, in: shape)
        }
    }
}

struct Artwork: View {
    var url: URL?
    var symbol = "newspaper"
    var body: some View {
        AsyncImage(url: url) { phase in
            if let image = phase.image { image.resizable().scaledToFill() }
            else { Rectangle().fill(.quaternary).overlay { Image(systemName: symbol).foregroundStyle(.secondary) } }
        }.clipped().accessibilityHidden(true)
    }
}

struct ChannelIcon: View {
    let channel: Channel
    var body: some View {
        if UIImage(named: "channel-\(channel.code)") != nil {
            Image("channel-\(channel.code)").resizable().scaledToFit()
                // NN/g's original black/red mark needs a light plate on a dark or selected rail.
                .background(channel.code == "nnGroup" ? Color.white : .clear, in: Circle())
                .accessibilityHidden(true)
        } else {
            Image(systemName: channel.symbol).resizable().scaledToFit().foregroundStyle(.secondary).accessibilityHidden(true)
        }
    }
}
