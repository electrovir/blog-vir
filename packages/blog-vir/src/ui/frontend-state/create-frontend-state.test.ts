import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {createFrontendState} from './create-frontend-state.js';

describe(createFrontendState.name, () => {
    it('creates a root router when no Vite data is injected', () => {
        const dataClient = new BlogDataClient('/test/');
        const frontendStateObservable = createFrontendState({
            dataClient,
        });

        assert.strictEquals(frontendStateObservable.value.dataClient, dataClient);
        assert.isUndefined(frontendStateObservable.value.router.params.basePath);
        assert.deepEquals(frontendStateObservable.value.currentRoute, {
            paths: [],
            search: undefined,
            hash: undefined,
        });

        frontendStateObservable.destroy();
    });

    it('creates the default data client from the injected site base fallback', () => {
        const frontendStateObservable = createFrontendState();

        assert.deepEquals(
            {
                pageSize: frontendStateObservable.value.dataClient.pageSize,
                siteBase: frontendStateObservable.value.dataClient.siteBase,
            },
            {
                pageSize: 20,
                siteBase: `${window.location.origin}/`,
            },
        );

        frontendStateObservable.destroy();
    });

    it('excludes the current hash from the default data client base', () => {
        const originalUrl = globalThis.location.href;
        globalThis.history.replaceState(undefined, '', '/#table');
        const frontendStateObservable = createFrontendState();

        try {
            assert.strictEquals(
                frontendStateObservable.value.dataClient.siteBase,
                `${window.location.origin}/`,
            );
        } finally {
            frontendStateObservable.destroy();
            globalThis.history.replaceState(undefined, '', originalUrl);
        }
    });
});
