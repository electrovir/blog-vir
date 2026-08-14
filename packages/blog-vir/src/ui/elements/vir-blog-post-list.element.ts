import {type PartialWithUndefined} from '@augment-vir/common';
import {asyncProp, css, defineElement, html, listen, renderAsync} from 'element-vir';
import {
    ArrowLeft24Icon,
    ArrowRight24Icon,
    ViraButton,
    ViraEmphasis,
    ViraError,
    type ViraIconSvg,
    viraTheme,
} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree, createBlogPageRoute, readBlogPageNumber} from '../routing/blog-route.js';
import {blogContentMaxWidth} from '../util/shared-styles.js';
import {VirBlogLink} from './vir-blog-link.element.js';
import {VirBlogPostBlurb} from './vir-blog-post-blurb.element.js';

/**
 * Paginated list of blog post previews.
 *
 * @category Internal
 */
export const VirBlogPostList = defineElement<
    {
        frontendState: Readonly<FrontendState>;
    } & PartialWithUndefined<{
        /** Only posts whose slug appears here are shown, ordered by this list. */
        slugs: ReadonlyArray<string>;
    }>
>()({
    tagName: 'vir-blog-post-list',
    styles: css`
        :host {
            display: block;
            max-width: ${blogContentMaxWidth};
            margin: 0 auto;
        }

        /* Outer-tree rules beat the blurb's own :host border, so no input is needed for this. */
        ${VirBlogPostBlurb}:last-of-type {
            border-bottom: none;
        }

        .pager {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 0;

            /* Keeps "Older" on the right on the first page, where "Newer" isn't rendered at all. */
            &.only-older {
                justify-content: flex-end;
            }

            /* The button inside supplies all the visuals, so the link itself adds nothing. */
            & .pager-link {
                display: inline-flex;
            }
        }

        .placeholder {
            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
            padding: 32px 0;
        }
    `,
    state() {
        return {
            postsProp: asyncProp({
                async updateCallback({
                    dataClient,
                    pageIndex,
                    slugs,
                }: Readonly<{
                    dataClient: BlogDataClient;
                    pageIndex: number;
                    slugs: ReadonlyArray<string> | undefined;
                }>) {
                    if (!slugs) {
                        const generatedPage = await dataClient.fetchPostPage(pageIndex + 1);
                        return {
                            pageIndex: generatedPage.pageNumber - 1,
                            pageCount: generatedPage.pageCount,
                            posts: generatedPage.posts,
                        };
                    }

                    const pageCount = Math.max(1, Math.ceil(slugs.length / dataClient.pageSize));
                    const safePageIndex = Math.min(pageIndex, pageCount - 1);
                    const start = safePageIndex * dataClient.pageSize;
                    const pageSlugs = slugs.slice(start, start + dataClient.pageSize);
                    return {
                        pageIndex: safePageIndex,
                        pageCount,
                        posts: await Promise.all(
                            pageSlugs.map(async (slug) => {
                                return await dataClient.fetchPost(slug);
                            }),
                        ),
                    };
                },
            }),
            pageIndex: 0,
        };
    },
    render({inputs, state, updateState}) {
        const isRouteControlled = routeControlsPaging(inputs.frontendState);
        state.postsProp.update({
            dataClient: inputs.frontendState.dataClient,
            pageIndex: isRouteControlled
                ? readBlogPageNumber(inputs.frontendState.currentRoute.paths) - 1
                : state.pageIndex,
            slugs: inputs.slugs,
        });
        return renderAsync(
            state.postsProp,
            html`
                <div class="placeholder">Loading…</div>
            `,
            (page) => {
                if (!page.posts.length) {
                    return html`
                        <div class="placeholder">No posts yet.</div>
                    `;
                }
                return html`
                    ${page.posts.map((post) => {
                        return html`
                            <${VirBlogPostBlurb.assign({
                                frontendState: inputs.frontendState,
                                post,
                            })}></${VirBlogPostBlurb}>
                        `;
                    })}
                    ${page.pageCount > 1
                        ? html`
                              <nav class=${page.pageIndex === 0 ? 'pager only-older' : 'pager'}>
                                  ${page.pageIndex > 0
                                      ? renderPagerEntry({
                                            text: 'Newer',
                                            icon: ArrowLeft24Icon,
                                            targetPageIndex: page.pageIndex - 1,
                                            frontendState: inputs.frontendState,
                                            isRouteControlled,
                                            showPage(pageIndex) {
                                                updateState({
                                                    pageIndex,
                                                });
                                            },
                                        })
                                      : ''}
                                  ${page.pageIndex < page.pageCount - 1
                                      ? renderPagerEntry({
                                            text: 'Older',
                                            icon: ArrowRight24Icon,
                                            showIconOnRight: true,
                                            targetPageIndex: page.pageIndex + 1,
                                            frontendState: inputs.frontendState,
                                            isRouteControlled,
                                            showPage(pageIndex) {
                                                updateState({
                                                    pageIndex,
                                                });
                                            },
                                        })
                                      : ''}
                              </nav>
                          `
                        : ''}
                `;
            },
            (error) => {
                return html`
                    <${ViraError}>${error.message}</${ViraError}>
                `;
            },
        );
    },
});

function renderPagerEntry({
    text,
    icon,
    showIconOnRight,
    targetPageIndex,
    frontendState,
    isRouteControlled,
    showPage,
}: Readonly<{
    text: string;
    icon: Readonly<ViraIconSvg>;
    targetPageIndex: number;
    frontendState: Readonly<FrontendState>;
    isRouteControlled: boolean;
    showPage: (pageIndex: number) => void;
}> &
    PartialWithUndefined<{
        /** Points the arrow away from the text on the pager entry that moves forwards. */
        showIconOnRight: boolean;
    }>) {
    const button = html`
        <${ViraButton.assign({
            text,
            icon,
            showIconOnRight,
            buttonEmphasis: ViraEmphasis.Subtle,
        })}
            ${listen('click', () => {
                if (!isRouteControlled) {
                    showPage(targetPageIndex);
                }
                scrollToTop();
            })}
        ></${ViraButton}>
    `;

    if (!isRouteControlled) {
        return button;
    }

    /* The link owns navigation, so the button inside it only handles the scroll back to the top. */
    return html`
        <${VirBlogLink.assign({
            router: frontendState.router,
            route: createBlogPageRoute(targetPageIndex + 1),
            underlineOnHover: false,
        })}
            class="pager-link"
        >
            ${button}
        </${VirBlogLink}>
    `;
}

function routeControlsPaging(frontendState: Readonly<FrontendState>) {
    const topPath = frontendState.currentRoute.paths[0];
    return !topPath || topPath === blogPathTree.paths.children.page.path;
}

function scrollToTop() {
    if (typeof window !== 'undefined') {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }
}
