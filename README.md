# Figma Color Change Plugin

一个 Figma 插件，用于批量调整选中 Frame 内所有颜色的饱和度和明度。

## 功能

- 🎨 **颜色扫描**：扫描选中 Frame 内的所有颜色（填充、描边、渐变、阴影）
- 🔧 **全局调整**：通过饱和度/明度滑杆批量调整颜色
- ⚪ **智能处理**：白色、灰色、黑色只受明度影响，不会变色
- 📊 **统计信息**：显示处理的节点数、修改的颜色数等

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/YOUR_USERNAME/figma-color-change.git
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

4. 在 Figma 中加载插件：
   - 打开 Figma Desktop
   - Plugins → Development → Import plugin from manifest...
   - 选择项目目录下的 `manifest.json`

## 使用方法

1. 选中一个 Frame
2. 运行插件
3. 点击 "Scan Selection" 扫描颜色
4. 调整饱和度和明度滑杆
5. 点击 "Apply Changes" 应用更改

## 技术栈

- TypeScript
- esbuild
- Figma Plugin API

## License

MIT
