import {createArray} from '@augment-vir/common';
import {createUtcFullDate, type DateLike, toLocaleString, type UtcIsoString} from 'date-vir';

/**
 * Format a date as a month and day with padding for aligned history rows.
 *
 * @category Internal
 */
export function formatBlogMonthDay(isoDate: UtcIsoString): {padding: string; monthDay: string} {
    const monthDay = formatMonthDay(isoDate);
    return {
        padding: ' '.repeat(maxMonthDayWidth - monthDay.length),
        monthDay,
    };
}

function formatMonthDay(dateLike: Readonly<DateLike>): string {
    return toLocaleString(createUtcFullDate(dateLike), {
        month: 'long',
        day: 'numeric',
    });
}

const maxMonthDayWidth = Math.max(
    ...createArray(12, (index) => {
        return formatMonthDay(`2024-${String(index + 1).padStart(2, '0')}-28`).length;
    }),
);
