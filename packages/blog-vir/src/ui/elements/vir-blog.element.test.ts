import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {html, listen} from 'element-vir';
import {ViraLink} from 'vira';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {VirBlogLink} from './vir-blog-link.element.js';
import {VirBlog} from './vir-blog.element.js';

class TestBlogDataClient extends BlogDataClient {
    public override fetchPostPage(pageNumber: number) {
        return Promise.resolve({
            pageNumber,
            pageCount: 1,
            posts: [],
        });
    }

    public override fetchAllPosts() {
        return Promise.resolve([]);
    }

    public override fetchSearchIndex() {
        return Promise.resolve([]);
    }
}

describe(VirBlog.tagName, () => {
    it('emits frontend state updates', async () => {
        const frontendStateUpdate = Promise.withResolvers<FrontendState>();
        const element = await testWeb.render(html`
            <${VirBlog.assign({
                dataClient: new TestBlogDataClient(),
            })}
                ${listen(VirBlog.events.frontendStateUpdate, (event) => {
                    if (
                        event.detail.currentRoute.paths[0] ===
                        blogPathTree.paths.children.history.path
                    ) {
                        frontendStateUpdate.resolve(event.detail);
                    }
                })}
            ></${VirBlog}>
        `);
        assert.instanceOf(element, VirBlog);

        const historyLink = assertWrap.isDefined(
            element.shadowRoot.querySelectorAll(VirBlogLink.tagName)[1],
        );
        const viraLink = assertWrap
            .isDefined(historyLink.shadowRoot)
            .querySelector(ViraLink.tagName);
        assert.instanceOf(viraLink, ViraLink);
        await testWeb.click(viraLink);

        const emittedFrontendState = await frontendStateUpdate.promise;
        assert.deepEquals(emittedFrontendState.currentRoute.paths, [
            blogPathTree.paths.children.history.path,
        ]);
    });
});
