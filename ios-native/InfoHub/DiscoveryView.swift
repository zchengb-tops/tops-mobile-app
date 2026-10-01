import SwiftUI

struct DiscoveryView: View {
    @Environment(AppStore.self) private var store
    @State private var arenaSection = "rank"
    var body: some View {
        @Bindable var store = store
        ScrollViewReader { proxy in
            ScrollView {
              LazyVStack(spacing: 0) {
                Color.clear.frame(height: 0).id("top")
                if let channel = store.current {
                    if channel.code == "arena" {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Agent Arena").font(.system(.title2, design: .serif).bold())
                            Text("Dynamic ranking of models for real-world agentic tasks, based on tool reliability, task completion, and steerability.").font(.caption).foregroundStyle(.secondary)
                            let models = store.items(for: channel).filter { $0.properties["section"].text == "rank" }
                            Text("\(models.first?.properties["publishDate"].text ?? "") · \(Int(models.reduce(0) { $0 + $1.properties["sessions"].number }).formatted()) sessions · \(models.count) models")
                                .font(.caption2).foregroundStyle(.secondary)
                            Link("View Methodology ↗", destination: URL(string: "https://arena.ai/blog/agent-arena-methodology/")!).font(.caption)
                        }.frame(maxWidth: .infinity, alignment: .leading).padding(16)
                        Picker("排行榜", selection: $arenaSection) {
                            Text("Models").tag("rank"); Text("Labs").tag("lab")
                        }.pickerStyle(.segmented).padding(.horizontal, 16).padding(.bottom, 12)
                    }
                    let items = store.items(for: channel).filter {
                        (channel.code != "arena" || $0.properties["section"].text == arenaSection)
                    }
                    if channel.code == "tiobe" { TiobeRow(item: nil).padding(.horizontal, 16).padding(.vertical, 12) }
                    if items.isEmpty {
                        if store.loading { ProgressView("正在汇集最新资讯…").frame(maxWidth: .infinity, minHeight: 300) }
                        else { ContentUnavailableView("暂无资讯", systemImage: "newspaper", description: Text("下拉刷新，或选择其他频道")) }
                    } else if channel.code == "stock" {
                        StockMap(items: items).padding(12)
                    } else {
                        ForEach(items) { item in
                            NewsRow(item: item, channel: channel.code).accessibilityIdentifier("news-\(channel.code)-\(item.index)")
                        }
                    }
                } else {
                    ContentUnavailableView("开始你的每日阅读", systemImage: "square.stack.3d.up", description: Text("到「订阅」选择感兴趣的频道"))
                }
              }.padding(.bottom, 20)
            }
            .background(Color(uiColor: .systemBackground))
            .refreshable { await store.refresh() }
            .onChange(of: store.selectedChannel) { _, _ in proxy.scrollTo("top", anchor: .top) }
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
                                    ChannelIcon(channel: channel).frame(width: 18, height: 18)
                                    Text(channel.title).font(.subheadline.weight(store.current?.id == channel.id ? .semibold : .regular))
                                }.padding(.horizontal, 12).frame(minHeight: 44)
                                    .background(store.current?.id == channel.id ? Color.orange.opacity(0.12) : Color.clear, in: Capsule())
                                    .foregroundStyle(store.current?.id == channel.id ? Color.orange : Color.primary)
                            }.buttonStyle(.plain).id(channel.id)
                                .accessibilityIdentifier("tab-\(channel.id)")
                                .accessibilityAddTraits(store.current?.id == channel.id ? .isSelected : [])
                        }
                    }.padding(.horizontal, 12)
                }.scrollIndicators(.hidden)
                    .onChange(of: store.selectedChannel) { _, id in proxy.scrollTo(id, anchor: .center) }
                    .onAppear { proxy.scrollTo(store.selectedChannel, anchor: .center) }
            }
                Menu {
                    ForEach(store.enabledChannels) { channel in
                        Button { store.selectedChannel = channel.id } label: {
                            Label(channel.title, systemImage: store.current?.id == channel.id ? "checkmark" : channel.symbol)
                        }.accessibilityIdentifier("choose-\(channel.id)")
                    }
                } label: { Image(systemName: "ellipsis").frame(width: 44, height: 44).contentShape(Rectangle()) }
                    .accessibilityLabel("选择频道")
                    .accessibilityIdentifier("channel-menu")
          }.padding(.vertical, 4).background(.bar).overlay(alignment: .bottom) { Divider() }
        }
        .navigationDestination(for: NewsItem.self) { item in
            if let url = item.url { ReaderView(url: url, title: item.title) }
        }
    }
}

