import {asyncProp, css, defineElement, html, renderAsync} from 'element-vir';
import {ViraError, viraFontCssVars, viraTheme} from 'vira';
import {type AllBlogPostsEntry} from '../../data/blog-post.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {formatBlogMonthDay} from '../util/format-blog-date.js';
import {blogContentMaxWidth} from '../util/shared-styles.js';
import {VirBlogLink} from './vir-blog-link.element.js';

/**
 * Complete chronological post history grouped by year.
 *
 * @category Internal
 */
export const VirBlogHistory = defineElement<{
    frontendState: Readonly<FrontendState>;
}>()({
    tagName: 'vir-blog-history',
    styles: css`
        :host {
            display: block;
            max-width: ${blogContentMaxWidth};
            margin: 0 auto;
        }

        h2 {
            margin: 24px 0 12px;
        }

        ol {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;

            & li .post-line {
                display: block;

                /*
                   The alignment spaces sit in their own inline-block, which is the only way to keep
                   the link's hover underline off of them: a text-decoration from an ancestor covers
                   every inline descendant but stops at an atomic one.
                */
                & .date-pad {
                    display: inline-block;
                    font-family: ${viraFontCssVars['vira-monospace'].value};
                    white-space: pre;
                }

                & time {
                    color: ${viraTheme.colors['vira-grey-foreground-body'].foreground.value};
                    font-family: ${viraFontCssVars['vira-monospace'].value};
                    white-space: pre;
                }

                &:hover time {
                    color: inherit;
                }
            }
        }

        .placeholder {
            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
        }
    `,
    state() {
        return {
            allPostsProp: asyncProp({
                async updateCallback(client: BlogDataClient) {
                    return await client.fetchAllPosts();
                },
            }),
        };
    },
    render({inputs, state}) {
        state.allPostsProp.update(inputs.frontendState.dataClient);
        return renderAsync(
            state.allPostsProp,
            html`
                <p class="placeholder">Loading…</p>
            `,
            (posts) => {
                const groups = groupPostsByYear(posts);
                return html`
                    <h1>History</h1>
                    ${groups.map(({year, posts}) => {
                        return html`
                            <h2>${year}</h2>
                            <ol>
                                ${posts.map((post) => {
                                    const monthDay = formatBlogMonthDay(post.postDate);
                                    return html`
                                        <li>
                                            <${VirBlogLink.assign({
                                                router: inputs.frontendState.router,
                                                route: {
                                                    paths: blogPathTree.paths.children.post.children[
                                                        ':slug'
                                                    ].fill(post.postSlug).fullPaths,
                                                },
                                                underlineOnHover: true,
                                            })}
                                                class="post-line"
                                            >
                                                <!-- prettier-ignore -->
                                                <span class="date-pad">${monthDay.padding}</span><time datetime=${post.postDate}>${monthDay.monthDay}&nbsp;&nbsp;</time>${post.postTitle}
                                            </${VirBlogLink}>
                                        </li>
                                    `;
                                })}
                            </ol>
                        `;
                    })}
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

function groupPostsByYear(
    posts: ReadonlyArray<AllBlogPostsEntry>,
): {year: string; posts: ReadonlyArray<AllBlogPostsEntry>}[] {
    const groups = new Map<string, AllBlogPostsEntry[]>();
    posts.forEach((post) => {
        const year = post.postDate.slice(0, 4);
        const existing = groups.get(year);
        if (existing) {
            existing.push(post);
        } else {
            groups.set(year, [post]);
        }
    });
    return [...groups.entries()]
        .toSorted((a, b) => b[0].localeCompare(a[0]))
        .map(
            ([
                year,
                postList,
            ]) => {
                return {
                    year,
                    posts: postList,
                };
            },
        );
}
