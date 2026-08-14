import {type FullSpaRoute, PathTree, type SpaRoute} from 'spa-router-vir';

/**
 * Every URL path that the blog serves:
 *
 * - `/`: the first page of the post list.
 * - `/page/<number>`: a later page of the post list.
 * - `/history`: the full post history.
 * - `/post/<slug>`: a single post.
 * - `/tags`: all tags.
 * - `/tags/<tag>`: posts under a single tag.
 *
 * @category Internal
 */
export const blogPathTree = new PathTree({
    allowBare: true,
    children: {
        history: {},
        /** `allowBare` must be `true` because `:pageNumber` is the only child. */
        page: {
            allowBare: true,
            children: {
                ':pageNumber': {},
            },
        },
        /**
         * `allowBare` must be `true` because `:slug` is the only child. A bare `/post` is
         * redirected to the home page in {@link sanitizeBlogRoute}.
         */
        post: {
            allowBare: true,
            children: {
                ':slug': {},
            },
        },
        tags: {
            allowBare: true,
            children: {
                ':tag': {},
            },
        },
    },
});

/**
 * Valid path tuples represented by {@link blogPathTree}.
 *
 * @category Internal
 */
export type BlogPaths = typeof blogPathTree.PathsType;

/**
 * Partial blog route accepted by navigation APIs.
 *
 * @category Internal
 */
export type BlogRoute = Readonly<SpaRoute<BlogPaths, undefined>>;

/**
 * Fully resolved and sanitized blog route.
 *
 * @category Internal
 */
export type BlogFullRoute = Readonly<FullSpaRoute<BlogPaths, undefined>>;

/**
 * The 1-indexed post list page that the given route paths point at. The first page has no `/page`
 * segment at all, matching how most blogs canonicalize their list URLs.
 *
 * @category Internal
 */
export function readBlogPageNumber(paths: ReadonlyArray<string>): number {
    if (paths[0] !== blogPathTree.paths.children.page.path) {
        return 1;
    }
    const parsedPageNumber = Number(paths[1]);
    return Number.isInteger(parsedPageNumber) && parsedPageNumber > 1 ? parsedPageNumber : 1;
}

/**
 * The route for a post list page. Page 1 is the home route, with no `/page` segment.
 *
 * @category Internal
 */
export function createBlogPageRoute(pageNumber: number): BlogRoute {
    return {
        paths:
            pageNumber > 1
                ? blogPathTree.paths.children.page.children[':pageNumber'].fill(String(pageNumber))
                      .fullPaths
                : blogPathTree.paths.fullPaths,
    };
}

/**
 * Forces any raw window URL into a route that the blog can actually render.
 *
 * @category Internal
 */
export function sanitizeBlogRoute(rawRoute: Readonly<FullSpaRoute>): BlogFullRoute {
    return {
        paths: blogPathTree.sanitizePaths(canonicalizePaths(rawRoute.paths)),
        search: undefined,
        hash: rawRoute.hash || undefined,
    };
}

/**
 * Sends the two paths that exist in the tree but have nothing to render home: a bare `/post`, and
 * any `/page` that does not name a page after the first.
 */
function canonicalizePaths(rawPaths: ReadonlyArray<string>): ReadonlyArray<string> {
    if (rawPaths.length === 1 && rawPaths[0] === blogPathTree.paths.children.post.path) {
        return [];
    } else if (rawPaths[0] === blogPathTree.paths.children.page.path) {
        return readBlogPageNumber(rawPaths) > 1 ? rawPaths : [];
    } else {
        return rawPaths;
    }
}
