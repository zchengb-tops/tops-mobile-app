# InfoHub 行動端 Agent 指引

本目錄是獨立 Git 倉庫。React Native／Expo 與獨立 SwiftUI App 並存；先確認任務針對哪一個實作。
修改前讀取受影響的入口、呼叫方、狀態、儲存與檢查；以下描述以目前程式和 [package.json](./package.json) 為準。

## 範圍與安全

- 只修改需求及必要的呼叫方、測試；保留所有既有修改與未追蹤素材，不順手整理格式、升級依賴或搬移目錄。
- 優先沿用現有元件和平台能力，不為單次需求新增框架、通用包裝或預留抽象。
- 校驗 API 回應、RSS URL、深層連結與 WebView 導航；權限由服務端確認，不把本地登入旗標當成授權。
- 不吞錯誤或把失敗當成功；處理重複操作、過期回應與帳戶切換，重試須有界限並確認冪等性。
- 憑據不進程式、文件、URL、截圖或日誌；`EXPO_PUBLIC_*` 會進入客戶端，不能存放秘密。
- 測試使用隔離資料與測試帳戶，不發送真實驗證信或寫入正式訂閱／RSS 資料；執行前核對環境與副作用。
- 提交、推送、上傳、發布與部署只在任務授權時執行；不能把發布腳本當作驗證命令。

## 實作與責任邊界

- [App.js](./App.js) 是 RN 入口，使用 React Navigation 的 stack／bottom tabs；現有依賴為 Expo 52、React 18、RN 0.76，主要語言是 JavaScript。
- [ios/](./ios/) 是 Expo／RN 的 iOS 工程；[ios-native/](./ios-native/) 是另一個 SwiftUI App，不能混用建置入口。
- 原生 SwiftUI 工作先讀 [ios-native/AGENTS.md](./ios-native/AGENTS.md)。下列 JS／React 規則只適用 RN，不套用到 Swift。
- [src/request.js](./src/request.js) 集中處理 API URL、Token 與 401；[src/apis/](./src/apis/) 定義端點。沿用這些入口，不在新 UI 元件複製認證邏輯。
- [src/stores/useNewsStore.js](./src/stores/useNewsStore.js) 管新聞載入、刷新及錯誤狀態；[src/hooks/](./src/hooks/) 管帳戶、頻道、外觀與播放器等行為。
- [src/storage.js](./src/storage.js) 提供 MMKV。修改登入、登出或同步時，同時檢查 Token、使用者資料、頻道版本與快取的生命週期。
- [src/screens/](./src/screens/) 放頁面，[src/tabs/](./src/tabs/) 放頻道呈現，[src/components/](./src/components/) 放元件；保持目前目錄，不改套其他專案的分層模板。
- 頻道能力與圖示映射在 [src/constant.js](./src/constant.js)，設定合併與選中頁保存在 [src/hooks/TabHooks.js](./src/hooks/TabHooks.js)。新增頻道要一併檢查映射、持久化、排序與同步，保留 RSS、停用選擇及未知欄位。
- 播放器涉及 [src/components/PlayerBar.js](./src/components/PlayerBar.js)、[src/hooks/TrackHooks.js](./src/hooks/TrackHooks.js) 和 [src/services/PlaybackService.js](./src/services/PlaybackService.js)；註冊入口在 App.js，不另建一套播放狀態。
- 沒有 React Query、Expo Router 或 TypeScript 遷移要求；不把泛用編輯器建議視為已安裝功能或架構門禁。

## 寫法與命名

