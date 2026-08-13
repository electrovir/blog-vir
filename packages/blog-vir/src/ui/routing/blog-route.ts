import {type FullSpaRoute, PathTree, type SpaRoute} from 'spa-router-vir';

/** The search param that carries the query on the `/search` route. */
export const blogSearchQueryParam = 'q';

/**
 * Every URL path that the blog serves:
 *
 * - `/`: the paginated post list.
 * - `/all`: the full archive.
 * - `/post/<slug>`: a single post.
 * - `/search`: search, with the query in the `q` search param.
 * - `/tags`: all tags.
 * - `/tags/<tag>`: posts under a single tag.
 */
export const blogPathTree = new PathTree({
    allowBare: true,
    children: {
        all: {},
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
        search: {},
        tags: {
            allowBare: true,
            children: {
                ':tag': {},
            },
        },
    },
});

export type BlogPaths = typeof blogPathTree.PathsType;

/** The first path segment of any blog route. The home page has no segments, hence `''`. */
export type BlogTopPath = keyof NonNullable<typeof blogPathTree.tree.children> | '';

export type BlogSearch = Readonly<Record<typeof blogSearchQueryParam, ReadonlyArray<string>>>;

export type BlogRoute = Readonly<SpaRoute<BlogPaths, BlogSearch | undefined>>;

export type BlogFullRoute = Readonly<FullSpaRoute<BlogPaths, BlogSearch | undefined>>;

/** Forces any raw window URL into a route that the blog can actually render. */
export function sanitizeBlogRoute(rawRoute: Readonly<FullSpaRoute>): BlogFullRoute {
    const rawPaths =
        rawRoute.paths.length === 1 && rawRoute.paths[0] === blogPathTree.paths.children.post.path
            ? []
            : rawRoute.paths;
    const query = rawRoute.search?.[blogSearchQueryParam]?.[0];
    const isSearchPath = rawPaths[0] === blogPathTree.paths.children.search.path;

    return {
        paths: blogPathTree.sanitizePaths(rawPaths),
        search:
            isSearchPath && query
                ? {
                      [blogSearchQueryParam]: [query],
                  }
                : undefined,
        hash: rawRoute.hash || undefined,
    };
}
