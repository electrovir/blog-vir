import {type Branded, type SelectFrom} from '@augment-vir/common';
import {type UtcIsoString} from 'date-vir';

/** Frontmatter that a blog post markdown file may define. */
export const blogPostPageSize = 20;

export type RawHtml = Branded<string, 'raw-html-string'>;

/** A heading parsed out of a post's body. Used for anchored search results. */
export type BlogPostHeading = {
    headingLevel: number;
    headingTitle: string;
    headingUrlAnchor: string;
};

/** A fully rendered blog post, including its HTML body. */
export type BlogPost = {
    postSlug: string;
    postTitle: string;
    tags: string[];
    postDate: UtcIsoString;
    /**
     * Pre-truncation excerpt (HTML) to show on post list pages. Undefined when the post has no
     * `<!--truncate-->` marker, i.e. the blurb would equal the entire post body.
     */
    postBlurb?: RawHtml | undefined;
    /** The pre-rendered HTML for the full post body. */
    postContentHtml: RawHtml;
    /** Headings found in the post body, in document order. */
    postHeadings: BlogPostHeading[];
};

export type BlogPostListing = SelectFrom<
    BlogPost,
    {
        postSlug: true;
        postTitle: true;
        tags: true;
        postBlurb: true;
        postDate: true;
    }
>;

/** A search index entry. Kept small so a single JSON file is fast to load. */
export type BlogPostSectionSearchEntry = SelectFrom<
    BlogPost,
    {
        postSlug: true;
        postTitle: true;
    }
> &
    SelectFrom<
        BlogPostHeading,
        {
            headingTitle: true;
            headingUrlAnchor: true;
        }
    > & {
        /** Plain-text text from the section, used for full-text matching. */
        sectionText: string;
    };

/** The complete search index JSON file shape. */
export type BlogSearchIndex = BlogPostSectionSearchEntry[];

export type AllBlogPostsEntry = SelectFrom<
    BlogPost,
    {
        postSlug: true;
        postTitle: true;
        postDate: true;
    }
>;

/** The complete all-posts JSON file shape. */
export type BlogAllPosts = AllBlogPostsEntry[];

/** The complete tag count JSON file shape. */
export type BlogTags = {[TagName in string]: number};

/** A generated page of blog post metadata. */
export type BlogPostPage = {
    /** 1-indexed page number. */
    pageNumber: number;
    /** Total generated post-list pages. */
    pageCount: number;
    /** Post metadata for this page, sorted descending by date. */
    posts: ReadonlyArray<BlogPostListing>;
};
