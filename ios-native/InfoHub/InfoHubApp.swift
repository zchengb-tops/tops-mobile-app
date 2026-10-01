import SwiftUI

@main struct InfoHubApp: App {
    @State private var store = AppStore()
    @State private var player = PodcastPlayer()
    var body: some Scene {
        WindowGroup {
            RootView().environment(store).environment(player)
                .tint(.orange)
                .preferredColorScheme(store.colorScheme)
                .task { await store.start() }
        }
    }
}

struct RootView: View {
    @Environment(AppStore.self) private var store
    @Environment(PodcastPlayer.self) private var player
    @Environment(\.scenePhase) private var scenePhase
    @State private var playerPresented = false
    @State private var lastActive = Date.now
    private var tabs: some View {
        TabView {
            NavigationStack { DiscoveryView() }.tabItem { Label("发现", systemImage: "square.stack.3d.up") }
            NavigationStack { SubscriptionsView() }.tabItem { Label("订阅", systemImage: "square.grid.2x2") }
            NavigationStack { SettingsView() }.tabItem { Label("我的", systemImage: "person.crop.circle") }
        }
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
                                Text(player.isPlaying ? "正在播放" : "已暂停").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }.buttonStyle(.plain)
                    Button { player.toggle() } label: { Image(systemName: player.isPlaying ? "pause.fill" : "play.fill").frame(width: 44, height: 44) }
                        .accessibilityLabel(player.isPlaying ? "暂停" : "播放")
                }.padding(.horizontal, 12).padding(.vertical, 6)
            }
        }
    }
    var body: some View {
        Group {
            if #available(iOS 26.1, *) {
                tabs.tabViewBottomAccessory(isEnabled: player.item != nil) { miniPlayer }
            } else {
                tabs.safeAreaInset(edge: .bottom, spacing: 0) {
                    if player.item != nil { miniPlayer.background(.regularMaterial) }
                }
            }
        }
        .sheet(isPresented: $playerPresented) { PlayerView() }
        .sheet(isPresented: Binding(get: { store.update != nil }, set: { if !$0 { store.update = nil } })) {
            VStack(spacing: 24) {
                Image(systemName: "arrow.down.app").font(.largeTitle).foregroundStyle(.orange)
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

extension View {
    @ViewBuilder func glassSurface() -> some View {
        if #available(iOS 26, *) { self.glassEffect(.regular, in: .rect(cornerRadius: 24)) }
        else { self.background(.regularMaterial, in: .rect(cornerRadius: 24)) }
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
            Image("channel-\(channel.code)").resizable().scaledToFit().accessibilityHidden(true)
        } else {
            Image(systemName: channel.symbol).resizable().scaledToFit().foregroundStyle(.orange).accessibilityHidden(true)
        }
    }
}
