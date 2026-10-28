import SwiftUI

struct SubscriptionsView: View {
    @Environment(AppStore.self) private var store
    @State private var adding = false
    @State private var recommendationsPresented = false
    @State private var firstChannelBeforeAdding: String?
    @State private var editing: Channel?
    var body: some View {
        @Bindable var store = store
        ScrollViewReader { proxy in
        List {
            Section {
                Button {
                    firstChannelBeforeAdding = store.channels.first?.id
                    recommendationsPresented = true
                } label: {
                    HStack {
                        Label("精选推荐", systemImage: "sparkles")
                        Spacer()
                        Image(systemName: "chevron.right").font(.footnote).foregroundStyle(.secondary)
                    }.frame(minHeight: 44).contentShape(Rectangle())
                }.buttonStyle(.plain).listRowBackground(Color.clear)
                    .accessibilityIdentifier("rss-recommendations-entry")
                    .accessibilityHint("浏览推荐来源并直接订阅")
            }
            Section {
                ForEach($store.channels.filter { $0.wrappedValue.visibleInMobile }) { $channel in
                    HStack(spacing: 12) {
                        ChannelIcon(channel: channel).frame(width: 24, height: 24)
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Text(channel.raw.first("title", "name", "tabTitle")).channelText(16, weight: .medium)
                                if channel.isRSS { Image("RSSIcon").resizable().scaledToFit().frame(width: 14, height: 14).accessibilityLabel("RSS 频道") }
                            }
                            Text(channel.supported ? channel.detail.nilIfEmpty ?? channel.title : "此频道暂未开放 Mobile 版本").channelText(12).foregroundStyle(.secondary).lineLimit(1)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        Toggle("订阅 \(channel.title)", isOn: $channel.enabled).labelsHidden().disabled(!channel.supported)
                            .onChange(of: channel.enabled) { _, _ in store.channelsChanged() }
                    }.padding(.vertical, 6)
                        .listRowBackground(Color.clear)
                        .swipeActions {
                            if channel.isRSS {
                                Button("删除", role: .destructive) {
                                    store.channels.removeAll { $0.id == channel.id }; store.channelsChanged()
                                }
                                Button("编辑") { editing = channel }.tint(.blue)
                            }
                        }
                }.onMove { indices, destination in
                    var visible = store.channels.filter(\.visibleInMobile)
                    visible.move(fromOffsets: indices, toOffset: destination)
                    // Keep excluded legacy channels in the sync payload, not in the mobile menu.
                    store.channels = visible + store.channels.filter { !$0.visibleInMobile }; store.channelsChanged()
                }
            } header: { Text("我的频道 · \(store.enabledChannels.count) 个已订阅") }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .avoidsAppFooter()
        .ignoresSafeArea(.container, edges: .bottom)
        .accessibilityIdentifier("subscriptions-scroll")
        .navigationTitle("资讯订阅").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) { EditButton() }
            ToolbarItem(placement: .topBarTrailing) {
                Button("添加 RSS 频道", systemImage: "plus") {
                    firstChannelBeforeAdding = store.channels.first?.id
                    adding = true
                }
            }
        }
        .navigationDestination(isPresented: $recommendationsPresented) { RSSRecommendationsView() }
        .onChange(of: recommendationsPresented) { _, presented in
            if !presented { revealNewRSS(using: proxy) }
        }
        .sheet(isPresented: $adding, onDismiss: { revealNewRSS(using: proxy) }) {
            RSSEditor().environment(\.appFooterHeight, 0)
        }
        .sheet(item: $editing) { channel in RSSEditor(editing: channel).environment(\.appFooterHeight, 0) }
        }
    }
    private func revealNewRSS(using proxy: ScrollViewProxy) {
        if let first = store.channels.first, first.isRSS, first.id != firstChannelBeforeAdding {
            proxy.scrollTo(first.id, anchor: .top)
        }
    }
}

