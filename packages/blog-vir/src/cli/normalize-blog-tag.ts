/**
 * Normalize a tag before writing generated blog data.
 *
 * @category Internal
 */
export function normalizeBlogTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, '-');
}
