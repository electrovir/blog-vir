import {type PartialWithUndefined} from '@augment-vir/common';
import {SpaRouter} from 'spa-router-vir';
import {type BlogPaths, type BlogSearch, sanitizeBlogRoute} from './blog-route.js';

export type BlogRouter = SpaRouter<BlogPaths, BlogSearch | undefined, string | undefined>;

/**
 * Create the blog's router. Create only one per page and pass it into `VirBlog` (and any blog
 * element that links or navigates).
 */
export function createBlogRouter(
    params: Readonly<
        PartialWithUndefined<{
            /**
             * Path prefix that the blog is served under, needed for hosts like GitHub Pages where
             * the site lives at `<user>.github.io/<repo-name>`. Set it to `<repo-name>`.
             */
            basePath: string;
        }>
    > = {},
) {
    return new SpaRouter<BlogPaths, BlogSearch | undefined, string | undefined>({
        basePath: params.basePath,
        sanitizeRoute: sanitizeBlogRoute,
    });
}
