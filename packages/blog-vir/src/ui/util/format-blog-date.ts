import {createUtcFullDate, toLocaleString, type UtcIsoString} from 'date-vir';

/** Format an ISO date into a user-facing date string (e.g. "May 27, 2024"). */
export function formatBlogDate(isoDate: UtcIsoString): string {
    const fullDate = createUtcFullDate(isoDate);
    return toLocaleString(fullDate, {
        dateStyle: 'long',
    });
}
