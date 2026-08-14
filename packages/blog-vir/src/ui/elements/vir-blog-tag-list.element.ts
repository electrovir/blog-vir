import {getObjectTypedEntries} from '@augment-vir/common';
import {asyncProp, css, defineElement, html, renderAsync} from 'element-vir';
import {ViraError, viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogContentMaxWidth} from '../util/shared-styles.js';
import {VirBlogTagLink} from './vir-blog-tag-link.element.js';

/**
 * Alphabetical list of all blog tags and their post counts.
 *
 * @category Internal
 */
export const VirBlogTagList = defineElement<{
    frontendState: Readonly<FrontendState>;
}>()({
    tagName: 'vir-blog-tag-list',
    styles: css`
        :host {
            display: block;
            max-width: ${blogContentMaxWidth};
            margin: 0 auto;
        }

        h2 {
            margin-top: 0;
        }

        ol {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 0;
            padding-left: 24px;

            /* Overrides the dimming and shrinking that tag links use inside post metadata. */
            & li ${VirBlogTagLink} {
                color: inherit;
                font-size: 1.25em;
            }
        }

        .placeholder {
            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
        }
    `,
    state() {
        return {
            tagsProp: asyncProp({
                async updateCallback(client: BlogDataClient) {
                    return await client.fetchTags();
                },
            }),
        };
    },
    render({inputs, state}) {
        state.tagsProp.update(inputs.frontendState.dataClient);
        return renderAsync(
            state.tagsProp,
            html`
                <p class="placeholder">Loading…</p>
            `,
            (tags) => {
                const entries = getObjectTypedEntries(tags).toSorted((a, b) => {
                    return a[0].localeCompare(b[0]);
                });
                return html`
                    <h2>Tags</h2>
                    <ol>
                        ${entries.map(
                            ([
                                tag,
                                postCount,
                            ]) => {
                                return html`
                                    <li>
                                        <${VirBlogTagLink.assign({
                                            frontendState: inputs.frontendState,
                                            tag,
                                            postCount,
                                            showHashPrefix: false,
                                        })}></${VirBlogTagLink}>
                                    </li>
                                `;
                            },
                        )}
                    </ol>
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
