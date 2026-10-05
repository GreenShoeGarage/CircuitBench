# CIRCUITBENCH v1.2.0 — verification report

Software verification completed 2026-10-05 UTC. No physical hardware was built.

## Automated results

`CHROMIUM_EXECUTABLE=/tmp/chromium npm test` passed with **108 PASS lines** in `verification/v1.2-final-tests.log`. This includes the existing core, library, release and browser suites, six new board-editing engine groups and eleven new board-editing browser workflows. Chromium ran against static HTTP and standalone file:// installations; the new workflow runs offline.

New coverage:

- True mirrored board view and B shortcut; flipping leaves the design model unchanged and switches the active copper side. Assembly annotations remain readable.
- Back-view dragging, arrow-key nudging, undo/redo, pointer-centered zoom and panning use consistent world coordinates.
- Direct text authoring defaults to the active side; back text is mirrored for normal underside reading. Text and image editing/rotation remain available in the inspector.
- PNG image import, unsupported-file rejection, monochrome preview, transparent holes, physical width/aspect ratio, position and chosen side. Image conversion rejects empty/oversized/invalid data; serialization retains bounded integer runs.
- Actual ink area, nested clear regions, islands, rotation and mirror handedness; DRC on image feature size, board edges and mask clearance.
- Interactive outer-edge insertion, numeric corner edits, handle dragging, keyboard movement, cancellable drafts and invalid crossing rejection.
- Width/height/thickness edits, proportional custom-boundary scaling, unchanged component/routing/hole/cutout/artwork positions, undo and redo.
- Editing embedded artwork without the original file, bottom 3D viewing, autosave/reload, view preference persistence and JSON transfer to an independent standalone browser context.
- Desktop and 390 px mobile workflows, including a dark-theme board view and image dialog, with no horizontal page overflow or uncaught browser errors.

Screenshots were inspected for the image preview, edited board, outline dialog, bottom 3D view and mobile dark interface. Selected screenshots are included in `verification/v1.2-*.png`.

## Independent manufacturing checks

`tests/board-artwork-manufacturing.test.py` uses Gerbonara and Shapely to compare exported Gerbers against independently reconstructed artwork from stored raster rectangles. It checks both sides, nested holes/islands, rotation and handedness, plus every edited outer/cutout segment. Front artwork symmetric difference: **0.000000 mm²**. A mirrored, 37° rotated back image differed by **0.001808 mm²** after integer-grid quantization, within the fixture's 0.004 mm² tolerance. Exported regions are individually valid polygons.

`tests/board-artwork-native.test.py` uses KiCad 7.0.11's pcbnew to load native board output and independently verify every image rectangle's vertices, side and filled state, together with outer/cutout edge counts. Native save also passed. No CIRCUITBENCH geometry functions are called by either independent test.

The existing expanded catalog manufacturing fixture was also rerun after polygon-union changes. All eight copper/mask/paste/silk layers matched their geometric expectations with 0.0 mm² rounded symmetric difference; plated/nonplated drill positions, diameters and slots, and edge/cutout segment counts passed. Logs: `verification/v1.2-manufacturing-tests.log`, `v1.2-artwork-manufacturing.log`, `v1.2-artwork-native.log`.

## Defects found and corrected during verification

Pixel rectangles initially produced self-touching contours at shared edges. Strictly simple polygon output fixes clear holes/islands. Rotating adjacent rectangles before union additionally introduced small shared-edge rounding slivers at arbitrary angles; images now merge on the exact integer raster before scaling, mirroring and rotation. Independent readers verified the corrected result.

The old custom-outline inspector size fields refused edits; they now use the same boundary-resize operation as the new dialog. Bottom text now starts near the right board edge in canonical coordinates, keeping its default mirrored placement on the board. New toolbar theme transitions were removed so controls stay readable during theme changes.

## Practical limits

Outline editing is polygonal (3–200 corners); curved edges have no dedicated arc controls. Images are monochrome PNG/JPEG/WebP conversions, limited to 256 pixels per axis, 6,000 rectangles each and 12,000 total, within the existing 5 MB project limit. SVG import and color silk are not implemented. Source binaries are not retained; changing conversion settings after reopening requires reimporting the source. Width/position/rotation/side remain editable.

The board importer warns and omits native image polygons; use full CIRCUITBENCH JSON for editable round trips. Gerber coordinates stay canonical regardless of the view. Fabricator DFM, physical footprint checks, board fabrication, assembly and electrical testing remain outstanding. Earlier release evidence is retained in `TEST-REPORT-v1.1.md` and `TEST-REPORT-v1.0.md`.
