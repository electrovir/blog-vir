#!/usr/bin/env node

import {ensureErrorAndPrependMessage, log} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {createBlogPostWatcherPlugin} from './blog-post-watcher.plugin.js';
import {generateStaticBlog} from './generate-static-blog.js';
import {parseBlogVirArgs} from './parse-cli-args.js';
import {runVite} from './run-vite-build.js';

async function main(): Promise<void> {
    const args = await parseBlogVirArgs(process.argv, import.meta);

    if (!existsSync(args.indexHtmlPath)) {
        throw new Error(
            [
                'index.html not found at "',
                args.indexHtmlPath,
                '".',
            ].join(''),
        );
    } else if (!existsSync(args.postsDirPath)) {
        throw new Error(
            [
                'Posts directory not found at "',
                args.postsDirPath,
                '".',
            ].join(''),
        );
    }

    log.info(
        [
            'Generating static blog content into "',
            args.staticDirPath,
            '".',
        ].join(''),
    );
    const {posts} = await generateStaticBlog({
        pageSize: args.pageSize,
        postsDir: args.postsDirPath,
        rssFeed: args.rssFeed,
        staticDir: args.staticDirPath,
        verbose: args.verbose,
    });
    log.success(
        [
            'Generated ',
            String(posts.length),
            ' posts.',
        ].join(''),
    );

    await runVite({
        configPath: args.viteConfigPath,
        cwd: process.cwd(),
        devPlugins: [
            createBlogPostWatcherPlugin({
                pageSize: args.pageSize,
                postsDir: args.postsDirPath,
                rssFeed: args.rssFeed,
                staticDir: args.staticDirPath,
                verbose: args.verbose,
            }),
        ],
        indexHtmlPath: args.indexHtmlPath,
        mode: args.mode,
        pageSize: args.pageSize,
        siteBasePath: args.siteBasePath,
        staticDirPath: args.staticDirPath,
    });
}

try {
    await main();
} catch (error) {
    const wrapped = ensureErrorAndPrependMessage(error, 'blog-vir failed.');
    log.error(wrapped.message);
    process.exit(1);
}
