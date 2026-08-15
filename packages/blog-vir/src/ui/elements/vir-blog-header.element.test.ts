import {assert, assertWrap, waitUntil} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {css, html, testIdSelector} from 'element-vir';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {createBlogRouter} from '../routing/blog-router.js';
import {VirBlogHeader} from './vir-blog-header.element.js';

describe(VirBlogHeader.tagName, () => {
    it('stops being sticky when the right side wraps below the left side', async () => {
        const router = createBlogRouter();
        const element = await testWeb.render(html`
            <${VirBlogHeader.assign({
                frontendState: {
                    router,
                    dataClient: new BlogDataClient(),
                    currentRoute: router.readCurrentRoute(),
                },
            })}
                style=${css`
                    width: 1px;
                `}
            >
                <span
                    slot=${VirBlogHeader.slotNames['vir-blog-header-brand']}
                    style=${css`
                        display: inline-block;
                        width: 200px;
                    `}
                >
                    Brand
                </span>
                <span
                    slot=${VirBlogHeader.slotNames['vir-blog-header-nav']}
                    style=${css`
                        display: inline-block;
                        width: 200px;
                    `}
                >
                    Navigation
                </span>
                <span
                    slot=${VirBlogHeader.slotNames['vir-blog-header-right']}
                    style=${css`
                        display: inline-block;
                        width: 200px;
                    `}
                >
                    Controls
                </span>
            </${VirBlogHeader}>
        `);
        assert.instanceOf(element, VirBlogHeader);
        const shadowRoot = assertWrap.isDefined(element.shadowRoot, 'element has no shadow root');
        const left = assertWrap.instanceOf(
            shadowRoot.querySelector(testIdSelector(VirBlogHeader.testIds['vir-blog-header-left'])),
            HTMLElement,
        );
        const right = assertWrap.instanceOf(
            shadowRoot.querySelector(
                testIdSelector(VirBlogHeader.testIds['vir-blog-header-right']),
            ),
            HTMLElement,
        );

        element.style.width = `${left.offsetWidth + right.offsetWidth + 1}px`;
        await waitUntil.isTrue(() => {
            return (
                left.offsetTop === right.offsetTop &&
                getComputedStyle(element).position === 'sticky'
            );
        });

        element.style.width = `${left.offsetWidth + right.offsetWidth - 1}px`;
        await waitUntil.isTrue(() => {
            return (
                left.offsetTop < right.offsetTop && getComputedStyle(element).position === 'static'
            );
        });
    });
});
