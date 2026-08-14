import {type PartialWithUndefined} from '@augment-vir/common';
import {colorCss} from '@electrovir/color';
import {css, defineElement, defineElementEvent, html, type HtmlInterpolation} from 'element-vir';
import {themeDefaultKey} from 'theme-vir';
import {ViraLink, viraTheme, ViraThemeSwitcher} from 'vira';
import {createBlogRssFeedUrl} from '../../data/blog-paths.js';
import {createFrontendState} from '../frontend-state/create-frontend-state.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {VirBlogHeader} from './vir-blog-header.element.js';
import {VirBlogHistory} from './vir-blog-history.element.js';
import {VirBlogLink} from './vir-blog-link.element.js';
import {VirBlogPostList} from './vir-blog-post-list.element.js';
import {VirBlogPost} from './vir-blog-post.element.js';
import {VirBlogSearch} from './vir-blog-search.element.js';
import {VirBlogTagList} from './vir-blog-tag-list.element.js';
import {VirBlogTagPage} from './vir-blog-tag-page.element.js';

/**
 * The whole blog: header plus the current route's page. This is the only element a consumer needs.
 *
 * All slots are forwarded to the built-in header:
 *
 * - `vir-blog-brand`: the home link's contents.
 * - `vir-blog-nav`: left-aligned nav links.
 * - `vir-blog-right`: right-aligned contents, between the search box and theme switcher.
 *
 * @category Main
 * @default The `vir-blog-nav` slot contains tags, history, and feed links.
 */
export const VirBlog = defineElement<
    PartialWithUndefined<{
        /** Optional override for the data client (useful for tests). */
        dataClient: BlogDataClient;
    }>
>()({
    tagName: 'vir-blog',
    slotNames: [
        'vir-blog-brand',
        'vir-blog-nav',
        'vir-blog-right',
    ],
    events: {
        frontendStateUpdate: defineElementEvent<FrontendState>(),
    },
    styles: css`
        :host {
            ${colorCss(viraTheme.colors[themeDefaultKey])}
            display: flex;
            flex-direction: column;
        }

        ${VirBlogHeader} {
            & .header-search {
                width: 220px;
            }

            & .default-nav-link {
                text-decoration: none;

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        main {
            flex-grow: 1;
            padding: 24px;
        }
    `,
    state({inputs}) {
        return {
            frontendState: createFrontendState({
                dataClient: inputs.dataClient,
            }),
        };
    },
    init({state, updateState, dispatch, events}) {
        state.frontendState.listen(true, (frontendState) => {
            updateState({
                frontendState: state.frontendState,
            });
            dispatch(new events.frontendStateUpdate(frontendState));
        });
    },
    cleanup({state}) {
        state.frontendState.destroy();
    },
    render({slotNames, state}) {
        const frontendState: FrontendState = state.frontendState.value;
        const paths = frontendState.currentRoute.paths;
        const renderer = routeRenderers[paths[0] || ''] || renderPostListRoute;

        return html`
            <${VirBlogHeader.assign({
                frontendState,
            })}>
                <slot
                    name=${slotNames['vir-blog-brand']}
                    slot=${VirBlogHeader.slotNames['vir-blog-header-brand']}
                >
                    My Blog
                </slot>
                <slot
                    name=${slotNames['vir-blog-nav']}
                    slot=${VirBlogHeader.slotNames['vir-blog-header-nav']}
                >
                    ${renderDefaultNav(frontendState)}
                </slot>
                <${VirBlogSearch.assign({
                    frontendState,
                })}
                    slot=${VirBlogHeader.slotNames['vir-blog-header-right']}
                    class="header-search"
                ></${VirBlogSearch}>
                <slot
                    name=${slotNames['vir-blog-right']}
                    slot=${VirBlogHeader.slotNames['vir-blog-header-right']}
                ></slot>
                <${ViraThemeSwitcher}
                    slot=${VirBlogHeader.slotNames['vir-blog-header-right']}
                ></${ViraThemeSwitcher}>
            </${VirBlogHeader}>
            <main>
                ${renderer({
                    frontendState,
                })}
            </main>
        `;
    },
});

/**
 * Render the default tags, history, and RSS feed navigation for {@link VirBlog}.
 *
 * @category Internal
 */
export function renderDefaultNav(frontendState: Readonly<FrontendState>) {
    return html`
        <${VirBlogLink.assign({
            router: frontendState.router,
            route: {
                paths: blogPathTree.paths.children.tags.fullPaths,
            },
            underlineOnHover: true,
        })}>
            tags
        </${VirBlogLink}>
        <${VirBlogLink.assign({
            router: frontendState.router,
            route: {
                paths: blogPathTree.paths.children.history.fullPaths,
            },
            underlineOnHover: true,
        })}>
            history
        </${VirBlogLink}>
        <${ViraLink.assign({
            link: {
                url: createBlogRssFeedUrl(
                    frontendState.router.createRouteUrl({
                        paths: blogPathTree.paths.fullPaths,
                    }).url,
                ),
                newTab: false,
            },
        })}
            class="default-nav-link"
        >
            feed
        </${ViraLink}>
    `;
}

type RenderRouteParams = Readonly<{
    frontendState: Readonly<FrontendState>;
}>;

type BlogRouteRenderer = (params: RenderRouteParams) => HtmlInterpolation;

const renderPostListRoute: BlogRouteRenderer = ({frontendState}) => {
    return html`
        <${VirBlogPostList.assign({
            frontendState,
        })}></${VirBlogPostList}>
    `;
};

const routeRenderers: Readonly<Record<string, BlogRouteRenderer | undefined>> = {
    '': renderPostListRoute,
    [blogPathTree.paths.children.page.path]: renderPostListRoute,
    [blogPathTree.paths.children.history.path]: ({frontendState}) => {
        return html`
            <${VirBlogHistory.assign({
                frontendState,
            })}></${VirBlogHistory}>
        `;
    },
    [blogPathTree.paths.children.post.path]: (params) => {
        const slug = params.frontendState.currentRoute.paths[1];
        if (!slug) {
            return renderPostListRoute(params);
        }
        return html`
            <${VirBlogPost.assign({
                frontendState: params.frontendState,
                slug,
            })}></${VirBlogPost}>
        `;
    },
    [blogPathTree.paths.children.tags.path]: ({frontendState}) => {
        const tag = frontendState.currentRoute.paths[1];
        if (!tag) {
            return html`
                <${VirBlogTagList.assign({
                    frontendState,
                })}></${VirBlogTagList}>
            `;
        }
        return html`
            <${VirBlogTagPage.assign({
                frontendState,
                tag,
            })}></${VirBlogTagPage}>
        `;
    },
};
