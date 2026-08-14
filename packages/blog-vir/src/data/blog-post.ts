import {type Branded} from '@augment-vir/common';
import {utcIsoStringShape} from 'date-vir';
import {
    defineShape,
    nonEmptyStringShape,
    pickShape,
    recordShape,
    typedStringShape,
} from 'object-shape-tester';

/**
 * Pre-rendered HTML that is safe to insert into a blog page.
 *
 * @category Internal
 */
export type RawHtml = Branded<string, 'raw-html-string'>;

/**
 * Runtime shape for {@link RawHtml}.
 *
 * @category Internal
 */
export const rawHtmlShape = typedStringShape<RawHtml>();

/**
 * Runtime shape for {@link BlogPostHeading}.
 *
 * @category Internal
 */
export const blogPostHeadingShape = defineShape({
    headingLevel: 0,
    headingTitle: '',
    headingUrlAnchor: '',
});

/**
 * A heading parsed out of a post's body. Used for anchored search results.
 *
 * @category Internal
 */
export type BlogPostHeading = (typeof blogPostHeadingShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogPost}.
 *
 * @category Internal
 */
export const blogPostShape = defineShape({
    postSlug: nonEmptyStringShape(),
    postTitle: nonEmptyStringShape(),
    tags: [nonEmptyStringShape()],
    postDate: utcIsoStringShape(),
    postBlurb: rawHtmlShape,
    isTruncated: false,
    postContentHtml: rawHtmlShape,
    postHeadings: [blogPostHeadingShape],
});

/**
 * A fully rendered blog post, including its HTML body.
 *
 * @category Internal
 */
export type BlogPost = (typeof blogPostShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogPostListing}.
 *
 * @category Internal
 */
export const blogPostListingShape = pickShape(blogPostShape, {
    postSlug: true,
    postTitle: true,
    tags: true,
    postBlurb: true,
    isTruncated: true,
    postDate: true,
});

/**
 * Post metadata and preview content shown on a post-list page.
 *
 * @category Internal
 */
export type BlogPostListing = (typeof blogPostListingShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogPostSectionSearchEntry}.
 *
 * @category Internal
 */
export const blogPostSectionSearchEntryShape = defineShape({
    postSlug: nonEmptyStringShape(),
    postTitle: nonEmptyStringShape(),
    headingTitle: '',
    headingUrlAnchor: '',
    sectionText: '',
});

/**
 * A search index entry. Kept small so a single JSON file is fast to load.
 *
 * @category Internal
 */
export type BlogPostSectionSearchEntry = (typeof blogPostSectionSearchEntryShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogSearchIndex}.
 *
 * @category Internal
 */
export const blogSearchIndexShape = defineShape([blogPostSectionSearchEntryShape]);

/**
 * The complete search index JSON file shape.
 *
 * @category Internal
 */
export type BlogSearchIndex = (typeof blogSearchIndexShape)['runtimeType'];

/**
 * Runtime shape for {@link AllBlogPostsEntry}.
 *
 * @category Internal
 */
export const allBlogPostsEntryShape = pickShape(blogPostShape, {
    postSlug: true,
    postTitle: true,
    postDate: true,
});

/**
 * Minimal post metadata used by the complete post index and history page.
 *
 * @category Internal
 */
export type AllBlogPostsEntry = (typeof allBlogPostsEntryShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogAllPosts}.
 *
 * @category Internal
 */
export const blogAllPostsShape = defineShape([allBlogPostsEntryShape]);

/**
 * The complete all-posts JSON file shape.
 *
 * @category Internal
 */
export type BlogAllPosts = (typeof blogAllPostsShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogTags}.
 *
 * @category Internal
 */
export const blogTagsShape = recordShape({
    keys: nonEmptyStringShape(),
    values: 0,
});

/**
 * The complete tag count JSON file shape.
 *
 * @category Internal
 */
export type BlogTags = (typeof blogTagsShape)['runtimeType'];

/**
 * Runtime shape for {@link BlogPostPage}.
 *
 * @category Internal
 */
export const blogPostPageShape = defineShape({
    pageNumber: 0,
    pageCount: 0,
    posts: [blogPostListingShape],
});

/**
 * A generated page of blog post metadata.
 *
 * @category Internal
 */
export type BlogPostPage = (typeof blogPostPageShape)['runtimeType'];

/**
 * Runtime shape for an ordered list of post slugs.
 *
 * @category Internal
 */
export const blogPostSlugsShape = defineShape([nonEmptyStringShape()]);
