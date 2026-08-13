import {log} from '@augment-vir/common';
import {findAncestor, runShellCommand} from '@augment-vir/node';
import {existsSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {BlogVirMode} from './parse-cli-args.js';

export type RunViteBuildOptions = {
    /**
     * Path to the consumer's Vite config (defaults to `<package>/configs/vite.config.ts`, derived
     * from the index.html path).
     */
    configPath: string;
    /** Working directory to run Vite from (defaults to the package containing the config). */
    cwd: string;
    /** Which Vite command to run. */
    mode: BlogVirMode;
};

/** Vite subcommand for each mode. Dev runs the default dev server, so it has no subcommand. */
const viteSubCommands: Readonly<Record<BlogVirMode, string>> = {
    [BlogVirMode.Build]: 'build',
    [BlogVirMode.Preview]: 'preview',
    [BlogVirMode.Dev]: '',
};

export async function runVite({
    configPath,
    cwd,
    mode,
}: Readonly<RunViteBuildOptions>): Promise<void> {
    if (!existsSync(configPath)) {
        throw new Error(
            [
                'Vite config not found at "',
                configPath,
                '".',
            ].join(''),
        );
    }
    const relConfig = relative(cwd, configPath);
    const command = [
        'NODE_OPTIONS="--import tsx"',
        'npx',
        'vite',
        viteSubCommands[mode],
        '--config',
        JSON.stringify(relConfig),
    ]
        .filter(Boolean)
        .join(' ');

    log.faint(
        [
            'running: ',
            command,
        ].join(''),
    );
    const result = await runShellCommand(command, {
        cwd,
        hookUpToConsole: true,
    });
    if (result.exitCode) {
        throw new Error(
            [
                'Vite exited with code ',
                String(result.exitCode),
                '.',
            ].join(''),
        );
    }
}

/**
 * Try to find a `configs/vite.config.ts` walking up from the given starting path. The lookup stops
 * at the first ancestor that contains a `configs/vite.config.ts` file.
 */
export function findDefaultViteConfigPath(startPath: string): string | undefined {
    const ancestor = findAncestor(resolve(startPath), (dir) => {
        return existsSync(join(dir, 'configs', 'vite.config.ts'));
    });
    return ancestor && join(ancestor, 'configs', 'vite.config.ts');
}
