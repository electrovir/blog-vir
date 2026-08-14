# blog-vir

A simple blog builder that uses [element-vir](https://www.npmjs.com/package/element-vir) and [Vite](https://vite.dev).

## Install

```Shell
npm i -D blog-vir url-vir
```

## Usage

### Configure blog-vir

Create `src/blog-vir.config.ts`:

<!-- example-link: src/readme-examples/blog-vir.config.ts -->

```TypeScript
import {type BlogVirConfig} from 'blog-vir';

const blogVirConfig: BlogVirConfig = {
    rssFeed: {
        title: 'My Blog',
        description: 'Notes from my blog.',
        siteUrl: 'https://example.com/blog',
    },
};

export default blogVirConfig;
```

### Add posts

Add Markdown files under `posts/`:

```
---
title: My First Post
tags: [notes, example]
---

This appears on the post list.

<!--truncate-->

## More detail

This appears only on the full post page.
```

`title` is required. `tags` and `date` are optional. The post date is resolved from the front matter date, a date-prefixed filename such as `2026-08-14-my-first-post.md`, the Git commit that added the file, or the filesystem creation time, in that order. The filename without its date prefix becomes the post slug.

The `<!--truncate-->` marker is optional. Without it, the complete post is shown on the post list.

### Render the blog

Create `src/my-blog.element.ts`:

<!-- example-link: src/readme-examples/my-blog.element.example.ts -->

```TypeScript
import {VirBlog} from 'blog-vir';
import {defineElement, html} from 'element-vir';

export const MyBlog = defineElement()({
    tagName: 'my-blog',
    render() {
        return html`
            <${VirBlog}>
                <span slot=${VirBlog.slotNames['vir-blog-brand']}>My Blog</span>
            </${VirBlog}>
        `;
    },
});
```

Then load it from `src/index.html`:

```HTML
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Blog</title>
        <script type="module" src="./my-blog.element.ts"></script>
        <link
            rel="alternate"
            type="application/rss+xml"
            title="My Blog RSS"
            href="%BASE_URL%rss.xml"
        />
    </head>
    <body>
        <my-blog></my-blog>
    </body>
</html>
```

### Run it

-   `blog-vir dev src/blog-vir.config.ts`: generates the blog data, watches posts for changes, and starts the Vite development server.
-   `blog-vir build src/blog-vir.config.ts`: generates the blog data and creates a Vite production build.
-   `blog-vir preview src/blog-vir.config.ts`: serves the existing Vite production build for local inspection.
