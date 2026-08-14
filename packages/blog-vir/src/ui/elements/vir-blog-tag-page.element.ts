import {asyncProp, css, defineElement, html, renderAsync} from 'element-vir';
import {ViraError, viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogContentMaxWidth} from '../util/shared-styles.js';
import {VirBlogPostList} from './vir-blog-post-list.element.js';

/**
 * Paginated post-list page for a single blog tag.
 *
 * @category Internal
 */
export const VirBlogTagPage = defineElement<{
    frontendState: Readonly<FrontendState>;
    tag: string;
}>()({
    tagName: 'vir-blog-tag-page',
    styles: css`
        :host {
            display: block;
            max-width: ${blogContentMaxWidth};
            margin: 0 auto;
        }

        h2 {
            margin-top: 0;
        }

        .placeholder {
            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
        }
    `,
    state() {
        return {
            tagPostsProp: asyncProp({
                async updateCallback({
                    dataClient,
                    tag,
                }: Readonly<{
                    dataClient: BlogDataClient;
                    tag: string;
                }>) {
                    return await dataClient.fetchTagPosts(tag);
                },
            }),
        };
    },
    render({inputs, state}) {
        state.tagPostsProp.update({
            dataClient: inputs.frontendState.dataClient,
            tag: inputs.tag,
        });
        return renderAsync(
            state.tagPostsProp,
            html`
                <p class="placeholder">Loading…</p>
            `,
            (slugs) => {
                if (!slugs.length) {
                    return html`
                        <h2>Tag: ${inputs.tag}</h2>
                        <p class="placeholder">No posts under this tag.</p>
                    `;
                }
                return html`
                    <h2>Tag: ${inputs.tag}</h2>
                    <${VirBlogPostList.assign({
                        frontendState: inputs.frontendState,
                        slugs,
                    })}></${VirBlogPostList}>
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
