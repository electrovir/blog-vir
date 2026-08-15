---
title: Markdown Elements
date: 2025-09-12
tags: [markdown, styling]
description: A reference post showing the Markdown syntax supported by blog-vir.
---

This post shows the Markdown elements rendered by blog-vir: text formatting, links, lists, quotes, code, tables, images, and HTML.

<!--truncate-->

# Heading Level One

## Heading Level Two

### Heading Level Three

#### Heading Level Four

##### Heading Level Five

###### Heading Level Six

## Text and Links

This paragraph has _emphasis_, **strong text**, **_both together_**, ~~deleted text~~, and `inline code`. Escaped Markdown keeps a literal \*asterisk\*.  
The preceding sentence ends with a hard line break.

This has an [inline link](https://github.com/electrovir/blog-vir 'blog-vir repository'), a bare https://example.com URL, and a [reference link][repository].

## Lists

-   Unordered item
    -   Nested unordered item
    -   Another nested item
-   Final unordered item

1. Ordered item
    1. Nested ordered item
    2. Another nested item
2. Final ordered item

-   [x] Completed task
-   [ ] Remaining task

## Quotes

> A block quote can contain _formatted text_, a list, and another quote.
>
> -   Quoted list item
> -   Another quoted item
>
> > This is a nested quote.

## Code

An indented code block:

    const indentedCode = true;

A fenced code block:

```ts
const message = 'Fenced code keeps its language label.';
```

## Table

| Left aligned  | Center aligned | Right aligned |
| :------------ | :------------: | ------------: |
| Markdown      |     tables     |             1 |
| Have borders  |  striped rows  |             2 |
| And alignment |  is preserved  |             3 |

## Image

![Snowy mountains under a blue sky](https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80 'Mountain landscape')

---

## HTML

<details>
<summary>Open this native HTML disclosure.</summary>

Raw HTML is rendered alongside Markdown when the blog author needs an element Markdown does not provide.

</details>

[repository]: https://github.com/electrovir/blog-vir
