import SwiftUI
import Charts

struct GithubContent: View {
    var previewItemLimit: Int?
    private var preview: Bool { previewItemLimit != nil }
    @Environment(AppStore.self) private var store
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var period = GithubPeriod.daily
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 4) {
                if typeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 8) { heading; if !preview { periodPicker } }
                } else {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 12) { heading; Spacer(minLength: 0); if !preview { periodPicker.frame(width: 160) } }
                        VStack(alignment: .leading, spacing: 8) { heading; if !preview { periodPicker } }
                    }
                }
                Text("发现近期热门的开源项目").font(.footnote).foregroundStyle(.secondary)
                    .offset(y: typeSize.isAccessibilitySize ? -6 : -12)
            }
            if let error = store.channelErrors["github"], !preview { Text(error).font(.footnote).foregroundStyle(.secondary) }
            let items = period.items(in: store.news["github"])
            if items.isEmpty {
                ChannelDataState(loading: store.loading, message: store.news["github"][period.rawValue]["errorMessage"].text)
            } else {
                if preview { VStack(spacing: 0) { rows(items) } }
                else { LazyVStack(spacing: 0) { rows(items) } }
            }
        }.padding(.horizontal, 20).padding(.top, 16)
    }
    private func rows(_ items: [NewsItem]) -> some View {
        ForEach(Array(items.prefix(previewItemLimit ?? items.count))) { item in
            GithubRow(item: item, period: period)
            if item.id != items.last?.id { Divider().opacity(0.4).padding(.vertical, 16) }
        }
    }
    private var heading: some View {
        Link("GitHub Trending", destination: URL(string: "https://github.com/trending")!)
            .font(.title3.weight(.semibold)).tracking(-0.5).foregroundStyle(.primary)
            .fixedSize(horizontal: !typeSize.isAccessibilitySize, vertical: true).frame(minHeight: 44)
            .accessibilityAddTraits(.isHeader).accessibilityIdentifier("github-heading").offset(y: -6)
    }
    private var periodPicker: some View {
        Picker("榜单周期", selection: $period) {
            ForEach(GithubPeriod.allCases) { Text($0.title).tag($0) }
        }.pickerStyle(.segmented).frame(minHeight: 44).accessibilityIdentifier("github-period")
    }
}

private struct GithubRow: View {
    let item: NewsItem
    let period: GithubPeriod
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.colorScheme) private var scheme
    @ScaledMetric(relativeTo: .body) private var rankWidth = 26.0
    var body: some View {
        NavigationLink(value: item) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top, spacing: 10) {
                    Text(item.rank).font(.system(.title2, design: .serif).weight(.medium)).monospacedDigit()
                        .foregroundStyle(rankColor).frame(width: rankWidth, alignment: .leading)
                        .accessibilityIdentifier("github-rank-\(period.id)-\(item.index)")
                    VStack(alignment: .leading, spacing: 8) {
                        Text(item.title).channelText(16, weight: .semibold).fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("github-title-\(period.id)-\(item.index)")
                        let description = item.properties["description"].text
                        if !description.isEmpty {
                            Text(description).channelText(13, lineHeight: 19).foregroundStyle(.secondary)
                                .lineLimit(typeSize.isAccessibilitySize ? nil : 2).fixedSize(horizontal: false, vertical: true)
                        }
                        metadata
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    if !typeSize.isAccessibilitySize { growth }
                }
                if typeSize.isAccessibilitySize { growth }
            }.frame(maxWidth: .infinity, alignment: .leading).frame(minHeight: 44).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityIdentifier("github-\(period.id)-\(item.index)")
    }
    private var metadata: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 10) { language; statistics }.fixedSize(horizontal: true, vertical: false)
            VStack(alignment: .leading, spacing: 6) { language; statistics }
        }
    }
    @ViewBuilder private var language: some View {
        let value = item.properties["language"].text
        if !value.isEmpty {
            Text(value).channelText(10, weight: .medium).foregroundStyle(.primary)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
                .overlay { Capsule().strokeBorder(Color(uiColor: .separator).opacity(0.25), lineWidth: 0.5) }
                .accessibilityIdentifier("github-language-\(period.id)-\(item.index)")
        }
    }
    private var statistics: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 10) { stars; forks }.fixedSize(horizontal: true, vertical: false)
            VStack(alignment: .leading, spacing: 6) { stars; forks }
        }.channelText(10).monospacedDigit().foregroundStyle(.secondary)
    }
    @ViewBuilder private var stars: some View {
        let value = item.properties["stars"].text
        if !value.isEmpty {
            HStack(spacing: 3) { Image(systemName: "star"); Text(value) }
                .accessibilityElement(children: .ignore).accessibilityLabel("\(value) 星标")
        }
    }
    @ViewBuilder private var forks: some View {
        let value = item.properties["forks"].text
        if !value.isEmpty {
            HStack(spacing: 3) { Image(systemName: "arrow.triangle.branch"); Text(value) }
                .accessibilityElement(children: .ignore).accessibilityLabel("\(value) 分叉")
        }
    }
    private var rankColor: Color {
        switch Int(item.rank) {
        case 1: return scheme == .dark ? Color(red: 1, green: 0.55, blue: 0.26) : Color(red: 0.74, green: 0.34, blue: 0.02)
        case 2: return scheme == .dark ? Color(red: 1, green: 0.69, blue: 0.29) : Color(red: 0.63, green: 0.42, blue: 0)
        case 3: return scheme == .dark ? Color(red: 1, green: 0.82, blue: 0.40) : Color(red: 0.56, green: 0.43, blue: 0)
        default: return .secondary
        }
    }
    @ViewBuilder private var growth: some View {
        let value = item.properties["starsSince"].text.components(separatedBy: " stars").first ?? ""
        if !value.isEmpty {
            HStack(spacing: 6) {
                Image(systemName: "star.fill").channelText(12)
                    .foregroundStyle(scheme == .dark ? Color(red: 196 / 255, green: 206 / 255, blue: 216 / 255) : Color(red: 88 / 255, green: 99 / 255, blue: 110 / 255))
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value).channelText(10, weight: .semibold).monospacedDigit().foregroundStyle(.primary)
                    Text(period.growthTitle).channelText(10).foregroundStyle(.secondary)
                }
            }.fixedSize()
                .accessibilityElement(children: .ignore).accessibilityLabel("\(period.growthTitle) \(value) 星")
                .accessibilityIdentifier("github-growth-\(period.id)-\(item.index)")
        }
    }
}