struct NewsRow: View {
    let item: NewsItem
    let channel: String
    @Environment(PodcastPlayer.self) private var player
    @Environment(AppStore.self) private var store
    private var titleFont: Font { store.readingSize == "large" ? .title3 : store.readingSize == "small" ? .subheadline : .body }
    var body: some View {
      VStack(spacing: 0) {
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
                    }.buttonStyle(.plain).foregroundStyle(.orange)
                        .accessibilityLabel(player.item?.id == item.id && player.isPlaying ? "暂停" : "播放")
            }
        }.padding(.horizontal, 16).padding(.vertical, channel == "sina" ? 0 : 14)
        if !["sina", "xiaoyuzhou", "bilibili", "history"].contains(channel) { Divider().padding(.horizontal, 16) }
      }
            .contextMenu { if let url = item.url { ShareLink(item: url, subject: Text(item.title)); Link("在浏览器打开", destination: url) } }
    }
    @ViewBuilder private var content: some View {
        if channel == "sina" {
            HStack(spacing: 10) {
                rank
                Text(item.title).font(titleFont).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                Text(compactCount(item.properties["viewers"].number)).font(.subheadline).foregroundStyle(.secondary).fixedSize()
            }.frame(minHeight: 44)
        } else if channel == "tiobe" {
            TiobeRow(item: item)
        } else if channel == "arena" {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) {
                    VStack(spacing: 4) {
                        rank
                        let delta = Int(item.properties["delta"].number)
                        Text(delta == 0 ? "—" : "\(delta > 0 ? "▲" : "▼")\(abs(delta))")
                            .font(.caption2).foregroundStyle(delta == 0 ? Color.secondary : delta < 0 ? .red : .green)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.title).font(.subheadline.weight(.semibold)).lineLimit(2)
                        Text(item.properties.first("bestModel", "vendor")).font(.caption).foregroundStyle(.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    ArenaMetrics(item: item).frame(width: 132)
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text(item.title).font(titleFont)
                    ArenaMetrics(item: item)
                }
            }
        } else if channel == "history" {
            HStack(alignment: .top, spacing: 14) {
                Circle().fill(.orange).frame(width: 8, height: 8).padding(.top, 5)
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.raw["year"].text + "年").font(.caption).foregroundStyle(.secondary)
                    Text(item.title).font(titleFont)
                    Text(item.summary).font(.subheadline).foregroundStyle(.secondary)
                }
            }
        } else {
            HStack(alignment: .center, spacing: 12) {
                if ["zhihu", "doubanMovie"].contains(channel) { rank }
                if ["xiaoyuzhou", "sspai", "bilibili", "36kr", "doubanMovie"].contains(channel) {
                    Artwork(url: item.image).frame(width: channel == "doubanMovie" ? 70 : channel == "xiaoyuzhou" ? 80 : 120, height: channel == "doubanMovie" ? 105 : 86).clipShape(.rect(cornerRadius: 6))
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.title).font(titleFont).lineLimit(channel == "zhihu" ? 4 : 3)
                    if channel == "xiaoyuzhou" {
                        Text(item.raw["author"].text).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        Label("\(Int(item.raw["duration"].number / 60)) 分钟", systemImage: "clock").font(.caption).foregroundStyle(.secondary)
                    } else if channel == "sspai" {
                        Text(item.raw["publishDate"].text).font(.caption).foregroundStyle(.secondary)
                        HStack {
                            Label(item.raw["likeCount"].text, systemImage: "bolt")
                            Label(item.raw["commentCount"].text, systemImage: "bubble.right")
                        }.font(.caption).foregroundStyle(.secondary)
                    } else if channel == "bilibili" {
                        Text(item.properties["owner"].text).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        HStack {
                            Label(compactCount(item.properties["view"].number), systemImage: "play")
                            Label(compactCount(item.properties["like"].number), systemImage: "hand.thumbsup")
                        }.font(.caption).foregroundStyle(.secondary)
                    } else {
                        if !item.metadata.isEmpty { Text(item.metadata).font(.caption).foregroundStyle(.secondary).lineLimit(2) }
                        if channel != "zhihu", !item.summary.isEmpty { Text(item.summary).font(.subheadline).foregroundStyle(.secondary).lineLimit(3) }
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
                if let image = item.image, ["zhihu", "nnGroup"].contains(channel) {
                    Artwork(url: image).frame(width: 60, height: 60).clipShape(.rect(cornerRadius: 4))
                }
            }
        }
    }
    private var rank: some View {
        let top = (Int(item.rank) ?? 99) <= 3
        return Text(item.rank).font(.caption.monospacedDigit())
            .foregroundStyle(top ? Color.white : Color.secondary)
            .frame(width: 22, height: 22)
            .background(top ? [Color(red: 0.90, green: 0.47, blue: 0), Color(red: 0.96, green: 0.62, blue: 0), Color(red: 0.98, green: 0.77, blue: 0.1)][max(0, min(2, (Int(item.rank) ?? 1) - 1))] : Color.secondary.opacity(0.12), in: Circle())
    }
}

