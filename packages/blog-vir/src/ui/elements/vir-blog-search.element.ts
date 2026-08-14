import {assertWrap} from '@augment-vir/assert';
import {type PartialWithUndefined} from '@augment-vir/common';
import {asyncProp, css, defineElement, html, listen, renderAsync} from 'element-vir';
import {
    HorizontalAnchor,
    MagnifyingGlass24Icon,
    ViraError,
    viraFontCssVars,
    viraFormCssVars,
    ViraInput,
    ViraLink,
    ViraPopUpTrigger,
    viraShadows,
    viraTheme,
} from 'vira';
import {type BlogPostSectionSearchEntry} from '../../data/blog-post.js';
import {type FrontendState} from '../frontend-state/frontend-state.js';
import {type BlogDataClient} from '../routing/blog-data-client.js';
import {blogPathTree} from '../routing/blog-route.js';
import {type BlogRouter} from '../routing/blog-router.js';

const maxResults = 30;

type BlogSearchResultGroup = {
    postSlug: string;
    postTitle: string;
    /** Matched headings within this post, in index order. Empty when only the post title matched. */
    headings: {
        headingTitle: string;
        headingUrlAnchor: string;
    }[];
};

/**
 * A search box whose results appear in a pop-up anchored under the input.
 *
 * @category Internal
 */
export const VirBlogSearch = defineElement<{
    frontendState: Readonly<FrontendState>;
}>()({
    tagName: 'vir-blog-search',
    styles: css`
        :host {
            display: block;
        }

        ${ViraPopUpTrigger} {
            width: 100%;

            & ${ViraInput} {
                width: 100%;
                text-align: left;
            }

            & .dropdown {
                padding: 8px 4px;
                padding-right: 16px;
                box-sizing: border-box;
                max-height: 80vh;
                overflow-y: auto;
                overscroll-behavior: contain;
                border-radius: ${viraFormCssVars['vira-form-radius'].value};
                border: 1px solid ${viraFormCssVars['vira-form-border-color'].value};
                background-color: ${viraFormCssVars['vira-form-background-color'].value};
                color: ${viraFormCssVars['vira-form-foreground-color'].value};
                text-align: left;
                ${viraShadows.menuShadow}

                & .results {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;

                    & .group {
                        display: flex;
                        flex-direction: column;

                        & .group-headings {
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            padding-left: 6px;
                            margin-left: 12px;
                            border-left: 2px solid
                                ${viraTheme.colors['vira-grey-foreground-decoration'].foreground
                                    .value};
                        }

                        & .result {
                            box-sizing: border-box;
                            display: block;
                            padding: 6px 8px;
                            border-radius: 4px;
                            color: inherit;
                            text-decoration: none;

                            &:hover {
                                background-color: ${viraTheme.colors[
                                    'vira-grey-behind-fg-small-body'
                                ].background.value};
                            }

                            & .post-title {
                                font-weight: ${viraFontCssVars['vira-font-weight-bold'].value};
                            }

                            & .heading-title {
                                color: ${viraTheme.colors['vira-grey-foreground-body'].foreground
                                    .value};
                                font-size: 0.9em;
                            }
                        }
                    }
                }

                & .placeholder {
                    color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground.value};
                    padding: 16px;
                }
            }
        }
    `,
    state() {
        return {
            searchIndex: asyncProp({
                async updateCallback(client: BlogDataClient) {
                    return await client.fetchSearchIndex();
                },
            }),
            searchQuery: '',
        };
    },
    render({inputs, state, updateState}) {
        state.searchIndex.update(inputs.frontendState.dataClient);
        const trimmedQuery = state.searchQuery.trim();

        return html`
            <${ViraPopUpTrigger.assign({
                horizontalAnchor: HorizontalAnchor.Right,
                popUpOffset: {
                    vertical: 4,
                },
            })}
                ${listen(ViraPopUpTrigger.events.openChange, (event) => {
                    if (!event.detail) {
                        updateState({
                            searchQuery: '',
                        });
                    }
                })}
            >
                <${ViraInput.assign({
                    value: state.searchQuery,
                    placeholder: 'Search posts',
                    icon: MagnifyingGlass24Icon,
                    showClearButton: true,
                })}
                    slot=${ViraPopUpTrigger.slotNames['vira-pop-up-trigger-trigger']}
                    ${listen(ViraInput.events.valueChange, (event) => {
                        updateState({
                            searchQuery: event.detail,
                        });
                    })}
                ></${ViraInput}>
                ${trimmedQuery
                    ? html`
                          <div
                              class="dropdown"
                              slot=${ViraPopUpTrigger.slotNames['vira-pop-up-trigger-pop-up']}
                          >
                              ${renderAsync(
                                  state.searchIndex,
                                  html`
                                      <div class="placeholder">Loading search index.</div>
                                  `,
                                  (searchIndex) => {
                                      return renderResults({
                                          searchIndex,
                                          query: trimmedQuery,
                                          router: inputs.frontendState.router,
                                          closeDropdown() {
                                              updateState({
                                                  searchQuery: '',
                                              });
                                          },
                                      });
                                  },
                                  (error) => {
                                      return html`
                                          <${ViraError}>${error.message}</${ViraError}>
                                      `;
                                  },
                              )}
                          </div>
                      `
                    : ''}
            </${ViraPopUpTrigger}>
        `;
    },
});

