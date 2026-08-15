import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {
    createUtcFullDate,
    toUtcIsoString,
    utcTimezone,
    zeroDate,
    type DayOfMonth,
    type UtcIsoString,
} from 'date-vir';
import {mkdtemp, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseBlogPostFile} from './parse-blog-post.js';

function createTestDate(day: DayOfMonth): UtcIsoString {
    return toUtcIsoString({
        ...zeroDate,
        day,
        year: 2024,
        timezone: utcTimezone,
    });
}

async function useTempPostFile(
    {
        fileName,
        content,
    }: Readonly<{
        fileName: string;
        content: string;
    }>,
    callback: (tempFilePath: string) => Promise<void>,
): Promise<void> {
    const tempDirPath = await mkdtemp(join(tmpdir(), 'blog-vir-date-'));
    const tempFilePath = join(tempDirPath, fileName);
    await writeFile(tempFilePath, content);

    try {
        await callback(tempFilePath);
    } finally {
        await rm(tempDirPath, {
            force: true,
            recursive: true,
        });
    }
}

async function readFileCreationDate(filePath: string): Promise<UtcIsoString> {
    return toUtcIsoString(createUtcFullDate((await stat(filePath)).birthtime));
}

describe('blog post date resolution', () => {
    it('normalizes and deduplicates tags', async () => {
        await useTempPostFile(
            {
                fileName: '2024-01-01-tags.md',
                content: [
                    '---',
                    'title: Tags',
                    'tags: [TypeScript, typescript, Formatting Details]',
                    '---',
                    '',
                    'Post content.',
                ].join('\n'),
            },
            async (tempFilePath) => {
                assert.deepEquals((await parseBlogPostFile(tempFilePath)).post.tags, [
                    'typescript',
                    'formatting-details',
                ]);
            },
        );
    });

    it('prefers frontmatter dates', async () => {
        await useTempPostFile(
            {
                fileName: 'frontmatter-date.md',
                content: [
                    '---',
                    'title: Frontmatter Date',
                    'date: 2024-01-04',
                    '---',
                    '',
                    'Post content.',
                ].join('\n'),
            },
            async (tempFilePath) => {
                assert.strictEquals(
                    (await parseBlogPostFile(tempFilePath)).post.postDate,
                    createTestDate(4),
                );
            },
        );
    });

    it('prefers file-name dates over git add dates', async () => {
        await useTempPostFile(
            {
                fileName: '2024-01-03-slug-date.md',
                content: [
                    '---',
                    'title: Slug Date',
                    '---',
                    '',
                    'Post content.',
                ].join('\n'),
            },
            async (tempFilePath) => {
                assert.strictEquals(
                    (await parseBlogPostFile(tempFilePath)).post.postDate,
                    createTestDate(3),
                );
            },
        );
    });

    it('uses filesystem creation dates last', async () => {
        await useTempPostFile(
            {
                fileName: 'no-date.md',
                content: [
                    '---',
                    'title: Filesystem Date',
                    '---',
                    '',
                    'Post content.',
                ].join('\n'),
            },
            async (tempFilePath) => {
                assert.strictEquals(
                    (await parseBlogPostFile(tempFilePath)).post.postDate,
                    await readFileCreationDate(tempFilePath),
                );
            },
        );
    });
});
