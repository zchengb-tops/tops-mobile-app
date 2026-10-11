import SwiftUI

struct DiscoveryView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var overviewProgress: CGFloat = 0
    var body: some View {
        @Bindable var store = store
        Group {
            if store.enabledChannels.isEmpty {
                ContentUnavailableView("开始你的每日阅读", systemImage: "square.stack.3d.up", description: Text("到「订阅」选择感兴趣的频道"))
            } else {
                ChannelOverviewHost(channels: store.enabledChannels, selection: $store.selectedChannel, progress: $overviewProgress)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .top, spacing: 0) {
          ZStack {
            if overviewProgress > 0 {
            HStack {
                Text("频道总览").font(.headline)
                Text("\(store.enabledChannels.count)").font(.subheadline).monospacedDigit().foregroundStyle(.secondary)
                Spacer()
                Button { setOverview(false) } label: {
                    Image(systemName: "xmark").font(.body.weight(.medium)).frame(width: 44, height: 44).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel("返回当前频道").accessibilityIdentifier("overview-close")
            }.padding(.leading, 20).padding(.trailing, 8)
                .opacity(overviewProgress).allowsHitTesting(overviewProgress == 1).accessibilityHidden(overviewProgress < 1)
            }
            if overviewProgress < 1 {
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
                                }.padding(.horizontal, 12).frame(minHeight: 44).contentShape(Capsule())
                                    .foregroundStyle(store.current?.id == channel.id ? Color.white : Color.primary)
                            }.buttonStyle(.plain).id(channel.id)
                                .anchorPreference(key: ChannelBoundsPreference.self, value: .bounds) { [channel.id: $0] }
                                .accessibilityIdentifier("tab-\(channel.id)")
                                .accessibilityAddTraits(store.current?.id == channel.id ? .isSelected : [])
                        }
                    }.padding(.horizontal, 4)
                        .backgroundPreferenceValue(ChannelBoundsPreference.self) { bounds in
                            GeometryReader { geometry in
                                if let anchor = bounds[store.current?.id ?? ""] {
                                    let frame = geometry[anchor]
                                    // Animate one persistent plate, not the labels or the entire scrolling rail.
                                    Capsule().fill(Color.infoHubSelection)
                                        .padding(.horizontal, 4).padding(.vertical, 3)
                                        .frame(width: frame.width, height: frame.height)
                                        .position(x: frame.midX, y: frame.midY)
                                        .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1), value: store.selectedChannel)
                                }
                            }.allowsHitTesting(false).accessibilityHidden(true)
                        }
                }.scrollIndicators(.hidden)
                    .onChange(of: store.selectedChannel) { _, id in
                        // The native nil anchor scrolls only enough to reveal an offscreen selection.
                        withAnimation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 1)) { proxy.scrollTo(id) }
                    }
                    .onAppear { proxy.scrollTo(store.selectedChannel) }
            }
                Menu {
                    Button("频道总览", systemImage: "square.grid.2x2") { setOverview(true) }
                        .accessibilityIdentifier("open-channel-overview")
                    Divider()
                    Picker("选择频道", selection: $store.selectedChannel) {
                        ForEach(store.enabledChannels) { channel in
                            Label {
                                Text(channel.title)
                            } icon: {
                                if let image = ChannelIcon.menuImage(for: channel) {
                                    Image(uiImage: image).accessibilityHidden(true)
                                }
                            }.tag(channel.id)
                        }
                    }.pickerStyle(.inline)
                } label: { Image(systemName: "ellipsis").frame(width: 44, height: 44).contentShape(Rectangle()) }
                    .accessibilityLabel("选择频道")
                    .accessibilityIdentifier("channel-menu")
                    .accessibilityHint("选择频道或查看频道总览；双指合拢也可进入总览")
          }.padding(4)
              .opacity(1 - overviewProgress).allowsHitTesting(overviewProgress == 0).accessibilityHidden(overviewProgress > 0)
            }
          }
              .frame(minHeight: 52)
              // Keep compact navigation readable; the feed still follows the full AX text range.
              .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
              .glassSurface(in: Capsule())
              .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 8)
              .zIndex(1)
        }
        // Apply to the whole inset/page host, not just an individual page.
        .ignoresSafeArea(.container, edges: .bottom)
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .navigationDestination(for: NewsItem.self) { item in
            if let url = item.url { ReaderView(url: url, title: item.title) }
        }
    }
    private func setOverview(_ visible: Bool) {
        withAnimation(reduceMotion ? .easeOut(duration: 0.16) : .spring(response: 0.36, dampingFraction: 1)) {
            overviewProgress = visible ? 1 : 0
        }
    }
}

private enum ChannelBoundsPreference: PreferenceKey {
    static let defaultValue: [String: Anchor<CGRect>] = [:]
    static func reduce(value: inout [String: Anchor<CGRect>], nextValue: () -> [String: Anchor<CGRect>]) {
        value.merge(nextValue()) { _, new in new }
    }
}

struct ChannelPager: View {
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
                                .accessibilityHidden(channel.id != selection)
                                .id(channel.id)
                        }
                    }.scrollTargetLayout()
                }
                .scrollTargetBehavior(.viewAligned(limitBehavior: .always))
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

