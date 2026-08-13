#!/usr/bin/env node

import {runCliScript} from '@augment-vir/node/dist/index.js';
import {join} from 'node:path';

const cliPath = join(import.meta.dirname, 'src', 'cli', 'blog-vir.script.ts');

await runCliScript({
    scriptPath: cliPath,
    cliScriptFilePath: import.meta.filename,
    binName: 'blog-vir',
});
