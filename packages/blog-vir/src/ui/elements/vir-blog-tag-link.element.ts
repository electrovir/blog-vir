import {colorCss} from '@electrovir/color';
import {css, defineElement, html} from 'element-vir';
import {viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {blogPathTree} from '../routing/blog-route.js';
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
            display: inline-flex;
            font-size: 0.85em;
            color: ${viraTheme.colors['vira-grey-foreground-placeholder'].foreground.value};
        }

        ${VirBlogLink} .post-count {
            ${colorCss(viraTheme.colors['vira-grey-behind-fg-small-body'])}
            display: inline-block;
            margin-left: 6px;
            padding: 0 6px;
            border-radius: 10px;
            font-size: 0.75em;
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
                ${inputs.showHashPrefix ? '#' : ''}${inputs.tag}
                ${inputs.postCount == undefined
                    ? ''
                    : html`
                          <span class="post-count">${inputs.postCount}</span>
                      `}
            </${VirBlogLink}>
        `;
    },
});
