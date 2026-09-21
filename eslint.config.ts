import {
    defaultAllowedFileExtensions,
    defineEslintConfig,
} from '@virmator/lint/configs/eslint.config.base.js';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
    ...defineEslintConfig(__dirname),
    {
        ignores: [
            /** Add file globs that should be ignored. */
        ],
    },
    {
        rules: {
            '@virmator/allowed-file-extensions': [
                'error',
                {
                    extensions: [
                        ...defaultAllowedFileExtensions,
                        '.plugin.ts',
                        '.plugin.test.node.ts',
                    ],
                },
            ],
        },
    },
];
