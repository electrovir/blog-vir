import {describe, itCases} from '@augment-vir/test';
import {type FullSpaRoute} from 'spa-router-vir';
import {sanitizeBlogRoute} from './blog-route.js';

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
                'post',
                'my-post',
            ]),
            expect: {
                paths: [
                    'post',
                    'my-post',
                ],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'sends a bare post path home',
            input: createRawRoute(['post']),
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
                'tags',
                'typescript',
                'extra',
            ]),
            expect: {
                paths: [
                    'tags',
                    'typescript',
                ],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'keeps the query on the search route',
            input: createRawRoute(['search'], {
                q: ['router'],
            }),
            expect: {
                paths: ['search'],
                search: {
                    q: ['router'],
                },
                hash: undefined,
            },
        },
        {
            it: 'drops the query on every other route',
            input: createRawRoute(['all'], {
                q: ['router'],
            }),
            expect: {
                paths: ['all'],
                search: undefined,
                hash: undefined,
            },
        },
        {
            it: 'keeps a heading anchor',
            input: createRawRoute(
                [
                    'post',
                    'my-post',
                ],
                undefined,
                'my-heading',
            ),
            expect: {
                paths: [
                    'post',
                    'my-post',
                ],
                search: undefined,
                hash: 'my-heading',
            },
        },
    ]);
});
