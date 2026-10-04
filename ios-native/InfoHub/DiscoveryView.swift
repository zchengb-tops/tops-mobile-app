import SwiftUI

struct DiscoveryView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var channelSelection
    var body: some View {
        @Bindable var store = store
        Group {
            if store.enabledChannels.isEmpty {
                ContentUnavailableView("开始你的每日阅读", systemImage: "square.stack.3d.up", description: Text("到「订阅」选择感兴趣的频道"))
            } else {
                ChannelPager(channels: store.enabledChannels, selection: $store.selectedChannel)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .top, spacing: 0) {
          HStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView(.horizontal) {
                    HStack(spacing: 4) {
                        ForEach(store.enabledChannels) { channel in
                            Button { store.selectedChannel = channel.id } label: {
                                HStack(spacing: 6) {
                                    ChannelIcon(channel: channel).frame(width: 20, height: 20)
                                    Text(channel.title).channelText(14, weight: store.current?.id == channel.id ? .medium : .regular)
                                        .lineLimit(1).fixedSize(horizontal: true, vertical: false)
                                }.padding(.horizontal, 12).frame(minHeight: 44)
                                    .background {
                                        if store.current?.id == channel.id {
                                            Capsule().fill(Color.infoHubSelection)
                                                .matchedGeometryEffect(id: "selected-channel", in: channelSelection)
                                        }
                                    }
                                    .foregroundStyle(store.current?.id == channel.id ? Color.white : Color.primary)
                            }.buttonStyle(.plain).id(channel.id)
                                .accessibilityIdentifier("tab-\(channel.id)")
                                .accessibilityAddTraits(store.current?.id == channel.id ? .isSelected : [])
                        }
                    }.padding(.horizontal, 4)
                        .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1), value: store.selectedChannel)
                }.scrollIndicators(.hidden)
                    .onChange(of: store.selectedChannel) { _, id in
                        withAnimation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1)) { proxy.scrollTo(id, anchor: .center) }
                    }
                    .onAppear { proxy.scrollTo(store.selectedChannel, anchor: .center) }
            }
                Menu {
                    ForEach(store.enabledChannels) { channel in
                        Button { store.selectedChannel = channel.id } label: {
                            Label(channel.title, systemImage: store.current?.id == channel.id ? "checkmark" : channel.symbol)
                        }.accessibilityIdentifier("choose-\(channel.id)")
                    }
                    Divider()
                    Picker("资讯密度", selection: $store.feedDensity) {
                        ForEach(FeedDensity.allCases) { Text($0.title).tag($0) }
                    }
                } label: { Image(systemName: "ellipsis").frame(width: 44, height: 44).contentShape(Rectangle()) }
                    .accessibilityLabel("选择频道")
                    .accessibilityIdentifier("channel-menu")
                    .accessibilityValue(store.feedDensity.title)
                    .accessibilityHint("可在菜单调整资讯密度，也可在资讯页双指捏合")
          }.padding(4)
              // Keep compact navigation readable; the feed still follows the full AX text range.
              .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
              .glassSurface(in: Capsule())
              .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 8)
        }
        // Apply to the whole inset/page host, not just an individual page.
        .ignoresSafeArea(.container, edges: .bottom)
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .navigationDestination(for: NewsItem.self) { item in
            if let url = item.url { ReaderView(url: url, title: item.title) }
        }
    }
}

private struct ChannelPager: View {
    let channels: [Channel]
    @Binding private var selection: String
    @State private var position: String?
    init(channels: [Channel], selection: Binding<String>) {
        self.channels = channels; _selection = selection
        _position = State(initialValue: selection.wrappedValue)
    }
    var body: some View {
        GeometryReader { geometry in
            if geometry.size.width > 0 && geometry.size.height > 0 {
              ScrollViewReader { proxy in
                ScrollView(.horizontal) {
                    // Keep each channel's vertical scroll view alive when paging away and back.
                    HStack(spacing: 0) {
                        ForEach(channels) { channel in
                            ChannelFeed(channel: channel)
                                .frame(width: geometry.size.width, height: geometry.size.height)
                                .id(channel.id)
                        }
                    }.scrollTargetLayout()
                }
                .scrollTargetBehavior(.paging)
                .scrollPosition(id: $position)
                .scrollIndicators(.hidden)
                .contentMargins(.all, 0)
                .ignoresSafeArea(.container, edges: .bottom)
                // scrollPosition tracks subsequent changes; explicitly restore the initial page after layout.
                .onAppear { proxy.scrollTo(selection, anchor: .leading) }
              }
            }
        }
        .onChange(of: selection) { _, id in
            if position != id { position = id }
        }
        .onChange(of: position) { _, id in
            if let id, id != selection, channels.contains(where: { $0.id == id }) { selection = id }
        }
    }
}

