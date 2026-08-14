import {getObjectTypedKeys} from '@augment-vir/common';
import {colorCss} from '@electrovir/color';
import {css, unsafeCSS} from 'element-vir';
import {viraFontCssVars, viraTheme} from 'vira';

/**
 * Maximum width for the blog's main page content.
 *
 * @category Internal
 */
export const blogContentMaxWidth = css`1200px`;

/**
 * Font size, in `em`, of the `h1` post title on a full post page.
 *
 * @category Internal
 */
export const blogPostTitleFontSize = 2.4;

/**
 * Font size, in `em`, of a post title on list pages, where posts are shown as blurbs.
 *
 * @category Internal
 */
export const blogBlurbTitleFontSize = 2;

/**
 * List pages show a smaller post title than a post's own page does, so their content headings
 * shrink by the same ratio to keep the heading hierarchy below the title intact.
 *
 * @category Internal
 */
export const blogBlurbContentScale = blogBlurbTitleFontSize / blogPostTitleFontSize;

/** Heading font sizes, in `em`, for post content shown at full size. */
const blogHeadingFontSizes: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number> = {
    h1: 2,
    h2: 1.6,
    h3: 1.3,
    h4: 1.15,
    h5: 1,
    h6: 0.9,
};

/**
 * Re-usable styles for post content rendered from markdown. These target the `unsafeHTML` injected
 * markup, so selectors live inside an outer wrapper. Pass a `headingScale` below `1` to shrink
 * every heading by that ratio.
 *
 * @category Internal
 */
export function createBlogContentStyles(headingScale = 1) {
    const headingSizeStyles = unsafeCSS(
        getObjectTypedKeys(blogHeadingFontSizes)
            .map((headingTag) => {
                return css`
                    & ${unsafeCSS(headingTag)} {
                        font-size: ${blogHeadingFontSizes[headingTag] * headingScale}em;
                    }
                `;
            })
            .join('\n'),
    );

    return css`
        & h1,
        & h2,
        & h3,
        & h4,
        & h5,
        & h6 {
            font-weight: ${viraFontCssVars['vira-font-weight-bold'].value};
            scroll-margin-top: 4rem;
        }

        ${headingSizeStyles}

        & a.anchor {
            opacity: 0;
            margin-right: 0.4em;
            text-decoration: none;
            font-weight: ${viraFontCssVars['vira-font-weight-normal'].value};
            color: ${viraTheme.colors['vira-grey-foreground-body'].foreground.value};
        }

        & :is(h1, h2, h3, h4, h5, h6):hover a.anchor {
            opacity: 1;
        }

        & pre {
            ${colorCss(viraTheme.colors['vira-grey-behind-fg-small-body'])}
            padding: 12px 16px;
            border-radius: 6px;
            overflow-x: auto;
        }

        & code {
            font-family: ${viraFontCssVars['vira-monospace'].value};
            font-size: 1.05em;
        }

        & :not(pre) > code {
            ${colorCss(viraTheme.colors['vira-grey-behind-fg-small-body'])}
            padding: 2px 6px;
            border-radius: 3px;
        }

        & blockquote {
            border-left: 4px solid
                ${viraTheme.colors['vira-grey-foreground-placeholder'].foreground.value};
            color: ${viraTheme.colors['vira-grey-foreground-body'].foreground.value};
            padding-left: 12px;
            margin-left: 0;
        }

        & img {
            max-width: 100%;
            height: auto;
        }
    `;
}
