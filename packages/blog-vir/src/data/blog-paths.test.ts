import {describe, itCases} from '@augment-vir/test';
import {
    assertValidBlogTag,
    createBlogPostJsonPath,
    createBlogPostPageJsonPath,
    createBlogRssFeedUrl,
    createBlogTagJsonPath,
} from './blog-paths.js';

describe(assertValidBlogTag.name, () => {
    itCases(assertValidBlogTag, [
        {
            it: 'accepts a plain word tag',
            input: 'typescript',
            expect: undefined,
        },
        {
            it: 'accepts hyphens, underscores, periods, and tildes',
            input: 'my-tag_1.0~beta',
            expect: undefined,
        },
        {
            it: 'accepts mixed-case alphanumerics',
            input: 'MixedCase123',
            expect: undefined,
        },
        {
            it: 'rejects a tag with a space',
            input: 'bad tag',
            throws: {
                matchMessage: 'Invalid blog tag "bad tag".',
            },
        },
        {
            it: 'rejects a tag with a slash',
            input: 'slash/tag',
            throws: {
                matchMessage: 'Invalid blog tag',
            },
        },
        {
            it: 'rejects a tag with non-ascii characters',
            input: 'emoji😀',
            throws: {
                matchMessage: 'Invalid blog tag',
            },
        },
        {
            it: 'rejects an empty tag',
            input: '',
            throws: {
                matchMessage: 'Invalid blog tag',
            },
        },
        {
            it: 'rejects a current-directory tag',
            input: '.',
            throws: {
                matchMessage: 'Invalid blog tag',
            },
        },
        {
            it: 'rejects a parent-directory tag',
            input: '..',
            throws: {
                matchMessage: 'Invalid blog tag',
            },
        },
    ]);
});

describe(createBlogPostJsonPath.name, () => {
    itCases(createBlogPostJsonPath, [
        {
            it: 'builds a post JSON path from the slug',
            input: '2024-05-27-my-post',
            expect: 'blog-content/posts/2024-05-27-my-post.json',
        },
    ]);
});

describe(createBlogTagJsonPath.name, () => {
    itCases(createBlogTagJsonPath, [
        {
            it: 'builds a tag JSON path from a valid tag',
            input: 'typescript',
            expect: 'blog-content/tags/typescript.json',
        },
        {
            it: 'validates the tag before building the path',
            input: 'bad tag',
            throws: {
                matchMessage: 'Invalid blog tag "bad tag".',
            },
        },
    ]);
});

describe(createBlogPostPageJsonPath.name, () => {
    itCases(createBlogPostPageJsonPath, [
        {
            it: 'builds a page JSON path from the page number',
            input: 3,
            expect: 'blog-content/pages/page-3.json',
        },
    ]);
});

describe(createBlogRssFeedUrl.name, () => {
    itCases(createBlogRssFeedUrl, [
        {
            it: 'appends the feed path to an absolute site URL',
            input: 'https://example.com/blog/',
            expect: 'https://example.com/blog/rss.xml',
        },
        {
            it: 'appends the feed path to a site base path',
            input: '/blog/',
            expect: '/blog/rss.xml',
        },
    ]);
});
