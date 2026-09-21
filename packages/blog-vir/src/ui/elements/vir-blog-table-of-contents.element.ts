import {css, defineElement, html} from 'element-vir';
import {ViraLink, viraTheme} from 'vira';
import {type BlogPost} from '../../data/blog-post.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {blogPathTree} from '../routing/blog-route.js';
import {normalizeBlogRoute} from '../routing/blog-router.js';
import {blogFontSizes} from '../util/shared-styles.js';

/**
 * Sticky, wide-screen navigation for a blog post's Markdown headings.
 *
 * @category Internal
 */
export const VirBlogTableOfContents = defineElement<{
    frontendState: Readonly<FrontendState>;
    post: Readonly<BlogPost>;
}>()({
    tagName: 'vir-blog-table-of-contents',
    styles: css`
        :host {
            display: none;
        }

        @media (min-width: 1720px) {
            :host {
                display: block;
                position: absolute;
                top: 0;
                right: calc(100% + 32px);
                bottom: 0;
                width: 200px;
            }

            nav {
                position: sticky;
                top: 72px;
                color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
                font-size: ${blogFontSizes.postMetadata};

                & .title {
                    margin-bottom: 8px;
                    color: ${viraTheme.colors['vira-grey-foreground-body'].foreground.value};
                    font-weight: bold;
                }

                & .links {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                & ${ViraLink}.link {
                    display: block;
                    overflow-wrap: anywhere;
                    text-decoration: none;

                    &:hover {
                        text-decoration: underline;
                    }

                    &.heading-level-2 {
                        padding-left: 12px;
                    }

                    &.heading-level-3 {
                        padding-left: 24px;
                    }

                    &.heading-level-4 {
                        padding-left: 36px;
                    }

                    &.heading-level-5 {
                        padding-left: 48px;
                    }

                    &.heading-level-6 {
                        padding-left: 60px;
                    }
                }
            }
        }
    `,
    render({inputs}) {
        return html`
            <nav aria-label="Table of contents">
                <div class="title">On this page</div>
                <div class="links">
                    ${inputs.post.postHeadings.map((heading) => {
                        return html`
                            <${ViraLink.assign({
                                route: {
                                    router: inputs.frontendState.router,
                                    route: normalizeBlogRoute({
                                        paths: blogPathTree.paths.children.post.children[
                                            ':slug'
                                        ].fill(inputs.post.postSlug).fullPaths,
                                        hash: heading.headingUrlAnchor,
                                    }),
                                },
                                disableLinkStyles: true,
                            })}
                                class=${[
                                    'link',
                                    `heading-level-${heading.headingLevel}`,
                                ].join(' ')}
                            >
                                ${heading.headingTitle}
                            </${ViraLink}>
                        `;
                    })}
                </div>
            </nav>
        `;
    },
});
