/**
 * Execution mode for the blog-vir CLI.
 *
 * @category Internal
 */
export enum BlogVirMode {
    /** Build the production static outputs. */
    Build = 'build',
    /** Preview the production static outputs in a dev server. */
    Preview = 'preview',
    /** Run the dev server with automatic reloading. */
    Dev = 'dev',
}
