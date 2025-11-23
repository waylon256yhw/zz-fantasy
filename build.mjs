import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function build() {
  try {
    console.log('🚀 开始使用 esbuild 打包...');

    // 打包 JS/TS 代码
    const result = await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      minify: true,
      format: 'iife', // ✅ 改为IIFE格式，兼容DZMM sandbox
      target: 'es2020',
      write: false,
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
      },
      // ✅ 移除external，将所有依赖打包到一起
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    const bundledJS = result.outputFiles[0].text;

    // 读取原始 HTML
    let htmlTemplate = fs.readFileSync('index.html', 'utf-8');

    // ✅ 移除 import map（DZMM不支持）
    htmlTemplate = htmlTemplate.replace(
      /<script type="importmap">[\s\S]*?<\/script>/g,
      ''
    );

    // 创建单个 HTML 文件，将 JS 内联
    // ✅ 改为普通script标签，不使用type="module"
    // ⚠️ 只替换HTML结构中的</body>，不影响JS代码中的字符串
    const bodyTagIndex = htmlTemplate.lastIndexOf('</body>');
    if (bodyTagIndex === -1) {
      throw new Error('Cannot find </body> tag in HTML template');
    }
    const finalHTML =
      htmlTemplate.slice(0, bodyTagIndex) +
      `  <script>${bundledJS}</script>\n  ` +
      htmlTemplate.slice(bodyTagIndex);

    // 创建 dist 目录
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }

    // 写入最终的 HTML 文件
    fs.writeFileSync('dist/index.html', finalHTML);

    // 创建软链接到 public 目录
    const publicDir = 'public';
    const symlinkPath = path.join(publicDir, 'index.html');
    const targetPath = path.resolve('dist/index.html');

    // 如果 public 目录不存在，创建它
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 删除旧的软链接（如果存在）
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    }

    // 创建软链接
    fs.symlinkSync(targetPath, symlinkPath);

    console.log('✅ 打包完成！输出文件：dist/index.html');
    console.log(`📦 Bundle 大小：${(bundledJS.length / 1024).toFixed(2)} KB`);
    console.log(`🔗 软链接已创建：public/index.html -> ${targetPath}`);

  } catch (error) {
    console.error('❌ 打包失败：', error);
    process.exit(1);
  }
}

build();
