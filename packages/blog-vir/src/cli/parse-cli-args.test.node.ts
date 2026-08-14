import {assert} from '@augment-vir/assert';
import {type JsonCompatibleValue} from '@augment-vir/common';
import {writeJsonFile} from '@augment-vir/node';
import {describe, it} from '@augment-vir/test';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {type BlogVirConfig} from './blog-vir-config.js';
import {BlogVirMode} from './blog-vir-mode.js';
import {parseBlogVirArgs} from './parse-cli-args.js';

const rssFeedConfig: BlogVirConfig['rssFeed'] = {
    siteUrl: 'https://example.com/blog/',
    title: 'Example Blog',
    description: 'Example blog feed.',
};

async function createTempConfig(config: JsonCompatibleValue) {
    const tempDirPath = await mkdtemp(join(tmpdir(), 'blog-vir-config-'));
    const configFilePath = join(tempDirPath, 'blog-vir.config.json');
    await writeJsonFile(configFilePath, config);

    return {
        configFilePath,
        tempDirPath,
    };
}

describe(parseBlogVirArgs.name, () => {
    it('loads the config file and resolves its paths', async () => {
        const {configFilePath, tempDirPath} = await createTempConfig({
            indexHtmlPath: 'custom/index.html',
            postsDirPath: 'custom/posts',
            staticDirPath: 'custom/static',
            viteConfigPath: 'custom/vite.config.ts',
            pageSize: 12,
            rssFeed: rssFeedConfig,
            verbose: true,
        });

        try {
            assert.deepEquals(
                await parseBlogVirArgs(
                    [
                        BlogVirMode.Preview,
                        configFilePath,
                    ],
                    import.meta,
                ),
                {
                    indexHtmlPath: resolve('custom/index.html'),
                    postsDirPath: resolve('custom/posts'),
                    staticDirPath: resolve('custom/static'),
                    viteConfigPath: resolve('custom/vite.config.ts'),
                    mode: BlogVirMode.Preview,
                    pageSize: 12,
                    rssFeed: rssFeedConfig,
                    siteBasePath: '/blog/',
                    verbose: true,
                },
            );
        } finally {
            await rm(tempDirPath, {
                recursive: true,
            });
        }
    });

    it('preserves the existing path defaults', async () => {
        const {configFilePath, tempDirPath} = await createTempConfig({
            rssFeed: rssFeedConfig,
        });

        try {
            assert.deepEquals(
                await parseBlogVirArgs(
                    [
                        BlogVirMode.Build,
                        configFilePath,
                    ],
                    import.meta,
                ),
                {
                    indexHtmlPath: resolve('src', 'index.html'),
                    postsDirPath: resolve('posts'),
                    staticDirPath: resolve('www-static'),
                    viteConfigPath: undefined,
                    mode: BlogVirMode.Build,
                    pageSize: 20,
                    rssFeed: rssFeedConfig,
                    siteBasePath: '/blog/',
                    verbose: false,
                },
            );
        } finally {
            await rm(tempDirPath, {
                recursive: true,
            });
        }
    });

    it('requires RSS feed metadata', async () => {
        const {configFilePath, tempDirPath} = await createTempConfig({});

        try {
            await assert.throws(
                parseBlogVirArgs(
                    [
                        BlogVirMode.Build,
                        configFilePath,
                    ],
                    import.meta,
                ),
                {
                    matchMessage: 'rssFeed',
                },
            );
        } finally {
            await rm(tempDirPath, {
                recursive: true,
            });
        }
    });
});
