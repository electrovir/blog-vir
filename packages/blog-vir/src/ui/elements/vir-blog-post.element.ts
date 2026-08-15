import {createUtcFullDate, utcTimezone} from 'date-vir';
import {asyncProp, css, defineElement, html, renderAsync, unsafeHTML} from 'element-vir';
import {ViraAbsoluteTime, ViraError, viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {
    blogContentMaxWidth,
    blogFontSizes,
    createBlogContentStyles,
} from '../util/shared-styles.js';
import {VirBlogTagLink} from './vir-blog-tag-link.element.js';

/**
 * Full rendered blog post page.
 *
 * @category Internal
 */
export const VirBlogPost = defineElement<{
    frontendState: Readonly<FrontendState>;
    slug: string;
}>()({
    tagName: 'vir-blog-post',
    styles: css`
        :host {
            display: block;
            max-width: ${blogContentMaxWidth};
            margin: 0 auto;
        }

        article {
            & .header {
                margin-bottom: 24px;

                & .title {
                    font-size: ${blogFontSizes.postTitle};
                    margin: 0 0 8px;
                }

                & .meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    align-items: center;
                    color: ${viraTheme.colors['vira-grey-foreground-placeholder'].foreground.value};
                    font-size: ${blogFontSizes.postMetadata};
                }

                & .tag-list {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-top: 8px;
                }
            }

            & .content {
                ${createBlogContentStyles()}
            }
        }

        .placeholder {
            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
            padding: 32px 0;
        }
    `,
    state() {
        return {
            postProp: asyncProp({
                async updateCallback({
                    slug,
                    dataClient,
                }: Readonly<{
                    slug: string;
                    dataClient: BlogDataClient;
                }>) {
                    return await dataClient.fetchPost(slug);
                },
            }),
        };
    },
    render({inputs, state}) {
        state.postProp.update({
            slug: inputs.slug,
            dataClient: inputs.frontendState.dataClient,
        });

        return renderAsync(
            state.postProp,
            html`
                <div class="placeholder">Loading…</div>
            `,
            (post) => {
                return html`
                    <article>
                        <header class="header">
                            <h1 class="title">${post.postTitle}</h1>
                            <div class="meta">
                                <${ViraAbsoluteTime.assign({
                                    time: createUtcFullDate(post.postDate),
                                    showDateOnly: true,
                                    timezone: utcTimezone,
                                })}></${ViraAbsoluteTime}>
                            </div>
                            ${post.tags.length
                                ? html`
                                      <div class="tag-list">
                                          ${post.tags.map((tag) => {
                                              return html`
                                                  <${VirBlogTagLink.assign({
                                                      frontendState: inputs.frontendState,
                                                      tag,
                                                      postCount: undefined,
                                                      showHashPrefix: true,
                                                  })}></${VirBlogTagLink}>
                                              `;
                                          })}
                                      </div>
                                  `
                                : ''}
                        </header>
                        <div class="content">${unsafeHTML(post.postContentHtml)}</div>
                    </article>
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
