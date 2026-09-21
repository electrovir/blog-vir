import {assert, assertWrap} from '@augment-vir/assert';
import {applyBrand} from '@augment-vir/common';
import {describe, it, testWeb} from '@augment-vir/test';
import {html} from 'element-vir';
import {parseUrl} from 'url-vir';
import {ViraLink} from 'vira';
import {type BlogPost, type RawHtml} from '../../data/blog-post.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {createBlogRouter} from '../routing/blog-router.js';
import {VirBlogPost} from './vir-blog-post.element.js';
import {VirBlogTableOfContents} from './vir-blog-table-of-contents.element.js';

const testPost: BlogPost = {
    postSlug: 'example-post',
    postTitle: 'Example post',
    postDate: '2024-01-01T00:00:00.000Z',
    tags: [],
    postBlurb: applyBrand<RawHtml>(''),
    isTruncated: false,
    postContentHtml: applyBrand<RawHtml>('<h2 id="target-heading">Target heading</h2>\n'),
    postHeadings: [
        {
            headingLevel: 2,
            headingTitle: 'Target heading',
            headingUrlAnchor: 'target-heading',
        },
    ],
};

describe(VirBlogPost.tagName, () => {
    it('scrolls to a hash heading after the post loads and renders a table of contents link', async () => {
        const postLoad = Promise.withResolvers<BlogPost>();
        const scrolledHeading = Promise.withResolvers<string>();
        const router = createBlogRouter();
        const originalScrollIntoView = Object.getOwnPropertyDescriptor(
            HTMLElement.prototype,
            'scrollIntoView',
        );

        class TestBlogDataClient extends BlogDataClient {
            public override fetchPost() {
                return postLoad.promise;
            }
        }

        HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
            scrolledHeading.resolve(this.id);
        };

        try {
            const frontendState: FrontendState = {
                router,
                dataClient: new TestBlogDataClient(),
                currentRoute: {
                    paths: blogPathTree.paths.children.post.children[':slug'].fill(
                        testPost.postSlug,
                    ).fullPaths,
                    search: undefined,
                    hash: testPost.postHeadings[0]?.headingUrlAnchor,
                },
            };
            const element = await testWeb.render(html`
                <${VirBlogPost.assign({
                    frontendState,
                    slug: testPost.postSlug,
                })}></${VirBlogPost}>
            `);
            assert.instanceOf(element, VirBlogPost);

            postLoad.resolve(testPost);
            assert.strictEquals(
                await scrolledHeading.promise,
                assertWrap.isDefined(testPost.postHeadings[0]).headingUrlAnchor,
            );

            const tableOfContents = assertWrap.instanceOf(
                element.shadowRoot.querySelector(VirBlogTableOfContents.tagName),
                VirBlogTableOfContents,
            );
            const tableOfContentsLink = assertWrap.isDefined(
                tableOfContents.shadowRoot.querySelector(`${ViraLink.tagName}.link`),
            );
            const anchor = assertWrap.isDefined(tableOfContentsLink.shadowRoot?.querySelector('a'));
            const tableOfContentsUrl = parseUrl(anchor.href);
            assert.deepEquals(
                {
                    hash: tableOfContentsUrl.hash,
                    pathname: tableOfContentsUrl.pathname,
                },
                {
                    hash: '#target-heading',
                    pathname: '/post/example-post',
                },
            );
        } finally {
            if (originalScrollIntoView) {
                Object.defineProperty(
                    HTMLElement.prototype,
                    'scrollIntoView',
                    originalScrollIntoView,
                );
            } else {
                Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
            }
            router.destroy();
        }
    });
});
