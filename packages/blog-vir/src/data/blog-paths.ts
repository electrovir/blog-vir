/**
 * Site-relative paths used by both the generator and the runtime elements. Keeping them in one
 * place ensures the file layout stays in sync.
 */
export const blogPaths = {
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

const safeBlogTagMatcher = /^[A-Za-z0-9._~-]+$/;

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

export function createBlogPostJsonPath(slug: string): string {
    return [
        blogPaths.postsDir,
        '/',
        slug,
        '.json',
    ].join('');
}

export function createBlogTagJsonPath(tag: string): string {
    assertValidBlogTag(tag);

    return [
        blogPaths.tagsDir,
        '/',
        tag,
        '.json',
    ].join('');
}

export function createBlogPostPageJsonPath(pageNumber: number): string {
    return [
        blogPaths.pagesDir,
        '/page-',
        pageNumber,
        '.json',
    ].join('');
}
