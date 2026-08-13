#!/usr/bin/env node

import {ensureErrorAndPrependMessage, log} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {generateStaticBlog} from './generate-static-blog.js';
import {parseBlogVirArgs} from './parse-cli-args.js';
import {runVite} from './run-vite-build.js';

async function main(): Promise<void> {
    const args = parseBlogVirArgs(process.argv, import.meta);

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
        postsDir: args.postsDirPath,
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
        mode: args.mode,
    });
}

try {
    await main();
} catch (error) {
    const wrapped = ensureErrorAndPrependMessage(error, 'blog-vir failed.');
    log.error(wrapped.message);
    process.exit(1);
}
