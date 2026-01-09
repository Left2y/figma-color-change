const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
    // 1. 构建 Main 进程
    await esbuild.build({
        entryPoints: ['src/main.ts'],
        bundle: true,
        outfile: 'dist/main.js',
        target: 'es6',
    });
    console.log('✅ Built dist/main.js');

    // 2. 构建 UI 脚本 (生成临时文件)
    await esbuild.build({
        entryPoints: ['src/ui.ts'],
        bundle: true,
        outfile: 'dist/ui-temp.js',
        target: 'es6',
    });
    console.log('✅ Built dist/ui-temp.js');

    // 3. 读取 HTML 模板和编译后的 JS
    const htmlTemplate = fs.readFileSync('src/ui.html', 'utf-8');
    const uiJs = fs.readFileSync('dist/ui-temp.js', 'utf-8');
    const iroJs = fs.readFileSync('src/iro.min.js', 'utf-8');

    // 4. 把 <script src="ui.js"> 替换成内联脚本（包含库和业务逻辑）
    // 注意：库文件 (iroJs) 必须在业务逻辑 (uiJs) 之前
    const finalHtml = htmlTemplate.replace(
        '<script src="ui.js"></script>',
        `<script>\n${iroJs}\n</script>\n<script>\n${uiJs}\n</script>`
    );

    // 5. 写入最终的 ui.html
    fs.writeFileSync('dist/ui.html', finalHtml);
    console.log('✅ Created dist/ui.html with inlined script');

    // 6. 清理临时文件
    fs.unlinkSync('dist/ui-temp.js');
}

build().catch((e) => {
    console.error(e);
    process.exit(1);
});
