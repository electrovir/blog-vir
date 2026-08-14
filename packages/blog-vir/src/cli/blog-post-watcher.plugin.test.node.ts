import {assert, waitUntil} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createServer} from 'vite';
import {createBlogPostJsonPath} from '../data/blog-paths.js';
import {
    BlogPostWatcherEvent,
    createBlogPostChangeHandler,
    createBlogPostWatcherPlugin,
} from './blog-post-watcher.plugin.js';

describe(createBlogPostChangeHandler.name, () => {
    it('rebuilds and reloads for added, changed, and removed Markdown posts', async () => {
        const postsDir = resolve('test-files', 'watcher-posts');
        const expectedRebuildCalls = [
            Promise.resolve(),
            Promise.resolve(),
            Promise.resolve(),
        ].values();
        const expectedReloadCalls = [
            true,
            true,
            true,
        ].values();
        const handleBlogPostChange = createBlogPostChangeHandler({
            postsDir,
            rebuild() {
                const expectedCall = expectedRebuildCalls.next();
                assert.isFalse(expectedCall.done);
                return expectedCall.value;
            },
            reload() {
                assert.isFalse(expectedReloadCalls.next().done);
            },
        });

        assert.deepEquals(
            [
                await handleBlogPostChange({
                    eventName: BlogPostWatcherEvent.Rename,
                    filePath: join(postsDir, 'added.md'),
                }),
                await handleBlogPostChange({
                    eventName: BlogPostWatcherEvent.Change,
                    filePath: join(postsDir, 'changed.md'),
                }),
                await handleBlogPostChange({
                    eventName: BlogPostWatcherEvent.Rename,
                    filePath: join(postsDir, 'removed.md'),
                }),
            ],
            [
                true,
                true,
                true,
            ],
        );
        assert.isTrue(expectedRebuildCalls.next().done);
        assert.isTrue(expectedReloadCalls.next().done);
    });

    it('ignores non-Markdown files and files outside the posts directory', async () => {
        const postsDir = resolve('test-files', 'watcher-posts');
        const handleBlogPostChange = createBlogPostChangeHandler({
            postsDir,
            rebuild() {
                return Promise.reject(new Error('Unexpected rebuild.'));
            },
            reload() {
                throw new Error('Unexpected reload.');
            },
        });

        assert.deepEquals(
            await Promise.all([
                handleBlogPostChange({
                    eventName: BlogPostWatcherEvent.Change,
                    filePath: join(postsDir, 'notes.txt'),
                }),
                handleBlogPostChange({
                    eventName: BlogPostWatcherEvent.Change,
                    filePath: resolve('test-files', 'outside.md'),
                }),
            ]),
            [
                false,
                false,
            ],
        );
    });

    it('keeps at most one trailing rebuild while a rebuild is active', async () => {
        const postsDir = resolve('test-files', 'watcher-posts');
        const firstRebuild = Promise.withResolvers<void>();
        const expectedRebuildCalls = [
            firstRebuild.promise,
            Promise.resolve(),
        ].values();
        const expectedReloadCalls = [
            true,
            true,
        ].values();
        const handleBlogPostChange = createBlogPostChangeHandler({
            postsDir,
            rebuild() {
                const expectedCall = expectedRebuildCalls.next();
                assert.isFalse(expectedCall.done);
                return expectedCall.value;
            },
            reload() {
                assert.isFalse(expectedReloadCalls.next().done);
            },
        });
        const fileChange = {
            eventName: BlogPostWatcherEvent.Change,
            filePath: join(postsDir, 'changed.md'),
        };
        const rebuildPromises = [
            handleBlogPostChange(fileChange),
            handleBlogPostChange(fileChange),
            handleBlogPostChange(fileChange),
        ];

        firstRebuild.resolve();

        assert.deepEquals(await Promise.all(rebuildPromises), [
            true,
            true,
            true,
        ]);
        assert.isTrue(expectedRebuildCalls.next().done);
        assert.isTrue(expectedReloadCalls.next().done);
    });

    it('rebuilds outputs when Vite observes a post addition and removal', async () => {
        const tempDirPath = await mkdtemp(join(tmpdir(), 'blog-vir-post-watcher-'));
        const postsDir = join(tempDirPath, 'posts');
        const sourceDir = join(tempDirPath, 'src');
        const staticDir = join(tempDirPath, 'www-static');
        await Promise.all([
            mkdir(postsDir),
            mkdir(sourceDir),
            mkdir(staticDir),
        ]);

        try {
            const server = await createServer({
                configFile: false,
                logLevel: 'silent',
                publicDir: staticDir,
                root: sourceDir,
                plugins: [
                    createBlogPostWatcherPlugin({
                        postsDir,
                        rssFeed: {
                            title: 'Watcher Test Blog',
                            description: 'Generated watcher test posts.',
                            siteUrl: 'https://example.com/blog/',
                        },
                        staticDir,
                    }),
                ],
            });

            try {
                await server.listen(0);
                const postFilePath = join(postsDir, '2025-01-01-watched-post.md');
                const postOutputPath = join(
                    staticDir,
                    createBlogPostJsonPath('2025-01-01-watched-post'),
                );
                await writeFile(
                    postFilePath,
                    [
                        '---',
                        'title: Watched post',
                        'date: 2025-01-01',
                        '---',
                        '',
                        'Watched post contents.',
                    ].join('\n'),
                    'utf8',
                );
                await waitUntil.isTrue(() => existsSync(postOutputPath));

                await rm(postFilePath);

                await waitUntil.isFalse(() => existsSync(postOutputPath));
            } finally {
                await server.close();
            }
        } finally {
            await rm(tempDirPath, {
                force: true,
                recursive: true,
            });
        }
    });
});
