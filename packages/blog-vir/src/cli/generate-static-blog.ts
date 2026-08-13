import {
    awaitedBlockingMap,
    chunkArray,
    ensureErrorAndPrependMessage,
    filterMap,
    getObjectTypedEntries,
    log,
    mapObjectValues,
} from '@augment-vir/common';
import {writeJsonFile} from '@augment-vir/node';
import {mkdir, rm} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {
    assertValidBlogTag,
    blogPaths,
    createBlogPostJsonPath,
    createBlogPostPageJsonPath,
    createBlogTagJsonPath,
} from '../data/blog-paths.js';
import {
    type BlogAllPosts,
    type BlogPost,
    type BlogPostPage,
    type BlogSearchIndex,
    type BlogTags,
    blogPostPageSize,
} from '../data/blog-post.js';
import {listMarkdownFiles} from './list-markdown-files.js';
import {type ParsedBlogPost, parseBlogPostFile} from './parse-blog-post.js';

export type GenerateStaticBlogOptions = {
    /** Directory containing the blog post `.md` files. */
    postsDir: string;
    /**
     * Directory that Vite will use as its public/static directory. The generator writes its output
     * under `<staticDir>/blog-content/`.
     */
    staticDir: string;
    /** If true, log per-file progress. */
    verbose?: boolean | undefined;
};

export async function generateStaticBlog({
    postsDir,
    staticDir,
    verbose,
}: Readonly<GenerateStaticBlogOptions>): Promise<{
    posts: BlogPost[];
    contentDir: string;
}> {
    const blogContentDir = join(staticDir, blogPaths.contentDir);
    await rm(blogContentDir, {
        force: true,
        recursive: true,
    });
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

    const sortedBlogPosts = parsed.toSorted((a, b) => {
        return b.post.postDate.localeCompare(a.post.postDate);
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
    await awaitedBlockingMap(buildPostPages(sortedBlogPosts), async (page) => {
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

    return {
        posts: sortedBlogPosts.map(({post}) => post),
        contentDir: blogContentDir,
    };
}

export function buildTagCounts(tagPostSlugs: Readonly<Record<string, string[]>>): BlogTags {
    return mapObjectValues(tagPostSlugs, (tag, postSlugs) => {
        assertValidBlogTag(tag);

        return postSlugs.length;
    });
}

export function buildTagPostSlugs(
    blogPosts: ReadonlyArray<ParsedBlogPost>,
): Record<string, string[]> {
    return blogPosts.reduce<Record<string, string[]>>((tagPosts, {post}) => {
        return post.tags.reduce<Record<string, string[]>>((innerTagPosts, tag) => {
            assertValidBlogTag(tag);

            return {
                ...innerTagPosts,
                [tag]: [
                    ...(Object.hasOwn(tagPosts, tag) ? tagPosts[tag] || [] : []),
                    post.postSlug,
                ],
            };
        }, tagPosts);
    }, {});
}

export function buildPostPages(blogPosts: ReadonlyArray<ParsedBlogPost>): BlogPostPage[] {
    const postPageChunks = chunkArray(
        blogPosts.map(({post}) => {
            return {
                postSlug: post.postSlug,
                postTitle: post.postTitle,
                tags: post.tags,
                postDate: post.postDate,
                postBlurb: post.postBlurb,
            };
        }),
        {
            chunkSize: blogPostPageSize,
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
