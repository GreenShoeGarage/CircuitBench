# Manifold solid modeler

The offline enclosure worker embeds Manifold **3.5.4** from the pinned `manifold-3d` npm package. Upstream source: <https://github.com/elalish/manifold>. JavaScript API documentation: <https://manifoldcad.org/docs/jsapi/>. License: **Apache License 2.0**, retained in `MANIFOLD-LICENSE.txt`. Upstream copyright and license notices are retained in the distribution files and license.

`manifold.js` is the upstream JavaScript loader bundled/minified with esbuild 0.28.2 as browser IIFE `CBManifold`; `manifold.wasm` is copied unchanged from the package. No Manifold geometry algorithms were modified. `scripts/build-manifold.cjs` reproduces these assets after `npm ci`; run `npm run build:manifold`, then `npm run build` to embed them into the standalone HTML.

The build supplies a syntactically valid placeholder `import.meta.url` for loader URL resolution. Runtime initialization receives the embedded WASM bytes directly; the placeholder is never fetched. Worker execution, solid operations and STL export remain local. The release's `SHA256SUMS.txt` records both asset hashes.
