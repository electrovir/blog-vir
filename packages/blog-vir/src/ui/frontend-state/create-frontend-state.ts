import {check} from '@augment-vir/assert';
import {type AnyObject, type PartialWithUndefined} from '@augment-vir/common';
import {Observable} from 'element-vir';
import {readInjectedBlogVirData} from '../../data/injected-global-data.js';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {createBlogRouter} from '../routing/blog-router.js';
import {type FrontendStateObservable} from './frontend-state.js';

/**
 * Inputs for {@link createFrontendState}.
 *
 * @category Internal
 */
export type FrontendStateParams = Readonly<
    PartialWithUndefined<{
        /** Optional override for the data client. This is mostly just useful for testing purposes. */
        dataClient: BlogDataClient;
    }>
>;

/**
 * Create observable frontend state and keep its current route synchronized with the URL.
 *
 * @category Internal
 */
export function createFrontendState({
    dataClient,
}: FrontendStateParams = {}): FrontendStateObservable {
    const injectedData = readInjectedBlogVirData();
    const router = createBlogRouter({
        basePath: injectedData.siteBasePath,
    });
    const rawFrontendStateObservable = new Observable({
        equalityCheck: check.strictEquals,
        defaultValue: {
            router,
            dataClient:
                dataClient ||
                new BlogDataClient(
                    router.createRouteUrl({
                        paths: blogPathTree.paths.fullPaths,
                    }).url,
                    injectedData.pageSize,
                ),
            currentRoute: router.readCurrentRoute(),
        },
    });

    function update(
        this: void,
        updateValue: Partial<(typeof rawFrontendStateObservable)['value']> = {},
    ) {
        rawFrontendStateObservable.setValue({
            ...rawFrontendStateObservable.value,
            ...updateValue,
        });
    }

    const removeRouterListener = router.listen(true, (currentRoute) => {
        update({
            currentRoute,
        });
    });
    const destroyRawObservable = rawFrontendStateObservable.destroy.bind(
        rawFrontendStateObservable,
    );

    return Object.assign(
        rawFrontendStateObservable as AnyObject as Omit<
            typeof rawFrontendStateObservable,
            | 'equalityCheck'
            | 'getListenerCount'
            | 'listenToEvent'
            | 'removeAllListeners'
            | 'removeListener'
            | 'destroy'
            | 'setValue'
        >,
        {
            update,
            destroy() {
                removeRouterListener();
                destroyRawObservable();
            },
        },
    );
}
