import SwiftUI
import AVFoundation
import MediaPlayer

@MainActor @Observable final class PodcastPlayer {
    var item: NewsItem?
    var isPlaying = false
    var position: Double = 0
    var duration: Double = 0
    var error: String?
    private let player = AVPlayer()
    private var timeObserver: Any?
    private var statusObserver: NSKeyValueObservation?
    private var playbackObserver: NSKeyValueObservation?
    private var interruptionObserver: NSObjectProtocol?
    private var routeObserver: NSObjectProtocol?
    private var wasPlaying = false
    init() {
        timeObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 600), queue: .main) { [weak self] time in
            Task { @MainActor in
                guard let self else { return }
                self.position = max(0, time.seconds.isFinite ? time.seconds : 0)
                let length = self.player.currentItem?.duration.seconds ?? 0
                if length.isFinite && length > 0 { self.duration = length }
                if let item = self.item { UserDefaults.standard.set(self.position, forKey: "native.position.\(item.id)") }
                self.updateNowPlaying()
            }
        }
        playbackObserver = player.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
            Task { @MainActor in self?.isPlaying = player.timeControlStatus == .playing }
        }
        let commands = MPRemoteCommandCenter.shared()
        commands.playCommand.addTarget { [weak self] _ in Task { @MainActor in self?.resume() }; return .success }
        commands.pauseCommand.addTarget { [weak self] _ in Task { @MainActor in self?.pause() }; return .success }
        commands.skipBackwardCommand.preferredIntervals = [15]
        commands.skipBackwardCommand.addTarget { [weak self] _ in Task { @MainActor in self?.skip(-15) }; return .success }
        commands.skipForwardCommand.preferredIntervals = [30]
        commands.skipForwardCommand.addTarget { [weak self] _ in Task { @MainActor in self?.skip(30) }; return .success }
        commands.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            let position = event.positionTime
            Task { @MainActor in self?.seek(position) }
            return .success
        }
        interruptionObserver = NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            let type = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
            let options = note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            Task { @MainActor in
                guard let self else { return }
                if type == AVAudioSession.InterruptionType.began.rawValue { self.wasPlaying = self.isPlaying; self.pause() }
                else if self.wasPlaying && AVAudioSession.InterruptionOptions(rawValue: options).contains(.shouldResume) { self.resume() }
            }
        }
        routeObserver = NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            let reason = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt
            if reason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue { Task { @MainActor in self?.pause() } }
        }
        if let data = UserDefaults.standard.data(forKey: "native.lastPodcast"), let raw = try? JSONDecoder().decode(JSON.self, from: data) {
            item = NewsItem(raw: raw["item"], index: Int(raw["index"].number))
            if let item, let url = item.audio {
                prepare(url); duration = item.raw["duration"].number
                seek(UserDefaults.standard.double(forKey: "native.position.\(item.id)"))
            }
        }
    }
    private func prepare(_ url: URL) {
        let asset = AVPlayerItem(url: url)
        statusObserver = asset.observe(\.status, options: [.new]) { [weak self] asset, _ in
            if asset.status == .failed { Task { @MainActor in self?.error = asset.error?.localizedDescription ?? "音频暂时无法播放" } }
        }
        player.replaceCurrentItem(with: asset)
    }
    func play(_ item: NewsItem) {
        guard let url = item.audio else { return }
        self.item = item; error = nil; duration = item.raw["duration"].number
        prepare(url)
        let saved = UserDefaults.standard.double(forKey: "native.position.\(item.id)")
        seek(saved >= duration - 1 ? 0 : saved)
        UserDefaults.standard.set(try? JSONEncoder().encode(JSON.object(["item": item.raw, "index": .number(Double(item.index))])), forKey: "native.lastPodcast")
        resume()
    }
    func resume() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
            if duration > 0 && position >= duration - 1 { seek(0) }
            player.play(); updateNowPlaying()
        } catch { self.error = error.localizedDescription }
    }
    func pause() { player.pause(); isPlaying = false; updateNowPlaying() }
    func toggle() { isPlaying ? pause() : resume() }
    func skip(_ seconds: Double) { seek(position + seconds) }
    func seek(_ seconds: Double) {
        let value = min(max(0, seconds), max(duration, 0))
        position = value
        player.seek(to: CMTime(seconds: value, preferredTimescale: 600))
        updateNowPlaying()
    }
    func stop() {
        pause(); player.replaceCurrentItem(with: nil); item = nil
        UserDefaults.standard.removeObject(forKey: "native.lastPodcast")
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
    private func updateNowPlaying() {
        guard let item else { return }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [MPMediaItemPropertyTitle: item.title, MPMediaItemPropertyArtist: item.raw["author"].text, MPMediaItemPropertyPlaybackDuration: duration, MPNowPlayingInfoPropertyElapsedPlaybackTime: position, MPNowPlayingInfoPropertyPlaybackRate: player.rate]
    }
}

struct PlayerView: View {
    @Environment(PodcastPlayer.self) private var player
    @Environment(\.dismiss) private var dismiss
    @State private var seeking = false
    @State private var sliderValue: Double = 0
    var body: some View {
        NavigationStack {
            ScrollView {
                if let item = player.item {
                    VStack(spacing: 24) {
                        Artwork(url: item.image, symbol: "headphones").aspectRatio(1, contentMode: .fit).clipShape(.rect(cornerRadius: 28)).shadow(radius: 12, y: 8)
                        VStack(alignment: .leading, spacing: 8) {
                            Text(item.title).font(.title2.bold())
                            Text(item.raw["author"].text).foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        VStack {
                            Slider(value: Binding(get: { seeking ? sliderValue : min(player.position, max(1, player.duration)) }, set: { sliderValue = $0 }), in: 0...max(1, player.duration)) { editing in
                                seeking = editing
                                if !editing { player.seek(sliderValue) }
                            }.accessibilityLabel("播放进度")
                            HStack { Text(time(player.position)); Spacer(); Text(time(player.duration)) }.font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        }
                        HStack(spacing: 44) {
                            Button("后退 15 秒", systemImage: "gobackward.15") { player.skip(-15) }
                            Button(player.isPlaying ? "暂停" : "播放", systemImage: player.isPlaying ? "pause.fill" : "play.fill") { player.toggle() }.font(.system(size: 44))
                            Button("前进 30 秒", systemImage: "goforward.30") { player.skip(30) }
                        }.font(.title).labelStyle(.iconOnly).frame(minHeight: 64)
                        AirPlayPicker().frame(width: 44, height: 44).accessibilityLabel("AirPlay 音频输出")
                        if let error = player.error { Text(error).foregroundStyle(.red); Button("重试") { player.play(item) } }
                        Button("结束播放", role: .destructive) { player.stop(); dismiss() }
                    }.padding(28).frame(maxWidth: 500)
                }
            }.frame(maxWidth: .infinity).navigationTitle("正在收听").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("收起", systemImage: "chevron.down") { dismiss() } } }
        }
    }
    private func time(_ seconds: Double) -> String { let s = Int(max(0, seconds)); return String(format: "%d:%02d", s / 60, s % 60) }
}

struct AirPlayPicker: UIViewRepresentable {
    func makeUIView(context: Context) -> MPVolumeView { let view = MPVolumeView(); view.showsVolumeSlider = false; return view }
    func updateUIView(_ view: MPVolumeView, context: Context) {}
}
