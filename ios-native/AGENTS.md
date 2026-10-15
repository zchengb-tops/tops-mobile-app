# InfoHub 原生 iOS Agent 指引

本目錄是獨立 SwiftUI 實作，與父目錄的 Expo／React Native App 共用部分素材及契約，但使用不同的工程與執行入口。
修改前讀取 [README.md](./README.md) 和受影響程式、呼叫方及測試；工程設定以 [InfoHub.xcodeproj](./InfoHub.xcodeproj/) 為準，最低 iOS 17、Swift 語言設定為 5.0。

## 範圍與安全

- 只修改需求和必要的呼叫方、測試與資源；保留既有修改、未追蹤素材，不順手搬檔、改格式、升級工具或遷移架構。
- 沿用 SwiftUI 與系統框架；一般原生開發不需要 Metro、CocoaPods 或 npm 安裝，不把 JS 的 Hook、命名或目錄規則套到 Swift。
- 外部 JSON、RSS URL 與閱讀器導航在邊界校驗；沿用 Models 的 `webURL`，不放寬可開啟協議或把 UI 狀態當成服務端授權。
- Token 沿用 Keychain 的 `Credential`，偏好和快取不能代替安全儲存；憑據、驗證碼和個人資料不進文件、URL、截圖或日誌。
- [InfoHub/Info.plist](./InfoHub/Info.plist) 的 `APIBaseURL` 預設指向正式服務。測試不得發送真實驗證信、上傳正式訂閱或新增正式 RSS；先確認攔截範圍或隔離環境。
- 不吞錯誤或以失敗結果覆蓋有效資料；改動登入、同步、快取時檢查取消、競態與帳戶切換。重試須有界限並確認冪等性。
- 提交、推送、簽章、TestFlight 和發布僅在任務授權時執行；發布 lane 不是一般檢查。

## 實際責任邊界

- [InfoHub/InfoHubApp.swift](./InfoHub/InfoHubApp.swift) 建立 AppStore／PodcastPlayer，注入 environment；RootView 管主導航、閱讀路徑與浮動底欄。
- [InfoHub/AppStore.swift](./InfoHub/AppStore.swift) 是 `@MainActor @Observable` 狀態與用例入口：載入新聞、RSS、偏好、登入及雲端同步。
- [InfoHub/API.swift](./InfoHub/API.swift) 集中 URLSession、HTTP／解碼錯誤、401 與 Keychain；新增端點沿用 API，不在 View 複製認證與 HTTP 流程。
- [InfoHub/Models.swift](./InfoHub/Models.swift) 放 JSON、Channel、NewsItem、頻道合併與純計算。保留 `Channel.raw` 未知欄位及識別碼語義，不能為簡化模型破壞跨端同步。
- [InfoHub/DiscoveryView.swift](./InfoHub/DiscoveryView.swift) 管頻道與榜單呈現；[InfoHub/ChannelOverview.swift](./InfoHub/ChannelOverview.swift) 管頻道縮覽互動。閱讀器在 [InfoHub/ReaderView.swift](./InfoHub/ReaderView.swift)，訂閱與帳戶分別在 SubscriptionsView／SettingsView。
- [InfoHub/PodcastPlayer.swift](./InfoHub/PodcastPlayer.swift) 擁有 AVPlayer、進度保存、音訊中斷與鎖屏命令；mini／full player 共用它，不另建播放器實例。
- UserDefaults 保存 `native.*` 偏好，新聞快取在 Application Support；RN 的 MMKV 不會自動遷入。資料遷移需明確設計，不能把可啟動視為升級相容。
- 新頻道同時檢查 Models 的支援集合／合併、AppStore 載入、View 呈現與圖示資源。保留順序、停用選擇、RSS 和未知欄位；特殊端點失敗保留最後成功資料。
- 目前沒有強制 MVVM／Repository 分層或自動架構門禁，不為套模板把所有 View 搬進新目錄或新增空殼 Service。

## Swift 寫法與命名

- 型別用 UpperCamelCase，屬性／方法用 lowerCamelCase；沿用 4 空格與周邊宣告方式。不全檔壓縮成單行，也不為格式重寫既有密集程式。
- 優先 `let`，需要變更才用 `var`；使用明確型別、值型別與現有 enum，避免新增 `Any`、強制轉型或強制解包掩蓋無效輸入。
- 名稱表達內容，如 `selectedChannel`、`rssURL`、`syncTask`；保留 Swift 的 URL／RSS 縮寫習慣，外部 `rssUrl`／`enable` 欄位不隨內部名稱改動。
- 集合用複數，如 `enabledChannels`；字典表達索引，如 `itemsByChannelCode`。布林用 `is/has/can/should` 等可讀名稱，既有 `enabled`、`supported` 保持相容。
- 區分 Channel 的穩定識別、服務端數字 ID、頻道 code 與列表 index，不把顯示位置當跨端主鍵。
- 數值標示易混淆的單位，如 `positionSeconds`、`timeoutSeconds`；SwiftUI 尺寸是 point，AVPlayer 的秒數與 CMTime timescale 分開理解。
- 方法和 argument label 一起讀應能表達用途，如 `items(for:)`、`saveRSS(name:url:editing:recommendation:)`。只傳需要的值，不把整份 AppStore 傳給純計算。
- 用 `currentChannels/mergedChannels` 區分階段；不要以 `data1/data2` 或多個無標籤布林表達操作模式。簡單輸入不額外包裝型別。