- 使用函式元件與 Hooks；沿用相鄰檔案的縮排、引號和匯出方式。現有 JS 多為 4 空格、引號混用，不宣稱有統一 formatter。
- 變數預設 `const`，需要重新賦值才用 `let`；元件用 PascalCase，函式／變數用 camelCase，自訂 Hook 才以 `use` 開頭。
- 名稱表達業務內容，如 `channelCode`、`rssUrl`、`currentTrack`；不要混淆服務端 `id`、頻道代碼與列表位置，保留外部欄位及儲存鍵契約。
- 集合用複數或清楚的索引關係，如 `enabledChannels`、`newsByChannelCode`；避免流程中通篇使用 `data`、`list`、`result`。
- 新布林值用 `is/has/can/should` 等可讀形式；既有 `enable`、`visible` 等欄位保持相容，不機械改名或使用雙重否定。
- 易混淆數值標示單位，如 `delayMs`、`positionSeconds`；版面沿用 RN 的尺寸語義，播放秒數不要與計時器毫秒混用。
- 區分更新階段，如 `storedChannels`、`nextChannels`。多個容易傳錯的參數用具名物件；單一清楚值直接傳，不把整份 Store 傳給只需要一個欄位的 helper。
- 事件 props 用 `on...`、內部處理函式用 `handle...`；state／setter 名稱對應。不要為形式做無關改名。

## 函式拆分與生命週期

- 名稱描述動作與對象，如 `fetchNormalNews`、`resolveTabIndex`、`sanitizeChannelsForApp`；判定和轉換函式不暗藏 HTTP、儲存或 state 更新。
- 入口可以編排「校驗 → 請求 → 更新狀態／導航」；只有重複規則、獨立解析／計算、清楚的 UI 區塊或混雜責任才拆分。
- 優先使用檔案內 helper／區域函式；跨元件共用且涉及 React 生命週期才抽 Hook，不為縮短行數增加轉呼叫或空殼模組。
- 長函式、深層巢狀或多個位置參數是審閱提示；JSX、StyleSheet 不按行數機械拆分。提前返回必須保留錯誤及清理語義。
- 拆分保留 Promise 的 return／await、I/O 次數與順序、失敗行為、effect 依賴與閉包狀態；不要把批量請求變成每列 render 的請求。
- Hooks 放在頂層；effect 的訂閱、計時器與可取消請求隨所屬生命週期清理，防止卸載後更新或舊回應覆蓋新狀態。
- TrackPlayer 監聽按擁有者清理，服務級監聽避免重複註冊；頁面離開不等於銷毀背景播放器。保持進度保存、切曲與遠端控制順序。
- UI 呈現載入、空資料及失敗狀態，列表使用穩定識別；優化依據實際問題，不一律加 memo、effect 或新的依賴。

## 命令與驗證界限

以下命令在本目錄執行，按修改範圍選用：

```sh
npm run start
npm run ios
npm run android
node src/channelSanitize.check.js
node src/tabPreserve.check.js
node src/tabs/arena.check.js
git diff --check
```

- `start` 啟動 Metro；`ios/android` 建置並啟動 RN，不是自動測試。原生啟動使用 `npm run ios:native`，詳見子指引。
- package scripts 沒有 `test`、`lint` 或型別檢查；未找到獨立架構／命名檢查，不虛構命令或聲稱有自動門禁。
- 三個 `.check.js` 是局部自檢，部分自行重寫邏輯而未引用正式模組；`console.assert` 失敗也可能維持退出碼 0，須閱讀輸出，不能宣稱完整回歸通過。
- 重要行為或修錯補對應行為檢查，驗證正式邏輯與相關失敗邊界；環境不支援的原生互動要明確回報，不以重寫演算法的自檢替代。
- [setenv.js](./setenv.js) 會覆寫 `.env`；local 腳本需要目前缺少的 `.env.dev`。先取得合法測試環境設定，不自動改連正式環境。
- `build-test:ios`、`build-prod:android` 會使用 EAS；`build-testflight:ios` 還會自動上傳並執行 `git add .`／commit，不能作為一般檢查。
- 純文件變更只檢查內容、相對路徑與 diff；交付列出實際執行結果及未驗證原因。建置、自檢或模擬器結果不等於實機、跨平台或正式 API 已驗收。
