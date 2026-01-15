# Left2y-colorchange (No-Build 版本)

一个 Figma 颜色调整插件，**无需构建**，直接导入即可使用。

## ✨ 功能特性

- 🎨 **色相旋转**：在色盘上拖动颜色点来调整整体色相
- 🔗 **联动模式**：锁定模式下所有颜色一起旋转，保持色彩关系
- 📊 **颜色占比条**：可视化显示当前 frame 中各颜色的使用比例
- 🎛️ **饱和度/亮度调节**：通过滑块精确控制
- ⚙️ **保留特殊颜色**：可选择保留黑/白/灰色不被修改
- 🔄 **自动扫描**：切换选择时自动识别新 frame 的颜色

## 🚀 安装方法

1. 下载并解压 `no-build.zip`
2. 打开 Figma 桌面应用
3. 进入 **Plugins** → **Development** → **Import plugin from manifest...**
4. 选择解压后的 `manifest.json` 文件
5. 完成！

## 📖 使用方法

1. 在 Figma 中选择一个 Frame
2. 运行插件 (Plugins → Left2y-colorchange)
3. 插件会自动扫描并显示颜色
4. 拖动色盘上的颜色点来调整色相
5. 使用滑块调整饱和度和亮度
6. 点击 **Apply Changes** 应用修改

## 🔧 与构建版本的区别

| 特性 | 构建版本 | No-Build 版本 |
| :--- | :--- | :--- |
| 需要 npm install | ✅ 是 | ❌ 否 |
| 需要 npm build | ✅ 是 | ❌ 否 |
| 修改后需重新构建 | ✅ 是 | ❌ 否，直接刷新 |
| 代码可读性 | TypeScript | 纯 JavaScript |

## 📁 文件结构

```
no-build/
├── manifest.json  # 插件配置文件
├── code.js        # 主进程代码
├── ui.html        # UI 界面
└── README.md      # 本文件
```

## 📝 版本信息

- **版本**：v2.0 (No-Build)
- **作者**：Left2y
- **许可**：MIT
