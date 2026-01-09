# Figma 极速换色插件 (Quick Hues)

⚡️ **Figma 中最高效的批量调色工具**
这是一个强大的 Figma 插件，让你能够批量调整选中内容中所有颜色的色相、饱和度和明度。支持高级颜色映射和独立颜色控制。

## ✨ 功能特性

### V2.1: 独立颜色控制 (New!) 🔓
- **独立模式 (Unlock Mode)**：打破传统全局调整的限制，点击锁定图标即可切换模式。
- **精准映射 (Color Mapping)**：支持单独拖拽某个特定颜色点（如将渐变中的紫色改为青色），插件会自动计算并精准应用到对应的渐变、描边或投影中，而不影响画面中的其他颜色。
- **实时反馈**：拖拽色盘时实时预览效果。

### V2: 高级 HSL 与 交互升级 🎨
- **交互式色盘**：可视化的色相环，直观地旋转调整色调。
- **智能保护**：支持“保留白/黑/灰”选项，避免破坏画面的明暗关系。
- **精细控制**：可单独控制填充 (Fills)、描边 (Strokes)、内阴影 (Inner Shadows) 和 投影 (Drop Shadows) 是否参与变色。
- **快捷操作**：一键“去饱和” (Desaturate) 和“重置” (Reset)。

### V1: 核心基础功能 🛠
- **批量处理**：一键扫描并调整选中 Frame 内的所有颜色。
- **全类型支持**：完美支持纯色 (Solid)、渐变 (Gradient) 和 阴影 (Effects)。
- **安全机制**：优雅处理 `mixed` 属性和只读节点，防止报错。

## 🚀 安装指南

1. 克隆项目仓库：
```bash
git clone https://github.com/Left2y/figma-color-change.git
cd figma-color-change
```

2. 安装依赖：
```bash
npm install
```

3. 构建插件：
```bash
npm run build
```

4. 在 Figma 中导入：
   - 打开 Figma Desktop
   - 菜单选择 **Plugins** → **Development** → **Import plugin from manifest...**
   - 选择项目目录下的 `manifest.json` 文件

## 📖 使用说明

1. **选中**：选择一个或多个 Frame。
2. **运行**：启动 "Quick Hues" 插件。
3. **控制**：
    - **🔗 连锁模式**（默认）：拖动任意颜色点，旋转整个色相环（保持原有配色关系）。
    - **🔓 独立模式**：点击右上角锁图标解锁，单独调整某个颜色点。
4. **微调**：使用下方滑杆调整饱和度 (Saturation) 和 亮度 (Lightness)。在设置面板中勾选“Keep White”来锁定白色。
5. **应用**：点击 **Apply Changes** 完成修改。

## 🛠 技术栈

- **TypeScript**: 强类型保障代码健壮性。
- **esbuild**: 极速构建体验。
- **Preact / Vanilla**: 轻量级原生 UI 实现。
- **iro.js**: 专业级色盘组件。
- **Figma Plugin API**: 深度集成。

## 📄 开源协议

MIT © Left2y