struct TiobeRow: View {
    let item: NewsItem?
    var body: some View {
        HStack(spacing: 6) {
            Text(item?.rank ?? "本月").frame(width: 36)
            Text(item?.properties["rankOfMonthLastYear"].text ?? "去年").frame(width: 36)
            Text(item?.title ?? "语言").lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
            Text(item?.properties["ratings"].text ?? "占比").frame(width: 60)
            Text(item?.properties["change"].text ?? "变化").frame(width: 60)
        }.font(.caption).foregroundStyle(item == nil ? Color.secondary : .primary)
    }
}

struct ArenaMetrics: View {
    let item: NewsItem
    private let metrics = [("score", "Net"), ("confirmedSuccess", "Success"), ("praiseComplaint", "Praise"), ("steerability", "Steer")]
    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], alignment: .leading, spacing: 8) { cells }
    }
    @ViewBuilder private var cells: some View {
        ForEach(metrics, id: \.0) { key, title in
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.caption2).foregroundStyle(.secondary)
                Text(item.properties[key] == .null ? "—" : String(format: "%.1f%%", item.properties[key].number * 100))
                    .font(.caption.bold().monospacedDigit())
                    .foregroundStyle(item.properties[key].number < 0 ? Color.red : .green)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct StockMap: View {
    let items: [NewsItem]
    var body: some View {
        GeometryReader { geometry in
            let rects = stockRects(items, in: CGRect(origin: .zero, size: geometry.size))
            ZStack(alignment: .topLeading) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    let rect = rects[index]
                    let change = item.raw["value"].array.last?.text ?? "0"
                    NavigationLink(value: item) {
                        VStack(spacing: 4) {
                            Text(item.title).font(.caption.weight(.semibold)).lineLimit(1)
                            Text(change + "%").font(.caption2.monospacedDigit()).lineLimit(1).minimumScaleFactor(0.7)
                        }.frame(width: max(0, rect.width - 3), height: max(0, rect.height - 3))
                            .background((change.hasPrefix("-") ? Color.green : Color.red).opacity(0.18), in: .rect(cornerRadius: 6)).clipped()
                    }.buttonStyle(.plain).offset(x: rect.minX, y: rect.minY)
                }
            }
        }.frame(height: 600).accessibilityLabel("沪深板块热力图，面积代表市值，红涨绿跌")
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
