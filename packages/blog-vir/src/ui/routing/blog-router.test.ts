import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {createBlogRouter} from './blog-router.js';

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
});
