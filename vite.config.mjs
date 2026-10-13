import { defineConfig, transformWithEsbuild } from 'vite';
import { cpSync } from 'node:fs';
export default defineConfig({ base: './', publicDir: false,
 // 部署到反向代理域名后，预览服务必须放行外部 Host，否则报 "Blocked request"。
 server: { host: '0.0.0.0', allowedHosts: true },
 preview: { host: '0.0.0.0', allowedHosts: true },
 plugins: [{ name: 'source-jsx', async transform(code, id) {
 if (/\/source\/.*\.js$/.test(id)) return transformWithEsbuild(code, id, {loader:'jsx', jsx:'automatic'});
 }}, {name:'copy-existing-assets', closeBundle(){for(const p of ['models','draco','hdri']) cpSync(p,`dev-dist/${p}`,{recursive:true});}}],
 optimizeDeps: {esbuildOptions:{loader:{'.js':'jsx'}}},
 build: {outDir:'dev-dist', rollupOptions:{input:'dev.html'}}
});
