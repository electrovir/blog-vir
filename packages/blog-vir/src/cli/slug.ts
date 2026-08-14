import {createUtcFullDate, toUtcIsoString, type UtcIsoString} from 'date-vir';

const dateMatcher = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d+))?-(.+)$/;

/**
 * Slug and optional date parsed from a Markdown file's base name.
 *
 * @category Internal
 */
export type SlugInfo = {
    slug: string;
    /** ISO date string (UTC midnight) parsed from the file name, or undefined if not parseable. */
    date: UtcIsoString | undefined;
};

/**
 * Derive a slug and optional date from a blog Markdown file name. If the name has no recognizable
 * date prefix, the complete base name becomes the slug and the post parser resolves the date from
 * other metadata.
 *
 * @category Internal
 */
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
