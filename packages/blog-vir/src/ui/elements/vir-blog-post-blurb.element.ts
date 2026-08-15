import {createUtcFullDate, utcTimezone} from 'date-vir';
import {css, defineElement, html, unsafeHTML} from 'element-vir';
import {ViraAbsoluteTime, viraFontCssVars, viraTheme} from 'vira';
import {type BlogPostListing} from '../../data/blog-post.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {blogPathTree} from '../routing/blog-route.js';
import {blogFontSizes, createBlogContentStyles} from '../util/shared-styles.js';
import {VirBlogLink} from './vir-blog-link.element.js';
import {VirBlogTagLink} from './vir-blog-tag-link.element.js';

/**
 * Post title, metadata, tags, and preview content for a post-list page.
 *
 * @category Internal
 */
export const VirBlogPostBlurb = defineElement<{
    frontendState: Readonly<FrontendState>;
    post: BlogPostListing;
}>()({
    tagName: 'vir-blog-post-blurb',
    styles: css`
        :host {
            display: block;
            padding: 16px 0;
            border-bottom: 1px solid
                ${viraTheme.colors['vira-grey-foreground-decoration'].foreground.value};
        }

        .title {
            display: inline-block;
            font-size: ${blogFontSizes.blurbTitle};
            font-weight: ${viraFontCssVars['vira-font-weight-bold'].value};
            color: ${viraTheme.colors['vira-brand-foreground-non-body'].foreground.value};
        }

        .blurb {
            ${createBlogContentStyles(blogFontSizes.blurbContentHeading)}
        }

        .read-more-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;

            & .read-more {
                color: ${viraTheme.colors['vira-brand-foreground-non-body'].foreground.value};
            }
        }

        .meta {
            display: flex;
            gap: 12px;
            align-items: center;
            font-size: ${blogFontSizes.blurbMetadata};
            color: ${viraTheme.colors['vira-grey-foreground-placeholder'].foreground.value};
            margin: 4px 0 8px;
        }

        .tag-list {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }
    `,
    render({inputs}) {
        const {post} = inputs;
        const postRoute = {
            paths: blogPathTree.paths.children.post.children[':slug'].fill(post.postSlug).fullPaths,
        };
        return html`
            <${VirBlogLink.assign({
                router: inputs.frontendState.router,
                route: postRoute,
                underlineOnHover: true,
            })}
                class="title"
            >
                ${post.postTitle}
            </${VirBlogLink}>
            <div class="meta">
                <${ViraAbsoluteTime.assign({
                    time: createUtcFullDate(post.postDate),
                    showDateOnly: true,
                    timezone: utcTimezone,
                })}></${ViraAbsoluteTime}>
            </div>
            ${post.tags.length
                ? html`
                      <div class="tag-list">
                          ${post.tags.map((tag) => {
                              return html`
                                  <${VirBlogTagLink.assign({
                                      frontendState: inputs.frontendState,
                                      tag,
                                      postCount: undefined,
                                      showHashPrefix: true,
                                  })}></${VirBlogTagLink}>
                              `;
                          })}
                      </div>
                  `
                : ''}
            <div class="blurb">${unsafeHTML(post.postBlurb)}</div>
            ${post.isTruncated
                ? html`
                      <div class="read-more-row">
                          <${VirBlogLink.assign({
                              router: inputs.frontendState.router,
                              route: postRoute,
                              underlineOnHover: true,
                          })}
                              class="read-more"
                          >
                              Read more
                          </${VirBlogLink}>
                      </div>
                  `
                : ''}
        `;
    },
});
