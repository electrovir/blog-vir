import {checkWrap} from '@augment-vir/assert';
import {
    ensureErrorAndPrependMessage,
    extractExtension,
    log,
    PromiseQueue,
} from '@augment-vir/common';
import {doesPathContain} from '@augment-vir/node';
import {watch} from 'node:fs';
import {realpath} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {type Plugin} from 'vite';
import {blogPaths} from '../data/blog-paths.js';
import {generateStaticBlog, type GenerateStaticBlogOptions} from './generate-static-blog.js';

/**
 * Filesystem events handled by the blog post watcher.
 *
 * @category Internal
 */
export enum BlogPostWatcherEvent {
    Change = 'change',
    Rename = 'rename',
}

/**
 * Create a queued change handler that rebuilds generated content and reloads the browser.
 *
 * @category Internal
 */
export function createBlogPostChangeHandler({
    postsDir,
    rebuild,
    reload,
}: Readonly<{
    postsDir: string;
    rebuild: () => Promise<void>;
    reload: () => void;
}>) {
    const rebuildQueue = new PromiseQueue();

    return async function handleBlogPostChange({
        eventName,
        filePath,
    }: Readonly<{
        eventName: string;
        filePath: string;
    }>) {
        if (
            checkWrap.isEnumValue(eventName, BlogPostWatcherEvent) == undefined ||
            extractExtension(filePath).extension !== '.md' ||
            !doesPathContain({
                potentialParentPath: postsDir,
                potentialChildPath: filePath,
            })
        ) {
            return false;
        } else if (rebuildQueue.size >= 2) {
            /** Keep the active rebuild plus at most one trailing rebuild for changes during it. */
            return true;
        }

        await rebuildQueue.add(async () => {
            await rebuild();
            reload();
        });
        return true;
    };
}

/**
 * Create the Vite development plugin that watches Markdown posts and regenerates blog data.
 *
 * @category Internal
 */
export function createBlogPostWatcherPlugin({
    pageSize,
    postsDir,
    rssFeed,
    staticDir,
    verbose,
}: Readonly<GenerateStaticBlogOptions>): Plugin {
    return {
        name: 'blog-vir-post-watcher',
        apply: 'serve',
        async configureServer(server) {
            const watchedPostsDir = await realpath(postsDir);
            const handleBlogPostChange = createBlogPostChangeHandler({
                postsDir: watchedPostsDir,
                async rebuild() {
                    const {posts} = await generateStaticBlog({
                        pageSize,
                        postsDir,
                        rssFeed,
                        staticDir,
                        verbose,
                    });
                    log.success(
                        [
                            'Regenerated ',
                            String(posts.length),
                            ' posts after post content changed.',
                        ].join(''),
                    );
                },
                reload() {
                    server.ws.send({
                        type: 'full-reload',
                    });
                },
            });

            function handleWatcherEvent(
                ...[
                    eventName,
                    fileName,
                ]: [
                    eventName: string,
                    fileName: string | null,
                ]
            ) {
                if (!fileName) {
                    return;
                }
                const filePath = resolve(watchedPostsDir, fileName);
                void handleBlogPostChange({
                    eventName,
                    filePath,
                }).catch((error: unknown) => {
                    log.error(
                        ensureErrorAndPrependMessage(
                            error,
                            `Failed to regenerate blog content after '${filePath}' changed.`,
                        ).message,
                    );
                });
            }

            const postWatcher = watch(
                watchedPostsDir,
                {
                    encoding: 'utf8',
                    recursive: true,
                },
                handleWatcherEvent,
            );
            server.httpServer?.once('close', () => {
                postWatcher.close();
            });

            return () => {
                server.watcher.unwatch([
                    join(staticDir, blogPaths.contentDir),
                    join(staticDir, blogPaths.rssFeedFile),
                ]);
            };
        },
    } satisfies Plugin;
}
