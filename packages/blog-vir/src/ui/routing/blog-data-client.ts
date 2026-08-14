import {ensureErrorAndPrependMessage} from '@augment-vir/common';
import {parseJsonWithShape, type Shape} from 'object-shape-tester';
import {defaultBlogPostPageSize} from '../../data/blog-page-size.js';
import {
    blogPaths,
    createBlogPostJsonPath,
    createBlogPostPageJsonPath,
    createBlogTagJsonPath,
} from '../../data/blog-paths.js';
import {
    type BlogAllPosts,
    blogAllPostsShape,
    type BlogPost,
    type BlogPostPage,
    blogPostPageShape,
    blogPostShape,
    blogPostSlugsShape,
    type BlogSearchIndex,
    blogSearchIndexShape,
    type BlogTags,
    blogTagsShape,
} from '../../data/blog-post.js';

function joinSiteBase({base, sitePath}: Readonly<{base: string; sitePath: string}>): string {
    const trimmedBase = trimTrailingSlashes(base);
    const trimmedPath = trimLeadingSlashes(sitePath);
    return [
        trimmedBase,
        '/',
        trimmedPath,
    ].join('');
}

function trimTrailingSlashes(input: string): string {
    let end = input.length;
    while (end > 0 && input[end - 1] === '/') {
        end -= 1;
    }
    return input.slice(0, end);
}

function trimLeadingSlashes(input: string): string {
    let start = 0;
    while (start < input.length && input[start] === '/') {
        start += 1;
    }
    return input.slice(start);
}

/**
 * Fetch and cache generated blog JSON files.
 *
 * Frontend state supplies the site base injected by the blog-vir Vite runner.
 *
 * @category Internal
 */
export class BlogDataClient {
    protected allPostsPromise: Promise<BlogAllPosts> | undefined;
    protected searchIndexPromise: Promise<BlogSearchIndex> | undefined;
    protected tagsPromise: Promise<BlogTags> | undefined;
    protected readonly postPagePromises = new Map<number, Promise<BlogPostPage>>();
    protected readonly postPromises = new Map<string, Promise<BlogPost>>();
    protected readonly tagPostPromises = new Map<string, Promise<string[]>>();

    constructor(
        /** @default `'/'` */
        public readonly siteBase: string = '/',
        /** @default {@link defaultBlogPostPageSize} */
        public readonly pageSize: number = defaultBlogPostPageSize,
    ) {}

    /** Fetch a generated 1-indexed post-list page. */
    public fetchPostPage(pageNumber: number): Promise<BlogPostPage> {
        const cached = this.postPagePromises.get(pageNumber);
        if (cached) {
            return cached;
        }
        const promise = this.loadJson({
            shape: blogPostPageShape,
            sitePath: createBlogPostPageJsonPath(pageNumber),
        }).catch((error: unknown) => {
            this.postPagePromises.delete(pageNumber);
            throw ensureErrorAndPrependMessage(
                error,
                [
                    'Failed to load blog page ',
                    String(pageNumber),
                    '.',
                ].join(''),
            );
        });
        this.postPagePromises.set(pageNumber, promise);
        return promise;
    }

    /** Fetch the complete post metadata index. */
    public fetchAllPosts(): Promise<BlogAllPosts> {
        if (!this.allPostsPromise) {
            this.allPostsPromise = this.loadJson({
                shape: blogAllPostsShape,
                sitePath: blogPaths.allPostsFile,
            }).catch((error: unknown) => {
                this.allPostsPromise = undefined;
                throw ensureErrorAndPrependMessage(error, 'Failed to load all blog posts.');
            });
        }
        return this.allPostsPromise;
    }

    /** Fetch the complete post section search index. */
    public fetchSearchIndex(): Promise<BlogSearchIndex> {
        if (!this.searchIndexPromise) {
            this.searchIndexPromise = this.loadJson({
                shape: blogSearchIndexShape,
                sitePath: blogPaths.searchIndexFile,
            }).catch((error: unknown) => {
                this.searchIndexPromise = undefined;
                throw ensureErrorAndPrependMessage(error, 'Failed to load blog search index.');
            });
        }
        return this.searchIndexPromise;
    }

    /** Fetch all tags and their post counts. */
    public fetchTags(): Promise<BlogTags> {
        if (!this.tagsPromise) {
            this.tagsPromise = this.loadJson({
                shape: blogTagsShape,
                sitePath: blogPaths.tagsFile,
            }).catch((error: unknown) => {
                this.tagsPromise = undefined;
                throw ensureErrorAndPrependMessage(error, 'Failed to load blog tags.');
            });
        }
        return this.tagsPromise;
    }

    /** Fetch the ordered post slugs assigned to a tag. */
    public fetchTagPosts(tag: string): Promise<string[]> {
        const cached = this.tagPostPromises.get(tag);
        if (cached) {
            return cached;
        }
        const promise = this.loadJson({
            shape: blogPostSlugsShape,
            sitePath: createBlogTagJsonPath(tag),
        }).catch((error: unknown) => {
            this.tagPostPromises.delete(tag);
            throw ensureErrorAndPrependMessage(
                error,
                [
                    'Failed to load blog tag "',
                    tag,
                    '".',
                ].join(''),
            );
        });
        this.tagPostPromises.set(tag, promise);
        return promise;
    }

    /** Fetch a full post by its slug. */
    public fetchPost(slug: string): Promise<BlogPost> {
        const cached = this.postPromises.get(slug);
        if (cached) {
            return cached;
        }
        const promise = this.loadJson({
            shape: blogPostShape,
            sitePath: createBlogPostJsonPath(slug),
        }).catch((error: unknown) => {
            this.postPromises.delete(slug);
            throw ensureErrorAndPrependMessage(
                error,
                [
                    'Failed to load post "',
                    slug,
                    '".',
                ].join(''),
            );
        });
        this.postPromises.set(slug, promise);
        return promise;
    }

    /** Fetch and parse one generated JSON file beneath the site base. */
    protected async loadJson<const CurrentShape extends Shape>({
        shape,
        sitePath,
    }: Readonly<{
        shape: CurrentShape;
        sitePath: string;
    }>): Promise<CurrentShape['runtimeType']> {
        const url = joinSiteBase({
            base: this.siteBase,
            sitePath,
        });
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                [
                    'Request for "',
                    url,
                    '" failed with status ',
                    String(response.status),
                    '.',
                ].join(''),
            );
        }
        return parseJsonWithShape(await response.text(), shape);
    }
}
