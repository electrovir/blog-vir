import {parseArgs} from 'cli-vir';
import {loadConfig} from 'config-vir';
import {join, resolve} from 'node:path';
import {buildUrl} from 'url-vir';
import {defaultBlogPostPageSize} from '../data/blog-page-size.js';
import {blogVirConfigShape, type BlogVirConfig} from './blog-vir-config.js';
import {BlogVirMode} from './blog-vir-mode.js';

/**
 * Parse the CLI mode and load the referenced blog-vir config file.
 *
 * @category Internal
 */
export async function parseBlogVirArgs(
    rawArgs: ReadonlyArray<string>,
    importMeta: Readonly<Pick<ImportMeta, 'filename'>>,
) {
    const parsed = parseArgs(
        rawArgs,
        {
            mode: {
                position: 0,
                required: true,
                type: BlogVirMode,
                description: 'Blog-vir execution mode.',
            },
            configFile: {
                position: 1,
                required: true,
                description:
                    'Path to your blog-vir config file in TypeScript, JavaScript, JSON, YAML, or TOML format.',
            },
        },
        {
            binName: 'blog-vir',
            importMeta,
        },
    );

    const config: BlogVirConfig = await loadConfig({
        configPath: resolve(parsed.configFile),
        configShape: blogVirConfigShape,
    });

    return {
        indexHtmlPath: resolve(config.indexHtmlPath || join('src', 'index.html')),
        postsDirPath: resolve(config.postsDirPath || './posts/'),
        staticDirPath: resolve(config.staticDirPath || join(process.cwd(), 'www-static')),
        viteConfigPath: config.viteConfigPath ? resolve(config.viteConfigPath) : undefined,
        mode: parsed.mode,
        pageSize: config.pageSize || defaultBlogPostPageSize,
        rssFeed: config.rssFeed,
        siteBasePath: buildUrl(config.rssFeed.siteUrl).pathname || '/',
        verbose: !!config.verbose,
    };
}
