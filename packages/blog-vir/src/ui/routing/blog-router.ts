import {check} from '@augment-vir/assert';
import {addPrefix, type PartialWithUndefined} from '@augment-vir/common';
import {SpaRouter} from 'spa-router-vir';
import {buildUrl} from 'url-vir';
import {type BlogPaths, sanitizeBlogRoute} from './blog-route.js';

/**
 * Router configured with the blog's valid paths and hash values.
 *
 * @category Internal
 */
export type BlogRouter = SpaRouter<BlogPaths, undefined, string | undefined>;

/**
 * Create the blog's router. Frontend state creation uses this for the page's router; consumers only
 * need it when using lower-level blog elements directly.
 *
 * @category Internal
 */
export function createBlogRouter(
    params: Readonly<
        PartialWithUndefined<{
            /**
             * Path prefix that the blog is served under, needed for hosts like GitHub Pages where
             * the site lives at `<user>.github.io/<repo-name>`.
             */
            basePath: string;
        }>
    > = {},
) {
    return new SpaRouter<BlogPaths, undefined, string | undefined>({
        basePath: params.basePath
            ? buildUrl(
                  addPrefix({
                      value: params.basePath,
                      prefix: '/',
                  }),
              )
                  .paths.filter(check.isTruthy)
                  .join('/') || undefined
            : undefined,
        sanitizeRoute: sanitizeBlogRoute,
    });
}
