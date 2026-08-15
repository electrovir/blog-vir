#!/usr/bin/env bash

set -euo pipefail

npm run compile
npm rebuild
npm run docs
npm run build --workspace @blog-vir/demo
mkdir -p dist-pages/docs dist-pages/demo
cp -R packages/blog-vir/dist-docs/. dist-pages/docs
cp -R packages/demo/dist/. dist-pages/demo
cp packages/blog-vir/dist-docs/.nojekyll dist-pages/.nojekyll
cp index.html dist-pages/index.html
