import {check} from '@augment-vir/assert';
import {
    applyBrand,
    ensureErrorAndPrependMessage,
    type PartialWithUndefined,
    type SelectFrom,
} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node';
import {createUtcFullDate, toUtcIsoString, type UtcIsoString} from 'date-vir';
import {marked} from 'marked';
import {readFile, stat} from 'node:fs/promises';
import {basename, dirname, extname, relative} from 'node:path';
import {type BlogPost, type BlogPostHeading, type RawHtml} from '../data/blog-post.js';
import {parseFileNameSlug} from './slug.js';

/** Marker used by some blog flavors (Docusaurus, Jekyll) to denote the cutoff for an excerpt. */

const truncateMarker = /<!--\s*truncate\s*-->/i;

function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function extractHeadings(rawContent: string): BlogPostHeading[] {
    const used = new Map<string, number>();

    return rawContent.split('\n').reduce<BlogPostHeading[]>((headings, line) => {
        const heading = isHeadingLine(line);
        if (!heading) {
            return headings;
        }
        const base =
            slugifyHeading(heading.title) ||
            [
                'heading-',
                String(heading.level),
            ].join('');
        const count = used.get(base) || 0;
        used.set(base, count + 1);
        const anchor = count
            ? [
                  base,
                  '-',
                  String(count),
              ].join('')
            : base;
        return [
            ...headings,
            {
                headingLevel: heading.level,
                headingTitle: heading.title,
                headingUrlAnchor: anchor,
            },
        ];
    }, []);
}

function stripHtml(input: string): string {
    return (
        input
            // eslint-disable-next-line sonarjs/slow-regex
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')

            .replace(/\s+/g, ' ')
            .trim()
    );
}

/**
 * The blurb is the rendered post HTML up to the `<!--truncate-->` marker. When there is no marker,
 * the blurb would equal the entire post body, so it is left undefined instead.
 */
function deriveBlurb(contentHtml: RawHtml): RawHtml | undefined {
    const segments = contentHtml.split(truncateMarker);
    if (segments.length < 2) {
        return undefined;
    }
    return applyBrand<RawHtml>(segments[0] ?? '');
}

type BlogPostFrontmatter = {
    /** Required: post title. */
    title: string;
    /** Optional tags. */
    tags?: ReadonlyArray<string> | undefined;
    /**
     * Optional date string. If not provided, the date is parsed from the markdown file name (e.g.
     * `2024-05-27-my-post.md`).
     */
    date?: string | undefined;
    /** Optional one-line description used in meta tags. */
    description?: string | undefined;
};

export type BlogPostSection = SelectFrom<
    BlogPostHeading,
    {
        headingTitle: true;
        headingUrlAnchor: true;
    }
> & {
    /** Plain-text section body, used for full-text search matching. */
    sectionText: string;
};
type SectionAccumulator = {
    cursor: {
        headingUrlAnchor: string;
        headingTitle: string;
        lines: string[];
    };
    sections: BlogPostSection[];
    headingIndex: number;
};
type ParsedFrontmatter = PartialWithUndefined<BlogPostFrontmatter>;

function isHeadingLine(line: string): {level: number; title: string} | undefined {
    if (!line.startsWith('#')) {
        return undefined;
    }
    let depth = 0;
    while (depth < line.length && line[depth] === '#' && depth < 6) {
        depth += 1;
    }
    if (depth === 0 || line[depth] !== ' ') {
        return undefined;
    }
    return {
        level: depth,
        title: line.slice(depth + 1).trim(),
    };
}

function stripYamlQuotes(input: string): string {
    const trimmedInput = input.trim();
    return (
        trimmedInput.match(/^'(.*)'$/)?.[1] || trimmedInput.match(/^"(.*)"$/)?.[1] || trimmedInput
    );
}

function parseFrontmatterValue(value: string): string | string[] {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
        return trimmedValue.slice(1, -1).split(',').map(stripYamlQuotes).filter(check.isTruthy);
    }

    return stripYamlQuotes(trimmedValue);
}

function addFrontmatterEntry({
    frontmatter,
    key,
    value,
}: Readonly<{
    frontmatter: ParsedFrontmatter;
    key: string;
    value: string;
}>): ParsedFrontmatter {
    const parsedValue = parseFrontmatterValue(value);

    if (key === 'tags') {
        return {
            ...frontmatter,
            tags: check.isArray(parsedValue) ? parsedValue : [parsedValue],
        };
    } else if (key === 'title' && check.isString(parsedValue)) {
        return {
            ...frontmatter,
            title: parsedValue,
        };
    } else if (key === 'date' && check.isString(parsedValue)) {
        return {
            ...frontmatter,
            date: parsedValue,
        };
    } else if (key === 'description' && check.isString(parsedValue)) {
        return {
            ...frontmatter,
            description: parsedValue,
        };
    }

    return frontmatter;
}

function parseFrontmatter(rawText: string): {
    frontmatter: ParsedFrontmatter;
    rawContent: string;
} {
    const lines = rawText.split('\n');
    if (lines[0]?.trim() !== '---') {
        return {
            frontmatter: {},
            rawContent: rawText,
        };
    }

    const closingIndex = lines.slice(1).findIndex((line) => line.trim() === '---');
    if (closingIndex < 0) {
        return {
            frontmatter: {},
            rawContent: rawText,
        };
    }

    const frontmatterLines = lines.slice(1, closingIndex + 1);
    return {
        frontmatter: frontmatterLines.reduce<ParsedFrontmatter>((frontmatter, line) => {
            const [
                key,
                ...valueParts
            ] = line.split(':');
            if (!key || !valueParts.length) {
                return frontmatter;
            }

            return addFrontmatterEntry({
                frontmatter,
                key: key.trim(),
                value: valueParts.join(':').trim(),
            });
        }, {}),
        rawContent: lines.slice(closingIndex + 2).join('\n'),
    };
}

