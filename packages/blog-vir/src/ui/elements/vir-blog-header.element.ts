import {colorCss} from '@electrovir/color';
import {css, defineElement, html, testId} from 'element-vir';
import {themeDefaultKey} from 'theme-vir';
import {viraFontCssVars, viraTheme} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {blogPathTree} from '../routing/blog-route.js';
import {blogFontSizes} from '../util/shared-styles.js';
import {VirBlogLink} from './vir-blog-link.element.js';

const headerResizeObservers = new WeakMap<HTMLElement, ResizeObserver>();

/**
 * Responsive header used by VirBlog.
 *
 * @category Internal
 */
export const VirBlogHeader = defineElement<{
    frontendState: Readonly<FrontendState>;
}>()({
    tagName: 'vir-blog-header',
    state() {
        return {
            isWrapped: false,
        };
    },
    hostClasses: {
        'vir-blog-header-wrapped': ({state}) => state.isWrapped,
    },
    slotNames: [
        'vir-blog-header-brand',
        'vir-blog-header-nav',
        'vir-blog-header-right',
    ],
    testIds: [
        'vir-blog-header-left',
        'vir-blog-header-right',
    ],
    styles: ({hostClasses}) => {
        return css`
            /*
           The header itself is transparent so page content scrolls visibly through the gap between
           its two filled sides, and the transparent area passes clicks through to that content.
        */
            :host {
                position: sticky;
                top: 0;
                z-index: 100;
                display: flex;
                flex-wrap: wrap;
                align-items: stretch;
                justify-content: space-between;
                pointer-events: none;
            }

            ${hostClasses['vir-blog-header-wrapped'].selector} {
                position: static;
            }

            .left,
            .right {
                ${colorCss(viraTheme.colors[themeDefaultKey])}
                display: flex;
                flex-shrink: 0;
                align-items: center;
                padding: 12px 24px;
                pointer-events: auto;
            }

            .left {
                gap: 16px;

                & .brand {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: ${viraFontCssVars['vira-font-weight-bold'].value};
                    font-size: ${blogFontSizes.headerBrand};
                }

                & .nav {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
            }

            .right {
                gap: 12px;
            }
        `;
    },
    init({host, state, updateState}) {
        const resizeObserver = new ResizeObserver(() => {
            const left = host.shadowRoot.querySelector('.left');
            const right = host.shadowRoot.querySelector('.right');
            if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) {
                return;
            }

            const isWrapped = left.offsetTop !== right.offsetTop;
            if (isWrapped !== state.isWrapped) {
                updateState({
                    isWrapped,
                });
            }
        });
        resizeObserver.observe(host);
        headerResizeObservers.set(host, resizeObserver);
    },
    cleanup({host}) {
        headerResizeObservers.get(host)?.disconnect();
        headerResizeObservers.delete(host);
    },
    render({inputs, slotNames, testIds}) {
        return html`
            <div class="left" ${testId(testIds['vir-blog-header-left'])}>
                <${VirBlogLink.assign({
                    router: inputs.frontendState.router,
                    route: {
                        paths: blogPathTree.paths.fullPaths,
                    },
                    underlineOnHover: false,
                })}
                    class="brand"
                >
                    <slot name=${slotNames['vir-blog-header-brand']}></slot>
                </${VirBlogLink}>
                <nav class="nav">
                    <slot name=${slotNames['vir-blog-header-nav']}></slot>
                </nav>
            </div>
            <div class="right" ${testId(testIds['vir-blog-header-right'])}>
                <slot name=${slotNames['vir-blog-header-right']}></slot>
            </div>
        `;
    },
});
