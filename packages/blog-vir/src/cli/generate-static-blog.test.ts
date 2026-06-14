import {readAllDirContents} from '@augment-vir/node';
import {assertSnapshot, describe, it} from '@augment-vir/test';
import {rm} from 'node:fs/promises';
import {testFileGeneratedBlogDirPath, testFilePostsDirPath} from '../data/file-paths.mock.js';
import {generateStaticBlog} from './generate-static-blog.js';

describe(generateStaticBlog.name, () => {
    it('generates static blog files from markdown fixtures', async (testContext) => {
        await rm(testFileGeneratedBlogDirPath, {
            force: true,
            recursive: true,
        });

        await generateStaticBlog({
            postsDir: testFilePostsDirPath,
            staticDir: testFileGeneratedBlogDirPath,
        });

        await assertSnapshot(
            testContext,
            await readAllDirContents(testFileGeneratedBlogDirPath, {
                recursive: true,
            }),
        );
    });
});
