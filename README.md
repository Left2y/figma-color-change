# Left2y-colorchange

⚡️ **Figma 极速换色插件** - 无需构建，下载即用！

一个强大的 Figma 插件，让你能够批量调整选中内容中所有颜色的色相、饱和度和明度。

## 🚀 快速安装 (No-Build 版本)

**无需 npm，无需构建，3 步搞定！**

1. 前往 [Releases 页面](https://github.com/Left2y/figma-color-change/releases) 下载 `no-build.zip`
2. 解压后，在 Figma 中选择 **Plugins → Development → Import plugin from manifest...**
3. 选择解压目录中的 `manifest.json` 文件，完成！

## ✨ 功能特性

- 🎨 **色相旋转**：在色盘上拖动颜色点来调整整体色相
- 🔗 **联动模式**：锁定模式下所有颜色一起旋转，保持色彩关系
- 📊 **颜色占比条**：可视化显示当前 frame 中各颜色的使用比例（最多 10 种）
- 🎛️ **饱和度/亮度调节**：通过滑块精确控制
- ⚙️ **保留特殊颜色**：可选择保留黑/白/灰色不被修改
- 🔄 **自动扫描**：切换选择时自动识别新 frame 的颜色
- 🎯 **精准控制**：支持填充、描边、内阴影、投影独立开关

## 📖 使用方法

1. 在 Figma 中选择一个 Frame
2. 运行插件 (Plugins → Left2y-colorchange)
3. 插件会自动扫描并显示颜色
4. 拖动色盘上的颜色点来调整色相
5. 使用滑块调整饱和度和亮度
6. 点击 **Apply Changes** 应用修改

### 模式切换

| 模式 | 图标 | 说明 |
| :--- | :---: | :--- |
| **🔗 锁定模式** | 🔗 | 所有颜色联动旋转，保持相对关系 |
| **🔓 解锁模式** | 🔓 | 可单独调整某个颜色 |

## 📁 项目结构

```
figma-color-change/
├── no-build/           # ⭐ 无需构建版本（推荐使用）
│   ├── manifest.json
│   ├── code.js
│   ├── ui.html
│   └── README.md
├── src/                # TypeScript 源码（开发者用）
├── dist/               # 构建输出
└── README.md
```

## � 开发者安装 (需要构建)

如果你想修改源码：

```bash
git clone https://github.com/Left2y/figma-color-change.git
cd figma-color-change
npm install
npm run build
```

然后在 Figma 中导入根目录的 `manifest.json`。

## � 技术栈

- **No-Build 版本**：纯 JavaScript + HTML/CSS
- **开发版本**：TypeScript + esbuild
- **色盘组件**：iro.js
- **Figma Plugin API**

## � 版本历史

- **v2.0-nobuild**：无需构建版本，新增颜色占比条、锁定模式饱和度锁定
- **v2.1**：独立颜色控制
- **v2.0**：交互式色盘、智能保护
- **v1.0**：基础批量处理

## 📄 开源协议

MIT © Left2y
