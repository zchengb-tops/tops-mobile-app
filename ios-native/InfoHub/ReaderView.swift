import SwiftUI
import WebKit

@MainActor @Observable final class ReaderState {
    let webView = WKWebView()
    var error: String?
    var loading = true
    var url: URL?
    var canGoBack = false
}

struct ReaderView: View {
    let url: URL
    let title: String
    @State private var state = ReaderState()
    var body: some View {
        Browser(state: state, url: url)
            .overlay(alignment: .top) { if state.loading { ProgressView().padding(12).glassSurface() } }
            .overlay {
                if let error = state.error {
                    ContentUnavailableView {
                        Label("页面暂时无法打开", systemImage: "wifi.exclamationmark")
                    } description: { Text(error) } actions: { Button("重试") { state.error = nil; state.webView.reload() } }
                }
            }
            .navigationTitle(title).navigationBarTitleDisplayMode(.inline)
            .toolbar(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItemGroup(placement: .bottomBar) {
                    Button("网页后退", systemImage: "chevron.left") { state.webView.goBack() }.disabled(!state.canGoBack)
                    Spacer()
                    Button("刷新", systemImage: "arrow.clockwise") { state.webView.reload() }
                    Spacer()
                    ShareLink(item: state.url ?? url, subject: Text(title))
                    Spacer()
                    Link(destination: state.url ?? url) { Image(systemName: "safari") }.accessibilityLabel("在 Safari 打开")
                }
            }
    }
}

struct Browser: UIViewRepresentable {
    let state: ReaderState
    let url: URL
    func makeUIView(context: Context) -> WKWebView {
        state.webView.navigationDelegate = context.coordinator
        state.webView.allowsBackForwardNavigationGestures = true
        state.webView.load(URLRequest(url: url))
        return state.webView
    }
    func updateUIView(_ view: WKWebView, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(state: state) }
    class Coordinator: NSObject, WKNavigationDelegate {
        let state: ReaderState
        init(state: ReaderState) { self.state = state }
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) { state.loading = true; state.error = nil }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            state.loading = false; state.url = webView.url; state.canGoBack = webView.canGoBack
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { state.loading = false; state.error = error.localizedDescription }
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { state.loading = false; state.error = error.localizedDescription }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url, webURL(url.absoluteString) != nil else { decisionHandler(.cancel); return }
            if navigationAction.targetFrame == nil { webView.load(navigationAction.request); decisionHandler(.cancel) }
            else { decisionHandler(.allow) }
        }
    }
}