struct AnalysisContent: View {
    var preview = false
    @Environment(AppStore.self) private var store
    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Link(destination: URL(string: "https://artificialanalysis.ai/")!) {
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("AI Model Benchmark").font(.title2.weight(.semibold)).tracking(-0.5).accessibilityAddTraits(.isHeader)
                        Text("来自 Artificial Analysis · 智能、速度与成本").font(.footnote).foregroundStyle(.secondary)
                    }.multilineTextAlignment(.leading).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    Image("channel-artificialAnalysis").renderingMode(.original).resizable().scaledToFit()
                        .frame(width: 56, height: 56).accessibilityHidden(true)
                }
            }.foregroundStyle(.primary).accessibilityIdentifier("analysis-heading")
            if let error = store.channelErrors["artificialAnalysis"], !preview { Text(error).font(.footnote).foregroundStyle(.secondary) }
            let charts = AnalysisChart.charts(in: store.news["artificialAnalysis"])
            if charts.isEmpty { ChannelDataState(loading: store.loading) }
            ForEach(charts) { chart in
                AnalysisChartView(chart: chart, limit: preview ? 4 : nil, preview: preview)
            }
        }.padding(.horizontal, 20).padding(.top, 16)
    }
}

struct AnalysisChartView: View {
    let chart: AnalysisChart
    var limit: Int?
    var preview = false
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.newsPath) private var newsPath
    @ScaledMetric(relativeTo: .caption2) private var columnWidth = 60.0
    @ScaledMetric(relativeTo: .caption2) private var axisWidth = 40.0
    @State private var selection: String?
    private var points: [AnalysisChart.Point] { Array(chart.points.prefix(limit ?? chart.points.count)) }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(chart.title).font(.headline)
                Text(chart.subtitle).font(.caption).foregroundStyle(.secondary)
            }.accessibilityElement(children: .combine).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("analysis-\(chart.id)-heading")
            GeometryReader { geometry in plot(width: geometry.size.width) }
                .frame(height: typeSize.isAccessibilitySize ? 420 : 270)
        }.padding(16).background(Color(uiColor: .systemBackground), in: .rect(cornerRadius: 16))
            .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(Color(uiColor: .separator).opacity(0.25), lineWidth: 0.5) }
    }
    private func plot(width availableWidth: CGFloat) -> some View {
        let width = availableWidth.isFinite ? max(0, availableWidth) : 0
        let visibleCount = max(1, Int(min(CGFloat(points.count), max(1, (width - axisWidth) / columnWidth))))
        let labelWidth = max(44, (width - axisWidth) / CGFloat(max(1, visibleCount)) - 8)
        return Chart(points) { point in
            BarMark(x: .value("模型", point.label), y: .value(chart.title, point.value), width: .ratio(0.55))
                .foregroundStyle(analysisColor(point.color)).cornerRadius(4)
                .opacity(selection == nil || selection == point.id ? 1 : 0.75)
                .annotation(position: .top, spacing: 4) {
                    Text(chart.formatted(point.value)).font(.caption2.weight(.semibold)).monospacedDigit()
                        .foregroundStyle(.primary).accessibilityHidden(true)
                }
                .accessibilityLabel(point.label).accessibilityValue("\(chart.title) \(chart.formatted(point.value))")
        }
        .chartXScale(domain: points.map(\.label))
        .chartYScale(domain: 0...chart.maximum, range: .plotDimension(startPadding: 0, endPadding: 24))
        .chartScrollableAxes(preview ? [] : .horizontal)
        .chartXVisibleDomain(length: visibleCount)
        .chartXAxis {
            AxisMarks(values: points.map(\.label)) { value in
                AxisValueLabel {
                    if let label = value.as(String.self), let point = points.first(where: { $0.label == label }) {
                        VStack(spacing: 3) {
                            Group {
                                if let asset = point.logoAsset, UIImage(named: asset) != nil {
                                    Image(asset).resizable().scaledToFit().foregroundStyle(analysisColor(point.color))
                                } else { Image(systemName: "cpu").resizable().scaledToFit().foregroundStyle(.secondary) }
                            }.frame(width: 16, height: 16).accessibilityHidden(true)
                            Text(point.name).channelText(11, weight: .medium).lineLimit(3)
                            if !point.variant.isEmpty, !typeSize.isAccessibilitySize { Text(point.variant).channelText(10).lineLimit(2).foregroundStyle(.secondary) }
                        }.multilineTextAlignment(.center).frame(width: labelWidth)
                    }
                }
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading, values: .automatic(desiredCount: 4)) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [3, 3]))
                AxisValueLabel {
                    if let number = value.as(Double.self) { Text(chart.formatted(number)).font(.caption2).monospacedDigit() }
                }
            }
        }
        .chartGesture { proxy in
            SpatialTapGesture().onEnded { tap in
                if let label = proxy.value(atX: tap.location.x, as: String.self),
                   let point = points.first(where: { $0.id == label }) { open(point) }
            }
        }
        .accessibilityActions {
            ForEach(points) { point in
                Button("查看\(point.label)，\(chart.title) \(chart.formatted(point.value))") { open(point) }
            }
        }
        .accessibilityValue(selection ?? "未选择模型")
        .accessibilityIdentifier("analysis-\(chart.id)-chart")
    }
    private func open(_ point: AnalysisChart.Point) {
        guard !preview else { return }
        selection = point.id
        if let url = point.detailsURL {
            newsPath?.wrappedValue.append(NewsItem(raw: .object(["title": .string(point.label), "url": .string(url.absoluteString)]), index: 0))
        }
    }
}

