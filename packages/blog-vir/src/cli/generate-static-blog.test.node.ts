import {assert} from '@augment-vir/assert';
import {applyBrand, createArray} from '@augment-vir/common';
import {readAllDirContents, readJsonFile} from '@augment-vir/node';
import {assertSnapshot, describe, it, itCases} from '@augment-vir/test';
import {toUtcIsoString, utcTimezone, zeroDate, type DayOfMonth, type UtcIsoString} from 'date-vir';
import {rm} from 'node:fs/promises';
import {join} from 'node:path';
import {blogPaths, createBlogTagJsonPath} from '../data/blog-paths.js';
import {type RawHtml} from '../data/blog-post.js';
import {
    testFileGeneratedBlogDirPath,
    testFileJsonUnsafeTagGeneratedBlogDirPath,
    testFileJsonUnsafeTagPostsDirPath,
    testFilePostsDirPath,
    testFileUnsafeTagGeneratedBlogDirPath,
    testFileUnsafeTagPostsDirPath,
} from '../data/file-paths.mock.js';
import {type RssFeedConfig} from './generate-rss-feed.js';
import {
    buildPostPages,
    buildSearchIndex,
    buildTagCounts,
    buildTagPostSlugs,
    generateStaticBlog,
} from './generate-static-blog.js';
import {type ParsedBlogPost} from './parse-blog-post.js';

const testRssFeedConfig: RssFeedConfig = {
    title: 'Test Blog',
    description: 'Generated test posts.',
    siteUrl: 'https://example.com/blog/',
};

function createTestParsedBlogPost({
    slug,
    date,
    tags,
    title,
    blurb,
    sections = [],
}: Readonly<{
    slug: string;
    date: UtcIsoString;
    tags: ReadonlyArray<string>;
    title: string;
    blurb: string;
    sections?: ParsedBlogPost['sections'] | undefined;
}>): ParsedBlogPost {
    return {
        post: {
            postSlug: slug,
            postTitle: title,
            tags: [...tags],
            postDate: date,
            postBlurb: applyBrand<RawHtml>(blurb),
            isTruncated: true,
            postContentHtml: applyBrand<RawHtml>(
                [
                    '<p>',
                    blurb,
                    '</p>',
                ].join(''),
            ),
            postHeadings: [],
        },
        sections,
    };
}

function createTestDate(day: DayOfMonth): UtcIsoString {
    return toUtcIsoString({
        ...zeroDate,
        day,
        year: 2024,
        timezone: utcTimezone,
    });
}

const parsedBlogPosts = [
    createTestParsedBlogPost({
        slug: 'third-post',
        title: 'Third Post',
        tags: [
            'shared',
            'third',
        ],
        date: createTestDate(3),
        blurb: 'Third blurb.',
    }),
    createTestParsedBlogPost({
        slug: 'second-post',
        title: 'Second Post',
        tags: [
            'shared',
            'second',
        ],
        date: createTestDate(2),
        blurb: 'Second blurb.',
    }),
    createTestParsedBlogPost({
        slug: 'first-post',
        title: 'First Post',
        tags: [
            'first',
        ],
        date: createTestDate(1),
        blurb: 'First blurb.',
    }),
];

function buildPostPageSummaries({
    blogPosts,
}: Readonly<{
    blogPosts: ReadonlyArray<ParsedBlogPost>;
}>): ReadonlyArray<{
    pageNumber: number;
    pageCount: number;
    postSlugs: ReadonlyArray<string>;
}> {
    return buildPostPages(blogPosts).map(({pageNumber, pageCount, posts}) => {
        return {
            pageNumber,
            pageCount,
            postSlugs: posts.map(({postSlug}) => postSlug),
        };
    });
}

describe(buildTagPostSlugs.name, () => {
    itCases(buildTagPostSlugs, [
        {
            it: 'groups post slugs by tag in post order',
            input: parsedBlogPosts,
            expect: {
                shared: [
                    'third-post',
                    'second-post',
                ],
                third: [
                    'third-post',
                ],
                second: [
                    'second-post',
                ],
                first: [
                    'first-post',
                ],
            },
        },
    ]);
});

describe(buildTagCounts.name, () => {
    itCases(buildTagCounts, [
        {
            it: 'counts posts for each tag',
            input: {
                shared: [
                    'third-post',
                    'second-post',
                ],
                third: [
                    'third-post',
                ],
                second: [
                    'second-post',
                ],
                first: [
                    'first-post',
                ],
            },
            expect: {
                shared: 2,
                third: 1,
                second: 1,
                first: 1,
            },
        },
    ]);
});

