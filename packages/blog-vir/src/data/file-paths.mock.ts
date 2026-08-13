import {assert} from '@augment-vir/assert';
import {existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

export const monoRepoRootDirPath = resolve(import.meta.dirname, '..', '..', '..', '..');
export const testFilesDirPath = join(monoRepoRootDirPath, 'packages', 'blog-vir', 'test-files');
export const testFileGeneratedBlogDirPath = join(testFilesDirPath, 'generated-blog');
export const testFilePostsDirPath = join(testFilesDirPath, 'posts');
export const testFileJsonUnsafeTagGeneratedBlogDirPath = join(
    testFilesDirPath,
    'json-unsafe-tag-generated-blog',
);
export const testFileJsonUnsafeTagPostsDirPath = join(testFilesDirPath, 'json-unsafe-tag-posts');
export const testFileUnsafeTagGeneratedBlogDirPath = join(
    testFilesDirPath,
    'unsafe-tag-generated-blog',
);
export const testFileUnsafeTagPostsDirPath = join(testFilesDirPath, 'unsafe-tag-posts');

const filePathsThatShouldExist = [
    monoRepoRootDirPath,
    testFilesDirPath,
    testFileJsonUnsafeTagPostsDirPath,
    testFilePostsDirPath,
    testFileUnsafeTagPostsDirPath,
];

filePathsThatShouldExist.forEach((filePathThatShouldExist) => {
    assert.isTrue(existsSync(filePathThatShouldExist));
});
