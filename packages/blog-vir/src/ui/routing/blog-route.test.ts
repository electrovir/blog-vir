import {describe, itCases} from '@augment-vir/test';
import {type FullSpaRoute} from 'spa-router-vir';
import {blogPathTree, sanitizeBlogRoute} from './blog-route.js';

function createRawRoute(
    paths: ReadonlyArray<string>,
    search?: Readonly<Record<string, ReadonlyArray<string>>> | undefined,
    hash?: string | undefined,
): Readonly<FullSpaRoute> {
    return {
        paths,
        search,
        hash,
    };
}

describe(sanitizeBlogRoute.name, () => {
    itCases(sanitizeBlogRoute, [
        {
            it: 'keeps the home route',
            input: createRawRoute([]),
            expect: {
                paths: [],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'keeps a post slug',
            input: createRawRoute([
                blogPathTree.paths.children.post.path,
                'my-post',
            ]),
            expect: {
                paths: [
                    blogPathTree.paths.children.post.path,
                    'my-post',
                ],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'sends a bare post path home',
            input: createRawRoute([blogPathTree.paths.children.post.path]),
            expect: {
                paths: [],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'sends an unknown path home',
            input: createRawRoute(['nope']),
            expect: {
                paths: [],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'drops extra segments below a tag',
            input: createRawRoute([
                blogPathTree.paths.children.tags.path,
                'typescript',
                'extra',
            ]),
            expect: {
                paths: [
                    blogPathTree.paths.children.tags.path,
                    'typescript',
                ],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'drops every search param',
            input: createRawRoute([blogPathTree.paths.children.history.path], {
                q: ['router'],
            }),
            expect: {
                paths: [blogPathTree.paths.children.history.path],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'keeps a later list page',
            input: createRawRoute([
                blogPathTree.paths.children.page.path,
                '3',
            ]),
            expect: {
                paths: [
                    blogPathTree.paths.children.page.path,
                    '3',
                ],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'sends the first list page home',
            input: createRawRoute([
                blogPathTree.paths.children.page.path,
                '1',
            ]),
            expect: {
                paths: [],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'sends a non-numeric list page home',
            input: createRawRoute([
                blogPathTree.paths.children.page.path,
                'nope',
            ]),
            expect: {
                paths: [],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'keeps a heading anchor',
            input: createRawRoute(
                [
                    blogPathTree.paths.children.post.path,
                    'my-post',
                ],
                undefined,
                'my-heading',
            ),
            expect: {
                paths: [
                    blogPathTree.paths.children.post.path,
                    'my-post',
                ],
                search: undefined,
                hash: 'my-heading',
            },
        },
    ]);
});
