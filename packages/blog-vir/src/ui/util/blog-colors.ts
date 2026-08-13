import {viraTheme} from 'vira';

/**
 * Every Vira color pair used by the blog elements, gathered here so the whole blog shares one set
 * of palette choices. Each entry is a full Vira color pair: read `.foreground.value` /
 * `.background.value`, or pass the pair straight to `colorCss`.
 */
export const blogColors = {
    /** Dates, tag counts, and other de-emphasized body text. */
    muted: viraTheme.colors['vira-grey-foreground-body'],
    /** Loading and empty-state messages. */
    placeholder: viraTheme.colors['vira-grey-foreground-non-body'],
    /** Hairlines: the header underline and the dividers between post blurbs. */
    separator: viraTheme.colors['vira-grey-foreground-decoration'],
    /** Background for markdown code blocks and inline code. */
    code: viraTheme.colors['vira-grey-behind-fg-small-body'],
    /** The vertical bar on markdown block quotes. */
    quoteBar: viraTheme.colors['vira-grey-foreground-placeholder'],
} as const;
