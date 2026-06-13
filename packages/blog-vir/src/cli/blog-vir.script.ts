#!/usr/bin/env node

import {ensureErrorAndPrependMessage, log} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {generateStaticBlog} from './generate-static-blog.js';
import {BlogVirMode, parseBlogVirArgs} from './parse-cli-args.js';
import {runVite} from './run-vite-build.js';

async function main(): Promise<void> {
    const args = parseBlogVirArgs(process.argv, import.meta);

    if (!existsSync(args.indexHtml)) {
        throw new Error(
            [
                'index.html not found at "',
                args.indexHtml,
                '".',
            ].join(''),
        );
    } else if (!existsSync(args.postsDir)) {
        throw new Error(
            [
                'Posts directory not found at "',
                args.postsDir,
                '".',
            ].join(''),
        );
    }

    log.info(
        [
            'Generating static blog content into "',
            args.staticDir,
            '".',
        ].join(''),
    );
    const {posts} = await generateStaticBlog({
        postsDir: args.postsDir,
        staticDir: args.staticDir,
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
        configPath: args.viteConfig,
        cwd: process.cwd(),
        mode: args.mode === BlogVirMode.Dev ? 'dev' : args.mode,
    });
}

try {
    await main();
} catch (error) {
    const wrapped = ensureErrorAndPrependMessage(error, 'blog-vir failed.');
    log.error(wrapped.message);
    process.exit(1);
}
