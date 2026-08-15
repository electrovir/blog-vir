import {
    awaitedBlockingMap,
    chunkArray,
    ensureErrorAndPrependMessage,
    filterMap,
    getObjectTypedEntries,
    log,
    mapObjectValues,
    type PartialWithUndefined,
} from '@augment-vir/common';
import {writeJsonFile} from '@augment-vir/node';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {defaultBlogPostPageSize} from '../data/blog-page-size.js';
import {
    assertValidBlogTag,
    blogPaths,
    createBlogPostJsonPath,
    createBlogPostPageJsonPath,
    createBlogTagJsonPath,
} from '../data/blog-paths.js';
import {
    compareBlogPostsNewestFirst,
    type BlogAllPosts,
    type BlogPost,
    type BlogPostPage,
    type BlogSearchIndex,
    type BlogTags,
} from '../data/blog-post.js';
import {generateRssFeed, type RssFeedConfig} from './generate-rss-feed.js';
import {listMarkdownFiles} from './list-markdown-files.js';
import {normalizeBlogTag} from './normalize-blog-tag.js';
import {parseBlogPostFile, type ParsedBlogPost} from './parse-blog-post.js';

/**
 * Inputs for {@link generateStaticBlog}.
 *
 * @category Internal
 */
export type GenerateStaticBlogOptions = {
    /** Directory containing the blog post `.md` files. */
    postsDir: string;
    /** RSS feed metadata. */
    rssFeed: RssFeedConfig;
    /**
     * Directory that Vite will use as its public/static directory. The generator writes its JSON
     * output under `<staticDir>/blog-content/`.
     */
    staticDir: string;
} & PartialWithUndefined<{
    /** Posts per generated post-list page. */
    pageSize: number;
    /** If true, log per-file progress. */
    verbose: boolean;
}>;

/**
 * Parse Markdown posts and write all generated blog data into the static directory.
 *
 * @category Internal
 */
export async function generateStaticBlog({
    pageSize = defaultBlogPostPageSize,
    postsDir,
    rssFeed,
    staticDir,
    verbose,
}: Readonly<GenerateStaticBlogOptions>): Promise<{
    posts: BlogPost[];
    contentDir: string;
}> {
    const blogContentDir = join(staticDir, blogPaths.contentDir);
    await Promise.all([
        rm(blogContentDir, {
            force: true,
            recursive: true,
        }),
        rm(join(staticDir, blogPaths.rssFeedFile), {
            force: true,
        }),
    ]);
    await Promise.all(
        [
            blogPaths.postsDir,
            blogPaths.pagesDir,
            blogPaths.tagsDir,
        ].map(async (dirPath) => {
            await mkdir(join(staticDir, dirPath), {
                recursive: true,
            });
        }),
    );

    const filePaths = await listMarkdownFiles(postsDir);

    const parsed = await awaitedBlockingMap(filePaths, async (filePath) => {
        const relativeFilePath = relative(postsDir, filePath);
        log.if(!!verbose).faint(`parsing '${relativeFilePath}'`);
        try {
            return await parseBlogPostFile(filePath);
        } catch (error) {
            throw ensureErrorAndPrependMessage(error, `Failed to parse '${filePath}'.`);
        }
    });

    const sortedBlogPosts = parsed.toSorted((firstBlogPost, secondBlogPost) => {
        return compareBlogPostsNewestFirst({
            firstBlogPost: firstBlogPost.post,
            secondBlogPost: secondBlogPost.post,
        });
    });
    const tagPostSlugs = buildTagPostSlugs(sortedBlogPosts);

    await awaitedBlockingMap(sortedBlogPosts, async ({post}) => {
        const outPath = join(staticDir, createBlogPostJsonPath(post.postSlug));
        await writeJsonFile(outPath, post);
    });

    const allPosts: BlogAllPosts = sortedBlogPosts.map(({post}) => {
        return {
            postSlug: post.postSlug,
            postTitle: post.postTitle,
            postDate: post.postDate,
        };
    });
    await awaitedBlockingMap(buildPostPages(sortedBlogPosts, pageSize), async (page) => {
        await writeJsonFile(join(staticDir, createBlogPostPageJsonPath(page.pageNumber)), page);
    });
    await writeJsonFile(join(staticDir, blogPaths.allPostsFile), allPosts);
    await writeJsonFile(
        join(staticDir, blogPaths.searchIndexFile),
        buildSearchIndex(sortedBlogPosts),
    );
    await writeJsonFile(join(staticDir, blogPaths.tagsFile), buildTagCounts(tagPostSlugs));
    await awaitedBlockingMap(
        getObjectTypedEntries(tagPostSlugs),
        async ([
            tag,
            postSlugs,
        ]) => {
            await writeJsonFile(join(staticDir, createBlogTagJsonPath(tag)), postSlugs);
        },
    );
    await writeFile(
        join(staticDir, blogPaths.rssFeedFile),
        generateRssFeed({
            config: rssFeed,
            posts: sortedBlogPosts.map(({post}) => post),
        }),
        'utf8',
    );

    return {
        posts: sortedBlogPosts.map(({post}) => post),
        contentDir: blogContentDir,
    };
}

/**
 * Count the posts assigned to each tag.
 *
 * @category Internal
 */
export function buildTagCounts(tagPostSlugs: Readonly<Record<string, string[]>>): BlogTags {
    return mapObjectValues(tagPostSlugs, (tag, postSlugs) => {
        assertValidBlogTag(tag);

        return postSlugs.length;
    });
}

/**
 * Build each tag's ordered list of post slugs.
 *
 * @category Internal
 */
export function buildTagPostSlugs(
    blogPosts: ReadonlyArray<ParsedBlogPost>,
): Record<string, string[]> {
    return blogPosts.reduce<Record<string, string[]>>((tagPosts, {post}) => {
        return post.tags.reduce<Record<string, string[]>>((innerTagPosts, tag) => {
            const normalizedTag = normalizeBlogTag(tag);
            assertValidBlogTag(normalizedTag);

            return {
                ...innerTagPosts,
                [normalizedTag]: [
                    ...(Object.hasOwn(tagPosts, normalizedTag)
                        ? tagPosts[normalizedTag] || []
                        : []),
                    post.postSlug,
                ],
            };
        }, tagPosts);
    }, {});
}

/**
 * Split parsed posts into generated post-list pages.
 *
 * @category Internal
 */
export function buildPostPages(
    blogPosts: ReadonlyArray<ParsedBlogPost>,
    pageSize = defaultBlogPostPageSize,
): BlogPostPage[] {
    const postPageChunks = chunkArray(
        blogPosts.map(({post}) => {
            return {
                postSlug: post.postSlug,
                postTitle: post.postTitle,
                tags: post.tags,
                postDate: post.postDate,
                postBlurb: post.postBlurb,
                isTruncated: post.isTruncated,
            };
        }),
        {
            chunkSize: pageSize,
        },
    );

    return (postPageChunks.length ? postPageChunks : [[]]).map((posts, index, pages) => {
        return {
            pageNumber: index + 1,
            pageCount: pages.length,
            posts,
        };
    });
}

/**
 * Flatten parsed post sections into the browser search index.
 *
 * @category Internal
 */
export function buildSearchIndex(blogPosts: ReadonlyArray<ParsedBlogPost>): BlogSearchIndex {
    return blogPosts.flatMap(({post, sections}) => {
        return filterMap(
            sections,
            (section) => {
                return {
                    postSlug: post.postSlug,
                    postTitle: post.postTitle,
                    ...section,
                };
            },
            (searchEntry) => Boolean(searchEntry.headingTitle || searchEntry.sectionText),
        );
    });
}
