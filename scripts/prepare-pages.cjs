const fs = require('node:fs');
const path = require('node:path');
const built = fs.readFileSync('dev-dist/dev.html', 'utf8');
const js = built.match(/src="\.\/assets\/([^"]+\.js)"/)[1];
const css = built.match(/href="\.\/assets\/([^"]+\.css)"/)[1];
fs.mkdirSync('static/dietary', {recursive:true});
for (const name of fs.readdirSync('dev-dist/assets')) fs.copyFileSync(path.join('dev-dist/assets', name), path.join('static/dietary', name));
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, '').replace(/<link[^>]+rel="stylesheet"[^>]*>/g, '');
html = html.replace('</head>', `<script type="module" crossorigin src="./static/dietary/${js}"></script><link rel="stylesheet" href="./static/dietary/${css}"></head>`);
html = html.replace('<title>TCM 3D 中医穴位</title>', '<title>TCM 3D 中医穴位与传统食养</title>');
// Preserve the existing disclaimer above the application viewport.
// 加幂等守卫：原来这条 replace 不带判断，第二次跑会把已经改好的
// `#root{...;position:relative}` 再追加一次，产出 `...};position:relative}` 这种坏 CSS。
if (!html.includes('#root > .fixed{position:absolute}')) {
  html = html.replace('#root{flex:1 1 auto;min-height:0;width:100%}', '#root{flex:1 1 auto;min-height:0;width:100%;position:relative}\n#root > .fixed{position:absolute}');
}
fs.writeFileSync('index.html', html);
fs.writeFileSync('asset-manifest.json', JSON.stringify({files:{'main.js':`./static/dietary/${js}`,'main.css':`./static/dietary/${css}`,'index.html':'./index.html'},entrypoints:[`static/dietary/${css}`,`static/dietary/${js}`]},null,2)+'\n');
console.log('Prepared Pages entrypoint:', js, css);
