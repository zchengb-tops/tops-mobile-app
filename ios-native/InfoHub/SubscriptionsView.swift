import SwiftUI

struct SubscriptionsView: View {
    @Environment(AppStore.self) private var store
    @State private var adding = false
    @State private var editing: Channel?
    var body: some View {
        @Bindable var store = store
        List {
            Section {
                ForEach($store.channels) { $channel in
                    HStack(spacing: 12) {
                        ChannelIcon(channel: channel).frame(width: 26, height: 26)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(channel.raw.first("title", "name", "tabTitle")).font(.body)
                            Text(channel.supported ? channel.detail : "此频道暂未开放 Mobile 版本").font(.caption).foregroundStyle(.secondary).lineLimit(2)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        Toggle("订阅 \(channel.title)", isOn: $channel.enabled).labelsHidden().disabled(!channel.supported)
                            .onChange(of: channel.enabled) { _, _ in store.channelsChanged() }
                    }.padding(.vertical, 6)
                        .swipeActions {
                            if channel.isRSS {
                                Button("删除", role: .destructive) {
                                    store.channels.removeAll { $0.id == channel.id }; store.channelsChanged()
                                }
                                Button("编辑") { editing = channel }.tint(.blue)
                            }
                        }
                }.onMove { indices, destination in
                    store.channels.move(fromOffsets: indices, toOffset: destination); store.channelsChanged()
                }
            } header: { Text("我的频道 · \(store.enabledChannels.count) 个已订阅") }
            footer: { Text("点编辑调整顺序；RSS 频道支持左滑编辑和删除。云端配置中的其他平台频道会保留。") }
        }
        .navigationTitle("订阅").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) { EditButton() }
            ToolbarItem(placement: .topBarTrailing) { Button("添加 RSS", systemImage: "plus") { adding = true } }
        }
        .sheet(isPresented: $adding) { RSSEditor() }
        .sheet(item: $editing) { channel in RSSEditor(editing: channel) }
    }
}

struct RSSEditor: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var editing: Channel?
    @State private var name = ""
    @State private var address = ""
    @State private var recommendations: [JSON] = []
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
                    ForEach(Array(recommendations.enumerated()), id: \.offset) { _, recommendation in
                        Button {
                            name = recommendation["title"].text; address = recommendation["rssUrl"].text; selected = recommendation
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(recommendation["title"].text).foregroundStyle(.primary)
                                Text(recommendation["description"].text).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }.navigationTitle(editing == nil ? "添加 RSS" : "编辑订阅").navigationBarTitleDisplayMode(.inline)
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
                    if let editing { name = editing.title; address = editing.rssURL }
                    do { recommendations = try await store.api.request("rss-recommendations").array }
                    catch { self.error = error.localizedDescription }
                }
        }
    }
}
