import {createUtcFullDate, toHttpDateString} from 'date-vir';
import {defineShape, nonEmptyStringShape} from 'object-shape-tester';
import {buildUrl, isValidUrl, type UrlParts} from 'url-vir';
import {compareBlogPostsNewestFirst, type BlogPost} from '../data/blog-post.js';
import {blogPathTree} from '../ui/routing/blog-route.js';

/**
 * Runtime shape for {@link RssFeedConfig}.
 *
 * @category Internal
 */
export const rssFeedConfigShape = defineShape({
    title: nonEmptyStringShape(),
    description: nonEmptyStringShape(),
    siteUrl: nonEmptyStringShape(),
});

/**
 * Required metadata for the generated RSS feed.
 *
 * @category Internal
 */
export type RssFeedConfig = (typeof rssFeedConfigShape)['runtimeType'];

/**
 * Generate an RSS 2.0 document from parsed blog posts.
 *
 * @category Internal
 */
export function generateRssFeed({
    config,
    posts,
}: Readonly<{
    config: Readonly<RssFeedConfig>;
    posts: ReadonlyArray<Readonly<BlogPost>>;
}>) {
    if (!config.title.trim()) {
        throw new Error('RSS title cannot be empty.');
    } else if (!config.description.trim()) {
        throw new Error('RSS description cannot be empty.');
    }

    const siteUrl = validateRssSiteUrl(config.siteUrl);
    const sortedPosts = posts.toSorted((firstPost, secondPost) => {
        return compareBlogPostsNewestFirst({
            firstBlogPost: firstPost,
            secondBlogPost: secondPost,
        });
    });
    const latestPost = sortedPosts[0];

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0">',
        '    <channel>',
        `        <title>${escapeXml(config.title.trim())}</title>`,
        `        <link>${escapeXml(siteUrl.href)}</link>`,
        `        <description>${escapeXml(config.description.trim())}</description>`,
        '        <generator>blog-vir</generator>',
        ...(latestPost
            ? [
                  `        <lastBuildDate>${toHttpDateString(createUtcFullDate(latestPost.postDate))}</lastBuildDate>`,
              ]
            : []),
        ...sortedPosts.flatMap((post) => {
            const postUrl = createRssPostUrl({
                siteUrl,
                slug: post.postSlug,
            });

            return [
                '        <item>',
                `            <title>${escapeXml(post.postTitle)}</title>`,
                `            <link>${escapeXml(postUrl)}</link>`,
                `            <guid isPermaLink="true">${escapeXml(postUrl)}</guid>`,
                `            <pubDate>${toHttpDateString(createUtcFullDate(post.postDate))}</pubDate>`,
                `            <description>${escapeXml(post.postBlurb.trim())}</description>`,
                ...post.tags.map((tag) => {
                    return `            <category>${escapeXml(tag)}</category>`;
                }),
                '        </item>',
            ];
        }),
        '    </channel>',
        '</rss>',
        '',
    ].join('\n');
}

function validateRssSiteUrl(siteUrl: string) {
    if (!isValidUrl(siteUrl)) {
        throw new Error(`RSS site URL must be an absolute URL: "${siteUrl}".`);
    }

    const siteUrlParts = buildUrl(siteUrl);
    if (
        ![
            'http',
            'https',
        ].includes(siteUrlParts.protocol)
    ) {
        throw new Error(`RSS site URL must use HTTP or HTTPS: "${siteUrl}".`);
    } else if (siteUrlParts.search || siteUrlParts.hash) {
        throw new Error(`RSS site URL cannot include a query or hash: "${siteUrl}".`);
    } else {
        return siteUrlParts;
    }
}

function createRssPostUrl({
    siteUrl,
    slug,
}: Readonly<{
    siteUrl: Readonly<UrlParts>;
    slug: string;
}>) {
    return buildUrl(siteUrl, {
        paths: [
            ...siteUrl.paths,
            ...blogPathTree.paths.children.post.children[':slug']
                .fill(slug)
                .fullPaths.map((path) => {
                    return encodeURIComponent(path);
                }),
        ],
    }).href;
}

const xmlCharacterEntities: Readonly<Record<string, string>> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escapeXml(value: string) {
    return Array.from(value)
        .filter((character) => {
            const codePoint = character.codePointAt(0) || 0;
            return (
                [
                    0x09,
                    0x0a,
                    0x0d,
                ].includes(codePoint) ||
                (codePoint >= 32 && codePoint <= 55_295) ||
                (codePoint >= 57_344 && codePoint <= 65_533) ||
                (codePoint >= 65_536 && codePoint <= 1_114_111)
            );
        })
        .join('')
        .replace(/[&<>"']/g, (character) => {
            return xmlCharacterEntities[character] || '';
        });
}
