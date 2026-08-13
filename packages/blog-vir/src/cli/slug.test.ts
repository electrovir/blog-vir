import {describe, itCases} from '@augment-vir/test';
import {createUtcFullDate, toUtcIsoString, type UtcIsoString} from 'date-vir';
import {parseFileNameSlug} from './slug.js';

function isoForDate(dateString: string): UtcIsoString {
    return toUtcIsoString(createUtcFullDate(dateString));
}

describe(parseFileNameSlug.name, () => {
    itCases(parseFileNameSlug, [
        {
            it: 'parses a standard date-prefixed file name',
            input: '2024-05-27-my-post',
            expect: {
                slug: '2024-05-27-my-post',
                date: isoForDate('2024-05-27'),
            },
        },
        {
            it: 'preserves a T time suffix in the slug',
            input: '2024-05-27T02-my-post',
            expect: {
                slug: '2024-05-27-T02-my-post',
                date: isoForDate('2024-05-27'),
            },
        },
        {
            it: 'keeps multi-hyphen rest segments intact',
            input: '2024-01-02-nested-post-title',
            expect: {
                slug: '2024-01-02-nested-post-title',
                date: isoForDate('2024-01-02'),
            },
        },
        {
            it: 'leaves the date undefined when there is no date prefix',
            input: 'just-a-title',
            expect: {
                slug: 'just-a-title',
                date: undefined,
            },
        },
        {
            it: 'does not match a partial date',
            input: '2024-05-my-post',
            expect: {
                slug: '2024-05-my-post',
                date: undefined,
            },
        },
        {
            it: 'does not match a bare date with no trailing segment',
            input: '2024-05-27',
            expect: {
                slug: '2024-05-27',
                date: undefined,
            },
        },
    ]);
});
