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
 * Font sizes, in pixels, used by blog elements.
 *
 * @category Internal
 */
export const blogFontSizes = {
    blurbMetadata: css`14px`,
    blurbTitle: css`32px`,
    code: css`16px`,
    blurbContentHeading: {
        h1: css`26px`,
        h2: css`21px`,
        h3: css`17px`,
        h4: css`15px`,
        h5: css`13px`,
        h6: css`12px`,
    },
    contentHeading: {
        h1: css`32px`,
        h2: css`26px`,
        h3: css`21px`,
        h4: css`18px`,
        h5: css`16px`,
        h6: css`14px`,
    },
    headerBrand: css`19px`,
    postMetadata: css`15px`,
    postTitle: css`38px`,
    searchHeading: css`14px`,
    tag: css`13px`,
    tagListTag: css`20px`,
    tagPostCount: css`12px`,
};

/**
 * Re-usable styles for post content rendered from markdown. These target the `unsafeHTML` injected
 * markup, so selectors live inside an outer wrapper.
 *
 * @category Internal
 */
export function createBlogContentStyles(
    headingFontSizes: Readonly<
        Record<keyof typeof blogFontSizes.contentHeading, ReturnType<typeof css>>
    > = blogFontSizes.contentHeading,
) {
    const headingSizeStyles = unsafeCSS(
        getObjectTypedKeys(headingFontSizes)
            .map((headingTag) => {
                return css`
                    & ${unsafeCSS(headingTag)} {
                        font-size: ${headingFontSizes[headingTag]};
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
            font-size: ${blogFontSizes.code};
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