private struct ChannelFeed: View {
    let channel: Channel
    @Environment(AppStore.self) private var store
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arenaSection = "rank"
    @GestureState private var pinchScale: CGFloat = 1
    private var density: FeedDensity { store.feedDensity.adjusted(by: pinchScale) }
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                if channel.code == "arena" {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Agent Arena").channelText(24, lineHeight: 28, family: "Georgia").tracking(-0.7)
                        Text("Dynamic ranking of models for real-world agentic tasks, based on tool reliability, task completion, and steerability.").channelText(11, lineHeight: 16).foregroundStyle(.secondary)
                        let models = store.items(for: channel).filter { $0.properties["section"].text == "rank" }
                        Text("\(models.first?.properties["publishDate"].text ?? "") · \(Int(models.reduce(0) { $0 + $1.properties["sessions"].number }).formatted()) sessions · \(models.count) models")
                            .channelText(11, lineHeight: 14).monospacedDigit().foregroundStyle(.secondary)
                        Link(destination: URL(string: "https://arena.ai/blog/agent-arena-methodology/")!) {
                            Label("View Methodology", systemImage: "arrow.up.right").channelText(11, weight: .medium, lineHeight: 14)
                        }.frame(minHeight: 44, alignment: .leading)
                    }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.top, 16)
                    Picker("排行榜", selection: $arenaSection) {
                        Text("Models").tag("rank"); Text("Labs").tag("lab")
                    }.pickerStyle(.segmented).padding(.horizontal, 20).padding(.vertical, 16)
                }
                let items = store.items(for: channel).filter { channel.code != "arena" || $0.properties["section"].text == arenaSection }
                if items.isEmpty {
                    if store.loading { ProgressView("正在汇集最新资讯…").frame(maxWidth: .infinity, minHeight: 300) }
                    else { ContentUnavailableView("暂无资讯", systemImage: "newspaper", description: Text("下拉刷新，或选择其他频道")) }
                } else if channel.code == "stock" {
                    HStack {
                        Text("板块热力图").channelText(16, weight: .medium)
                        Spacer()
                        Text("红涨 · 绿跌").channelText(12).foregroundStyle(.secondary)
                    }.padding(.horizontal, 20).padding(.vertical, 16)
                    StockMap(items: items, height: density == .compact ? 480 : density == .spacious ? 720 : 600).padding(.horizontal, 16)
                    Text("面积代表市值 · 点击板块查看详情").channelText(12).foregroundStyle(.secondary).padding(20)
                } else {
                    if channel.code == "tiobe" {
                        TiobeRow(item: nil).padding(.horizontal, 20).padding(.vertical, 12)
                        Divider().padding(.horizontal, 20)
                    }
                    ForEach(items) { item in
                        NewsRow(item: item, channel: channel.code, density: density).accessibilityIdentifier("news-\(channel.code)-\(item.index)")
                        if channel.code != "sina", item.id != items.last?.id {
                            Divider().padding(.horizontal, 20)
                        }
                    }
                }
            }.padding(.top, 4).padding(.bottom, 24)
                .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1), value: density)
        }
        .avoidsAppFooter()
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .highPriorityGesture(MagnifyGesture()
            .updating($pinchScale) { value, scale, _ in scale = value.magnification }
            .onEnded { value in store.feedDensity = store.feedDensity.adjusted(by: value.magnification) })
        .overlay(alignment: .topTrailing) {
            if abs(pinchScale - 1) > 0.05 {
                Label(density.title, systemImage: "rectangle.compress.vertical")
                    .font(.caption.weight(.medium)).padding(12).glassSurface(in: Capsule()).padding(16)
                    .allowsHitTesting(false).accessibilityHidden(true)
            }
        }
        .refreshable { await store.refresh() }
        .accessibilityIdentifier("feed-\(channel.id)")
        .accessibilityValue(density.title)
        .accessibilityAction(named: "更紧凑") { store.feedDensity = store.feedDensity.adjusted(by: 0.7) }
        .accessibilityAction(named: "更舒展") { store.feedDensity = store.feedDensity.adjusted(by: 1.5) }
    }
}

