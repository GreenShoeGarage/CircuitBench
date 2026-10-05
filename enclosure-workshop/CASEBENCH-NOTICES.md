# Third-party notices

## BSP solid Boolean algorithm

`src/solid.js` adapts the BSP constructive-solid-geometry algorithm from Evan
Wallace's `csg.js`, https://github.com/evanw/csg.js . CASEBENCH adds bounded
operations, primitive construction, conforming tessellation, checks and file
writers. It does not claim the upstream library's name or guarantees for its own
modified implementation.

Copyright (c) 2011 Evan Wallace (http://madebyevan.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

CASEBENCH adaptations: Copyright (c) 2026 Green Shoe Garage, MIT.

## Copperbench format references

The coordinate, outline, pad and slot conventions were checked against
GreenShoeGarage/Copperbench's MIT-licensed source. CASEBENCH has its own bounded
mechanical adapter and inspection renderer; no full Copperbench application,
component library or PCB fabrication engine is included.

References checked for the adapter on 18 September 2026:
- https://github.com/GreenShoeGarage/Copperbench/blob/main/src/core.js
- https://github.com/GreenShoeGarage/Copperbench/blob/main/src/geometry.js
- https://github.com/GreenShoeGarage/Copperbench/blob/main/src/platforms.js

The two original example files are unchanged user-supplied Copperbench JSON
exports. The additional enclosure examples are derived software-test data, not a
physically approved assembly.

## Other runtime and development components

No remotely fetched runtime libraries, fonts, images, CDN scripts or analytics.
The renderer, drafting-alphabet geometry, ZIP writer and remaining application
code are bundled source. **No font files are distributed.** The application uses
browser DOM, SVG, Canvas2D, optional WebGL, Web Workers and optional ZIP DEFLATE
decompression APIs.

Optional testing uses Node.js, Python, Playwright/Chromium, NumPy and trimesh,
installed separately under their own licenses. They are not required to use the
application and are not included in the release ZIP.

## Developer-only upstream contract fixtures

`tests/fixtures/copperbench-contract.json` contains source-emitted test projects and
coordinate expectations captured from the trusted Copperbench 1.6.1 runtime. It
is not a runtime component catalog. No upstream engine code is bundled.
The original application/block data remains MIT. Adafruit-derived module interface
data retains CC BY-SA 3.0, attribution to Adafruit Industries, Limor Fried / Ladyada
and contributors, source URLs/blob identifiers embedded in each fixture, and the
complete notice in `tests/fixtures/MODULE-DATA-NOTICES.txt`. CASEBENCH serialized
test instances and captured their transformed coordinates. Test data is not a
claim of hardware accuracy, endorsement, current product performance or fit.

Independent development checks may use the system-installed lib3mf 1.8.1 shared
library. It is not included in the application or release archive.

## Copperbench 1.7.1 export test data

`tests/fixtures/copperbench171/export-contract.json` contains native compact/full
exports and expected geometry captured from the reviewed Copperbench 1.7.1 source
engine. It retains module source/author/license metadata, including the existing
Adafruit CC BY-SA 3.0 attributions. `examples/Copperbench-1.7.1-casebench.json` is
the unchanged supplied user fixture; its module source and attribution are embedded.
No upstream runtime, external catalog dependency, font file or geometry service
is added to CASEBENCH. The hash-pinned upstream HTML is supplied separately for
live developer checks and is not distributed in this package.
