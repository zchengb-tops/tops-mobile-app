import SwiftUI

enum ChannelZoom {
    static func progress(from start: CGFloat, magnification: CGFloat, thumbnailScale: CGFloat) -> CGFloat {
        guard magnification.isFinite, thumbnailScale.isFinite else { return start }
        return min(1, max(0, start + (1 - magnification) / max(0.1, 1 - thumbnailScale)))
    }
    static func destination(progress: CGFloat, velocity: CGFloat) -> CGFloat {
        // Project a short distance in the release direction; tiny aborted pinches settle back.
        if progress < 0.15 { return 0 }
        if progress > 0.85 { return 1 }
        let speed = velocity.isFinite ? min(2, max(-2, velocity)) : 0
        return min(1, max(0, progress - speed * 0.12)) >= 0.5 ? 1 : 0
    }
}

struct ChannelOverviewHost: View {
    let channels: [Channel]
    @Binding var selection: String
    @Binding var progress: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var frames: [String: CGRect] = [:]
    @State private var gestureStart: CGFloat?
    @State private var presentedProgress: CGFloat = 0
    private var settleAnimation: Animation { reduceMotion ? .easeOut(duration: 0.16) : .spring(response: 0.36, dampingFraction: 1) }
    var body: some View {
        GeometryReader { geometry in
            let columns = typeSize.isAccessibilitySize ? 1 : geometry.size.width > 650 ? 3 : 2
            let thumbnailWidth = max(1, (geometry.size.width - 32 - CGFloat(columns - 1) * 16) / CGFloat(columns))
            let thumbnailScale = thumbnailWidth / max(1, geometry.size.width)
            let target = frames[selection] ?? CGRect(x: 16, y: 8, width: thumbnailWidth, height: geometry.size.height * thumbnailScale)
            ZStack(alignment: .topLeading) {
                Color(uiColor: .secondarySystemBackground).opacity(progress)
                overview(size: geometry.size, columns: columns, thumbnailWidth: thumbnailWidth)
                    .opacity(progress).allowsHitTesting(progress == 1).accessibilityHidden(progress < 1)
                // This is the original live pager, not a reconstructed page. Its scroll views stay alive.
                ChannelPager(channels: channels, selection: $selection)
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .modifier(ChannelReadingTransform(progress: progress, thumbnailScale: thumbnailScale, target: target,
                                                      reduceMotion: reduceMotion, hasThumbnail: frames[selection] != nil))
                    .allowsHitTesting(progress == 0).accessibilityHidden(progress > 0)
            }.clipped().contentShape(Rectangle())
                .highPriorityGesture(MagnifyGesture()
                    .onChanged { value in
                        if gestureStart == nil { gestureStart = presentedProgress }
                        var transaction = Transaction(); transaction.disablesAnimations = true
                        withTransaction(transaction) {
                            progress = ChannelZoom.progress(from: gestureStart ?? 0, magnification: value.magnification, thumbnailScale: thumbnailScale)
                        }
                    }
                    .onEnded { value in
                        gestureStart = nil
                        withAnimation(settleAnimation) { progress = ChannelZoom.destination(progress: progress, velocity: value.velocity) }
                    })
                .onPreferenceChange(OverviewFramePreference.self) { frames = $0.filter { $0.value.isFiniteThumbnail } }
                .onPreferenceChange(ZoomPresentationPreference.self) { presentedProgress = $0 }
                .accessibilityAction(named: "查看所有频道") { withAnimation(settleAnimation) { progress = 1 } }
                .accessibilityAction(.escape) { withAnimation(settleAnimation) { progress = 0 } }
        }.coordinateSpace(name: "channel-overview-host")
    }
    private func overview(size: CGSize, columns: Int, thumbnailWidth: CGFloat) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 16), count: columns), spacing: 22) {
                    ForEach(channels) { channel in
                        Button { select(channel) } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 7) {
                                    ChannelIcon(channel: channel).frame(width: 20, height: 20)
                                    Text(channel.title).font(.subheadline.weight(.medium)).lineLimit(1)
                                    Spacer(minLength: 0)
                                    if selection == channel.id {
                                        Image(systemName: "checkmark.circle.fill").font(.caption).foregroundStyle(.secondary)
                                    }
                                }.frame(minHeight: 28)
                                thumbnail(channel, size: size, width: thumbnailWidth)
                            }.contentShape(Rectangle())
                        }.buttonStyle(.plain).id(channel.id)
                            .accessibilityLabel(channel.title).accessibilityHidden(progress < 1)
                            .accessibilityHint("展开此频道")
                            .accessibilityAddTraits(selection == channel.id ? .isSelected : [])
                            .accessibilityIdentifier("overview-\(channel.id)")
                    }
                }.padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
            }.avoidsAppFooter().scrollDisabled(progress < 1)
                .accessibilityIdentifier("channel-overview")
                .onAppear { proxy.scrollTo(selection, anchor: .center) }
                .onChange(of: selection) { _, id in
                    if progress == 0 { proxy.scrollTo(id, anchor: .center) }
                }
        }
    }
    private func thumbnail(_ channel: Channel, size: CGSize, width: CGFloat) -> some View {
        let scale = width / max(1, size.width)
        return ChannelFeed(channel: channel, preview: true)
            .environment(\.appFooterHeight, 0)
            .frame(width: size.width, height: size.height)
            .scaleEffect(scale, anchor: .topLeading)
            .frame(width: width, height: size.height * scale, alignment: .topLeading)
            .clipped().clipShape(.rect(cornerRadius: 16))
            .opacity(channel.id == selection && !reduceMotion ? 0 : 1)
            .background(Color(uiColor: .systemBackground), in: .rect(cornerRadius: 16))
            .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(Color.primary.opacity(channel.id == selection ? 0.22 : 0.06), lineWidth: channel.id == selection ? 1.5 : 0.5) }
            .background {
                GeometryReader { geometry in
                    Color.clear.preference(key: OverviewFramePreference.self, value: [channel.id: geometry.frame(in: .named("channel-overview-host"))])
                }
            }.allowsHitTesting(false).accessibilityHidden(true)
    }
    private func select(_ channel: Channel) {
        var transaction = Transaction(); transaction.disablesAnimations = true
        withTransaction(transaction) { selection = channel.id }
        // Let the native paging position reach the chosen channel before expanding it.
        Task { @MainActor in
            await Task.yield()
            withAnimation(settleAnimation) { progress = 0 }
        }
    }
}