struct RSSRecommendationsView: View {
    @Environment(AppStore.self) private var store
    @State private var recommendations: [JSON] = []
    @State private var loading = true
    @State private var loadError: String?
    @State private var subscribingURLs: Set<String> = []
    @State private var subscriptionErrors: [String: String] = [:]
    var body: some View {
        List {
            if loading && recommendations.isEmpty {
                ProgressView("加载精选推荐…").frame(maxWidth: .infinity, minHeight: 120).listRowSeparator(.hidden)
            } else if let loadError, recommendations.isEmpty {
                ContentUnavailableView {
                    Label("精选推荐暂时无法加载", systemImage: "wifi.exclamationmark")
                } description: { Text(loadError) } actions: {
                    Button("重试") { Task { await loadRecommendations() } }.accessibilityIdentifier("rss-recommendations-retry")
                }.listRowSeparator(.hidden)
            } else if recommendations.isEmpty {
                ContentUnavailableView("暂无精选推荐", systemImage: "dot.radiowaves.left.and.right")
                    .listRowSeparator(.hidden)
            }
            ForEach(Array(recommendations.enumerated()), id: \.offset) { _, recommendation in
                recommendationRow(recommendation)
                    .listRowInsets(EdgeInsets(top: 8, leading: 24, bottom: 8, trailing: 20))
                    .listRowSeparator(.hidden).listRowBackground(Color.clear)
            }
            if let loadError, !recommendations.isEmpty { Text(loadError).foregroundStyle(.red) }
        }
        .listStyle(.plain).scrollContentBackground(.hidden)
        .background(Color(uiColor: .systemBackground).ignoresSafeArea())
        .avoidsAppFooter().ignoresSafeArea(.container, edges: .bottom)
        .navigationTitle("精选推荐").navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("rss-recommendations-list")
        .task { await loadRecommendations() }
        .refreshable { if !loading { await loadRecommendations() } }
    }
    private func recommendationRow(_ recommendation: JSON) -> some View {
        let url = recommendation["rssUrl"].text
        let title = recommendation["title"].text
        let identifier = recommendation["id"].text
        let subscribed = store.channels.contains { $0.isRSS && $0.rssURL == webURL(url)?.absoluteString && $0.enabled }
        let busy = subscribingURLs.contains(url)
        return HStack(alignment: .center, spacing: 12) {
            AsyncImage(url: webURL(recommendation["iconUrl"].text)) { phase in
                if let image = phase.image { image.resizable().scaledToFit() }
                else { Image("RSSIcon").resizable().scaledToFit() }
            }.frame(width: 24, height: 24)
                .frame(width: 32, height: 32).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).channelText(16, weight: .medium)
                Text(recommendation["description"].text).channelText(12, lineHeight: 17)
                    .foregroundStyle(.secondary).lineLimit(2).fixedSize(horizontal: false, vertical: true)
                if let error = subscriptionErrors[url] {
                    Text(error).font(.caption).foregroundStyle(.red).accessibilityIdentifier("rss-subscribe-error-\(identifier)")
                }
            }.frame(maxWidth: .infinity, alignment: .leading)
            Button {
                guard subscribingURLs.insert(url).inserted else { return }
                subscriptionErrors[url] = nil
                Task {
                    defer { subscribingURLs.remove(url) }
                    do { try await store.subscribeRSS(recommendation) }
                    catch { subscriptionErrors[url] = error.localizedDescription }
                }
            } label: {
                HStack(spacing: 4) {
                    if busy { ProgressView().controlSize(.small) }
                    else { Image(systemName: subscribed ? "checkmark" : "plus").font(.system(size: 11, weight: .semibold)) }
                    Text(subscribed ? "已订阅" : busy ? "订阅中" : "订阅")
                }.font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.primary)
                    .frame(width: 76, height: 30)
                    .background(subscribed ? Color.clear : Color.primary.opacity(0.045), in: Capsule())
                    .overlay { Capsule().strokeBorder(Color.primary.opacity(subscribed ? 0 : 0.12), lineWidth: 0.75) }
                    .frame(minHeight: 44).contentShape(Rectangle())
            }.buttonStyle(.plain)
                .disabled(subscribed || busy)
                .accessibilityLabel("\(subscribed ? "已订阅" : "订阅") \(title)")
                .accessibilityIdentifier("rss-subscribe-\(identifier)")
        }.frame(minHeight: 52)
    }
    private func loadRecommendations() async {
        loading = true
        defer { loading = false }
        do {
            recommendations = try await store.api.request("rss-recommendations").array
            loadError = nil
        } catch { if !Task.isCancelled { loadError = error.localizedDescription } }
    }
}

