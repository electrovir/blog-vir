import {colorCss} from '@electrovir/color';
import {VirBlog} from 'blog-vir/src/ui/elements/vir-blog.element.js';
import {css, defineElement, html} from 'element-vir';
import {themeDefaultKey} from 'theme-vir';
import {ViraLink, viraTheme} from 'vira';

export const VirBlogDemo = defineElement()({
    tagName: 'vir-blog-demo',
    styles: css`
        :host {
            ${colorCss(viraTheme.colors[themeDefaultKey])}
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            font-family: sans-serif;
        }

        ${VirBlog} {
            flex-grow: 1;

            /* Matches the hover-only underline that vir-blog-link uses for in-site links. */
            & ${ViraLink} {
                text-decoration: none;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    `,
    render() {
        return html`
            <${VirBlog}>
                <span slot=${VirBlog.slotNames['vir-blog-brand']}>blog-vir example</span>
                <${ViraLink.assign({
                    link: {
                        url: 'https://github.com/electrovir/blog-vir',
                        newTab: true,
                    },
                })}
                    slot=${VirBlog.slotNames['vir-blog-right']}
                >
                    GitHub
                </${ViraLink}>
            </${VirBlog}>
        `;
    },
});
