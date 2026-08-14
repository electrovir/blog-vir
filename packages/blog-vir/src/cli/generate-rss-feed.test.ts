import {assert} from '@augment-vir/assert';
import {applyBrand} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {createUtcIsoString} from 'date-vir';
import {type BlogPost, type RawHtml} from '../data/blog-post.js';
import {generateRssFeed} from './generate-rss-feed.js';

const testPost: BlogPost = {
    postSlug: 'post & one',
    postTitle: 'A <Post> & "More"',
    tags: [
        'TypeScript & XML',
    ],
    postDate: createUtcIsoString('2024-01-02'),
    postBlurb: applyBrand<RawHtml>('<p>Fish & chips.</p>'),
    isTruncated: false,
    postContentHtml: applyBrand<RawHtml>('<p>Fish & chips.</p>'),
    postHeadings: [],
};

describe(generateRssFeed.name, () => {
    it('generates escaped RSS with absolute post URLs', () => {
        assert.strictEquals(
            generateRssFeed({
                config: {
                    title: 'Example & Blog',
                    description: 'Posts <today>.',
                    siteUrl: 'https://example.com/blog/',
                },
                posts: [
                    testPost,
                ],
            }),
            `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Example &amp; Blog</title>
        <link>https://example.com/blog/</link>
        <description>Posts &lt;today&gt;.</description>
        <generator>blog-vir</generator>
        <lastBuildDate>Tue, 02 Jan 2024 00:00:00 GMT</lastBuildDate>
        <item>
            <title>A &lt;Post&gt; &amp; &quot;More&quot;</title>
            <link>https://example.com/blog/post/post%20%26%20one</link>
            <guid isPermaLink="true">https://example.com/blog/post/post%20%26%20one</guid>
            <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
            <description>&lt;p&gt;Fish &amp; chips.&lt;/p&gt;</description>
            <category>TypeScript &amp; XML</category>
        </item>
    </channel>
</rss>
`,
        );
    });

    it('rejects a site URL with a query', () => {
        assert.throws(
            () => {
                generateRssFeed({
                    config: {
                        title: 'Example Blog',
                        description: 'Example posts.',
                        siteUrl: 'https://example.com/blog/?preview=true',
                    },
                    posts: [],
                });
            },
            {
                matchMessage: 'RSS site URL cannot include a query or hash',
            },
        );
    });
});
