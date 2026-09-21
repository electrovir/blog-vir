import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {parseUrl} from 'url-vir';
import {blogPathTree} from './blog-route.js';
import {createBlogRouter, normalizeBlogRoute} from './blog-router.js';

describe(createBlogRouter.name, () => {
    it('preserves a trailing slash in a base route', () => {
        const originalUrl = globalThis.location.href;
        globalThis.history.replaceState(undefined, '', '/blog-vir/demo/');
        const router = createBlogRouter({
            basePath: '/blog-vir/demo/',
        });

        try {
            assert.strictEquals(globalThis.location.pathname, '/blog-vir/demo/');
        } finally {
            router.destroy();
            globalThis.history.replaceState(undefined, '', originalUrl);
        }
    });

    it('clears an omitted hash and search parameters', () => {
        const originalUrl = globalThis.location.href;
        globalThis.history.replaceState(undefined, '', '/blog-vir/demo/?filter=recent#table');
        const router = createBlogRouter({
            basePath: '/blog-vir/demo/',
        });

        try {
            const url = parseUrl(
                router.createRouteUrl(
                    normalizeBlogRoute({
                        paths: blogPathTree.paths.fullPaths,
                    }),
                ).url,
            );
            assert.deepEquals(
                {
                    hash: url.hash,
                    pathname: url.pathname,
                    search: url.search,
                },
                {
                    hash: '',
                    pathname: '/blog-vir/demo/',
                    search: '',
                },
            );
        } finally {
            router.destroy();
            globalThis.history.replaceState(undefined, '', originalUrl);
        }
    });
});
