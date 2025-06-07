import { defineConfig } from 'vite';
import { injectHtml } from 'vite-plugin-html';
import fs from 'fs';

export default defineConfig({
    plugins: [
        injectHtml({
            injectData: {
                headContent: fs.readFileSync('templates/head.html', 'utf-8'),
                criticalCss: `
          <style>
            body {
              background-color: #1a1a1a;
              color: #ffffff;
              margin: 0;
              min-height: 100vh;
              transition: none;
            }
          </style>
        `,
            },
        }),
    ],
    base: '/hayabusa-racing/', // GitHub Pagesのリポジトリ名に合わせる
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
                about: './about.html',
                // 他のページを追加
            },
        },
    },
});