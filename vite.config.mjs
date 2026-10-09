import { defineConfig, transformWithEsbuild } from 'vite';
import { cpSync, createReadStream, existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(repoRoot, 'source');
const runtimeAssetDirs = ['models', 'draco', 'hdri'];
const mimeTypes = {
  '.glb': 'model/gltf-binary',
  '.hdr': 'image/vnd.radiance',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

function assetPathForRequest(requestUrl, assetDir) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }

  const prefix = `/${assetDir}`;
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return null;

  const relativePath = pathname.slice(prefix.length).replace(/^[/\\]+/, '');
  if (!relativePath || relativePath.includes('\0') || relativePath.includes(':')) return null;

  const assetRoot = path.join(repoRoot, assetDir);
  let filePath;
  let relativeToRoot;
  try {
    filePath = path.resolve(assetRoot, relativePath);
    relativeToRoot = path.relative(assetRoot, filePath);
  } catch {
    return null;
  }
  if (relativeToRoot.startsWith(`..${path.sep}`) || relativeToRoot === '..' || path.isAbsolute(relativeToRoot)) return null;

  return filePath;
}

function serveRuntimeAssets() {
  return {
    name: 'serve-runtime-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url || !['GET', 'HEAD'].includes(request.method || 'GET')) {
          next();
          return;
        }

        const assetDir = runtimeAssetDirs.find(dir => request.url.startsWith(`/${dir}`));
        if (!assetDir) {
          next();
          return;
        }

        const filePath = assetPathForRequest(request.url, assetDir);
        if (!filePath) {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }

        let stat;
        try {
          stat = statSync(filePath);
        } catch {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }

        if (!stat.isFile()) {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Length', stat.size);
        response.setHeader('Content-Type', mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
        if (request.method === 'HEAD') {
          response.end();
          return;
        }

        createReadStream(filePath)
          .on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end();
          })
          .pipe(response);
      });
    },
  };
}

function copyRuntimeAssets() {
  let outDir;
  return {
    name: 'copy-runtime-assets',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const assetDir of runtimeAssetDirs) {
        const sourceDir = path.join(repoRoot, assetDir);
        if (!existsSync(sourceDir)) {
          throw new Error(`Missing runtime asset directory: ${sourceDir}`);
        }
        cpSync(sourceDir, path.join(outDir, assetDir), { recursive: true });
      }
      writeFileSync(path.join(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig({
  root: sourceRoot,
  base: './',
  publicDir: false,
  plugins: [
    {
      name: 'source-jsx',
      async transform(code, id) {
        if (/[\\/]source[\\/].*\.js$/.test(id)) {
          return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
        }
      },
    },
    serveRuntimeAssets(),
    copyRuntimeAssets(),
  ],
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  build: {
    outDir: path.join(repoRoot, 'dist'),
    emptyOutDir: true,
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
