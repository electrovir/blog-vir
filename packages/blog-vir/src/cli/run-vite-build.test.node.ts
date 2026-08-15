import {assert} from '@augment-vir/assert';
import {readAllDirContents} from '@augment-vir/node';
import {describe, it} from '@augment-vir/test';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BlogVirMode} from './blog-vir-mode.js';
import {createViteInlineConfig, runVite} from './run-vite-build.js';

describe(createViteInlineConfig.name, () => {
    it('injects runtime blog configuration', () => {
        assert.deepEquals(
            createViteInlineConfig({
                configPath: undefined,
                cwd: '/test',
                indexHtmlPath: '/test/src/index.html',
                pageSize: 12,
                siteBasePath: '/nested/',
                staticDirPath: '/test/www-static',
            }).define,
            {
                VITE_INJECTED_BLOG_VIR_DATA: JSON.stringify({
                    pageSize: 12,
                    siteBasePath: '/nested/',
                }),
            },
        );
    });
});

describe(runVite.name, () => {
    it('builds with blog-vir defaults when no Vite config is provided', async () => {
        const tempDirPath = await mkdtemp(join(tmpdir(), 'blog-vir-vite-'));
        const sourceDirPath = join(tempDirPath, 'src');
        const staticDirPath = join(tempDirPath, 'www-static');
        await Promise.all([
            mkdir(sourceDirPath),
            mkdir(staticDirPath),
        ]);

        try {
            await Promise.all([
                writeFile(
                    join(sourceDirPath, 'index.html'),
                    '<!doctype html><title>Default Vite build</title><link rel="alternate" href="/rss.xml"><script type="module" src="./main.ts"></script>',
                    'utf8',
                ),
                writeFile(
                    join(sourceDirPath, 'main.ts'),
                    'globalThis.blogVirBasePath = VITE_INJECTED_BLOG_VIR_DATA.siteBasePath;',
                    'utf8',
                ),
                writeFile(join(staticDirPath, 'rss.xml'), '<rss></rss>', 'utf8'),
            ]);

            await runVite({
                configPath: undefined,
                cwd: tempDirPath,
                devPlugins: [],
                indexHtmlPath: join(sourceDirPath, 'index.html'),
                mode: BlogVirMode.Build,
                pageSize: 12,
                siteBasePath: '/nested/',
                staticDirPath,
            });

            assert.isTrue(existsSync(join(tempDirPath, 'dist', 'index.html')));
            assert.isTrue(
                (await readFile(join(tempDirPath, 'dist', 'index.html'), 'utf8')).includes(
                    'href="/nested/rss.xml"',
                ),
            );
            assert.strictEquals(
                await readFile(join(tempDirPath, 'dist', 'rss.xml'), 'utf8'),
                '<rss></rss>',
            );
            const buildContents = JSON.stringify(
                await readAllDirContents(join(tempDirPath, 'dist'), {
                    recursive: true,
                }),
            );
            assert.isTrue(buildContents.includes('/nested/'));
            assert.isFalse(buildContents.includes('VITE_INJECTED_BLOG_VIR_DATA'));
        } finally {
            await rm(tempDirPath, {
                force: true,
                recursive: true,
            });
        }
    });

    it('rejects a configured Vite path that does not exist', async () => {
        const tempDirPath = await mkdtemp(join(tmpdir(), 'blog-vir-vite-'));

        try {
            await assert.throws(
                runVite({
                    configPath: join(tempDirPath, 'missing-vite.config.ts'),
                    cwd: tempDirPath,
                    devPlugins: [],
                    indexHtmlPath: join(tempDirPath, 'src', 'index.html'),
                    mode: BlogVirMode.Build,
                    pageSize: 20,
                    siteBasePath: '/',
                    staticDirPath: join(tempDirPath, 'www-static'),
                }),
                {
                    matchMessage: 'Vite config not found',
                },
            );
        } finally {
            await rm(tempDirPath, {
                force: true,
                recursive: true,
            });
        }
    });
});
