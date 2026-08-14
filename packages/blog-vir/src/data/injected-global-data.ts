import {assertValidShape, defineShape, nonEmptyStringShape} from 'object-shape-tester';
import {defaultBlogPostPageSize} from './blog-page-size.js';

/**
 * Runtime shape for {@link InjectedBlogVirData}.
 *
 * @category Internal
 */
export const injectedBlogVirDataShape = defineShape({
    pageSize: 0,
    siteBasePath: nonEmptyStringShape(),
});

/**
 * Data that the blog-vir CLI injects through Vite.
 *
 * @category Internal
 */
export type InjectedBlogVirData = (typeof injectedBlogVirDataShape)['runtimeType'];

declare const VITE_INJECTED_BLOG_VIR_DATA: InjectedBlogVirData;

/**
 * Read and validate data injected by the blog-vir Vite runner.
 *
 * @category Internal
 */
export function readInjectedBlogVirData(): InjectedBlogVirData {
    if (typeof VITE_INJECTED_BLOG_VIR_DATA === 'undefined') {
        return {
            pageSize: defaultBlogPostPageSize,
            siteBasePath: '/',
        };
    }

    const injectedData: InjectedBlogVirData = VITE_INJECTED_BLOG_VIR_DATA;
    assertValidShape(injectedData, injectedBlogVirDataShape);

    return injectedData;
}