struct ChannelFeed: View {
    let channel: Channel
    var previewHeight: CGFloat?
    private var preview: Bool { previewHeight != nil }
    @Environment(AppStore.self) private var store
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.appFooterHeight) private var footerHeight
    @State private var arenaSection = "rank"
    @State private var showsBackToTop = false
    private var density: FeedDensity { store.feedDensity }
    private var previewItemLimit: Int? { previewHeight.map { Int(ceil(max(0, $0) / 44)) + 1 } }
    @ViewBuilder
    var body: some View {
        if let previewHeight {
            // Eager, viewport-bounded content avoids lazy scroll-view culling after scaling.
            VStack(spacing: 0) { feedContent(viewportHeight: previewHeight) }
                .padding(.top, channel.code == "history" ? 20 : 4).padding(.bottom, 24)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
                .frame(height: previewHeight, alignment: .top)
                .clipped().background(Color(uiColor: .systemBackground))
        } else {
          GeometryReader { viewport in
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 0) { feedContent(viewportHeight: viewport.size.height) }
                        .padding(.top, channel.code == "history" ? 20 : 4).padding(.bottom, 24)
                        .id("feed-top-\(channel.id)")
                        .onGeometryChange(for: Bool.self) { geometry in
                            geometry.frame(in: .named("feed-scroll-\(channel.id)")).minY < -240
                        } action: { showsBackToTop = $0 }
                }
                .coordinateSpace(name: "feed-scroll-\(channel.id)")
                .avoidsAppFooter()
                .background(Color(uiColor: .systemBackground).ignoresSafeArea())
                .refreshable { await store.refresh() }
                .accessibilityIdentifier("feed-\(channel.id)")
                .accessibilityValue(density.title)
                .overlay(alignment: .bottomTrailing) {
                    if showsBackToTop {
                        Button {
                            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.25)) {
                                proxy.scrollTo("feed-top-\(channel.id)", anchor: .top)
                            }
                        } label: {
                            Image(systemName: "arrow.up.to.line")
                                .font(.body.weight(.medium)).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                                .frame(width: 44, height: 44)
                                .contentShape(Circle())
                        }
                        .buttonStyle(.plain).glassSurface(in: Circle())
                        .accessibilityLabel("回到顶部")
                        .accessibilityIdentifier("back-to-top-\(channel.id)")
                        .padding(.trailing, 20).padding(.bottom, footerHeight + 12)
                    }
                }
            }
          }
        }
    }
    @ViewBuilder private func feedContent(viewportHeight: CGFloat) -> some View {
        if channel.code == "featured", !channel.isRSS {
            FeaturedContent(previewHeight: previewHeight)
        } else if channel.code == "github", !channel.isRSS {
            GithubContent(previewItemLimit: previewItemLimit)
        } else if channel.code == "artificialAnalysis", !channel.isRSS {
            AnalysisContent(preview: preview)
        } else {
            if channel.code == "arena" {
                VStack(alignment: .leading, spacing: 8) {
                    ViewThatFits(in: .horizontal) {
                        HStack { arenaTitle; Spacer(minLength: 8); methodology }
                        VStack(alignment: .leading, spacing: 4) { arenaTitle; methodology }
                    }
                    Text("基于真实 Agent Mode 任务数据，模型通过随机分配参与评测；榜单综合任务成功、用户反馈、纠错能力与工具调用表现，衡量其在实际工作场景中的综合能力。").channelText(11, lineHeight: 16).foregroundStyle(.secondary)
                    let models = store.items(for: channel).filter { $0.properties["section"].text == "rank" }
                    let count = store.items(for: channel).filter { $0.properties["section"].text == arenaSection }.count
                    let date = newsDate(models.first?.properties["publishDate"].text ?? "")
                    Text("\(date?.formatted(.dateTime.month(.abbreviated).day().year().locale(Locale(identifier: "en_US"))) ?? "") · \(Int(models.reduce(0) { $0 + $1.properties["sessions"].number }).formatted()) sessions · \(count) \(arenaSection == "rank" ? "models" : "labs")")
                        .channelText(11, lineHeight: 14).monospacedDigit().foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    Picker("排行榜", selection: $arenaSection) {
                        Text("Models").tag("rank"); Text("Labs").tag("lab")
                    }.pickerStyle(.segmented).frame(maxWidth: dynamicTypeSize.isAccessibilitySize ? .infinity : 148)
                        .frame(maxWidth: .infinity, alignment: .trailing).padding(.top, 4)
                }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.top, 16)
            }
            let allItems = store.items(for: channel).filter { channel.code != "arena" || $0.properties["section"].text == arenaSection }
            let items = preview && channel.code != "stock" ? Array(allItems.prefix(previewItemLimit ?? allItems.count)) : allItems
            if items.isEmpty {
                if store.loading { ProgressView("正在汇集最新资讯…").frame(maxWidth: .infinity, minHeight: 300) }
                else { ContentUnavailableView("暂无资讯", systemImage: "newspaper", description: Text("下拉刷新，或选择其他频道")) }
            } else if channel.code == "stock" {
                VStack(spacing: 0) {
                    Text("*更新于 \(items.first?.stockUpdateTime ?? "未知时间") 北京")
                        .channelText(12).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20).padding(.vertical, 12).accessibilityIdentifier("stock-updated")
                    StockMap(items: items).padding(.horizontal, 16)
                }
                // Leave room for the shared footer, scroll margin and feed padding, even in short windows.
                .frame(height: max(0, viewportHeight - footerHeight - 44))
            } else {
                if channel.code == "tiobe" {
                    TiobeRow(item: nil).padding(.horizontal, 20).padding(.vertical, 12)
                    Divider().padding(.horizontal, 20)
                }
                let dates = channel.isRSS ? items.compactMap(\.publicationDate) : []
                let sameDay = dates.count == items.count && dates.first.map { first in dates.allSatisfy { Calendar.current.isDate($0, inSameDayAs: first) } } == true
                ForEach(items) { item in
                    NewsRow(item: item, channel: channel.isRSS ? "rss" : channel.code, density: density, rssShowsTime: sameDay)
                        .frame(minHeight: preview ? 44 : nil)
                        .accessibilityIdentifier("news-\(channel.code)-\(item.index)")
                    if !channel.isRSS, ["zhihu", "sspai", "nnGroup", "tiobe", "arena"].contains(channel.code), item.id != items.last?.id {
                        Divider().opacity(0.45).padding(.horizontal, 20)
                    }
                }
                if channel.code == "arena" {
                    Link("View on arena.ai", destination: URL(string: "https://arena.ai/leaderboard/agent")!)
                        .channelText(12).foregroundStyle(.secondary).frame(minHeight: 44).padding(.top, 12)
                }
            }
        }
    }
    private var arenaTitle: some View { Text("Agent Arena").channelText(24, lineHeight: 28, family: "Georgia").tracking(-0.7).fixedSize(horizontal: true, vertical: false) }
    private var methodology: some View {
        Link(destination: URL(string: "https://arena.ai/blog/agent-arena-methodology/")!) {
            Label("View Methodology", systemImage: "arrow.up.right").channelText(11, weight: .medium, lineHeight: 14)
                .padding(.horizontal, 8).padding(.vertical, 6).background(.quaternary, in: Capsule()).frame(minHeight: 44).contentShape(Rectangle())
        }.fixedSize(horizontal: true, vertical: false)
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

extension View {
    func channelText(_ size: CGFloat, weight: Font.Weight = .regular, lineHeight: CGFloat? = nil, family: String? = nil) -> some View {
        modifier(ChannelTextStyle(size, weight: weight, lineHeight: lineHeight, family: family))
    }
}

struct NewsRow: View {
    let item: NewsItem
    let channel: String
    var density: FeedDensity = .standard
    var rssShowsTime = false
    var source: Channel? = nil
    var isOverview = false
    @Environment(AppStore.self) private var store
    @Environment(PodcastPlayer.self) private var player
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.colorScheme) private var colorScheme
    @ScaledMetric(relativeTo: .body) private var rankDiameter = 22.0
    private var titleSize: CGFloat { ["36kr", "nnGroup", "bilibili"].contains(channel) ? 14 : channel == "arena" ? 13 : 16 }
    private var titleWeight: Font.Weight { ["36kr", "nnGroup"].contains(channel) ? .medium : channel == "arena" ? .semibold : .regular }
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
    private var title: some View {
        var text = AttributedString(item.title)
        if channel == "sspai", item.raw["morningPaper"].flag, let prefix = text.range(of: "派早报") {
            text[prefix].foregroundColor = Color(red: 223 / 255, green: 72 / 255, blue: 73 / 255)
        }
        return Text(text).channelText(titleSize, weight: titleWeight, lineHeight: titleLineHeight)
            .accessibilityIdentifier("\(channel)-title-\(item.index)")
    }
    var body: some View {
        row
        .contextMenu { if let url = item.url { ShareLink(item: url, subject: Text(item.title)); Link("在浏览器打开", destination: url) } }
    }
    private var row: some View {
        HStack(alignment: .center, spacing: 10) {
            if source != nil {
                content.frame(maxWidth: .infinity, alignment: .leading)
            } else {
                NavigationLink(value: item) {
                    content.frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
                }.buttonStyle(.plain)
            }
            if item.audio != nil {
                let current = player.item?.id == item.id
                let playing = current && player.isPlaying
                Button {
                    if player.item?.id == item.id { player.toggle() } else { player.play(item) }
                } label: {
                    Image(systemName: playing ? "pause.fill" : "play.fill").font(.system(size: 16))
                        .foregroundStyle(playing ? Color.orange : .primary)
                        .frame(width: 36, height: 36).background(playing ? Color.orange.opacity(0.12) : Color(uiColor: .quaternarySystemFill), in: Circle())
                        .overlay {
                            Circle().trim(from: 0, to: current && player.duration > 0 ? min(1, max(0, player.position / player.duration)) : 0)
                                .stroke(.orange, lineWidth: 2).rotationEffect(.degrees(-90)).accessibilityHidden(true)
                        }.frame(width: 44, height: 44).contentShape(Rectangle())
                }.buttonStyle(.plain)
                    .accessibilityLabel(playing ? "暂停" : "播放")
            }
        }.padding(.horizontal, channel == "history" ? 24 : 20)
            .padding(.vertical, isOverview && channel == "sina" && !dynamicTypeSize.isAccessibilitySize ? 0 :
                        source != nil ? 8 : channel == "history" ? 0 : channel == "sina" ? (density == .compact ? 2 : density == .spacious ? 12 : 4) : (density == .compact ? 10 : density == .spacious ? 24 : 16))
    }
    @ViewBuilder private func articleCopy<Copy: View>(@ViewBuilder _ copy: () -> Copy) -> some View {
        if let source {
            VStack(alignment: .leading, spacing: 0) {
                Button { store.selectedChannel = source.id } label: {
                    HStack(spacing: 6) {
                        ChannelIcon(channel: source).frame(width: 15, height: 15)
                        Text(source.title).channelText(11).foregroundStyle(.secondary)
                    }.frame(minWidth: 44, minHeight: 44, alignment: .leading).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel("查看\(source.title)频道")
                    .accessibilityIdentifier("featured-source-\(source.id)-\(item.index)")
                NavigationLink(value: item) { copy().contentShape(Rectangle()) }.buttonStyle(.plain)
            }.frame(maxWidth: .infinity, alignment: .leading)
        } else { copy() }
    }
    @ViewBuilder private func articleCover<Cover: View>(@ViewBuilder _ cover: () -> Cover) -> some View {
        if source != nil {
            NavigationLink(value: item) { cover() }.buttonStyle(.plain)
                .accessibilityLabel("阅读\(item.title)")
                .accessibilityIdentifier("featured-cover-\(channel)-\(item.index)")
        } else { cover() }
    }
    private func articleThumbnail<Cover: View>(width: CGFloat, height: CGFloat, cornerRadius: CGFloat, @ViewBuilder _ cover: () -> Cover) -> some View {
        let thumbnail = cover()
        return articleCover {
            // Overview covers fill the text-driven row; complete feeds retain their fixed dimensions.
            Color.clear.frame(width: source == nil ? width : 140)
                .frame(minHeight: source == nil ? height : 94, maxHeight: source == nil ? height : .infinity).overlay {
                GeometryReader { geometry in
                    thumbnail.frame(width: geometry.size.width, height: geometry.size.height)
                        .clipShape(.rect(cornerRadius: cornerRadius, style: .continuous))
                }
            }.clipped().contentShape(Rectangle())
        }
    }
    @ViewBuilder private var content: some View {
        if channel == "sina" {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 5) {
                    rank
                    title.fixedSize(horizontal: false, vertical: true)
                    sinaHeat
                }.frame(maxWidth: .infinity, alignment: .leading)
            } else {
                HStack(alignment: .center, spacing: 12) {
                    rank
                    title.lineLimit(density == .spacious ? nil : density == .compact ? 2 : 3)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                    sinaHeat.fixedSize(horizontal: true, vertical: false)
                }.frame(minHeight: 44)
            }
        } else if channel == "tiobe" {
            TiobeRow(item: item)
        } else if channel == "arena" {
            ArenaRow(item: item)
        } else if channel == "history" {
            HStack(alignment: .top, spacing: 12) {
                Circle().fill(Color(red: 0.89, green: 0.40, blue: 0.01)).frame(width: 8, height: 8).padding(.top, 6).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.raw["year"].text + "年").channelText(14).foregroundStyle(.secondary)
                    title.fixedSize(horizontal: false, vertical: true)
                    if !item.summary.isEmpty {
                        Text(item.summary).channelText(14, lineHeight: 20).foregroundStyle(.secondary)
                            .lineLimit(density == .compact && !dynamicTypeSize.isAccessibilitySize ? 2 : nil).fixedSize(horizontal: false, vertical: true)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }.padding(.bottom, 24).background(alignment: .leading) {
                Rectangle().fill(Color(uiColor: .separator).opacity(0.45)).frame(width: 1).offset(x: 4).accessibilityHidden(true)
            }
        } else if channel == "rss" {
            articleCopy {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    if source == nil { Circle().fill(.orange).frame(width: 8, height: 8).accessibilityHidden(true) }
                    if dynamicTypeSize.isAccessibilitySize || density == .spacious {
                        VStack(alignment: .leading, spacing: 6) { title.fixedSize(horizontal: false, vertical: true); rssDate }
                    } else {
                        title.lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                        rssDate.fixedSize()
                    }
                }.frame(minHeight: 44)
            }
        } else if channel == "sspai", density != .spacious, !dynamicTypeSize.isAccessibilitySize {
            // Keep the original image-left reading layout; density changes composition, not type size.
            HStack(alignment: .center, spacing: 14) {
                if item.image != nil {
                    articleThumbnail(width: density == .compact || source != nil ? 88 : 132,
                                     height: density == .compact || source != nil ? 66 : 96, cornerRadius: 10) {
                        Artwork(url: item.image, symbol: "photo")
                    }
                }
                articleCopy {
                    VStack(alignment: .leading, spacing: density == .compact ? 8 : 12) {
                        title.lineLimit(3).fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("sspai-title-\(item.index)")
                        editorialMetadata
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
            }.fixedSize(horizontal: false, vertical: source != nil)
        } else if ["sspai", "bilibili", "36kr"].contains(channel), density == .spacious || dynamicTypeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 12) {
                if item.image != nil {
                    articleCover {
                        GeometryReader { geometry in
                            Artwork(url: item.image, symbol: channel == "bilibili" ? "play.rectangle" : "photo")
                                .frame(width: geometry.size.width, height: geometry.size.height)
                                .clipShape(.rect(cornerRadius: 12, style: .continuous))
                        }.aspectRatio(density == .spacious ? 4 / 3 : 16 / 9, contentMode: .fit)
                    }
                }
                articleCopy {
                    VStack(alignment: .leading, spacing: 12) {
                        title.lineLimit(dynamicTypeSize.isAccessibilitySize || density == .spacious ? nil : 3)
                            .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("\(channel)-title-\(item.index)")
                        if channel == "36kr" { krMetadata } else { editorialMetadata }
                        if !isOverview, !item.summary.isEmpty, channel != "sspai" || density == .spacious {
                            Text(item.summary).channelText(channel == "36kr" ? 12 : 14, lineHeight: channel == "36kr" ? 16 : 20)
                                .foregroundStyle(.secondary).lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 4)
                                .accessibilityIdentifier("\(channel)-summary-\(item.index)")
                        }
                    }
                }
            }
        } else if channel == "bilibili" {
            HStack(alignment: .center, spacing: 10) {
                Artwork(url: item.image, symbol: "play.rectangle")
                    .frame(width: density == .compact ? 108 : 150, height: density == .compact ? 66 : 90)
                    .clipShape(.rect(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 8) {
                    title.lineLimit(2).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    editorialMetadata
                }.frame(maxWidth: .infinity, minHeight: density == .compact ? 66 : 90, alignment: .leading)
            }
        } else if channel == "36kr" {
            HStack(alignment: .center, spacing: 14) {
                articleThumbnail(width: density == .compact || source != nil ? 108 : 160,
                                 height: density == .compact || source != nil ? 72 : 100, cornerRadius: 4) {
                    if item.image != nil {
                        Artwork(url: item.image)
                    } else {
                        Image("channel-36kr").resizable().scaledToFit().frame(width: 28, height: 28)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(.quaternary).accessibilityHidden(true)
                    }
                }
                articleCopy {
                    VStack(alignment: .leading, spacing: source == nil ? 8 : 0) {
                        title.lineLimit(2).fixedSize(horizontal: false, vertical: true)
                        if !isOverview, !item.summary.isEmpty, density != .compact {
                            Text(item.summary).channelText(12, lineHeight: 16).foregroundStyle(.secondary).lineLimit(1)
                                .accessibilityIdentifier("36kr-summary-\(item.index)")
                        }
                        if source != nil {
                            // Balance the 44pt source action above the title, keeping metadata at the bottom.
                            Color.clear.frame(height: 44).overlay(alignment: .bottomLeading) { krMetadata }
                        } else { krMetadata }
                    }.frame(maxWidth: .infinity, minHeight: source != nil ? 0 : density == .compact ? 72 : 100, alignment: .leading)
                }
            }.fixedSize(horizontal: false, vertical: source != nil)
        } else if channel == "xiaoyuzhou" {
            HStack(alignment: .center, spacing: 14) {
                if !dynamicTypeSize.isAccessibilitySize {
                    Artwork(url: item.image, symbol: "headphones")
                        .frame(width: density == .compact ? 60 : 90, height: density == .compact ? 60 : 90)
                        .clipShape(.rect(cornerRadius: 4))
                }
                VStack(alignment: .leading, spacing: 6) {
                    title.lineLimit(dynamicTypeSize.isAccessibilitySize || density == .spacious ? nil : 2).fixedSize(horizontal: false, vertical: true).foregroundStyle(.primary)
                    Label(item.raw["author"].text, systemImage: "person").lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
                    Label(item.durationText, systemImage: "clock")
                }.channelText(14).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
            }.foregroundStyle(.primary)
        } else if channel == "doubanMovie" {
            HStack(alignment: .center, spacing: 12) {
                if !dynamicTypeSize.isAccessibilitySize { rank }
                Artwork(url: item.image, symbol: "film").frame(width: density == .compact ? 56 : 80, height: density == .compact ? 84 : 120)
                    .clipShape(.rect(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 12) {
                    if dynamicTypeSize.isAccessibilitySize { rank }
                    title.lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 3).fixedSize(horizontal: false, vertical: true)
                    Text([item.raw["publishDate"].text, item.raw["region"].text, item.raw["type"].text].filter { !$0.isEmpty }.joined(separator: " / "))
                        .channelText(12).foregroundStyle(.secondary).lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 2)
                    movieRating
                }.frame(maxWidth: .infinity, alignment: .leading).padding(.leading, 4)
            }
        } else if channel == "nnGroup" {
            HStack(alignment: .center, spacing: 12) {
                articleCopy {
                    VStack(alignment: .leading, spacing: 6) {
                        title.lineLimit(dynamicTypeSize.isAccessibilitySize || density == .spacious ? nil : 2).fixedSize(horizontal: false, vertical: true)
                        Text([item.raw["publishDate"].text, item.raw["consumingTime"].text].filter { !$0.isEmpty }.joined(separator: " | "))
                            .channelText(14).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                        if !isOverview, !item.summary.isEmpty, density != .compact {
                            Text(item.summary).channelText(14, lineHeight: 20).foregroundStyle(.secondary)
                                .lineLimit(dynamicTypeSize.isAccessibilitySize || density == .spacious ? nil : 3).fixedSize(horizontal: false, vertical: true)
                                .accessibilityIdentifier("nnGroup-summary-\(item.index)")
                        }
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
                if let image = item.image, !dynamicTypeSize.isAccessibilitySize {
                    articleThumbnail(width: density == .compact ? 88 : 120,
                                     height: density == .compact ? 66 : 88, cornerRadius: 4) {
                        Artwork(url: image).overlay {
                                Image(systemName: "play.fill").font(.system(size: 16)).foregroundStyle(.white)
                                    .frame(width: 36, height: 36).background(.black.opacity(0.5), in: Circle()).accessibilityHidden(true)
                            }
                    }
                }
            }.fixedSize(horizontal: false, vertical: source != nil)
        } else {
            HStack(alignment: .center, spacing: 12) {
                if !dynamicTypeSize.isAccessibilitySize { rank }
                VStack(alignment: .leading, spacing: 5) {
                    if dynamicTypeSize.isAccessibilitySize { rank }
                    title.lineLimit(dynamicTypeSize.isAccessibilitySize || density == .spacious ? nil : density == .compact ? 2 : 4)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(item.properties["metrics"].text).channelText(14).foregroundStyle(.secondary)
                }.frame(maxWidth: .infinity, alignment: .leading)
                if let image = item.image, image.absoluteString != "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg", !dynamicTypeSize.isAccessibilitySize {
                    Artwork(url: image).frame(width: 60, height: 60).clipShape(.rect(cornerRadius: 4))
                }
            }
        }
    }
    private var krMetadata: some View {
        VStack(alignment: .leading, spacing: 4) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 8) { krAuthor; krTime }.fixedSize(horizontal: true, vertical: false)
                VStack(alignment: .leading, spacing: 4) { krAuthor; krTime }
            }
        }.channelText(11, lineHeight: 16).foregroundStyle(.secondary)
            .accessibilityElement(children: .combine).accessibilityIdentifier("36kr-metadata-\(item.index)")
    }
    private var krAuthor: some View { Label(item.properties["author"].text, systemImage: "person") }
    private var krTime: some View { Label(publicationTime(item.properties.first("publishDate", "publishTime")), systemImage: "clock").monospacedDigit() }
    private var rssDate: some View {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = rssShowsTime ? "HH:mm" : "MM-dd"
        return Text(item.publicationDate.map(formatter.string(from:)) ?? "").channelText(14).monospacedDigit().foregroundStyle(.secondary)
    }
    @ViewBuilder private var movieRating: some View {
        if item.ratingStars.isEmpty {
            Text("暂无评分").channelText(14).foregroundStyle(.secondary)
        } else {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 8) { movieStars; Text(item.raw["rate"].text).channelText(14) }.fixedSize(horizontal: true, vertical: false)
                VStack(alignment: .leading, spacing: 6) { movieStars; Text(item.raw["rate"].text).channelText(14) }
            }.foregroundStyle(.secondary).accessibilityElement(children: .ignore)
                .accessibilityLabel("评分 \(item.raw["rate"].text) 分，满分 10 分").accessibilityIdentifier("doubanMovie-rating-\(item.index)")
        }
    }
    private var movieStars: some View {
        HStack(spacing: 1) {
            ForEach(Array(item.ratingStars.enumerated()), id: \.offset) { _, symbol in
                Image(systemName: symbol).foregroundStyle(symbol == "star" ? Color.secondary.opacity(0.25) : movieStarColor(item.raw["rate"].number))
            }
        }.channelText(16).accessibilityHidden(true)
    }
    @ViewBuilder private var sinaHeat: some View {
        let count = compactCount(item.properties["viewers"].number)
        Text(count).channelText(dynamicTypeSize.isAccessibilitySize ? 12 : 13,
                               weight: dynamicTypeSize.isAccessibilitySize ? .regular : .medium)
            .monospacedDigit().foregroundStyle(.secondary)
            .accessibilityLabel("热度，\(count)").accessibilityIdentifier("sina-heat-\(item.index)")
    }
    @ViewBuilder private var editorialMetadata: some View {
        if channel == "sspai" {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 0) { publishDate; Spacer(minLength: 12); editorialCounts }
                VStack(alignment: .leading, spacing: 6) { publishDate; editorialCounts }
            }.channelText(12).monospacedDigit().foregroundStyle(.secondary)
                .accessibilityElement(children: .combine).accessibilityIdentifier("sspai-metadata-\(item.index)")
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Label(item.properties["owner"].text, systemImage: "person").channelText(12).lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 8) { videoViews; videoLikes }.fixedSize(horizontal: true, vertical: false)
                    VStack(alignment: .leading, spacing: 4) { videoViews; videoLikes }
                }.channelText(12)
            }.foregroundStyle(.secondary)
                .accessibilityElement(children: .combine).accessibilityIdentifier("bilibili-metadata-\(item.index)")
        }
    }
    private var videoViews: some View { Label(compactCount(item.properties["view"].number), systemImage: "play").accessibilityLabel("播放 \(compactCount(item.properties["view"].number))") }
    private var videoLikes: some View { Label(compactCount(item.properties["like"].number), systemImage: "hand.thumbsup").accessibilityLabel("点赞 \(compactCount(item.properties["like"].number))") }
    private var publishDate: some View { Text(item.raw["publishDate"].text).fixedSize() }
    private var editorialCounts: some View {
        HStack(spacing: 12) {
            Label(item.raw["likeCount"].text, systemImage: "bolt")
                .accessibilityLabel("点赞 \(item.raw["likeCount"].text)")
            Label(item.raw["commentCount"].text, systemImage: "bubble.right")
                .accessibilityLabel("评论 \(item.raw["commentCount"].text)")
        }.fixedSize(horizontal: true, vertical: false)
    }
    @ViewBuilder private var rank: some View {
        let top = (Int(item.rank) ?? 99) <= 3
        let colors = [["sina", "zhihu"].contains(channel) ? Color(red: 0.87, green: 0.28, blue: 0.29) : Color(red: 0.90, green: 0.47, blue: 0), Color(red: 0.96, green: 0.62, blue: 0), Color(red: 0.98, green: 0.77, blue: 0.1)]
        let color = colors[max(0, min(2, (Int(item.rank) ?? 1) - 1))]
        if channel == "sina" || isOverview && channel == "zhihu" {
            let position = Int(item.rank) ?? item.index + 1
            let featured = (1...3).contains(position)
            Text(String(position))
                .channelText(16, weight: featured ? .semibold : .regular).monospacedDigit()
                .foregroundStyle(featured ? colors[position - 1] : .secondary)
                .frame(width: rankDiameter + 6)
                .accessibilityLabel("第 \(position) 名").accessibilityIdentifier("\(channel)-rank-\(item.index)")
        } else if channel == "zhihu" {
            Text(String(format: "%02d", Int(item.rank) ?? item.index + 1))
                .channelText(16, weight: .bold)
                .monospacedDigit().foregroundStyle(top ? color : .secondary)
                .accessibilityIdentifier("zhihu-rank-\(item.index)")
        } else {
            Text(item.rank).channelText(12)
                .foregroundStyle(top ? Color.white : Color.secondary)
                .frame(width: rankDiameter * 18 / 22, height: rankDiameter * 18 / 22)
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
                    Text("变化 \(item.properties["change"].text)").foregroundStyle(item.properties["isUp"].flag ? Color.green : .red)
                }
            }.channelText(14).monospacedDigit().frame(maxWidth: .infinity, alignment: .leading)
        } else {
            HStack(spacing: 6) {
                Text(item?.rank ?? monthLabel(yearOffset: 0)).frame(width: 44)
                Text(item?.properties["rankOfMonthLastYear"].text ?? monthLabel(yearOffset: -1)).frame(width: 44)
                Text(item?.title ?? "语言").channelText(14, weight: .medium).lineLimit(2).frame(maxWidth: .infinity)
                Text(item?.properties["ratings"].text ?? "占比").frame(width: 64)
                Text(item?.properties["change"].text ?? "变化").frame(width: 64)
                    .foregroundStyle(item.map { $0.properties["isUp"].flag ? Color.green : .red } ?? .secondary)
            }.channelText(14).monospacedDigit().foregroundStyle(item == nil ? Color.secondary : .primary)
        }
    }
    private func monthLabel(yearOffset: Int) -> String {
        let date = Calendar.current.date(byAdding: .year, value: yearOffset, to: .now) ?? .now
        return date.formatted(.dateTime.month(.abbreviated).year().locale(Locale(identifier: "en_US"))).replacingOccurrences(of: " ", with: "\n")
    }
}

