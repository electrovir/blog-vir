import {describe, itCases} from '@augment-vir/test';
import {createUtcIsoString} from 'date-vir';
import {compareBlogPostsNewestFirst, type BlogPost} from './blog-post.js';

function sortBlogPostSlugs(
    blogPosts: ReadonlyArray<Readonly<Pick<BlogPost, 'postDate' | 'postSlug'>>>,
) {
    return blogPosts
        .toSorted((firstBlogPost, secondBlogPost) => {
            return compareBlogPostsNewestFirst({
                firstBlogPost,
                secondBlogPost,
            });
        })
        .map((blogPost) => blogPost.postSlug);
}

describe(compareBlogPostsNewestFirst.name, () => {
    itCases(sortBlogPostSlugs, [
        {
            it: 'orders posts with equal dates by descending slug',
            input: [
                {
                    postDate: createUtcIsoString('2026-01-03'),
                    postSlug: 'newer-post',
                },
                {
                    postDate: createUtcIsoString('2026-01-02'),
                    postSlug: '2026-01-02-stream-s3-file-server-to-server',
                },
                {
                    postDate: createUtcIsoString('2026-01-02'),
                    postSlug: '2026-01-02-T02-linux-vm-for-ai',
                },
                {
                    postDate: createUtcIsoString('2026-01-02'),
                    postSlug: '2026-01-02-T03-disable-npm-install-scripts',
                },
            ],
            expect: [
                'newer-post',
                '2026-01-02-T03-disable-npm-install-scripts',
                '2026-01-02-T02-linux-vm-for-ai',
                '2026-01-02-stream-s3-file-server-to-server',
            ],
        },
    ]);
});