// Match the original tabs' system fonts and reading-size multipliers,
// while still respecting iOS Dynamic Type.
private struct ChannelTextStyle: ViewModifier {
    @Environment(AppStore.self) private var store
    @ScaledMetric private var size: CGFloat
    let leading: CGFloat
    let weight: Font.Weight
    let family: String?
    init(_ size: CGFloat, weight: Font.Weight, lineHeight: CGFloat?, family: String?) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
        leading = (lineHeight ?? size * 1.4) / size
        self.weight = weight; self.family = family
    }
    func body(content: Content) -> some View {
        let points = size * (store.readingSize == "small" ? 0.8 : store.readingSize == "large" ? 1.2 : 1)
        let font = family.map { Font.custom($0, fixedSize: points) } ?? .system(size: points, weight: weight)
        let metrics = family.flatMap { UIFont(name: $0, size: points) } ?? .systemFont(ofSize: points)
        content.font(font).lineSpacing(max(0, points * leading - metrics.lineHeight))
    }
}

private extension View {
    func channelText(_ size: CGFloat, weight: Font.Weight = .regular, lineHeight: CGFloat? = nil, family: String? = nil) -> some View {
        modifier(ChannelTextStyle(size, weight: weight, lineHeight: lineHeight, family: family))
    }
}