struct RSSEditor: View {
    private enum Field: Hashable { case name, address }
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var editing: Channel?
    @State private var name = ""
    @State private var address = ""
    @State private var busy = false
    @State private var parsingName = false
    @State private var error: String?
    @State private var sheetDetent: PresentationDetent = .height(360)
    @FocusState private var focusedField: Field?
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("RSS 链接").font(.subheadline.weight(.medium)).accessibilityHidden(true)
                        TextField("https://example.com/feed.xml", text: $address)
                            .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                            .focused($focusedField, equals: .address)
                            .accessibilityLabel("RSS 链接").accessibilityIdentifier("rss-editor-address")
                            .padding(.horizontal, 16).frame(minHeight: 44)
                            .background(Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 10))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("资讯名称").font(.subheadline.weight(.medium)).accessibilityHidden(true)
                            Spacer()
                            Button {
                                Task {
                                    busy = true; parsingName = true
                                    defer { busy = false; parsingName = false }
                                    do {
                                        guard webURL(address) != nil else { throw APIError.message("请输入有效的订阅地址") }
                                        let result = try await store.api.request("rss-resource/title", query: [URLQueryItem(name: "rssUrl", value: address)])
                                        name = result.text.nilIfEmpty ?? result["title"].text
                                    } catch { self.error = error.localizedDescription }
                                }
                            } label: {
                                HStack {
                                    if parsingName { ProgressView().controlSize(.small) }
                                    else { Label("尝试解析名称", systemImage: "lightbulb").font(.caption) }
                                }.frame(minHeight: 48).contentShape(Rectangle())
                            }.buttonStyle(.plain)
                                .foregroundStyle(address.isEmpty ? Color.secondary : Color(red: 247 / 255, green: 111 / 255, blue: 0))
                                .disabled(busy || address.isEmpty).accessibilityIdentifier("rss-editor-parse")
                        }
                        TextField("资讯名称", text: $name).focused($focusedField, equals: .name)
                            .accessibilityLabel("资讯名称").accessibilityIdentifier("rss-editor-name")
                            .padding(.horizontal, 16).frame(minHeight: 44)
                            .background(Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 10))
                    }
                    Text("💡 搜索「网站名 + RSS」，或使用 RSSHub 查找订阅链接。")
                        .font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    if let error { Text(error).font(.caption).foregroundStyle(.red) }
                    if busy && !parsingName { ProgressView() }
                }.padding(.horizontal, 20).padding(.vertical, 12)
            }.accessibilityIdentifier("rss-editor-form")
                .scrollDismissesKeyboard(.interactively)
                .navigationTitle(editing == nil ? "添加 RSS 订阅" : "编辑 RSS 订阅").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("保存") {
                            Task {
                                busy = true; defer { busy = false }
                                do {
                                    try await store.saveRSS(name: name, url: address, editing: editing, recommendation: nil)
                                    dismiss()
                                } catch { self.error = error.localizedDescription }
                            }
                        }.disabled(busy || name.isEmpty || webURL(address) == nil)
                    }
                }
                .task {
                    if let editing { name = editing.title; address = editing.rssURL }
                }
        }
        .presentationDetents([.height(360), .large], selection: $sheetDetent)
        .presentationBackground(Color(uiColor: .secondarySystemBackground))
        .presentationDragIndicator(.visible)
        .onChange(of: focusedField) { _, field in
            if field != nil { sheetDetent = .large }
        }
    }
}