describe(buildPostPages.name, () => {
    itCases(buildPostPageSummaries, [
        {
            it: 'chunks posts into numbered pages',
            input: {
                blogPosts: createArray(21, (postIndex) => {
                    const postNumber = postIndex + 1;

                    return createTestParsedBlogPost({
                        slug: [
                            'post-',
                            String(postNumber),
                        ].join(''),
                        title: [
                            'Post ',
                            String(postNumber),
                        ].join(''),
                        tags: [],
                        date: createTestDate(postNumber as DayOfMonth),
                        blurb: [
                            'Blurb ',
                            String(postNumber),
                            '.',
                        ].join(''),
                    });
                }),
            },
            expect: [
                {
                    pageNumber: 1,
                    pageCount: 2,
                    postSlugs: createArray(20, (postIndex) => {
                        return [
                            'post-',
                            String(postIndex + 1),
                        ].join('');
                    }),
                },
                {
                    pageNumber: 2,
                    pageCount: 2,
                    postSlugs: [
                        'post-21',
                    ],
                },
            ],
        },
        {
            it: 'generates one empty page when there are no posts',
            input: {
                blogPosts: [],
            },
            expect: [
                {
                    pageNumber: 1,
                    pageCount: 1,
                    postSlugs: [],
                },
            ],
        },
    ]);
});

describe(buildSearchIndex.name, () => {
    itCases(buildSearchIndex, [
        {
            it: 'builds a search doc per non-empty section',
            input: [
                createTestParsedBlogPost({
                    slug: 'searchable-post',
                    title: 'Searchable Post',
                    tags: [],
                    date: createTestDate(4),
                    blurb: 'Searchable blurb.',
                    sections: [
                        {
                            headingUrlAnchor: 'intro',
                            headingTitle: 'Intro',
                            sectionText: 'Intro text.',
                        },
                        {
                            headingUrlAnchor: 'empty',
                            headingTitle: '',
                            sectionText: '',
                        },
                        {
                            headingUrlAnchor: 'body',
                            headingTitle: '',
                            sectionText: 'Body text.',
                        },
                    ],
                }),
            ],
            expect: [
                {
                    postSlug: 'searchable-post',
                    postTitle: 'Searchable Post',
                    headingUrlAnchor: 'intro',
                    headingTitle: 'Intro',
                    sectionText: 'Intro text.',
                },
                {
                    postSlug: 'searchable-post',
                    postTitle: 'Searchable Post',
                    headingUrlAnchor: 'body',
                    headingTitle: '',
                    sectionText: 'Body text.',
                },
            ],
        },
    ]);
});

describe(generateStaticBlog.name, () => {
    it('generates static blog files from markdown fixtures', async (testContext) => {
        await rm(testFileGeneratedBlogDirPath, {
            force: true,
            recursive: true,
        });

        await generateStaticBlog({
            postsDir: testFilePostsDirPath,
            rssFeed: testRssFeedConfig,
            staticDir: testFileGeneratedBlogDirPath,
        });

        await assertSnapshot(
            testContext,
            await readAllDirContents(testFileGeneratedBlogDirPath, {
                recursive: true,
            }),
        );
    });

    it('rejects tags that are not URL and file-name safe', async () => {
        await rm(testFileUnsafeTagGeneratedBlogDirPath, {
            force: true,
            recursive: true,
        });

        await assert.throws(
            generateStaticBlog({
                postsDir: testFileUnsafeTagPostsDirPath,
                rssFeed: testRssFeedConfig,
                staticDir: testFileUnsafeTagGeneratedBlogDirPath,
            }),
            {
                matchMessage: 'Invalid blog tag "Bad Tag".',
            },
        );
    });

    it('title cases tags during parsing', async () => {
        await rm(testFileJsonUnsafeTagGeneratedBlogDirPath, {
            force: true,
            recursive: true,
        });

        await generateStaticBlog({
            postsDir: testFileJsonUnsafeTagPostsDirPath,
            rssFeed: testRssFeedConfig,
            staticDir: testFileJsonUnsafeTagGeneratedBlogDirPath,
        });

        assert.deepEquals(
            await readJsonFile(join(testFileJsonUnsafeTagGeneratedBlogDirPath, blogPaths.tagsFile)),
            {
                ToString: 1,
            },
        );
        assert.deepEquals(
            await readJsonFile(
                join(testFileJsonUnsafeTagGeneratedBlogDirPath, createBlogTagJsonPath('ToString')),
            ),
            [
                '2024-01-04-json-unsafe-tag',
            ],
        );
    });
});