struct NewsRow: View {
    let item: NewsItem
    let channel: String
    var density: FeedDensity = .standard
    @Environment(PodcastPlayer.self) private var player
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .body) private var rankDiameter = 22.0
    private var titleSize: CGFloat { ["36kr", "nnGroup", "bilibili"].contains(channel) ? 14 : channel == "arena" ? 13 : 16 }
    private var titleWeight: Font.Weight { channel == "arena" || channel == "sina" && (Int(item.rank) ?? 99) <= 3 ? .semibold : .medium }
    private var titleLineHeight: CGFloat {
        switch channel {
        case "sina", "zhihu", "sspai", "xiaoyuzhou": return 24
        case "36kr": return 21
        case "nnGroup", "history": return 20
        case "bilibili": return 18
        case "arena": return 16
        default: return titleSize * 1.4
        }
    }
    private var title: some View { Text(item.title).channelText(titleSize, weight: titleWeight, lineHeight: titleLineHeight) }
    private var metadataSize: CGFloat { channel == "36kr" ? 11 : channel == "doubanMovie" || channel == "bilibili" ? 12 : 14 }
    var body: some View {
        row
        .contextMenu { if let url = item.url { ShareLink(item: url, subject: Text(item.title)); Link("在浏览器打开", destination: url) } }
    }
    private var row: some View {
        HStack(spacing: 10) {
            NavigationLink(value: item) {
                content.frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
            }.buttonStyle(.plain)
            if item.audio != nil {
                Button {
                    if player.item?.id == item.id { player.toggle() } else { player.play(item) }
                } label: {
                    Image(systemName: player.item?.id == item.id && player.isPlaying ? "pause.fill" : "play.fill")
                        .frame(width: 44, height: 44).background(.quaternary, in: Circle())
                }.buttonStyle(.plain).foregroundStyle(.primary)
                    .accessibilityLabel(player.item?.id == item.id && player.isPlaying ? "暂停" : "播放")
            }
        }.padding(.horizontal, 20)
            .padding(.vertical, channel == "sina" ? (density == .compact ? 6 : density == .spacious ? 20 : 12) : (density == .compact ? 10 : density == .spacious ? 24 : 16))
    }
    @ViewBuilder private var content: some View {
        if channel == "sina" {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        rank
                        Spacer()
                        Text(compactCount(item.properties["viewers"].number)).channelText(14).foregroundStyle(.secondary)
                    }
                    title.fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("sina-title-\(item.index)")
                }.padding(.vertical, 10)
            } else if density == .compact {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    rank
                    title.lineLimit(2).frame(maxWidth: .infinity, alignment: .leading).accessibilityIdentifier("sina-title-\(item.index)")
                    Text(compactCount(item.properties["viewers"].number)).channelText(11).monospacedDigit().foregroundStyle(.secondary).fixedSize()
                }.frame(minHeight: 44)
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    rank
                    VStack(alignment: .leading, spacing: density == .spacious ? 10 : 6) {
                        title.lineLimit(density == .spacious ? nil : 2).fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("sina-title-\(item.index)")
                        Text("\(compactCount(item.properties["viewers"].number)) 热度")
                            .channelText(11).monospacedDigit().foregroundStyle(.secondary).accessibilityIdentifier("sina-heat-\(item.index)")
                    }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                }.frame(minHeight: 44)
            }
        } else if channel == "tiobe" {
            TiobeRow(item: item)
        } else if channel == "arena" {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(spacing: 4) {
                        rank
                        let delta = Int(item.properties["delta"].number)
                        Text(delta == 0 ? "—" : "\(delta > 0 ? "▲" : "▼")\(abs(delta))")
                            .channelText(9, weight: .semibold, lineHeight: 11).foregroundStyle(delta == 0 ? Color.secondary : delta < 0 ? .red : .green)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        title.lineLimit(2)
                        Text(item.properties.first("bestModel", "vendor")).channelText(10, lineHeight: 13).foregroundStyle(.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
                ArenaMetrics(item: item)
            }
        } else if channel == "history" {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: "clock.arrow.circlepath").font(.system(size: 16))
                    .foregroundStyle(.secondary).frame(width: 32, height: 32).background(.quaternary, in: Circle())
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.raw["year"].text + "年").channelText(14).foregroundStyle(.secondary)
                    title
                    if !item.summary.isEmpty { Text(item.summary).channelText(14, lineHeight: 20).foregroundStyle(.secondary).lineLimit(density == .compact ? 2 : density == .spacious ? 8 : 4) }
                }
            }
        } else if ["sspai", "bilibili"].contains(channel) {
          if density == .compact && !dynamicTypeSize.isAccessibilitySize {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    title.lineLimit(3)
                    editorialMetadata
                }.frame(maxWidth: .infinity, alignment: .leading)
                if item.image != nil {
                    Artwork(url: item.image).frame(width: 88, height: 66).clipShape(.rect(cornerRadius: 10))
                }
            }
          } else {
            VStack(alignment: .leading, spacing: 12) {
                if item.image != nil {
                    GeometryReader { geometry in
                        Artwork(url: item.image, symbol: channel == "bilibili" ? "play.rectangle" : "photo")
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .clipShape(.rect(cornerRadius: 12, style: .continuous))
                    }.aspectRatio(density == .spacious ? 4 / 3 : 16 / 9, contentMode: .fit)
                }
                title.lineLimit(density == .spacious ? nil : 3)
                editorialMetadata
                if density == .spacious, !item.summary.isEmpty {
                    Text(item.summary).channelText(14, lineHeight: 20).foregroundStyle(.secondary).lineLimit(4)
                }
            }
          }
        } else {
            HStack(alignment: .top, spacing: 12) {
                if ["zhihu", "doubanMovie"].contains(channel) { rank }
                if ["xiaoyuzhou", "doubanMovie"].contains(channel) {
                    Artwork(url: item.image, symbol: channel == "xiaoyuzhou" ? "headphones" : "film")
                        .frame(width: density == .compact ? 48 : density == .spacious ? 88 : 64,
                               height: (density == .compact ? 48 : density == .spacious ? 88 : 64) * (channel == "doubanMovie" ? 1.5 : 1))
                        .clipShape(.rect(cornerRadius: channel == "doubanMovie" ? 8 : 12, style: .continuous))
                }
                VStack(alignment: .leading, spacing: 8) {
                    title.lineLimit(density == .spacious ? nil : density == .compact ? 2 : channel == "zhihu" ? 4 : 3)
                    if channel == "xiaoyuzhou" {
                        Text(item.raw["author"].text).channelText(12).foregroundStyle(.secondary).lineLimit(1)
                        Label("\(Int(item.raw["duration"].number / 60)) 分钟", systemImage: "clock").channelText(12).foregroundStyle(.secondary)
                    } else {
                        if !item.metadata.isEmpty { Text(item.metadata).channelText(metadataSize).foregroundStyle(.secondary).lineLimit(2) }
                        if channel != "zhihu", !item.summary.isEmpty, density != .compact { Text(item.summary).channelText(channel == "36kr" ? 12 : 14, lineHeight: channel == "36kr" ? 16 : 20).foregroundStyle(.secondary).lineLimit(density == .spacious ? 4 : 2) }
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
                if let image = item.image, ["zhihu", "nnGroup", "36kr"].contains(channel), !dynamicTypeSize.isAccessibilitySize {
                    Artwork(url: image).frame(width: channel == "zhihu" ? 60 : 88, height: channel == "zhihu" ? 60 : 66)
                        .clipShape(.rect(cornerRadius: 10, style: .continuous))
                }
            }
        }
    }
    @ViewBuilder private var editorialMetadata: some View {
        if channel == "sspai" {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 14) { publishDate; editorialCounts }
                VStack(alignment: .leading, spacing: 6) { publishDate; editorialCounts }
            }.channelText(12).foregroundStyle(.secondary)
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text(item.properties["owner"].text).channelText(12).lineLimit(1)
                HStack(spacing: 16) {
                    Label(compactCount(item.properties["view"].number), systemImage: "play")
                    Label(compactCount(item.properties["like"].number), systemImage: "hand.thumbsup")
                }.channelText(12)
            }.foregroundStyle(.secondary)
        }
    }
    private var publishDate: some View { Text(item.raw["publishDate"].text) }
    private var editorialCounts: some View {
        HStack(spacing: 14) {
            Label(item.raw["likeCount"].text, systemImage: "bolt")
            Label(item.raw["commentCount"].text, systemImage: "bubble.right")
        }.fixedSize(horizontal: true, vertical: false)
    }
    @ViewBuilder private var rank: some View {
        let top = (Int(item.rank) ?? 99) <= 3
        let colors = [channel == "zhihu" ? Color(red: 0.87, green: 0.28, blue: 0.29) : Color(red: 0.90, green: 0.47, blue: 0), Color(red: 0.96, green: 0.62, blue: 0), Color(red: 0.98, green: 0.77, blue: 0.1)]
        let color = colors[max(0, min(2, (Int(item.rank) ?? 1) - 1))]
        if channel == "sina" {
            Text(String(format: "%02d", Int(item.rank) ?? item.index + 1))
                .channelText(13, weight: top ? .semibold : .regular).monospacedDigit()
                .foregroundStyle(top ? Color.primary : Color.secondary)
                .frame(minWidth: rankDiameter, alignment: .leading)
                .accessibilityLabel("第 \(item.rank) 名")
        } else if channel == "zhihu" || channel == "arena" {
            Text(channel == "zhihu" ? String(format: "%02d", Int(item.rank) ?? item.index + 1) : item.rank)
                .channelText(channel == "zhihu" ? 16 : 15, weight: .bold, lineHeight: channel == "arena" ? 16 : nil)
                .monospacedDigit().foregroundStyle(top ? color : .secondary)
        } else {
            Text(item.rank).channelText(12)
                .foregroundStyle(top ? Color.white : Color.secondary)
                .frame(width: rankDiameter, height: rankDiameter)
                .background(top ? color : Color.secondary.opacity(0.12), in: Circle())
        }
    }
}

