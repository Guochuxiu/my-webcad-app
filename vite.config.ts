import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vite.dev/config/
// @ts-ignore
export default ({ mode }) => {
    const isDev = mode === 'development';

    return defineConfig({
        plugins: [vue(), dts(), cssInjectedByJsPlugin()],
        build: {
            lib: {
                entry: isDev
                    ? './src/main.ts'        // 开发模式：带UI的入口
                    : './src/index.ts',  // 生产模式：SDK入口
                name: 'cadnginx',
                fileName: 'index',
                formats: ['es']
            },
            sourcemap: true,
            minify: false,
            outDir: isDev ? 'dist' : 'lib',
            reportCompressedSize: false,
            rollupOptions: {
                output: {
                    sourcemapExcludeSources: false  // 包含源代码在 sourcemap 中
                },
                external: [
                    // '@fs/cadnginx'
                ]
            }
        },
        resolve: {
            alias: {
                '@': path.resolve(dirname(fileURLToPath(import.meta.url)), 'src'),
                '@fs/cadnginx': path.resolve(dirname(fileURLToPath(import.meta.url)), 'node_modules/@fsdev/cadnginx')
            }
        },
        optimizeDeps: {
            // include: ['@fs/fscadweb']  // 列出需要包含 sourcemap 的依赖
        },
        server: {
            proxy: {

            },
            cors: true,
            headers: {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp'
            },
            https: {
                key: fs.readFileSync('./key.pem'),
                cert: fs.readFileSync('./cert.pem')
            }
        }
    });
};
