import {describe, itCases} from '@augment-vir/test';
import {normalizeBlogTag} from './normalize-blog-tag.js';

describe(normalizeBlogTag.name, () => {
    itCases(normalizeBlogTag, [
        {
            it: 'trims, lowercases, and replaces whitespace with dashes',
            input: '  TypeScript\tFormatting Details  ',
            expect: 'typescript-formatting-details',
        },
    ]);
});
