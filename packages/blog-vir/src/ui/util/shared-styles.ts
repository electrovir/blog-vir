import {colorCss} from '@electrovir/color';
import {css} from 'element-vir';
import {viraFontCssVars} from 'vira';
import {blogColors} from './blog-colors.js';

/**
 * Re-usable styles for post content rendered from markdown. These target the `unsafeHTML` injected
 * markup, so selectors live inside an outer wrapper.
 */
export const blogContentStyles = css`
    & h1,
    & h2,
    & h3,
    & h4,
    & h5,
    & h6 {
        font-weight: ${viraFontCssVars['vira-font-weight-bold'].value};
        scroll-margin-top: 4rem;
    }

    & h1 {
        font-size: 2em;
    }

    & h2 {
        font-size: 1.6em;
    }

    & a.anchor {
        opacity: 0;
        margin-right: 0.4em;
        text-decoration: none;
        font-weight: ${viraFontCssVars['vira-font-weight-normal'].value};
        color: ${blogColors.muted.foreground.value};
    }

    & :is(h1, h2, h3, h4, h5, h6):hover a.anchor {
        opacity: 1;
    }

    & pre {
        ${colorCss(blogColors.code)}
        padding: 12px 16px;
        border-radius: 6px;
        overflow-x: auto;
    }

    & code {
        font-family: ${viraFontCssVars['vira-monospace'].value};
        font-size: 1.05em;
    }

    & :not(pre) > code {
        ${colorCss(blogColors.code)}
        padding: 2px 6px;
        border-radius: 3px;
    }

    & blockquote {
        border-left: 4px solid ${blogColors.quoteBar.foreground.value};
        color: ${blogColors.muted.foreground.value};
        padding-left: 12px;
        margin-left: 0;
    }

    & img {
        max-width: 100%;
        height: auto;
    }
`;