struct ArenaRow: View {
    let item: NewsItem
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    private var vendor: String {
        let key = (item.properties["section"].text == "lab" ? item.title : item.properties["vendor"].text).lowercased().replacingOccurrences(of: " ", with: "")
        return ["spacexai": "xai", "z.ai": "zai", "zhipu": "zai", "thinkingmachines": "thinky"][key] ?? key
    }
    private var vendorName: String {
        ["alibaba": "Alibaba", "anthropic": "Anthropic", "deepseek": "DeepSeek", "google": "Google", "meta": "Meta", "minimax": "MiniMax", "moonshot": "Moonshot", "nvidia": "Nvidia", "openai": "OpenAI", "tencent": "Tencent", "thinky": "Thinky", "xai": "SpaceXAI", "xiaomi": "Xiaomi", "zai": "Z.ai"][vendor]
            ?? (item.properties["section"].text == "lab" ? item.title : item.properties["vendor"].text.capitalized)
    }
    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(spacing: 4) {
                let position = Int(item.rank) ?? 99
                let colors = [Color(red: 230 / 255, green: 119 / 255, blue: 0), Color(red: 245 / 255, green: 159 / 255, blue: 0), Color(red: 252 / 255, green: 196 / 255, blue: 25 / 255)]
                Text(item.rank).channelText(15, weight: .bold, lineHeight: 16).monospacedDigit()
                    .foregroundStyle((1...3).contains(position) ? colors[position - 1] : .primary)
                let delta = Int(item.properties["delta"].number)
                Text(delta == 0 ? "—" : "\(delta > 0 ? "▲" : "▼")\(abs(delta))")
                    .channelText(9, weight: .semibold, lineHeight: 11).foregroundStyle(delta == 0 ? Color.secondary : delta < 0 ? .red : .green)
            }.frame(minWidth: 26)
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 12) { identity; ArenaMetrics(item: item) }
            } else {
                identity.frame(maxWidth: .infinity, alignment: .leading)
                ArenaMetrics(item: item).frame(width: 118)
            }
        }
    }
    private var identity: some View {
        HStack(spacing: 10) {
            Group {
                // ponytail: bundled original SVGs; new/unavailable vendors use initials until an asset is added.
                if UIImage(named: "arena-\(vendor)") != nil {
                    Image("arena-\(vendor)").resizable().scaledToFit().foregroundStyle(.primary)
                } else {
                    Text(String(vendorName.prefix(1))).channelText(12, weight: .semibold).frame(maxWidth: .infinity, maxHeight: .infinity).background(.quaternary, in: .rect(cornerRadius: 5))
                }
            }.frame(width: 22, height: 22).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(item.properties["section"].text == "lab" ? vendorName : item.title).channelText(13, weight: .semibold, lineHeight: 16)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 2).fixedSize(horizontal: false, vertical: true)
                Text(item.properties["section"].text == "lab" ? item.properties["bestModel"].text : vendorName)
                    .channelText(10, lineHeight: 13).foregroundStyle(.secondary).lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct ArenaMetrics: View {
    let item: NewsItem
    @Environment(\.colorScheme) private var colorScheme
    private let metrics = [("score", "Net"), ("confirmedSuccess", "Success"), ("praiseComplaint", "Praise"), ("steerability", "Steer")]
    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 2), alignment: .leading, spacing: 8) { cells }
    }
    @ViewBuilder private var cells: some View {
        ForEach(metrics, id: \.0) { key, title in
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased()).channelText(8, lineHeight: 10).underline().foregroundStyle(.secondary)
                Text(item.properties[key] == .null ? "—" : String(format: "%.1f%%", item.properties[key].number * 100) + (item.properties[key].number > 0 ? " ▲" : item.properties[key].number < 0 ? " ▼" : ""))
                    .channelText(11, weight: .semibold, lineHeight: 14).monospacedDigit()
                    .foregroundStyle(item.properties[key] == .null || item.properties[key].number == 0 ? Color.secondary : item.properties[key].number < 0
                        ? (colorScheme == .dark ? .red : Color(red: 0.70, green: 0.17, blue: 0.16))
                        : (colorScheme == .dark ? .green : Color(red: 0.15, green: 0.43, blue: 0.23)))
            }.frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .combine)
        }
    }
}

