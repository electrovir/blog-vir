import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {join} from 'node:path';
import {testFilePostsDirPath} from '../data/file-paths.mock.js';
import {listMarkdownFiles} from './list-markdown-files.js';

describe(listMarkdownFiles.name, () => {
    it('lists sorted markdown files recursively', async () => {
        assert.deepEquals(await listMarkdownFiles(testFilePostsDirPath), [
            join(testFilePostsDirPath, '2024-01-01-root-post.md'),
            join(testFilePostsDirPath, 'nested', '2024-01-02-nested-post.md'),
        ]);
    });
});
