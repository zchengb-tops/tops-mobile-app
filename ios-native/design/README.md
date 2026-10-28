# InfoHub iOS 设计档案

直接在浏览器打开 [index.html](index.html)。图册是离线静态页面：按功能分组展示原生 App 截图，点击截图或使用键盘激活缩略图可放大，再次激活即可关闭。页面不实现 App 交互，也不会请求外部服务。

## 截图范围

基准为采集时工作区的 SwiftUI Debug 构建，在隔离的 iPhone 18 Pro Max / iOS 27.0 模拟器采集。部分页面反映同一工作区中尚未提交的其他改动，不应视为当前提交的逐屏实现。资讯、榜单、播客与精选推荐内容来自采集时可读取的来源，内容会随时间变化；RSS 订阅完成状态及表单使用明确标注的隔离测试数据。登录截图未发送验证码。截图保留原始尺寸并无损转换为 WebP；`catalog.json` 记录截图名称、采集方式、设备、时间与校验值。精选推荐列表及加载完成的网页阅读器通过只读手动导航截取，其余截图来自 XCTest。

图册只展示实际捕获的状态，不代表真机、所有系统版本、后台音频或账号同步已经完成验收。没有截图的状态不会用示意图冒充原生画面。

## 2026-10-28 采集记录

- 已在独立模拟器中采集 28 个页面／状态，共 54 张截图；来源文件和无损转换后的像素已核对。
- RSS 推荐与紧凑表单的两项隔离 UI 测试通过。其他采集测试中 6 项通过、3 项失败：总览测试的完整微博行间距断言期望 8pt、实际为 4pt；登录测试的键盘收起等待超时；GitHub 榜单首条语言标签断言未满足。另一次订阅开关测试中，点击前后的无障碍值均为 `1`，该测试失败。这些结果需要另行调查，不能当作完整功能验收。
- 播放相关测试报告了两条系统 `AVAudioSession` 主线程调用警告。采集测试结束后，停掉了等待中的可选模拟器诊断收集；测试结果包仍已生成。
- 图册已检查 HTML 结构、本地图片引用、尺寸与校验值。受浏览器工具对本地文件的限制，本次尚未完成浏览器实际排版及放大交互检查。
- 后续对照 React Native 更新了 RSS 表单：链接在前、名称及解析入口在后。隔离测试覆盖创建、编辑、取消、名称解析，以及浅色、深色和大字体下的紧凑与展开状态；解析按钮的触控范围调整后复测通过。

## 更新截图

1. 在隔离模拟器运行 `InfoHubUITests/NavigationTests.swift` 中对应的截图测试；修改 `catalog-map.json` 中的截图名称和说明。涉及订阅写入的测试必须使用其 `INFOHUB_UI_TEST_RSS` 隔离模式，不能将带测试订阅的模拟器接入正式 API。
2. 导出结果包，再导入一个或多个结果目录：

   ```sh
   xcrun xcresulttool export attachments --path /path/to/result.xcresult --output-path /tmp/infohub-design-export
   python3 import-captures.py /tmp/infohub-design-export
   node build-catalog.mjs
   node build-catalog.mjs --check
   ```

   导入需要带 WebP 支持的 Pillow。脚本导入传入结果中匹配的截图，并保留校验通过且映射名称未变的既有截图；缺失的映射会报错。新截图会逐像素验证无损转换并记录来源；`--check` 核对截图校验值与生成的 HTML。更新后在浏览器检查桌面与手机宽度、导航和截图放大功能。

`catalog-map.json` 是截图映射；`catalog.json`、`screens/` 和 `index.html` 是生成结果。调整样式时编辑 `catalog.css` 并重新运行 `node build-catalog.mjs`。