struct StockMap: View {
    let items: [NewsItem]
    var height: CGFloat?
    @Environment(\.colorScheme) private var colorScheme
    var body: some View {
        GeometryReader { geometry in
            let rects = stockRects(items, in: CGRect(origin: .zero, size: geometry.size))
            ZStack(alignment: .topLeading) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    let rect = rects[index]
                    let change = item.raw["value"].array.last?.text ?? "0"
                    let value = Double(change) ?? 0
                    NavigationLink(value: item) {
                        VStack(spacing: 4) {
                            Text(item.title).channelText(12, weight: .medium, lineHeight: 14).lineLimit(1)
                            Text(change + "%").channelText(12, lineHeight: 14).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
                                .foregroundStyle(stockChangeColor(value, colorScheme: colorScheme))
                        }.frame(width: max(0, rect.width - 3), height: max(0, rect.height - 3))
                            .background(stockBackground(value, colorScheme: colorScheme), in: .rect(cornerRadius: 2)).clipped()
                    }.buttonStyle(.plain).offset(x: rect.minX, y: rect.minY)
                        .accessibilityIdentifier("stock-sector-\(item.index)")
                }
            }
        }.frame(height: height).accessibilityLabel("沪深板块热力图，面积代表市值，红涨绿跌")
    }
}