struct TiobeRow: View {
    let item: NewsItem?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    var body: some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 8) {
                Text(item.map { "\($0.rank)  \($0.title)" } ?? "编程语言排行").channelText(16, weight: .medium)
                if let item {
                    Text("去年排名 \(item.properties["rankOfMonthLastYear"].text)")
                    Text("占比 \(item.properties["ratings"].text)")
                    Text("变化 \(item.properties["change"].text)")
                }
            }.channelText(14).monospacedDigit().frame(maxWidth: .infinity, alignment: .leading)
        } else {
            HStack(spacing: 6) {
                Text(item?.rank ?? "本月").frame(width: 36)
                Text(item?.properties["rankOfMonthLastYear"].text ?? "去年").frame(width: 36)
                Text(item?.title ?? "语言").channelText(14, weight: .medium).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                Text(item?.properties["ratings"].text ?? "占比").frame(width: 60)
                Text(item?.properties["change"].text ?? "变化").frame(width: 60)
            }.channelText(14).monospacedDigit().foregroundStyle(item == nil ? Color.secondary : .primary)
        }
    }
}

struct ArenaMetrics: View {
    let item: NewsItem
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.colorScheme) private var colorScheme
    private let metrics = [("score", "Net"), ("confirmedSuccess", "Success"), ("praiseComplaint", "Praise"), ("steerability", "Steer")]
    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: dynamicTypeSize.isAccessibilitySize ? 2 : 4), alignment: .leading, spacing: 6) { cells }
    }
    @ViewBuilder private var cells: some View {
        ForEach(metrics, id: \.0) { key, title in
            VStack(alignment: .leading, spacing: 4) {
                Text(title).channelText(10, lineHeight: 13).foregroundStyle(.secondary)
                Text(item.properties[key] == .null ? "—" : String(format: "%.1f%%", item.properties[key].number * 100))
                    .channelText(12, weight: .semibold, lineHeight: 16).monospacedDigit()
                    .foregroundStyle(item.properties[key] == .null ? Color.secondary : item.properties[key].number < 0
                        ? (colorScheme == .dark ? .red : Color(red: 0.70, green: 0.17, blue: 0.16))
                        : (colorScheme == .dark ? .green : Color(red: 0.15, green: 0.43, blue: 0.23)))
            }.frame(maxWidth: .infinity, alignment: .leading).padding(8)
                .background(Color(uiColor: .tertiarySystemGroupedBackground), in: .rect(cornerRadius: 10, style: .continuous))
        }
    }
}

