import SwiftUI

struct SubscriptionsView: View {
    @Environment(AppStore.self) private var store
    @State private var adding = false
    @State private var firstChannelBeforeAdding: String?
    @State private var editing: Channel?
    var body: some View {
        @Bindable var store = store
        ScrollViewReader { proxy in
        List {
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
        .sheet(isPresented: $adding, onDismiss: {
            if let first = store.channels.first, first.isRSS, first.id != firstChannelBeforeAdding {
                proxy.scrollTo(first.id, anchor: .top)
            }
        }) { RSSEditor().environment(\.appFooterHeight, 0) }
        .sheet(item: $editing) { channel in RSSEditor(editing: channel).environment(\.appFooterHeight, 0) }
        }
    }
}

struct RSSEditor: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize
    var editing: Channel?
    @State private var name = ""
    @State private var address = ""
    @State private var recommendations: [JSON] = []
    @State private var recommendationsLoading = true
    @State private var selected: JSON?
    @State private var busy = false
    @State private var error: String?
    var body: some View {
        NavigationStack {
            Form {
                Section("订阅信息") {
                    TextField("名称", text: $name)
                    TextField("https://example.com/feed.xml", text: $address).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("获取订阅名称") {
                        Task {
                            busy = true; defer { busy = false }
                            do {
                                guard webURL(address) != nil else { throw APIError.message("请输入有效的订阅地址") }
                                let result = try await store.api.request("rss-resource/title", query: [URLQueryItem(name: "rssUrl", value: address)])
                                name = result.text.nilIfEmpty ?? result["title"].text
                            } catch { self.error = error.localizedDescription }
                        }
                    }.disabled(busy || address.isEmpty)
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
                if busy { ProgressView() }
                Section("精选订阅") {
                    if recommendationsLoading { ProgressView("加载精选订阅…") }
                    else if recommendations.isEmpty { Text("暂无精选订阅").foregroundStyle(.secondary) }
                    ForEach(Array(recommendations.enumerated()), id: \.offset) { _, recommendation in
                        let isSelected = address == recommendation["rssUrl"].text
                        Button {
                            name = recommendation["title"].text; address = recommendation["rssUrl"].text; selected = recommendation
                        } label: {
                            HStack(spacing: 12) {
                                AsyncImage(url: webURL(recommendation["iconUrl"].text)) { phase in
                                    if let image = phase.image { image.resizable().scaledToFit() }
                                    else { Image("RSSIcon").resizable().scaledToFit() }
                                }
                                .frame(width: 32, height: 32).padding(6)
                                .background(Color(uiColor: .tertiarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10))
                                .accessibilityHidden(true)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(recommendation["title"].text).channelText(16, weight: .medium).foregroundStyle(.primary)
                                    Text(recommendation["description"].text).channelText(12, lineHeight: 17).foregroundStyle(.secondary)
                                        .lineLimit(typeSize.isAccessibilitySize ? nil : 2)
                                }.frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 20)).foregroundStyle(isSelected ? Color.accentColor : Color.secondary.opacity(0.4))
                                    .accessibilityHidden(true)
                            }.padding(.vertical, 4).frame(minHeight: 44).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(isSelected ? Color.accentColor.opacity(0.06) : Color(uiColor: .secondarySystemGroupedBackground))
                        .accessibilityLabel("\(recommendation["title"].text)，\(recommendation["description"].text)")
                        .accessibilityHint("填入订阅名称和地址，点击保存后添加")
                        .accessibilityAddTraits(isSelected ? .isSelected : [])
                        .accessibilityIdentifier("rss-recommendation-\(recommendation["id"].text)")
                    }
                }
            }.accessibilityIdentifier("rss-editor-form")
                .navigationTitle(editing == nil ? "添加 RSS" : "编辑订阅").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("保存") {
                            Task {
                                busy = true; defer { busy = false }
                                do {
                                    try await store.saveRSS(name: name, url: address, editing: editing, recommendation: selected?["rssUrl"].text == address ? selected : nil)
                                    dismiss()
                                } catch { self.error = error.localizedDescription }
                            }
                        }.disabled(busy || name.isEmpty || webURL(address) == nil)
                    }
                }
                .task {
                    defer { recommendationsLoading = false }
                    if let editing { name = editing.title; address = editing.rssURL }
                    do { recommendations = try await store.api.request("rss-recommendations").array }
                    catch { self.error = error.localizedDescription }
                }
        }
    }
}
