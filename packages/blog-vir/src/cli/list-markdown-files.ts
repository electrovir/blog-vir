import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, extractExtension} from '@augment-vir/common';
import {joinFilesToDir, readDirRecursive} from '@augment-vir/node';
import {stat} from 'node:fs/promises';

export async function listMarkdownFiles(dir: string): Promise<string[]> {
    return (
        await awaitedBlockingMap(
            joinFilesToDir(dir, await readDirRecursive(dir)),
            async (filePath) => {
                if (
                    extractExtension(filePath).extension !== '.md' ||
                    !(await stat(filePath)).isFile()
                ) {
                    return undefined;
                }

                return filePath;
            },
        )
    )
        .filter(check.isTruthy)
        .sort();
}