function renderResults({
    searchIndex,
    query,
    router,
    closeDropdown,
}: Readonly<{
    searchIndex: ReadonlyArray<BlogPostSectionSearchEntry>;
    query: string;
    router: BlogRouter;
    closeDropdown: () => void;
}>) {
    if (!query) {
        return '';
    }
    const groups = groupSearchMatches(scoreSearchIndex(searchIndex, query));
    if (!groups.length) {
        return html`
            <div class="placeholder">No matches.</div>
        `;
    }
    return html`
        <div class="results">
            ${groups.map((group) => {
                return html`
                    <div class="group">
                        ${renderResult({
                            group,
                            router,
                            closeDropdown,
                        })}
                        ${group.headings.length
                            ? html`
                                  <div class="group-headings">
                                      ${group.headings.map((heading) => {
                                          return renderResult({
                                              group,
                                              heading,
                                              router,
                                              closeDropdown,
                                          });
                                      })}
                                  </div>
                              `
                            : ''}
                    </div>
                `;
            })}
        </div>
    `;
}

function renderResult({
    group,
    heading,
    router,
    closeDropdown,
}: Readonly<{
    group: Readonly<BlogSearchResultGroup>;
    router: BlogRouter;
    closeDropdown: () => void;
}> &
    PartialWithUndefined<{
        /** Omit to link to the top of the post itself. */
        heading: Readonly<BlogSearchResultGroup['headings'][number]>;
    }>) {
    const route = {
        paths: blogPathTree.paths.children.post.children[':slug'].fill(group.postSlug).fullPaths,
        hash: heading?.headingUrlAnchor,
    };
    return html`
        <${ViraLink.assign({
            link: {
                url: router.createRouteUrl(route).url,
                newTab: false,
            },
            disableLinkStyles: true,
        })}
            class="result"
            ${listen('click', (event) => {
                if (!router.setRouteOnDirectNavigation(route, event)) {
                    return;
                }
                closeDropdown();
                if (heading) {
                    window.requestAnimationFrame(() => {
                        document.getElementById(heading.headingUrlAnchor)?.scrollIntoView({
                            behavior: 'smooth',
                        });
                    });
                }
            })}
        >
            ${heading
                ? html`
                      <div class="heading-title">${heading.headingTitle}</div>
                  `
                : html`
                      <div class="post-title">${group.postTitle}</div>
                  `}
        </${ViraLink}>
    `;
}

/**
 * Collapses the flat, per-section match list into one group per post: the post itself plus an entry
 * for each of its matched headings. Groups keep the order of their best-scoring section, and the
 * `maxResults` cap counts rendered entries (post entry included) rather than sections.
 */
function groupSearchMatches(
    matches: ReadonlyArray<{doc: BlogPostSectionSearchEntry}>,
): BlogSearchResultGroup[] {
    const orderedSlugs = matches
        .map(({doc}) => doc.postSlug)
        .filter((postSlug, index, allSlugs) => allSlugs.indexOf(postSlug) === index);

    return orderedSlugs
        .map((postSlug): BlogSearchResultGroup => {
            const postMatches = matches.filter((match) => match.doc.postSlug === postSlug);
            return {
                postSlug,
                postTitle: assertWrap.isDefined(postMatches[0]).doc.postTitle,
                headings: postMatches
                    .filter(({doc}) => {
                        return (
                            doc.headingUrlAnchor &&
                            doc.headingTitle &&
                            doc.headingTitle !== doc.postTitle
                        );
                    })
                    .map(({doc}) => {
                        return {
                            headingTitle: doc.headingTitle,
                            headingUrlAnchor: doc.headingUrlAnchor,
                        };
                    }),
            };
        })
        .reduce<BlogSearchResultGroup[]>((accum, group) => {
            const usedEntryCount = accum.reduce((count, {headings}) => {
                return count + headings.length + 1;
            }, 0);
            if (usedEntryCount >= maxResults) {
                return accum;
            }
            return [
                ...accum,
                {
                    ...group,
                    headings: group.headings.slice(0, maxResults - usedEntryCount - 1),
                },
            ];
        }, []);
}

function scoreSearchIndex(
    searchIndex: ReadonlyArray<BlogPostSectionSearchEntry>,
    query: string,
): {doc: BlogPostSectionSearchEntry; score: number}[] {
    const lowerQuery = query.toLowerCase();
    const tokens = lowerQuery.split(/\s+/).filter(Boolean);
    if (!tokens.length) {
        return [];
    }
    const scored: {doc: BlogPostSectionSearchEntry; score: number}[] = [];
    searchIndex.forEach((doc) => {
        const title = doc.postTitle.toLowerCase();
        const section = doc.headingTitle.toLowerCase();
        const text = doc.sectionText.toLowerCase();
        let score = 0;
        tokens.forEach((token) => {
            if (title.includes(token)) {
                score += 5;
            }
            if (section.includes(token)) {
                score += 3;
            }
            if (text.includes(token)) {
                score += 1;
            }
        });
        if (score > 0) {
            scored.push({
                doc,
                score,
            });
        }
    });
    return scored.toSorted((a, b) => b.score - a.score);
}