/// Read the live animated value so a new pinch can interrupt a settling spring without a jump.
private struct ChannelReadingTransform: AnimatableModifier {
    var progress: CGFloat
    let thumbnailScale: CGFloat
    let target: CGRect
    let reduceMotion: Bool
    let hasThumbnail: Bool
    var animatableData: CGFloat {
        get { progress }
        set { progress = newValue }
    }
    func body(content: Content) -> some View {
        content
            .clipShape(.rect(cornerRadius: reduceMotion ? 0 : 16 * progress / max(thumbnailScale, 0.1)))
            .scaleEffect(reduceMotion ? 1 : 1 + (thumbnailScale - 1) * progress, anchor: .topLeading)
            .offset(x: reduceMotion ? 0 : target.minX * progress, y: reduceMotion ? 0 : target.minY * progress)
            .opacity(reduceMotion ? 1 - progress : (!hasThumbnail ? 1 - progress : 1))
            .preference(key: ZoomPresentationPreference.self, value: progress)
    }
}

private enum ZoomPresentationPreference: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

private enum OverviewFramePreference: PreferenceKey {
    static let defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue()) { _, new in new }
    }
}

private extension CGRect {
    var isFiniteThumbnail: Bool { minX.isFinite && minY.isFinite && width.isFinite && height.isFinite && width > 0 && height > 0 }
}
