import {assert, assertWrap, waitUntil} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {ViraInput, ViraLink, ViraPopUpTrigger} from 'vira';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {createBlogRouter} from '../routing/blog-router.js';
import {VirBlogSearch} from './vir-blog-search.element.js';

class TestBlogDataClient extends BlogDataClient {
    public override fetchSearchIndex() {
        return Promise.resolve([
            {
                postSlug: 'search-result',
                postTitle: 'Search result',
                headingTitle: 'Search result',
                headingUrlAnchor: '',
                sectionText: 'Searchable text.',
            },
            {
                postSlug: 'search-result',
                postTitle: 'Search result',
                headingTitle: 'Search heading',
                headingUrlAnchor: 'search-heading',
                sectionText: 'Searchable heading text.',
            },
        ]);
    }
}

describe(VirBlogSearch.tagName, () => {
    it('opens and closes its results with ViraPopUpTrigger', async () => {
        const router = createBlogRouter();
        const element = await testWeb.renderElement(VirBlogSearch, {
            frontendState: {
                router,
                dataClient: new TestBlogDataClient(),
                currentRoute: router.readCurrentRoute(),
            },
        });
        const shadowRoot = assertWrap.isDefined(element.shadowRoot, 'element has no shadow root');
        const popUpTrigger = shadowRoot.querySelector(ViraPopUpTrigger.tagName);
        assert.instanceOf(popUpTrigger, ViraPopUpTrigger);
        const input = shadowRoot.querySelector(ViraInput.tagName);
        assert.instanceOf(input, ViraInput);
        assert.strictEquals(input.slot, ViraPopUpTrigger.slotNames['vira-pop-up-trigger-trigger']);

        await testWeb.click(input);
        await testWeb.typeText('search');

        const dropdown = await waitUntil.isDefined(() => shadowRoot.querySelector('.dropdown'));
        assert.strictEquals(
            dropdown.slot,
            ViraPopUpTrigger.slotNames['vira-pop-up-trigger-pop-up'],
        );
        const result = await waitUntil.isDefined(() => dropdown.querySelector('.result'));
        assert.instanceOf(result, ViraLink);
        assert.deepEquals(
            {
                inputTextAlign: getComputedStyle(input).textAlign,
                dropdownTextAlign: getComputedStyle(dropdown).textAlign,
                hasHorizontalOverflow: dropdown.scrollWidth > dropdown.clientWidth,
            },
            {
                inputTextAlign: 'left',
                dropdownTextAlign: 'left',
                hasHorizontalOverflow: false,
            },
        );
        const triggerButton = assertWrap.instanceOf(
            popUpTrigger.shadowRoot.querySelector('.dropdown-wrapper'),
            HTMLButtonElement,
        );
        await waitUntil.isTrue(() => triggerButton.getAttribute('aria-expanded') === 'true');

        document.dispatchEvent(
            new KeyboardEvent('keydown', {
                code: 'Escape',
                bubbles: true,
            }),
        );
        await waitUntil.isTrue(() => triggerButton.getAttribute('aria-expanded') === 'false');
    });
});
