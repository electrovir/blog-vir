---
title: Hello blog-vir
date: 2024-01-15
tags: [meta, intro]
---

This is the first post in the blog-vir demo site. Everything you see here was generated from a
directory of markdown files.

<!--truncate-->

## How it works

The `blog-vir` CLI reads every `.md` file under a posts directory, renders it to HTML, and writes a
set of JSON files into the Vite static directory. The browser then fetches only the JSON it needs
for the current page.

## Why JSON

Shipping one JSON file per post keeps the initial page small. A blog with a thousand posts loads
exactly as fast as a blog with three.
