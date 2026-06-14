import {
    awaitedBlockingMap,
    chunkArray,
    ensureErrorAndPrependMessage,
    log,
} from '@augment-vir/common';
import {writeJsonFile} from '@augment-vir/node';
import {mkdir, rm} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {blogPaths, createBlogPostJsonPath, createBlogPostPageJsonPath} from '../data/blog-paths.js';
import {
    type BlogIndex,
    type BlogPost,
    type BlogPostMeta,
    type BlogPostPage,
    type BlogSearchDoc,
    type BlogSearchIndex,
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
    await mkdir(join(staticDir, blogPaths.postsDir), {
        recursive: true,
    });

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

    const sorted = parsed.toSorted((a, b) => b.post.date.localeCompare(a.post.date));

    await awaitedBlockingMap(sorted, async ({post}) => {
        const outPath = join(staticDir, createBlogPostJsonPath(post.slug));
        await writeJsonFile(outPath, post);
    });

    const index = buildIndex(sorted);
    await awaitedBlockingMap(buildPostPages(sorted), async (page) => {
        await writeJsonFile(join(staticDir, createBlogPostPageJsonPath(page.pageNumber)), page);
    });
    await writeJsonFile(join(staticDir, blogPaths.indexFile), index);
    await writeJsonFile(join(staticDir, blogPaths.searchIndexFile), buildSearchIndex(sorted));

    return {
        posts: sorted.map(({post}) => post),
        contentDir: blogContentDir,
    };
}

function buildIndex(sorted: ReadonlyArray<ParsedBlogPost>): BlogIndex {
    const posts: BlogPostMeta[] = sorted.map(createBlogPostMeta);

    const tags: Record<string, string[]> = {};
    sorted.forEach(({post}) => {
        post.tags.forEach((tag) => {
            const list = tags[tag];
            if (list) {
                list.push(post.slug);
            } else {
                tags[tag] = [post.slug];
            }
        });
    });

    return {
        posts,
        tags,
    };
}

function buildPostPages(sorted: ReadonlyArray<ParsedBlogPost>): BlogPostPage[] {
    const postPageChunks = chunkArray(sorted.map(createBlogPostMeta), {
        chunkSize: blogPostPageSize,
    });

    return (postPageChunks.length ? postPageChunks : [[]]).map((posts, index, pages) => {
        return {
            pageNumber: index + 1,
            pageCount: pages.length,
            posts,
        };
    });
}

function createBlogPostMeta({post}: ParsedBlogPost): BlogPostMeta {
    return {
        slug: post.slug,
        title: post.title,
        tags: post.tags,
        date: post.date,
        blurb: post.blurb,
    };
}

function buildSearchIndex(sorted: ReadonlyArray<ParsedBlogPost>): BlogSearchIndex {
    return sorted.flatMap(({post, sections}) => {
        const docs: BlogSearchDoc[] = [
            {
                slug: post.slug,
                title: post.title,
                section: post.title,
                text: post.blurb,
            },
        ];
        sections.forEach((section) => {
            if (!section.title && !section.text) {
                return;
            }
            docs.push({
                slug: post.slug,
                title: post.title,
                anchor: section.anchor,
                section: section.title || post.title,
                text: section.text,
            });
        });
        return docs;
    });
}
