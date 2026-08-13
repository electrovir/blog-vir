import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {
    assertValidBlogTag,
    blogPaths,
    createBlogPostJsonPath,
    createBlogPostPageJsonPath,
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

describe('blogPaths', () => {
    it('nests every generated file and directory under the content directory', () => {
        assert.deepEquals(blogPaths, {
            contentDir: 'blog-content',
            allPostsFile: 'blog-content/all-posts.json',
            pagesDir: 'blog-content/pages',
            searchIndexFile: 'blog-content/search-index.json',
            tagsFile: 'blog-content/tags.json',
            tagsDir: 'blog-content/tags',
            postsDir: 'blog-content/posts',
        });
    });
});
