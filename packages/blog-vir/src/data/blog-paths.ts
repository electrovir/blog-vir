import {buildUrl, joinUrlPaths, parseUrl} from 'url-vir';

/**
 * Site-relative paths used by both the generator and the runtime elements. Keeping them in one
 * place ensures the file layout stays in sync.
 *
 * @category Internal
 */
export const blogPaths = {
    /** RSS 2.0 feed file, relative to the site root. */
    rssFeedFile: 'rss.xml',
    /** Directory (relative to the site root) where generated JSON lives. */
    contentDir: 'blog-content',
    /** The complete post metadata file. */
    allPostsFile: 'blog-content/all-posts.json',
    /** Generated post-list pages directory. */
    pagesDir: 'blog-content/pages',
    /** The search index file. */
    searchIndexFile: 'blog-content/search-index.json',
    /** Tag to post slug mapping file. */
    tagsFile: 'blog-content/tags.json',
    /** Per-tag post slug list directory; full path is `blog-content/tags/<tag>.json`. */
    tagsDir: 'blog-content/tags',
    /** Per-post directory; full path is `blog-content/posts/<slug>.json`. */
    postsDir: 'blog-content/posts',
} as const;

/**
 * Create the RSS feed URL beneath the given blog base URL.
 *
 * @category Internal
 */
export function createBlogRssFeedUrl(siteBase: string) {
    const siteBaseUrl = parseUrl(siteBase);

    return buildUrl(siteBaseUrl, {
        paths: [
            ...siteBaseUrl.paths,
            blogPaths.rssFeedFile,
        ],
    }).href;
}

const safeBlogTagMatcher = /^[A-Za-z0-9._~-]+$/;

/**
 * Throw if a tag cannot be safely used as a URL and file path segment.
 *
 * @category Internal
 */
export function assertValidBlogTag(tag: string): void {
    if (!safeBlogTagMatcher.test(tag) || tag === '.' || tag === '..') {
        throw new Error(
            [
                'Invalid blog tag "',
                tag,
                '". Tags must be URL and file-name safe: use only letters, numbers, periods, ',
                'underscores, tildes, or hyphens.',
            ].join(''),
        );
    }
}

/**
 * Create the generated JSON path for a post slug beneath {@link blogPaths.postsDir}.
 *
 * @category Internal
 */
export function createBlogPostJsonPath(slug: string): string {
    return joinUrlPaths(blogPaths.postsDir, `${slug}.json`);
}

/**
 * Create the generated JSON path for a tag beneath {@link blogPaths.tagsDir}.
 *
 * @category Internal
 */
export function createBlogTagJsonPath(tag: string): string {
    assertValidBlogTag(tag);

    return joinUrlPaths(blogPaths.tagsDir, `${tag}.json`);
}

/**
 * Create the generated JSON path for a 1-indexed post-list page beneath {@link blogPaths.pagesDir}.
 *
 * @category Internal
 */
export function createBlogPostPageJsonPath(pageNumber: number): string {
    return joinUrlPaths(blogPaths.pagesDir, `page-${pageNumber}.json`);
}