struct StockMap: View {
    let items: [NewsItem]
    var height: CGFloat = 600
    @Environment(\.colorScheme) private var colorScheme
    var body: some View {
        GeometryReader { geometry in
            let rects = stockRects(items, in: CGRect(origin: .zero, size: geometry.size))
            ZStack(alignment: .topLeading) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    let rect = rects[index]
                    let change = item.raw["value"].array.last?.text ?? "0"
                    NavigationLink(value: item) {
                        VStack(spacing: 4) {
                            Text(item.title).channelText(12, weight: .medium, lineHeight: 14).lineLimit(1)
                            Text(change + "%").channelText(12, lineHeight: 14).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
                        }.frame(width: max(0, rect.width - 3), height: max(0, rect.height - 3))
                            .background((change.hasPrefix("-") ? Color.green : Color.red).opacity(colorScheme == .dark ? 0.28 : 0.14), in: .rect(cornerRadius: 8, style: .continuous)).clipped()
                    }.buttonStyle(.plain).offset(x: rect.minX, y: rect.minY)
                }
            }
        }.frame(height: height).accessibilityLabel("沪深板块热力图，面积代表市值，红涨绿跌")
    }
}

func stockRects(_ items: [NewsItem], in bounds: CGRect) -> [CGRect] {
    guard items.count > 1 else { return items.isEmpty ? [] : [bounds] }
    let weights = items.map { max(1, $0.raw["value"].array.first?.number ?? 1) }
    let total = weights.reduce(0, +)
    var split = 1, sum = weights[0]
    while split < items.count - 1 && sum < total / 2 { sum += weights[split]; split += 1 }
    let fraction = sum / total
    let horizontal = bounds.width > bounds.height
    let a = CGRect(x: bounds.minX, y: bounds.minY, width: horizontal ? bounds.width * fraction : bounds.width, height: horizontal ? bounds.height : bounds.height * fraction)
    let b = CGRect(x: horizontal ? a.maxX : bounds.minX, y: horizontal ? bounds.minY : a.maxY, width: horizontal ? bounds.width - a.width : bounds.width, height: horizontal ? bounds.height : bounds.height - a.height)
    return stockRects(Array(items[..<split]), in: a) + stockRects(Array(items[split...]), in: b)
}