func movieStarColor(_ rate: Double) -> Color {
    // Extension's five-star thresholds 2 / 4 correspond to scores 4 / 8.
    if rate <= 4 { return Color(red: 153.0 / 255, green: 169.0 / 255, blue: 191.0 / 255) }
    if rate < 8 { return Color(red: 247.0 / 255, green: 186.0 / 255, blue: 42.0 / 255) }
    return Color(red: 1, green: 153.0 / 255, blue: 0)
}

func stockBackground(_ change: Double, colorScheme: ColorScheme = .light) -> Color {
    let rgb: (Double, Double, Double)
    switch change {
    case ..<(-3): rgb = colorScheme == .dark ? (44, 93, 73) : (206, 234, 219)
    case ..<(-1): rgb = colorScheme == .dark ? (33, 68, 57) : (226, 242, 233)
    case ..<0: rgb = colorScheme == .dark ? (29, 49, 44) : (240, 249, 244)
    case 0: rgb = colorScheme == .dark ? (43, 45, 49) : (225, 229, 233)
    case ...1: rgb = colorScheme == .dark ? (54, 33, 39) : (255, 240, 242)
    case ...3: rgb = colorScheme == .dark ? (77, 40, 47) : (255, 228, 230)
    default: rgb = colorScheme == .dark ? (109, 50, 60) : (254, 208, 213)
    }
    return Color(red: rgb.0 / 255, green: rgb.1 / 255, blue: rgb.2 / 255)
}

func stockChangeColor(_ change: Double, colorScheme: ColorScheme) -> Color {
    if change == 0 { return Color(white: colorScheme == .dark ? 0.70 : 0.38) }
    if change < 0 { return colorScheme == .dark ? Color(red: 0.49, green: 0.88, blue: 0.69) : Color(red: 0.15, green: 0.43, blue: 0.23) }
    return colorScheme == .dark ? Color(red: 1, green: 0.60, blue: 0.58) : Color(red: 0.70, green: 0.17, blue: 0.16)
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
