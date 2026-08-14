import {defineShape, nonEmptyStringShape, optionalShape} from 'object-shape-tester';
import {rssFeedConfigShape} from './generate-rss-feed.js';

/**
 * Shape definition for {@link BlogVirConfig}.
 *
 * @category Internal
 */
export const blogVirConfigShape = defineShape({
    /**
     * Consumer site index file.
     *
     * @default `src/index.html`
     */
    indexHtmlPath: optionalShape(nonEmptyStringShape(), {
        alsoUndefined: true,
    }),
    /**
     * Directory containing `.md` blog posts.
     *
     * @default `posts`
     */
    postsDirPath: optionalShape(nonEmptyStringShape(), {
        alsoUndefined: true,
    }),
    /**
     * Vite public/static directory.
     *
     * @default `www-static`
     */
    staticDirPath: optionalShape(nonEmptyStringShape(), {
        alsoUndefined: true,
    }),
    /** Optional Vite config file. */
    viteConfigPath: optionalShape(nonEmptyStringShape(), {
        alsoUndefined: true,
    }),
    /**
     * Posts per generated page.
     *
     * @default 20
     */
    pageSize: optionalShape(0, {
        alsoUndefined: true,
    }),
    /** RSS feed metadata. */
    rssFeed: rssFeedConfigShape,
    /** Log per-file progress while parsing blog posts. */
    verbose: optionalShape(false, {
        alsoUndefined: true,
    }),
});

/**
 * Configuration loaded by the `blog-vir` CLI. Relative paths resolve from the working directory.
 *
 * @category Internal
 */
export type BlogVirConfig = (typeof blogVirConfigShape)['runtimeType'];