## 方法拆分與資源生命週期

- 方法描述動作與結果，如 `persistChannels`、`applyChannelResult`；判定屬性和純轉換不暗藏網路、Keychain 或偏好寫入。
- 一個方法負責可命名的任務；解析、計算、校驗或重複規則可提取為既有型別的 private 方法。只有真正共用責任才新增型別／模組。
- SwiftUI body 可提取具名子視圖或獨立 View，但不按行數機械拆分 ViewBuilder／modifier 鏈，不為簡單表達式增加轉呼叫。
- 用 guard／defer 保持正常路徑和必要清理；拆分不能改變 throws、async／await、I/O 次數與順序、快取回退或同步衝突處理。
- UI 可觀察狀態沿用 MainActor；View 的短期狀態用現有 State／Binding／Environment。普通計算不需要新的可觀察物件。
- `.task` 與獨立 `Task` 的生命週期不同；新建長任務明確歸屬、取消與錯誤處理，避免退頁、登出或新請求後被舊結果覆蓋。
- 新增／修改 AVPlayer time observer、KVO、NotificationCenter 或遠端命令時，保存必要 token，按擁有者生命週期成對解除並避免重複註冊。
- 閱讀器退場時檢查載入、delegate／回呼與引用釋放；不要因關閉播放 sheet 或離開頻道就銷毀 App 級背景播放器。
- 保持 Dynamic Type、VoiceOver、深淺色、減少動態／透明度與安全區行為；iOS 26 專用效果必須保留較舊系統 fallback。

## 工程與生成資源

- 已提交的 Xcode 工程可以直接建置；新增 Swift／資源須核對 target membership 和共用 InfoHub scheme，不預設檔案會自動收錄。
- [generate_project.rb](./generate_project.rb) 會重建工程、scheme、圖示與資源，並從 RN 法律頁抽取文字；只在需要時執行並逐項審查 diff。
- 生成器需要 Ruby 的 `xcodeproj` gem，且複製素材／字型時會讀取父目錄資源及 node_modules；這些不是日常建置依賴，也不能用生成器替代測試。
- `InfoHub/terms.txt`、`InfoHub/privacy.txt` 是生成文字，不獨立改寫；[InfoHub/Assets.xcassets](./InfoHub/Assets.xcassets/)、啟動畫面與隱私資源要核對實際打包結果。

## 驗證與交付

以下命令在本目錄執行；先從裝置清單選擇已安裝的模擬器，將 `<UDID>` 換成實際 ID：

```sh
xcrun simctl list devices available
xcodebuild -project InfoHub.xcodeproj -scheme InfoHub \
  -destination 'platform=iOS Simulator,id=<UDID>' \
  -derivedDataPath /tmp/infohub-native-derived \
  CODE_SIGNING_ALLOWED=NO -only-testing:InfoHubTests test
git diff --check
```

- [InfoHubTests/ContractTests.swift](./InfoHubTests/ContractTests.swift) 使用 XCTest，涵蓋資料契約、同步保留、解析與部分版面；重要邏輯或修錯補相應成功／失敗邊界檢查。
- 移除 `-only-testing:InfoHubTests` 才會連同 [InfoHubUITests/NavigationTests.swift](./InfoHubUITests/NavigationTests.swift) 執行；也可換成具體 target／class／method 篩選，不能把局部結果報成全套通過。
- UI 測試啟動 App 會讀線上內容，不能宣稱完全離線；現有 RSSResourceProtocol 只攔截特定 RSS 請求，測試須恢復 UserDefaults 並解除攔截，避免污染或漏出寫入。
- [run-simulator.sh](./run-simulator.sh) 建置、安裝並啟動 Debug App；父目錄的 `npm run ios:native` 呼叫它。這是啟動工具，不是測試，指定裝置必須已安裝。
- 未找到 SwiftLint、formatter 或獨立架構／命名檢查；不虛構 lint 命令。缺少 Xcode SDK／runtime、destination 或工具時，回報具體原因及未驗證範圍。
- 純文件變更只檢查內容、相對路徑及 diff，不重建工程或發布。交付說明實際命令、結果、跳過項與限制，不能把 skip／工具失敗視為通過。
- 模擬器和 XCTest 不證明實機背景音訊、來電／藍牙／AirPlay、全部 iOS 版本、帳戶同步或正式發布可用；這些需另行取得對應驗收證據。
