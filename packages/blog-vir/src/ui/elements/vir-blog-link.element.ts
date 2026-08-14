import {classMap, css, defineElement, html, listen} from 'element-vir';
import {ViraLink} from 'vira';
import {type BlogRoute} from '../routing/blog-route.js';
import {type BlogRouter} from '../routing/blog-router.js';

/**
 * A ViraLink bound to a blog {@link BlogRoute}. Plain clicks are handled in-page by the blog router
 * while modifier clicks fall through to the real `href` so new-tab and new-window clicks still
 * work.
 *
 * @category Internal
 */
export const VirBlogLink = defineElement<{
    router: BlogRouter;
    route: BlogRoute;
    underlineOnHover: boolean;
}>()({
    tagName: 'vir-blog-link',
    styles: css`
        :host {
            display: inline;
        }

        /* Overrides the always-on underline that vira-link applies to itself. */
        ${ViraLink} {
            text-decoration: none;

            &.underline-on-hover:hover {
                text-decoration: underline;
            }
        }
    `,
    render({inputs}) {
        return html`
            <${ViraLink.assign({
                link: {
                    url: inputs.router.createRouteUrl(inputs.route).url,
                    newTab: false,
                },
            })}
                class=${classMap({
                    'underline-on-hover': inputs.underlineOnHover,
                })}
                ${listen('click', (event) => {
                    inputs.router.setRouteOnDirectNavigation(inputs.route, event);
                })}
            >
                <slot></slot>
            </${ViraLink}>
        `;
    },
});
