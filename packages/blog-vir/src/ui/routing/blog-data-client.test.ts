import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {BlogDataClient} from './blog-data-client.js';

async function runWithMockFetch({
    responseBody,
    callback,
}: Readonly<{
    responseBody: string;
    callback: () => Promise<void>;
}>) {
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
    Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: () => {
            return Promise.resolve(new Response(responseBody));
        },
    });

    try {
        await callback();
    } finally {
        if (originalFetch) {
            Object.defineProperty(globalThis, 'fetch', originalFetch);
        } else {
            Reflect.deleteProperty(globalThis, 'fetch');
        }
    }
}

describe(BlogDataClient.name, () => {
    it('returns JSON that matches the requested shape', async () => {
        await runWithMockFetch({
            responseBody: '{"typescript":12}',
            async callback() {
                assert.deepEquals(await new BlogDataClient().fetchTags(), {
                    typescript: 12,
                });
            },
        });
    });

    it('rejects JSON that does not match the requested shape', async () => {
        await runWithMockFetch({
            responseBody: '{"typescript":"not-a-count"}',
            async callback() {
                await assert.throws(new BlogDataClient().fetchTags(), {
                    matchMessage: 'Failed to load blog tags:',
                });
            },
        });
    });
});
