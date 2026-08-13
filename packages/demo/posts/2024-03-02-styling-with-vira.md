---
title: Styling with Vira
date: 2024-03-02
tags: [vira, styling]
---

Every color in this blog comes from the Vira color theme, so light and dark mode both work with no
extra work from the site author.

<!--truncate-->

## Color pairs

Vira colors come in pairs: a foreground and a background chosen together to hit a specific contrast
level. Picking a pair instead of two separate colors is what keeps text legible in both themes.

```ts
import {viraTheme} from 'vira';

const muted = viraTheme.colors['vira-grey-foreground-body'].foreground.value;
```

## Elements

Tags, buttons, inputs, and links are all Vira elements, so they pick up theme changes immediately.

> Flip the theme with the switcher in the header to see it happen.
