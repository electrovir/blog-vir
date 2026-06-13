import {FlagRequirement, parseArgs} from 'cli-vir';
import {join, resolve} from 'node:path';

export enum BlogVirMode {
    Build = 'build',
    Preview = 'preview',
    Dev = 'dev',
}

export type ParsedBlogVirArgs = {
    indexHtml: string;
    postsDir: string;
    staticDir: string;
    viteConfig: string;
    mode: BlogVirMode;
    verbose: boolean;
};

export function parseBlogVirArgs(
    rawArgs: ReadonlyArray<string>,
    importMeta: Readonly<Pick<ImportMeta, 'filename'>>,
): ParsedBlogVirArgs {
    const parsed = parseArgs(
        rawArgs,
        {
            index: {
                flag: {
                    valueRequirement: FlagRequirement.Required,
                    aliases: ['-i'],
                },
                description:
                    'Path to the consumer site index.html file. Defaults to `src/index.html`.',
            },
            posts: {
                flag: {
                    valueRequirement: FlagRequirement.Required,
                    aliases: ['-p'],
                },
                description: 'Path to a directory of `.md` blog posts. Defaults to `./posts/`.',
            },
            static: {
                flag: {
                    valueRequirement: FlagRequirement.Required,
                    aliases: ['-s'],
                },
                description:
                    'Path to the Vite static (publicDir) directory. Defaults to `<package>/www-static`, where `<package>` is two directories up from the index.html file.',
            },
            viteConfig: {
                flag: {
                    valueRequirement: FlagRequirement.Required,
                    aliases: ['-c'],
                },
                description:
                    'Path to the Vite config TS file. Defaults to `<package>/configs/vite.config.ts`.',
            },
            mode: {
                flag: {
                    valueRequirement: FlagRequirement.Required,
                    aliases: ['-m'],
                },
                type: BlogVirMode,
                description: 'One of `build`, `preview`, or `dev`. Defaults to `build`.',
            },
            verbose: {
                flag: {
                    valueRequirement: FlagRequirement.Blocked,
                    aliases: ['-v'],
                },
                description: 'Log per-file progress while parsing blog posts.',
            },
        },
        {
            binName: 'blog-vir',
            importMeta,
        },
    );

    const indexHtml = resolve(parsed.index || join('src', 'index.html'));

    return {
        indexHtml,
        postsDir: resolve(parsed.posts || './posts/'),
        staticDir: resolve(parsed.static || join(process.cwd(), 'www-static')),
        viteConfig: resolve(parsed.viteConfig || join(process.cwd(), 'configs', 'vite.config.ts')),
        mode: parsed.mode || BlogVirMode.Build,
        verbose: parsed.verbose,
    };
}
