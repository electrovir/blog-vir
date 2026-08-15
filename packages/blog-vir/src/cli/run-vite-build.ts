import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {build, createServer, preview, type InlineConfig, type Plugin} from 'vite';
import {type InjectedBlogVirData} from '../data/injected-global-data.js';
import {BlogVirMode} from './blog-vir-mode.js';

/**
 * Inputs shared by the Vite development, build, and preview runners.
 *
 * @category Internal
 */
export type RunViteBuildOptions = {
    /** Optional path to the consumer's Vite config. */
    configPath: string | undefined;
    /** Working directory containing blog-vir's build output. */
    cwd: string;
    /** Which Vite command to run. */
    mode: BlogVirMode;
    /** Plugins that blog-vir injects into the dev server. */
    devPlugins: ReadonlyArray<Plugin>;
    /** Path to the site's Vite entry point. */
    indexHtmlPath: string;
    /** Posts shown on each post-list page. */
    pageSize: number;
    /** Vite base path derived from the canonical blog URL. */
    siteBasePath: string;
    /** Directory containing static files that Vite serves and copies into the build. */
    staticDirPath: string;
};

type ViteModeRunner = (options: Readonly<RunViteBuildOptions>) => Promise<void>;

const virmatorExternalDependencies: string[] = [
    /** These are specified, but not actually used in a browser, in `@augment-vir/common` exports. */
    'node:util',
    'node:path',
    /** Imported in object-shape-tester but only in backend code. */
    'node:fs/promises',
    /** These are specified, but not actually used in a browser, in `@augment-vir/test` exports. */
    '@playwright/test',
    /** For extra measure, also block playwright. */
    'playwright',
];

const viteModeRunners: Readonly<Record<BlogVirMode, ViteModeRunner>> = {
    [BlogVirMode.Build]: runViteProductionBuild,
    [BlogVirMode.Preview]: runVitePreviewServer,
    [BlogVirMode.Dev]: runViteDevServer,
};

/**
 * Create Vite's inline config, loading a consumer config when one was provided.
 *
 * @category Internal
 */
export function createViteInlineConfig({
    configPath,
    cwd,
    indexHtmlPath,
    pageSize,
    siteBasePath,
    staticDirPath,
}: Readonly<Omit<RunViteBuildOptions, 'devPlugins' | 'mode'>>): InlineConfig {
    const blogViteConfig: InlineConfig = {
        base: siteBasePath,
        define: {
            VITE_INJECTED_BLOG_VIR_DATA: JSON.stringify({
                pageSize,
                siteBasePath,
            } satisfies InjectedBlogVirData),
        },
    };

    if (configPath) {
        return {
            ...blogViteConfig,
            configFile: configPath,
        };
    }

    return {
        ...blogViteConfig,
        configFile: false,
        server: {
            host: true,
            watch: {
                ignored: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/.history/**',
                ],
            },
        },
        clearScreen: false,
        root: dirname(indexHtmlPath),
        publicDir: staticDirPath,
        build: {
            outDir: join(cwd, 'dist'),
            emptyOutDir: true,
            target: 'es2024',
            rollupOptions: {
                external: virmatorExternalDependencies,
            },
        },
        optimizeDeps: {
            rolldownOptions: {},
            exclude: virmatorExternalDependencies,
            force: true,
        },
    };
}

/**
 * Run Vite in the requested blog-vir mode.
 *
 * @category Internal
 */
export async function runVite(options: Readonly<RunViteBuildOptions>) {
    if (options.configPath && !existsSync(options.configPath)) {
        throw new Error(
            [
                'Vite config not found at "',
                options.configPath,
                '".',
            ].join(''),
        );
    }

    await viteModeRunners[options.mode](options);
}

async function runViteProductionBuild(options: Readonly<RunViteBuildOptions>) {
    await build(createViteInlineConfig(options));
}

async function runVitePreviewServer(options: Readonly<RunViteBuildOptions>) {
    const server = await preview(createViteInlineConfig(options));
    server.printUrls();
    server.bindCLIShortcuts({
        print: true,
    });
}

async function runViteDevServer(options: Readonly<RunViteBuildOptions>) {
    const server = await createServer({
        ...createViteInlineConfig(options),
        plugins: [...options.devPlugins],
    });
    await server.listen();
    server.printUrls();
    server.bindCLIShortcuts({
        print: true,
    });
}