function splitSectionsByHeading({
    rawContent,
    headings,
}: Readonly<{
    rawContent: string;
    headings: ReadonlyArray<BlogPostHeading>;
}>): BlogPostSection[] {
    if (!headings.length) {
        return [
            {
                headingUrlAnchor: '',
                headingTitle: '',
                sectionText: stripHtml(rawContent),
            },
        ];
    }

    const lines = rawContent.split('\n');
    const initial: SectionAccumulator = {
        cursor: {
            headingUrlAnchor: '',
            headingTitle: '',
            lines: [],
        },
        sections: [],
        headingIndex: 0,
    };
    const final = lines.reduce<SectionAccumulator>((accumulator, line) => {
        const heading = isHeadingLine(line);
        if (!heading) {
            return {
                ...accumulator,
                cursor: {
                    ...accumulator.cursor,
                    lines: [
                        ...accumulator.cursor.lines,
                        line,
                    ],
                },
            };
        }
        const nextHeading = headings[accumulator.headingIndex];
        return {
            cursor: {
                headingUrlAnchor: nextHeading?.headingUrlAnchor || '',
                headingTitle: nextHeading?.headingTitle || heading.title,
                lines: [],
            },
            sections: [
                ...accumulator.sections,
                {
                    headingUrlAnchor: accumulator.cursor.headingUrlAnchor,
                    headingTitle: accumulator.cursor.headingTitle,
                    sectionText: stripHtml(accumulator.cursor.lines.join('\n')),
                },
            ],
            headingIndex: accumulator.headingIndex + 1,
        };
    }, initial);

    const closed: BlogPostSection[] = [
        ...final.sections,
        {
            headingUrlAnchor: final.cursor.headingUrlAnchor,
            headingTitle: final.cursor.headingTitle,
            sectionText: stripHtml(final.cursor.lines.join('\n')),
        },
    ];
    return closed.filter((section) => section.sectionText || section.headingTitle);
}

export type ParsedBlogPost = {
    post: BlogPost;
    /**
     * Section breakdown used to build the search index. Each entry corresponds to either the post
     * body before the first heading, or one heading section.
     */
    sections: ReadonlyArray<BlogPostSection>;
};

/** Read a single markdown file from disk and parse it into a {@link BlogPost}. */
export async function parseBlogPostFile(filePath: string): Promise<ParsedBlogPost> {
    const fileName = basename(filePath, extname(filePath));
    const slugInfo = parseFileNameSlug(fileName);
    const rawText = await readFile(filePath, 'utf8');

    const {frontmatter, rawContent} = parseFrontmatter(rawText);

    if (!frontmatter.title) {
        throw new Error(
            [
                'Blog post "',
                filePath,
                '" is missing a required "title" frontmatter field.',
            ].join(''),
        );
    }

    const headings = extractHeadings(rawContent);
    const contentHtml = applyBrand<RawHtml>(
        marked(rawContent, {
            async: false,
        }),
    );

    const tags = (frontmatter.tags || []).map((tag) => tag.trim()).filter(Boolean);

    const date = await resolveBlogPostDate({
        frontmatterDate: frontmatter.date,
        slugDate: slugInfo.date,
        filePath,
    });

    const blurb = deriveBlurb(contentHtml);

    const sections = splitSectionsByHeading({
        rawContent,
        headings,
    });

    return {
        post: {
            postSlug: slugInfo.slug,
            postTitle: frontmatter.title,
            tags,
            postDate: date,
            postBlurb: blurb,
            postContentHtml: contentHtml,
            postHeadings: headings,
        },
        sections,
    };
}

async function resolveBlogPostDate({
    frontmatterDate,
    slugDate,
    filePath,
}: Readonly<{
    frontmatterDate: string | undefined;
    slugDate: UtcIsoString | undefined;
    filePath: string;
}>): Promise<UtcIsoString> {
    if (frontmatterDate) {
        return toUtcIsoString(createUtcFullDate(frontmatterDate));
    } else if (slugDate) {
        return slugDate;
    }

    const gitAddedDate = await readGitFileAddDate(filePath);
    if (gitAddedDate) {
        return gitAddedDate;
    }

    return await readFileCreationDateFromFileSystem(filePath);
}

async function readGitFileAddDate(filePath: string): Promise<UtcIsoString | undefined> {
    const gitRootResult = await runShellCommand(
        [
            'git',
            '-C',
            JSON.stringify(dirname(filePath)),
            'rev-parse',
            '--show-toplevel',
        ].join(' '),
    );
    const gitRoot = gitRootResult.stdout.trim();
    if (gitRootResult.exitCode || !gitRoot) {
        return undefined;
    }

    const result = await runShellCommand(
        [
            'git',
            'log',
            '--diff-filter=A',
            '--follow',
            '--format=%cI',
            '-1',
            '--',
            JSON.stringify(relative(gitRoot, filePath)),
        ].join(' '),
        {
            cwd: gitRoot,
        },
    );
    const rawDate = result.stdout.trim();
    if (result.exitCode || !rawDate) {
        return undefined;
    }

    return toUtcIsoString(createUtcFullDate(rawDate));
}

async function readFileCreationDateFromFileSystem(filePath: string): Promise<UtcIsoString> {
    try {
        const stats = await stat(filePath);
        return toUtcIsoString(createUtcFullDate(stats.birthtime));
    } catch (error) {
        throw ensureErrorAndPrependMessage(
            error,
            [
                'Failed to read creation time for "',
                filePath,
                '".',
            ].join(''),
        );
    }
}
