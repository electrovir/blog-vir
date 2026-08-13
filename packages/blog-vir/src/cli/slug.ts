/**
 * Derive a slug + parsed date from a blog markdown file name.
 *
 * - `2024-05-27-my-post.md` → date `2024-05-27`, slug `2024-05-27-my-post`
 * - `2024-05-27T02-my-post.md` → date `2024-05-27`, slug `2024-05-27-T02-my-post` (the `T02` suffix
 *   gets preserved in the slug).
 *
 * If the file name does not start with a recognizable date, the whole base name is used as the slug
 * and the date is left undefined for the post parser to resolve from other metadata.
 */

import {createUtcFullDate, toUtcIsoString, type UtcIsoString} from 'date-vir';

const dateMatcher = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d+))?-(.+)$/;

export type SlugInfo = {
    slug: string;
    /** ISO date string (UTC midnight) parsed from the file name, or undefined if not parseable. */
    date: UtcIsoString | undefined;
};

export function parseFileNameSlug(fileBaseName: string): SlugInfo {
    const match = dateMatcher.exec(fileBaseName);
    if (!match) {
        return {
            slug: fileBaseName,
            date: undefined,
        };
    }
    const [
        ,
        year,
        month,
        day,
        suffix,
        rest,
    ] = match;
    const dateIso = toUtcIsoString(
        createUtcFullDate(
            [
                year,
                '-',
                month,
                '-',
                day,
            ].join(''),
        ),
    );
    const slug = suffix
        ? [
              year,
              '-',
              month,
              '-',
              day,
              '-T',
              suffix,
              '-',
              rest,
          ].join('')
        : [
              year,
              '-',
              month,
              '-',
              day,
              '-',
              rest,
          ].join('');
    return {
        slug,
        date: dateIso,
    };
}