func analysisColor(_ source: String) -> Color {
    guard source.range(of: "^#[0-9a-fA-F]{6}$", options: .regularExpression) != nil,
          let hex = UInt64(source.dropFirst(), radix: 16) else { return .purple }
    let red = (hex >> 16) & 255, green = (hex >> 8) & 255, blue = hex & 255
    if red == green, green == blue, red < 128 { return .primary }
    return Color(red: Double(red) / 255, green: Double(green) / 255, blue: Double(blue) / 255)
}

private struct ChannelDataState: View {
    var loading: Bool
    var message = ""
    var body: some View {
        if loading { ProgressView("正在同步榜单…").frame(maxWidth: .infinity, minHeight: 180) }
        else { ContentUnavailableView("暂无榜单", systemImage: "chart.bar", description: Text(message.isEmpty ? "下拉刷新后重试" : message)) }
    }
}

struct FeaturedContent: View {
    var previewHeight: CGFloat?
    @Environment(AppStore.self) private var store
    private let groups: [[String]] = [
        ["sina", "zhihu", "stock"],
        ["sspai", "36kr", "nnGroup", "history"],
        ["github", "tiobe", "arena", "artificialAnalysis"],
        ["xiaoyuzhou", "bilibili", "doubanMovie"]
    ]
    private var visibleGroups: [[Channel]] {
        let channelsByGroup = groups.map { codes in codes.compactMap { code in store.enabledChannels.first { !$0.isRSS && $0.code == code } } }
            + [store.enabledChannels.filter(\.isRSS)]
        guard let previewHeight else { return channelsByGroup }
        // Minimum heights deliberately overfill rather than leave a partially populated thumbnail.
        var height: CGFloat = 0
        return Array(channelsByGroup.prefix { channels in
            guard height < previewHeight else { return false }
            for channel in channels {
                let count = items(for: channel).count
                if channel.code == "stock", count > 0 { height += 240 + 44 }
                else if channel.code == "artificialAnalysis", !AnalysisChart.charts(in: store.news[channel.code]).isEmpty { height += 270 + 44 }
                else { height += CGFloat(min(count, channel.code == "sina" ? 5 : 4)) * 44 + (isArticle(channel) ? 0 : 44) }
            }
            return true
        })
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            ForEach(Array(visibleGroups.enumerated()), id: \.offset) { _, channels in
                if !channels.isEmpty { section(channels: channels) }
            }
        }
    }
    private func section(channels: [Channel]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(channels) { channel in
                VStack(alignment: .leading, spacing: 0) {
                    if !isArticle(channel) {
                        Button { store.selectedChannel = channel.id } label: {
                            HStack(spacing: 8) {
                                ChannelIcon(channel: channel).frame(width: 18, height: 18)
                                Text(channel.title).font(.subheadline.weight(.medium))
                                Spacer(minLength: 0)
                                Image(systemName: "arrow.up.right").font(.caption).foregroundStyle(.secondary)
                            }.frame(minHeight: 44).contentShape(Rectangle())
                        }.buttonStyle(.plain).padding(.horizontal, 20)
                            .accessibilityIdentifier("featured-open-\(channel.id)").accessibilityLabel("查看\(channel.title)频道")
                            .accessibilityAddTraits(.isHeader)
                    }
                    featuredItems(channel)
                }.padding(.top, channel.id == channels.first?.id || isArticle(channel) ? 0 : 16)
            }
        }
    }
    private func isArticle(_ channel: Channel) -> Bool {
        channel.isRSS || ["sspai", "36kr", "nnGroup"].contains(channel.code)
    }
    private func items(for channel: Channel) -> [NewsItem] {
        store.items(for: channel).filter {
            (channel.code != "arena" || $0.properties["section"].text == "rank") &&
            (channel.code != "xiaoyuzhou" || $0.raw["trendType"].text == "最热榜")
        }
    }
    @ViewBuilder private func featuredItems(_ channel: Channel) -> some View {
        let items = items(for: channel)
        if channel.code == "artificialAnalysis", let chart = AnalysisChart.charts(in: store.news["artificialAnalysis"]).first {
            AnalysisChartView(chart: chart).padding(.horizontal, 20).padding(.vertical, 8)
        } else if channel.code == "stock", !items.isEmpty {
            StockMap(items: Array(items.prefix(12)), height: 240).padding(.horizontal, 20)
                .accessibilityIdentifier("featured-stock-map")
        } else if channel.code == "tiobe", !items.isEmpty {
            TiobeRow(item: nil).padding(.horizontal, 20).padding(.vertical, 12)
                .accessibilityElement(children: .contain).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("featured-tiobe-header")
            Divider().padding(.horizontal, 20)
            ForEach(Array(items.prefix(5))) { item in
                NewsRow(item: item, channel: channel.code, density: .standard, isOverview: true)
                    .accessibilityIdentifier("featured-tiobe-\(item.index)")
            }
        } else {
            ForEach(Array(items.prefix(channel.code == "sina" ? 5 : 4))) { item in
                if channel.code == "github" {
                    GithubRow(item: item, period: .daily).padding(.horizontal, 20).padding(.vertical, 10)
                } else {
                    NewsRow(item: item, channel: channel.isRSS ? "rss" : channel.code, density: .standard,
                            source: isArticle(channel) ? channel : nil, isOverview: true)
                }
            }
        }
        if items.isEmpty, channel.code != "artificialAnalysis" {
            Text(store.loading ? "正在汇集资讯…" : "暂无资讯").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 20).padding(.vertical, 8)
        }
    }
}
