# CIRCUITBENCH 1.0.0 verification

Verified in the release workspace on 2026-10-05. This report distinguishes software evidence from outstanding physical validation.

## Automated application suite

**67 passing groups**, no uncaught browser errors:

| Suite | Groups | Evidence |
| --- | ---: | --- |
| Core engine | 12 | Shared model, geometry, net changes, checks, export conventions and validation |
| Independent ZIP check | 1 | JSZip verifies CRC and every exported entry |
| Extended engine | 12 | Actual schema 1 fixture migration, wire split/merge/junctions, label connectivity, pin renumbering, libraries, plated drill voids, pad shapes, separated zone islands, thermal fill and process findings |
| Release engine | 12 | Router detours/refusal, cleanup, block isolation, sheet ports/cycles, invalid libraries/classes, rotated front/back interchange, blocked unsupported imports, mirrored silk, baselines, chord tolerance and benchmark |
| Browser workflow | 20 | Cold start in a static subfolder, schematic/PCB editing, keyboard undo/redo, footprints, JSON round trip, malformed imports, reports, fabrication ZIP, themes, vias, pan/grid, recovery, offline reload, mobile editing and standalone HTML |
| Advanced browser | 10 | Real WebGL geometry and image export, board tools, locks/devices, sheets/blocks, baseline comparison, KiCad preview/import/undo, multi-tab conflicts, schema 2 reload and corrupt-data protection |

The browser suites use Playwright with headless Chromium 153.0.8010.0 on Linux. Desktop widths 1440/1500 px and a 390 × 844 touch viewport were exercised. Installed offline reload and direct `file://` use passed. WebGL ran through software rendering. Firefox, Safari, real mobile hardware, assistive technologies and production TLS server configurations were not independently tested.

The 150-component/300-pad benchmark completed validation and actual geometry checks in **687 ms** during the final aggregate run. Earlier runs were approximately 1.6 seconds. This is a bounded synthetic fixture, not a performance guarantee or a worst-case zone benchmark.

## Independent manufacturing validation

Gerbonara 1.6.3 parses the exported files; Shapely reconstructs their planar geometry independently of the JavaScript polygon engine.

- All eight copper/mask/paste/silk layers matched the intended geometry in a fixture containing rotated front/back pads, solid/thermal copper, a cutout, a via, text, rectangular/oval SMDs and plated/nonplated slots. Symmetric-difference areas were below 0.0001 mm² (reported as 0.0 at eight decimals).
- Separate plated and nonplated drill files matched hole counts, positions and diameters; G85 slots matched lengths and angles. Coordinate tolerance was 0.00015 mm; slot-length tolerance 0.0002 mm; slot-angle tolerance 0.02°.
- The outline/cutout file had the expected closed contour segment count.
- The routed reference's nine Gerbers and two drill files were independently parsed, including valid empty paste/bottom-silk layers where no such artwork exists.

These tests verify the exported files against the application's geometry. They do not constitute fabricator acceptance or physical manufacturing evidence.

## Native KiCad validation

KiCad **7.0.11** successfully loaded and saved the export fixture. Native `pcbnew` confirmed all ten pad positions, sizes and absolute angles, including a back-side footprint rotated 37.5° and a locally rotated oval slot pad. Position tolerance was 0.000002 mm. A native save was reimported and compared by reference/pin identity; coordinates and net names were preserved. Native KiCad also plotted all nine requested manufacturing layers from the exported board.

Native plotting confirms syntactic acceptance and usable board objects; it does not establish full ERC/DRC equivalence. Zone fills use different engines and exported source zones must be refilled in KiCad. Unsupported-feature tests confirm blocking diagnostics and prevention of fabrication export for incomplete imports.

## Reference design and visual checks

`examples/routed-reference.circuitbench.json` contains five components, seven track objects, two mounting holes and authored front silk. All logical nets are routed; the implemented checks return zero findings. This fixture remains **unfabricated and electrically untested**. The default starter project intentionally has unrouted nets for editing practice.

Desktop, dark-theme, mobile, schematic, review, zone-board and actual 3D renders were captured. Desktop, schematic, mobile, zone-board and 3D screenshots were visually inspected. A PDF design report was generated and checked for content. Screenshot evidence is in `docs/`; the source test scripts reproduce the workflow captures.

## Reproduce

```sh
python3 build.py
npm ci
npx playwright install chromium
npm test

# Run release.test.cjs first to generate the native fixture.
node tests/manufacturing-fixture.cjs
python3 -m pip install gerbonara==1.6.3 shapely
python3 tests/manufacturing.test.py

# In a Python environment with KiCad's pcbnew module:
python3 tests/native-kicad.test.py
```

`CHROMIUM_EXECUTABLE` selects an existing browser. Browser tests create temporary local HTTP servers. Test dependencies are not runtime app dependencies. The release contains scripts and compact verification logs; generated intermediate files are omitted from the distribution.

## Outstanding validation

Physical PCB fabrication, component-fit checks, assembly, continuity/short testing and powered electrical behavior remain open. Also unverified: complete native KiCad/LibrePCB project compatibility, worst-case maximum-complexity performance, screen-reader completeness, and Firefox/Safari behavior. The v1.0 label denotes the documented software release scope.
