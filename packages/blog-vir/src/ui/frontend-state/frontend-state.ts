import {type Observable} from 'element-vir';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {type BlogFullRoute} from '../routing/blog-route.js';
import {type BlogRouter} from '../routing/blog-router.js';

/**
 * Router, generated-data client, and current route used to render the blog.
 *
 * @category Internal
 */
export type FrontendState = {
    /** Router scoped to the blog's base path. */
    router: BlogRouter;
    /** Client for loading generated blog data. */
    dataClient: BlogDataClient;
    /** Current sanitized browser route. */
    currentRoute: BlogFullRoute;
};

/**
 * Observable wrapper around {@link FrontendState}.
 *
 * @category Internal
 */
export type FrontendStateObservable = Pick<Observable<FrontendState>, 'listen' | 'value'> & {
    /** Merge a partial update into the current state. */
    update(updateValue?: Partial<FrontendState>): void;
    /** Remove the router listener and all state listeners. */
    destroy(): void;
};
