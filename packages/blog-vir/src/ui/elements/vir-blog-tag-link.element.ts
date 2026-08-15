import {colorCss} from '@electrovir/color';
import {css, defineElement, html} from 'element-vir';
import {viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {blogPathTree} from '../routing/blog-route.js';
import {blogFontSizes} from '../util/shared-styles.js';
import {VirBlogLink} from './vir-blog-link.element.js';

/**
 * A single tag rendered as a small link to that tag's page.
 *
 * @category Internal
 */
export const VirBlogTagLink = defineElement<{
    frontendState: Readonly<FrontendState>;
    tag: string;
    /** Rendered after the tag text in a grey blob. Used for the post count on the tag list. */
    postCount: number | undefined;
    /** Prefixes the tag text with `#`. */
    showHashPrefix: boolean;
}>()({
    tagName: 'vir-blog-tag-link',
    styles: css`
        :host {
            display: flex;
            align-items: center;
            font-size: ${blogFontSizes.tag};
            color: ${viraTheme.colors['vira-grey-foreground-placeholder'].foreground.value};
        }

        .tag-wrapper {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .post-count {
            ${colorCss(viraTheme.colors['vira-grey-behind-fg-small-body'])}
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: ${blogFontSizes.tagPostCount};
            text-decoration: none;
        }
    `,
    render({inputs}) {
        return html`
            <${VirBlogLink.assign({
                router: inputs.frontendState.router,
                route: {
                    paths: blogPathTree.paths.children.tags.children[':tag'].fill(inputs.tag)
                        .fullPaths,
                },
                underlineOnHover: true,
            })}>
                <div class="tag-wrapper">
                    <span>${inputs.showHashPrefix ? '#' : ''}${inputs.tag}</span>
                    ${inputs.postCount == undefined
                        ? ''
                        : html`
                              <span class="post-count">${inputs.postCount}</span>
                          `}
                </div>
            </${VirBlogLink}>
        `;
    },
});
